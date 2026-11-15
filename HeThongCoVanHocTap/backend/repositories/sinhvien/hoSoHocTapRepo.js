const { sql, poolPromise } = require('../../config/db');
const { ensureAllStudentsAcademicData } = require('../coVanRepository');

const getDashboardData = async (maSV) => {
    const pool = await poolPromise;

    // Tự động đồng bộ danh sách môn học theo TKB của lớp SV, điểm random 1-10, GPA & Chuẩn đầu ra
    await ensureAllStudentsAcademicData(pool);

    const ketQua = await pool.request().input('maSV', sql.NVarChar, maSV)
        .query(`SELECT kq.*, hk.TenHocKy, hk.NamHoc FROM KetQuaHocTap kq JOIN HocKy hk ON kq.MaHocKy = hk.MaHocKy WHERE kq.MaSV = @maSV ORDER BY kq.MaKQ DESC`);

    const hocPhi = await pool.request().input('maSV', sql.NVarChar, maSV)
        .query(`SELECT hp.*, hk.TenHocKy, hk.NamHoc FROM HocPhi hp JOIN HocKy hk ON hp.MaHocKy = hk.MaHocKy WHERE hp.MaSV = @maSV ORDER BY hp.HanDong DESC`);

    const chuanDauRa = await pool.request().input('maSV', sql.NVarChar, maSV)
        .query(`SELECT * FROM ChuanDauRa WHERE MaSV = @maSV`);

    const chiTietCDR = await pool.request().input('maSV', sql.NVarChar, maSV)
        .query(`SELECT * FROM ChiTietChuanDauRa WHERE MaSV = @maSV ORDER BY Loai DESC, MaChiTiet ASC`);

    const canhBao = await pool.request().input('maSV', sql.NVarChar, maSV).query(`
        SELECT cb.*, cv.HoTen AS TenCoVan, hk.TenHocKy,
               ph.MaPhanHoi, ph.NoiDungGiaiTrinh, ph.TepMinhChung, ph.KetQuaDuyet, ph.YKienCoVan
        FROM CanhBao cb
        JOIN CoVanHocTap cv ON cb.MaCV = cv.MaCV
        JOIN HocKy hk ON cb.MaHocKy = hk.MaHocKy
        LEFT JOIN PhanHoi ph ON cb.MaCanhBao = ph.MaCanhBao
        WHERE cb.MaSV = @maSV AND cb.TrangThai <> N'Bản nháp'
        ORDER BY cb.NgayBanHanh DESC
    `);

    const bangChung = await pool.request().input('maSV', sql.NVarChar, maSV)
        .query(`SELECT bc.* FROM ChiTietBangChung bc JOIN CanhBao cb ON bc.MaCanhBao = cb.MaCanhBao WHERE cb.MaSV = @maSV`);

    const keHoach = await pool.request().input('maSV', sql.NVarChar, maSV)
        .query(`SELECT kh.*, cb.MucDoRuiRo FROM KeHoachCanThiep kh JOIN CanhBao cb ON kh.MaCanhBao = cb.MaCanhBao WHERE cb.MaSV = @maSV ORDER BY kh.NgayLap DESC`);

    const nhiemVu = await pool.request().input('maSV', sql.NVarChar, maSV)
        .query(`SELECT nv.* FROM NhiemVuCanThiep nv JOIN KeHoachCanThiep kh ON nv.MaKeHoach = kh.MaKeHoach JOIN CanhBao cb ON kh.MaCanhBao = cb.MaCanhBao WHERE cb.MaSV = @maSV`);

    return {
        ketQua: ketQua.recordset,
        ketQuaHocTap: ketQua.recordset,
        hocPhi: hocPhi.recordset,
        chuanDauRa: chuanDauRa.recordset,
        chiTietCDR: chiTietCDR.recordset,
        canhBao: canhBao.recordset,
        bangChung: bangChung.recordset,
        keHoach: keHoach.recordset,
        nhiemVu: nhiemVu.recordset
    };
};

module.exports = { getDashboardData };