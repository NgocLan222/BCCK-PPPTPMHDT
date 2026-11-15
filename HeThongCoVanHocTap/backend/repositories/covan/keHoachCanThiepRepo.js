const { sql, poolPromise } = require('../../config/db');

const createKeHoach = async ({ maCanhBao, mucTieuTongThe, tranTinChi, danhSachNhiemVu }) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const maKH = 'KH_' + Date.now().toString().slice(-6);

        await new sql.Request(transaction)
            .input('maKH', sql.NVarChar, maKH)
            .input('maCB', sql.NVarChar, maCanhBao)
            .input('mucTieu', sql.NVarChar, mucTieuTongThe)
            .input('tranTC', sql.Int, tranTinChi || 14)
            .query(`INSERT INTO KeHoachCanThiep (MaKeHoach, MaCanhBao, MucTieuTongThe, TranTinChi, TrangThai) VALUES (@maKH, @maCB, @mucTieu, @tranTC, N'Đang can thiệp')`);

        if (Array.isArray(danhSachNhiemVu)) {
            for (const nv of danhSachNhiemVu) {
                if (!nv.tenNhiemVu) continue;
                await new sql.Request(transaction)
                    .input('maKH', sql.NVarChar, maKH)
                    .input('tenNV', sql.NVarChar, nv.tenNhiemVu)
                    .input('hanChot', sql.Date, nv.hanChot || '2026-05-30')
                    .query(`INSERT INTO NhiemVuCanThiep (MaKeHoach, TenNhiemVu, HanChot, TrangThaiHoanThanh) VALUES (@maKH, @tenNV, @hanChot, 0)`);
            }
        }

        await new sql.Request(transaction)
            .input('maCB', sql.NVarChar, maCanhBao)
            .query(`UPDATE CanhBao SET TrangThai = N'Đang can thiệp' WHERE MaCanhBao = @maCB`);

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

const toggleNhiemVuByAdvisor = async (maNhiemVu) => {
    const pool = await poolPromise;
    const check = await pool.request()
        .input('id', sql.Int, Number(maNhiemVu))
        .query(`
            SELECT kh.TrangThai
            FROM NhiemVuCanThiep nv
            JOIN KeHoachCanThiep kh ON nv.MaKeHoach = kh.MaKeHoach
            WHERE nv.MaNhiemVu = @id
        `);

    if (check.recordset.length === 0) throw new Error('Không tìm thấy nhiệm vụ!');
    if (check.recordset[0].TrangThai !== 'Đang can thiệp') {
        throw new Error('Kế hoạch can thiệp này đã đóng, không thể thay đổi trạng thái nhiệm vụ!');
    }

    await pool.request()
        .input('id', sql.Int, Number(maNhiemVu))
        .query(`
            UPDATE NhiemVuCanThiep
            SET TrangThaiHoanThanh = CASE WHEN TrangThaiHoanThanh = 1 THEN 0 ELSE 1 END
            WHERE MaNhiemVu = @id
        `);
};

const evaluateKeHoach = async (maKeHoach, { maCanhBao, ketQuaNghiemThu, danhGiaNghiemThu }) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const khCheck = await new sql.Request(transaction)
            .input('maKH', sql.NVarChar, maKeHoach)
            .query(`
                SELECT kh.TrangThai, kh.MucTieuTongThe, cb.MaSV
                FROM KeHoachCanThiep kh
                JOIN CanhBao cb ON kh.MaCanhBao = cb.MaCanhBao
                WHERE kh.MaKeHoach = @maKH
            `);

        if (khCheck.recordset.length === 0) throw new Error('Không tìm thấy kế hoạch can thiệp!');
        const { TrangThai, MucTieuTongThe, MaSV } = khCheck.recordset[0];
        if (TrangThai !== 'Đang can thiệp') {
            throw new Error('Kế hoạch này đã được nghiệm thu trước đó!');
        }

        const taskRes = await new sql.Request(transaction)
            .input('maKH', sql.NVarChar, maKeHoach)
            .query(`SELECT TenNhiemVu, TrangThaiHoanThanh FROM NhiemVuCanThiep WHERE MaKeHoach = @maKH`);

        const tasks = taskRes.recordset;
        const doneTasks = tasks.filter(t => t.TrangThaiHoanThanh);

        if (ketQuaNghiemThu === 'Hoàn thành' && (tasks.length === 0 || doneTasks.length < tasks.length)) {
            throw new Error(`Sinh viên mới đạt ${doneTasks.length}/${tasks.length} mốc nhiệm vụ, chưa đủ điều kiện nghiệm thu Hoàn thành!`);
        }

        await new sql.Request(transaction)
            .input('maKH', sql.NVarChar, maKeHoach)
            .input('tt', sql.NVarChar, ketQuaNghiemThu)
            .input('note', sql.NVarChar, danhGiaNghiemThu || '')
            .query(`
                UPDATE KeHoachCanThiep
                SET TrangThai = @tt, DanhGiaNghiemThu = @note, NgayNghiemThu = CAST(GETDATE() AS DATE)
                WHERE MaKeHoach = @maKH
            `);

        const trangThaiCB = ketQuaNghiemThu === 'Hoàn thành' ? 'Đã hủy' : 'Cần can thiệp';
        await new sql.Request(transaction)
            .input('maCB', sql.NVarChar, maCanhBao)
            .input('ttCB', sql.NVarChar, trangThaiCB)
            .query(`UPDATE CanhBao SET TrangThai = @ttCB WHERE MaCanhBao = @maCB`);

        const updatedSubjects = [];
        if (doneTasks.length > 0) {
            const subjectsRes = await new sql.Request(transaction)
                .input('maSV', sql.NVarChar, MaSV)
                .query(`
                    SELECT MaChiTiet, MaLO, TenMonHocOrChungChi, DiemSo
                    FROM ChiTietChuanDauRa
                    WHERE MaSV = @maSV AND Loai = N'Môn học'
                `);

            const approvedText = (
                doneTasks.map(t => t.TenNhiemVu).join(' ') +
                (ketQuaNghiemThu === 'Hoàn thành' ? ` ${MucTieuTongThe || ''}` : '')
            ).toLowerCase();

            const impactedLOs = new Set();

            for (const sub of subjectsRes.recordset) {
                const subName = (sub.TenMonHocOrChungChi || '').trim().toLowerCase();
                if (subName && approvedText.includes(subName)) {
                    const minScore = Math.max(6.5, Math.min(8.5, (sub.DiemSo || 0) + 1.5));
                    const randomScore = Number((minScore + Math.random() * (9.2 - minScore)).toFixed(1));

                    await new sql.Request(transaction)
                        .input('id', sql.Int, sub.MaChiTiet)
                        .input('diem', sql.Float, randomScore)
                        .query(`
                            UPDATE ChiTietChuanDauRa
                            SET DiemSo = @diem,
                                TrangThaiDat = 1,
                                TrangThaiDuyet = N'Đã duyệt',
                                GhiChuCoVan = N'Đã cải thiện điểm sau kế hoạch can thiệp'
                            WHERE MaChiTiet = @id
                        `);

                    updatedSubjects.push(`${sub.TenMonHocOrChungChi}: ${sub.DiemSo ?? 0} → ${randomScore}`);
                    impactedLOs.add(sub.MaLO);
                }
            }

            if (updatedSubjects.length > 0) {
                for (const maLO of impactedLOs) {
                    const loStats = await new sql.Request(transaction)
                        .input('maSV', sql.NVarChar, MaSV)
                        .input('maLO', sql.NVarChar, maLO)
                        .query(`
                            SELECT COUNT(*) AS Total,
                                   SUM(CASE WHEN TrangThaiDat = 1 THEN 1 ELSE 0 END) AS Passed
                            FROM ChiTietChuanDauRa
                            WHERE MaSV = @maSV AND MaLO = @maLO
                        `);
                    const { Total, Passed } = loStats.recordset[0];
                    const newPercent = Total > 0 ? Math.round((Passed / Total) * 100) : 0;

                    await new sql.Request(transaction)
                        .input('maSV', sql.NVarChar, MaSV)
                        .input('maLO', sql.NVarChar, maLO)
                        .input('pct', sql.Int, newPercent)
                        .query(`UPDATE ChuanDauRa SET TyLeDat = @pct WHERE MaSV = @maSV AND MaLO = @maLO`);
                }

                const avgRes = await new sql.Request(transaction)
                    .input('maSV', sql.NVarChar, MaSV)
                    .query(`
                        SELECT AVG(DiemSo) AS Avg10,
                               SUM(CASE WHEN DiemSo < 5.0 THEN 1 ELSE 0 END) AS FailedCount
                        FROM ChiTietChuanDauRa
                        WHERE MaSV = @maSV AND Loai = N'Môn học' AND DiemSo IS NOT NULL
                    `);
                const avg10 = avgRes.recordset[0]?.Avg10 || 0;
                const failedCount = avgRes.recordset[0]?.FailedCount || 0;
                const newGPA4 = Number(Math.min(4.0, (avg10 / 10) * 4).toFixed(2));

                await new sql.Request(transaction)
                    .input('maSV', sql.NVarChar, MaSV)
                    .input('gpa', sql.Float, newGPA4)
                    .input('no', sql.Int, failedCount)
                    .query(`
                        UPDATE KetQuaHocTap
                        SET DiemGPA = CASE WHEN @gpa > DiemGPA THEN @gpa ELSE DiemGPA END,
                            SoMonNo = @no
                        WHERE MaKQ = (SELECT TOP 1 MaKQ FROM KetQuaHocTap WHERE MaSV = @maSV ORDER BY MaKQ DESC)
                    `);
            }
        }

        await transaction.commit();
        return { updatedSubjects };
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

module.exports = {
    createKeHoach,
    toggleNhiemVuByAdvisor,
    evaluateKeHoach
};