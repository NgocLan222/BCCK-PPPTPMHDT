const { sql, poolPromise } = require('../../config/db');

const extractEvidenceForStudent = async (maSV) => {
    const pool = await poolPromise;
    const evidences = [];
    let mucDoDeXuat = 'Thấp';

    const kq = await pool.request().input('maSV', sql.NVarChar, maSV)
        .query(`SELECT TOP 1 * FROM KetQuaHocTap WHERE MaSV = @maSV ORDER BY MaKQ DESC`);

    if (kq.recordset.length > 0) {
        const row = kq.recordset[0];
        if (row.DiemGPA < 2.0) {
            evidences.push({
                loaiViPham: 'Điểm trung bình học kỳ (GPA) dưới ngưỡng',
                chiTiet: `GPA đạt ${row.DiemGPA}/4.0 (thấp hơn ngưỡng an toàn 2.0)`
            });
            mucDoDeXuat = 'Cao';
        }
        if (row.SoMonNo > 0) {
            evidences.push({
                loaiViPham: 'Nợ học phần trong chương trình đào tạo',
                chiTiet: `Hiện đang nợ ${row.SoMonNo} môn học (Tín chỉ tích lũy: ${row.TinChiTichLuy} TC)`
            });
            if (mucDoDeXuat !== 'Cao') mucDoDeXuat = 'Trung bình';
        }
    }

    const hp = await pool.request().input('maSV', sql.NVarChar, maSV)
        .query(`SELECT TOP 1 * FROM HocPhi WHERE MaSV = @maSV ORDER BY HanDong DESC`);

    if (hp.recordset.length > 0 && hp.recordset[0].TrangThaiHocPhi !== 'Đã đóng đủ') {
        const no = hp.recordset[0].SoTienPhaiDong - hp.recordset[0].SoTienDaDong;
        evidences.push({
            loaiViPham: 'Công nợ học phí học kỳ',
            chiTiet: `Trạng thái: ${hp.recordset[0].TrangThaiHocPhi} (Còn thiếu ${no.toLocaleString()} đ)`
        });
        if (mucDoDeXuat === 'Thấp') mucDoDeXuat = 'Trung bình';
    }

    const cdr = await pool.request().input('maSV', sql.NVarChar, maSV)
        .query(`SELECT * FROM ChuanDauRa WHERE MaSV = @maSV AND TyLeDat < 50`);

    for (const lo of cdr.recordset) {
        evidences.push({
            loaiViPham: 'Chậm tiến độ chuẩn đầu ra (LO)',
            chiTiet: `Chuẩn ${lo.MaLO} (${lo.TenChuan}) mới đạt ${lo.TyLeDat}%`
        });
    }

    if (evidences.length === 0) {
        evidences.push({
            loaiViPham: 'Nhắc nhở định kỳ học vụ',
            chiTiet: 'Sinh viên chưa ghi nhận vi phạm nghiêm trọng, cần duy trì tiến độ học tập.'
        });
    }

    return { evidences, mucDoDeXuat };
};

const createCanhBao = async ({ maSV, maCV, mucDoRuiRo, huongDanHoTro, danhSachBangChung }) => {
    const pool = await poolPromise;

    const existing = await pool.request()
        .input('maSV', sql.NVarChar, maSV)
        .query(`
            SELECT TOP 1 MaCanhBao, TrangThai FROM CanhBao
            WHERE MaSV = @maSV AND TrangThai IN (N'Chờ phản hồi', N'Đã phản hồi', N'Cần can thiệp', N'Đang can thiệp')
        `);

    if (existing.recordset.length > 0) {
        throw new Error(`Sinh viên ${maSV} đang có phiếu cảnh báo ${existing.recordset[0].MaCanhBao} (${existing.recordset[0].TrangThai}) chưa xử lý xong!`);
    }

    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const maCB = 'CB_' + Date.now().toString().slice(-6);

        await new sql.Request(transaction)
            .input('maCB', sql.NVarChar, maCB)
            .input('maSV', sql.NVarChar, maSV)
            .input('maCV', sql.NVarChar, maCV)
            .input('mucDo', sql.NVarChar, mucDoRuiRo || 'Trung bình')
            .input('huongDan', sql.NVarChar, huongDanHoTro)
            .query(`
                INSERT INTO CanhBao (MaCanhBao, MaSV, MaCV, MaHocKy, MucDoRuiRo, HuongDanHoTro, TrangThai, NgayBanHanh)
                VALUES (@maCB, @maSV, @maCV, (SELECT TOP 1 MaHocKy FROM HocKy ORDER BY MaHocKy DESC), @mucDo, @huongDan, N'Chờ phản hồi', GETDATE())
            `);

        const listBC = Array.isArray(danhSachBangChung) && danhSachBangChung.length > 0
            ? danhSachBangChung
            : [{ loaiViPham: 'Cảnh báo học vụ định kỳ', chiTiet: huongDanHoTro }];

        for (const bc of listBC) {
            await new sql.Request(transaction)
                .input('maCB', sql.NVarChar, maCB)
                .input('loai', sql.NVarChar, bc.loaiViPham)
                .input('chiTiet', sql.NVarChar, bc.chiTiet)
                .query(`INSERT INTO ChiTietBangChung (MaCanhBao, LoaiViPham, ChiTiet) VALUES (@maCB, @loai, @chiTiet)`);
        }

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

const publishDraftCanhBao = async (maCanhBao, huongDanHoTro) => {
    const pool = await poolPromise;
    await pool.request()
        .input('maCB', sql.NVarChar, maCanhBao)
        .input('hd', sql.NVarChar, huongDanHoTro)
        .query(`UPDATE CanhBao SET TrangThai = N'Chờ phản hồi', HuongDanHoTro = @hd, NgayBanHanh = GETDATE() WHERE MaCanhBao = @maCB`);
};

const reviewPhanHoi = async (maPhanHoi, { maCanhBao, ketQuaDuyet, yKienCoVan }) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        await new sql.Request(transaction)
            .input('maPH', sql.NVarChar, maPhanHoi)
            .input('ketQua', sql.NVarChar, ketQuaDuyet)
            .input('yKien', sql.NVarChar, yKienCoVan)
            .query(`UPDATE PhanHoi SET KetQuaDuyet = @ketQua, YKienCoVan = @yKien WHERE MaPhanHoi = @maPH`);

        const trangThaiCB = ketQuaDuyet === 'Chấp thuận' ? 'Đã hủy' : 'Cần can thiệp';
        await new sql.Request(transaction)
            .input('maCB', sql.NVarChar, maCanhBao)
            .input('tt', sql.NVarChar, trangThaiCB)
            .query(`UPDATE CanhBao SET TrangThai = @tt WHERE MaCanhBao = @maCB`);

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

const reviewSingleEvidence = async ({ maBangChung, maCanhBao, chapThuan, yKienCoVan }) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const bcRes = await new sql.Request(transaction)
            .input('id', sql.Int, maBangChung)
            .query(`SELECT ChiTiet FROM ChiTietBangChung WHERE MaBangChung = @id`);

        if (bcRes.recordset.length === 0) throw new Error('Không tìm thấy bằng chứng!');
        const oldText = bcRes.recordset[0].ChiTiet || '';
        const cleanText = oldText.replace(/^\[(Đã gỡ|Giữ nguyên|Chờ Admin duyệt HP)\]\s*/i, '');
        const prefix = chapThuan ? '[Đã gỡ]' : '[Giữ nguyên]';
        const newText = `${prefix} ${cleanText}`.slice(0, 248);

        await new sql.Request(transaction)
            .input('id', sql.Int, maBangChung)
            .input('chiTiet', sql.NVarChar, newText)
            .query(`UPDATE ChiTietBangChung SET ChiTiet = @chiTiet WHERE MaBangChung = @id`);

        const allBC = await new sql.Request(transaction)
            .input('maCB', sql.NVarChar, maCanhBao)
            .query(`SELECT ChiTiet FROM ChiTietBangChung WHERE MaCanhBao = @maCB`);

        const total = allBC.recordset.length;
        const resolvedCount = allBC.recordset.filter(r => r.ChiTiet && r.ChiTiet.startsWith('[Đã gỡ]')).length;
        const stillPendingCount = allBC.recordset.filter(r => !r.ChiTiet || !r.ChiTiet.startsWith('[')).length;

        let trangThaiCB = 'Đã phản hồi';
        let ketQuaPH = 'Chờ duyệt';

        if (resolvedCount === total && total > 0) {
            trangThaiCB = 'Đã hủy';
            ketQuaPH = 'Chấp thuận';
        } else if (stillPendingCount === 0) {
            trangThaiCB = 'Cần can thiệp';
            ketQuaPH = 'Cần can thiệp';
        }

        await new sql.Request(transaction)
            .input('maCB', sql.NVarChar, maCanhBao)
            .input('tt', sql.NVarChar, trangThaiCB)
            .query(`UPDATE CanhBao SET TrangThai = @tt WHERE MaCanhBao = @maCB`);

        await new sql.Request(transaction)
            .input('maCB', sql.NVarChar, maCanhBao)
            .input('kq', sql.NVarChar, ketQuaPH)
            .input('yk', sql.NVarChar, yKienCoVan || `Đã gỡ ${resolvedCount}/${total} nội dung vi phạm.`)
            .query(`UPDATE PhanHoi SET KetQuaDuyet = @kq, YKienCoVan = @yk WHERE MaCanhBao = @maCB`);

        await transaction.commit();
        return { trangThaiCB, resolvedCount, total };
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

const forwardTuitionToAdmin = async ({ maBangChung, maCanhBao, maSV, ghiChuChuyenTiep }) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const phRes = await new sql.Request(transaction)
            .input('maCB', sql.NVarChar, maCanhBao)
            .query(`SELECT TOP 1 TepMinhChung, NoiDungGiaiTrinh FROM PhanHoi WHERE MaCanhBao = @maCB`);

        const tep = phRes.recordset[0]?.TepMinhChung || null;
        const note = `[CVHT chuyển tiếp từ phiếu ${maCanhBao}]: ${ghiChuChuyenTiep || phRes.recordset[0]?.NoiDungGiaiTrinh || 'Đề nghị Admin đối soát học phí.'}`;

        await new sql.Request(transaction)
            .input('maSV', sql.NVarChar, maSV)
            .input('tep', sql.NVarChar(sql.MAX), tep)
            .input('note', sql.NVarChar, note.slice(0, 490))
            .query(`
                UPDATE HocPhi
                SET TrangThaiHocPhi = N'Chờ duyệt minh chứng',
                    MinhChungDongTien = COALESCE(@tep, MinhChungDongTien),
                    GhiChuMinhChung = @note
                WHERE MaHocPhi = (SELECT TOP 1 MaHocPhi FROM HocPhi WHERE MaSV = @maSV ORDER BY HanDong DESC)
            `);

        const bcRes = await new sql.Request(transaction)
            .input('id', sql.Int, maBangChung)
            .query(`SELECT ChiTiet FROM ChiTietBangChung WHERE MaBangChung = @id`);

        const cleanText = (bcRes.recordset[0]?.ChiTiet || '').replace(/^\[(Đã gỡ|Giữ nguyên|Chờ Admin duyệt HP)\]\s*/i, '');
        await new sql.Request(transaction)
            .input('id', sql.Int, maBangChung)
            .input('chiTiet', sql.NVarChar, `[Chờ Admin duyệt HP] ${cleanText}`.slice(0, 248))
            .query(`UPDATE ChiTietBangChung SET ChiTiet = @chiTiet WHERE MaBangChung = @id`);

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

module.exports = {
    extractEvidenceForStudent,
    createCanhBao,
    publishDraftCanhBao,
    reviewPhanHoi,
    reviewSingleEvidence,
    forwardTuitionToAdmin
};