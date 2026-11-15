const { sql, poolPromise } = require('../../config/db');
const { ensureAllStudentsAcademicData } = require('./dongBoHocTapRepo');

const getDashboardData = async (maCV) => {
    const pool = await poolPromise;
    await ensureAllStudentsAcademicData(pool);

    const sinhVien = await pool.request().input('maCV', sql.NVarChar, maCV).query(`
        SELECT sv.MaSV, sv.HoTen, sv.NgaySinh, sv.Phai, sv.Email, sv.SoDienThoai, sv.MaLop, l.TenLop,
               kq.DiemGPA, kq.TinChiTichLuy, kq.SoMonNo,
               hp.TrangThaiHocPhi, hp.SoTienPhaiDong, hp.SoTienDaDong
        FROM SinhVien sv
        JOIN LopSinhHoat l ON sv.MaLop = l.MaLop
        OUTER APPLY (SELECT TOP 1 * FROM KetQuaHocTap WHERE MaSV = sv.MaSV ORDER BY MaKQ DESC) kq
        OUTER APPLY (SELECT TOP 1 * FROM HocPhi WHERE MaSV = sv.MaSV ORDER BY HanDong DESC) hp
        WHERE l.MaCV = @maCV
    `);

    const chuanDauRa = await pool.request().input('maCV', sql.NVarChar, maCV).query(`
        SELECT cdr.*, sv.HoTen AS TenSV
        FROM ChuanDauRa cdr
        JOIN SinhVien sv ON cdr.MaSV = sv.MaSV
        JOIN LopSinhHoat l ON sv.MaLop = l.MaLop
        WHERE l.MaCV = @maCV
    `);

    const minhChungNangLuc = await pool.request().input('maCV', sql.NVarChar, maCV).query(`
        SELECT ct.*, cdr.TenChuan, sv.HoTen AS TenSV, sv.MaLop
        FROM ChiTietChuanDauRa ct
        JOIN ChuanDauRa cdr ON ct.MaLO = cdr.MaLO AND ct.MaSV = cdr.MaSV
        JOIN SinhVien sv ON ct.MaSV = sv.MaSV
        JOIN LopSinhHoat l ON sv.MaLop = l.MaLop
        WHERE l.MaCV = @maCV
        ORDER BY ct.MaChiTiet DESC
    `);

    const canhBao = await pool.request().input('maCV', sql.NVarChar, maCV).query(`
        SELECT cb.*, sv.HoTen AS TenSV, sv.MaLop, hk.TenHocKy,
               ph.MaPhanHoi, ph.NoiDungGiaiTrinh, ph.TepMinhChung, ph.KetQuaDuyet, ph.YKienCoVan, ph.NgayPhanHoi
        FROM CanhBao cb
        JOIN SinhVien sv ON cb.MaSV = sv.MaSV
        JOIN HocKy hk ON cb.MaHocKy = hk.MaHocKy
        LEFT JOIN PhanHoi ph ON cb.MaCanhBao = ph.MaCanhBao
        WHERE cb.MaCV = @maCV
        ORDER BY cb.NgayBanHanh DESC
    `);

    const bangChung = await pool.request().input('maCV', sql.NVarChar, maCV).query(`
        SELECT bc.* FROM ChiTietBangChung bc
        JOIN CanhBao cb ON bc.MaCanhBao = cb.MaCanhBao
        WHERE cb.MaCV = @maCV
    `);

    const keHoach = await pool.request().input('maCV', sql.NVarChar, maCV).query(`
        SELECT kh.*, cb.MaSV, sv.HoTen AS TenSV, sv.MaLop, cb.MucDoRuiRo
        FROM KeHoachCanThiep kh
        JOIN CanhBao cb ON kh.MaCanhBao = cb.MaCanhBao
        JOIN SinhVien sv ON cb.MaSV = sv.MaSV
        WHERE cb.MaCV = @maCV
        ORDER BY kh.NgayLap DESC
    `);

    const nhiemVu = await pool.request().input('maCV', sql.NVarChar, maCV).query(`
        SELECT nv.* FROM NhiemVuCanThiep nv
        JOIN KeHoachCanThiep kh ON nv.MaKeHoach = kh.MaKeHoach
        JOIN CanhBao cb ON kh.MaCanhBao = cb.MaCanhBao
        WHERE cb.MaCV = @maCV
    `);

    return {
        sinhVien: sinhVien.recordset,
        chuanDauRa: chuanDauRa.recordset,
        minhChungNangLuc: minhChungNangLuc.recordset,
        canhBao: canhBao.recordset,
        bangChung: bangChung.recordset,
        keHoach: keHoach.recordset,
        nhiemVu: nhiemVu.recordset
    };
};

const reviewCompetencyProof = async (maChiTiet, { chapThuan, ghiChuCoVan }) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const info = await new sql.Request(transaction)
            .input('id', sql.Int, maChiTiet)
            .query(`SELECT MaLO, MaSV FROM ChiTietChuanDauRa WHERE MaChiTiet = @id`);

        if (info.recordset.length === 0) {
            throw new Error('Không tìm thấy minh chứng năng lực!');
        }
        const { MaLO, MaSV } = info.recordset[0];

        await new sql.Request(transaction)
            .input('id', sql.Int, maChiTiet)
            .input('dat', sql.Bit, chapThuan ? 1 : 0)
            .input('tt', sql.NVarChar, chapThuan ? 'Đã duyệt' : 'Từ chối')
            .input('note', sql.NVarChar, ghiChuCoVan || (chapThuan ? 'Minh chứng hợp lệ' : 'Chưa đủ điều kiện công nhận'))
            .query(`
                UPDATE ChiTietChuanDauRa
                SET TrangThaiDat = @dat, TrangThaiDuyet = @tt, GhiChuCoVan = @note
                WHERE MaChiTiet = @id
            `);

        await new sql.Request(transaction)
            .input('maLO', sql.NVarChar, MaLO)
            .input('maSV', sql.NVarChar, MaSV)
            .query(`
                UPDATE ChuanDauRa
                SET TyLeDat = ISNULL((
                    SELECT CAST(SUM(CASE WHEN TrangThaiDat = 1 THEN 100.0 ELSE 0.0 END) / NULLIF(COUNT(*), 0) AS DECIMAL(5,2))
                    FROM ChiTietChuanDauRa
                    WHERE MaLO = @maLO AND MaSV = @maSV
                ), 0)
                WHERE MaLO = @maLO AND MaSV = @maSV
            `);

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

module.exports = {
    getDashboardData,
    reviewCompetencyProof
};