const { sql, poolPromise } = require('../../config/db');

// Chặn sinh viên tự tick nhiệm vụ can thiệp (chỉ Cố vấn học tập mới có quyền đánh dấu)
const toggleNhiemVu = async () => {
    throw new Error('Chỉ Cố vấn học tập mới có quyền xác nhận hoàn thành nhiệm vụ can thiệp!');
};

// Thanh toán học phí qua mã QR
const payTuitionByQR = async (maHocPhi) => {
    const pool = await poolPromise;
    await pool.request().input('id', sql.NVarChar, maHocPhi).query(`
        UPDATE HocPhi
        SET SoTienDaDong = SoTienPhaiDong,
            NgayDongThucTe = GETDATE(),
            TrangThaiHocPhi = CASE WHEN CAST(GETDATE() AS DATE) <= HanDong THEN N'Đã đóng đủ' ELSE N'Đóng trễ hạn' END
        WHERE MaHocPhi = @id
    `);
};

// Nộp ảnh/PDF biên lai minh chứng khi bị báo nợ nhầm
const submitTuitionProof = async (maHocPhi, anhMinhChung, ghiChu) => {
    const pool = await poolPromise;
    await pool.request()
        .input('id', sql.NVarChar, maHocPhi)
        .input('img', sql.NVarChar(sql.MAX), anhMinhChung)
        .input('note', sql.NVarChar, ghiChu || 'Sinh viên đã đóng đủ học phí, gửi biên lai đối soát.')
        .query(`UPDATE HocPhi SET MinhChungDongTien = @img, GhiChuMinhChung = @note, TrangThaiHocPhi = N'Chờ duyệt minh chứng' WHERE MaHocPhi = @id`);
};

module.exports = {
    toggleNhiemVu,
    payTuitionByQR,
    submitTuitionProof
};