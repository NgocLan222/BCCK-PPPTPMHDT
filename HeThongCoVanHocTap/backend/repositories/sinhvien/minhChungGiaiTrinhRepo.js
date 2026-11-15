const { sql, poolPromise } = require('../../config/db');

// Nộp minh chứng năng lực / chứng chỉ (kèm dữ liệu ảnh/PDF Base64)
const submitCompetencyProof = async ({ maSV, maLO, tenMinhChung, tepMinhChung, tenTep }) => {
    const pool = await poolPromise;
    await pool.request()
        .input('maLO', sql.NVarChar, maLO)
        .input('maSV', sql.NVarChar, maSV)
        .input('ten', sql.NVarChar, tenMinhChung)
        .input('tep', sql.NVarChar(sql.MAX), tepMinhChung || '')
        .input('tenTep', sql.NVarChar, tenTep || 'chung_chi_minh_chung.pdf')
        .query(`
            INSERT INTO ChiTietChuanDauRa (MaLO, MaSV, TenMonHocOrChungChi, Loai, DiemSo, TrangThaiDat, TrangThaiDuyet, TepMinhChung, TenTep)
            VALUES (@maLO, @maSV, @ten, N'Chứng chỉ', NULL, 0, N'Chờ duyệt', @tep, @tenTep)
        `);
};

// Gửi phản hồi giải trình cảnh báo kèm tệp minh chứng
const createPhanHoi = async (maCanhBao, noiDungGiaiTrinh, tepMinhChung, tenTep) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const maPH = 'PH_' + Date.now().toString().slice(-6);
        await new sql.Request(transaction)
            .input('maPH', sql.NVarChar, maPH)
            .input('maCB', sql.NVarChar, maCanhBao)
            .input('noiDung', sql.NVarChar, noiDungGiaiTrinh)
            .input('tep', sql.NVarChar(sql.MAX), tepMinhChung || '')
            .input('tenTep', sql.NVarChar, tenTep || 'minh_chung_giai_trinh.pdf')
            .query(`
                INSERT INTO PhanHoi (MaPhanHoi, MaCanhBao, NoiDungGiaiTrinh, TepMinhChung, TenTep, KetQuaDuyet)
                VALUES (@maPH, @maCB, @noiDung, @tep, @tenTep, N'Chờ duyệt')
            `);

        await new sql.Request(transaction)
            .input('maCB', sql.NVarChar, maCanhBao)
            .query(`UPDATE CanhBao SET TrangThai = N'Đã phản hồi' WHERE MaCanhBao = @maCB`);

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

module.exports = {
    submitCompetencyProof,
    createPhanHoi
};