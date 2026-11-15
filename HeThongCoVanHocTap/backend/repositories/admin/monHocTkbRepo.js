const { sql, poolPromise } = require('../../config/db');

const addLearningOutcome = async (maLO, tenChuan) => {
    const pool = await poolPromise;
    const check = await pool.request()
        .input('maLO', sql.NVarChar, maLO.trim())
        .query(`SELECT TOP 1 MaLO FROM ChuanDauRa WHERE MaLO = @maLO`);

    if (check.recordset.length > 0) {
        throw new Error('Mã chuẩn đầu ra này đã tồn tại!');
    }

    await pool.request()
        .input('maLO', sql.NVarChar, maLO.trim())
        .input('tenChuan', sql.NVarChar, tenChuan.trim())
        .query(`
            INSERT INTO ChuanDauRa (MaLO, MaSV, TenChuan, TyLeDat)
            SELECT @maLO, MaSV, @tenChuan, 0.00 FROM SinhVien
        `);
};

const updateLearningOutcome = async (maLO, tenChuan) => {
    const pool = await poolPromise;
    await pool.request()
        .input('maLO', sql.NVarChar, maLO)
        .input('tenChuan', sql.NVarChar, tenChuan.trim())
        .query(`UPDATE ChuanDauRa SET TenChuan = @tenChuan WHERE MaLO = @maLO`);
};

const deleteLearningOutcome = async (maLO) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        await new sql.Request(transaction)
            .input('maLO', sql.NVarChar, maLO)
            .query(`DELETE FROM ChiTietChuanDauRa WHERE MaLO = @maLO`);
        await new sql.Request(transaction)
            .input('maLO', sql.NVarChar, maLO)
            .query(`DELETE FROM ChuanDauRa WHERE MaLO = @maLO`);
        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

const getSubjectsAndSchedules = async () => {
    const pool = await poolPromise;
    const monHoc = await pool.request().query(`SELECT * FROM MonHoc ORDER BY MaMon ASC`);
    const tkb = await pool.request().query(`
        SELECT t.*, l.TenLop, mh.TenMon, mh.SoTinChi, mh.MaLO
        FROM ThoiKhoaBieuLop t
        JOIN LopSinhHoat l ON t.MaLop = l.MaLop
        JOIN MonHoc mh ON t.MaMon = mh.MaMon
        ORDER BY t.MaLop ASC, t.ThuTrongTuan ASC
    `);
    return { monHoc: monHoc.recordset, tkb: tkb.recordset };
};

const createMonHoc = async ({ maMon, tenMon, soTinChi, maLO }) => {
    const pool = await poolPromise;
    await pool.request()
        .input('ma', sql.NVarChar, maMon.trim().toUpperCase())
        .input('ten', sql.NVarChar, tenMon.trim())
        .input('tc', sql.Int, Number(soTinChi) || 3)
        .input('lo', sql.NVarChar, maLO || 'LO1_LapTrinh')
        .query(`INSERT INTO MonHoc (MaMon, TenMon, SoTinChi, MaLO) VALUES (@ma, @ten, @tc, @lo)`);
};

const updateMonHoc = async (maMon, { tenMon, soTinChi, maLO }, oldTenMon) => {
    const pool = await poolPromise;
    await pool.request()
        .input('ma', sql.NVarChar, maMon)
        .input('ten', sql.NVarChar, tenMon.trim())
        .input('tc', sql.Int, Number(soTinChi) || 3)
        .input('lo', sql.NVarChar, maLO || 'LO1_LapTrinh')
        .query(`UPDATE MonHoc SET TenMon = @ten, SoTinChi = @tc, MaLO = @lo WHERE MaMon = @ma`);

    if (oldTenMon && oldTenMon !== tenMon.trim()) {
        await pool.request()
            .input('oldTen', sql.NVarChar, oldTenMon)
            .input('newTen', sql.NVarChar, tenMon.trim())
            .query(`UPDATE ChiTietChuanDauRa SET TenMonHocOrChungChi = @newTen WHERE TenMonHocOrChungChi = @oldTen AND Loai = N'Môn học'`);
    }
};

const deleteMonHoc = async (maMon) => {
    const pool = await poolPromise;
    const mh = await pool.request().input('ma', sql.NVarChar, maMon).query(`SELECT TenMon FROM MonHoc WHERE MaMon = @ma`);
    const tenMon = mh.recordset[0]?.TenMon;

    await pool.request().input('ma', sql.NVarChar, maMon).query(`DELETE FROM MonHoc WHERE MaMon = @ma`);
    if (tenMon) {
        await pool.request().input('ten', sql.NVarChar, tenMon)
            .query(`DELETE FROM ChiTietChuanDauRa WHERE TenMonHocOrChungChi = @ten AND Loai = N'Môn học'`);
    }
};

const assignSubjectToClass = async ({ maLop, maMon, thuTrongTuan, tietHoc, phongHoc }) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        await new sql.Request(transaction)
            .input('maLop', sql.NVarChar, maLop)
            .input('maMon', sql.NVarChar, maMon)
            .input('thu', sql.NVarChar, thuTrongTuan || 'Thứ 2')
            .input('tiet', sql.NVarChar, tietHoc || 'Tiết 1 - 3')
            .input('phong', sql.NVarChar, phongHoc || 'A101')
            .query(`
                INSERT INTO ThoiKhoaBieuLop (MaLop, MaMon, ThuTrongTuan, TietHoc, PhongHoc)
                VALUES (@maLop, @maMon, @thu, @tiet, @phong)
            `);

        const mhRes = await new sql.Request(transaction)
            .input('maMon', sql.NVarChar, maMon)
            .query(`SELECT TenMon, MaLO FROM MonHoc WHERE MaMon = @maMon`);
        const { TenMon, MaLO } = mhRes.recordset[0];

        const svList = await new sql.Request(transaction)
            .input('maLop', sql.NVarChar, maLop)
            .query(`SELECT MaSV FROM SinhVien WHERE MaLop = @maLop`);

        for (const sv of svList.recordset) {
            const exists = await new sql.Request(transaction)
                .input('maSV', sql.NVarChar, sv.MaSV)
                .input('tenMon', sql.NVarChar, TenMon)
                .query(`SELECT 1 FROM ChiTietChuanDauRa WHERE MaSV = @maSV AND TenMonHocOrChungChi = @tenMon AND Loai = N'Môn học'`);

            if (exists.recordset.length === 0) {
                const randScore = Number((1 + Math.random() * 9).toFixed(1));
                const passed = randScore >= 5.0 ? 1 : 0;

                await new sql.Request(transaction)
                    .input('maLO', sql.NVarChar, MaLO)
                    .input('maSV', sql.NVarChar, sv.MaSV)
                    .input('tenMon', sql.NVarChar, TenMon)
                    .input('diem', sql.Float, randScore)
                    .input('dat', sql.Bit, passed)
                    .input('tt', sql.NVarChar, passed ? 'Đã duyệt' : 'Từ chối')
                    .query(`
                        INSERT INTO ChiTietChuanDauRa (MaLO, MaSV, TenMonHocOrChungChi, Loai, DiemSo, TrangThaiDat, TrangThaiDuyet)
                        VALUES (@maLO, @maSV, @tenMon, N'Môn học', @diem, @dat, @tt)
                    `);
            }
        }

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

const removeSubjectFromClass = async (maTKB) => {
    const pool = await poolPromise;
    const info = await pool.request()
        .input('id', sql.Int, Number(maTKB))
        .query(`
            SELECT t.MaLop, mh.TenMon
            FROM ThoiKhoaBieuLop t
            JOIN MonHoc mh ON t.MaMon = mh.MaMon
            WHERE t.MaTKB = @id
        `);

    if (info.recordset.length > 0) {
        const { MaLop, TenMon } = info.recordset[0];
        await pool.request().input('id', sql.Int, Number(maTKB)).query(`DELETE FROM ThoiKhoaBieuLop WHERE MaTKB = @id`);
        await pool.request()
            .input('maLop', sql.NVarChar, MaLop)
            .input('tenMon', sql.NVarChar, TenMon)
            .query(`
                DELETE ct
                FROM ChiTietChuanDauRa ct
                JOIN SinhVien sv ON ct.MaSV = sv.MaSV
                WHERE sv.MaLop = @maLop AND ct.TenMonHocOrChungChi = @tenMon AND ct.Loai = N'Môn học'
            `);
    }
};

module.exports = {
    addLearningOutcome,
    updateLearningOutcome,
    deleteLearningOutcome,
    getSubjectsAndSchedules,
    createMonHoc,
    updateMonHoc,
    deleteMonHoc,
    assignSubjectToClass,
    removeSubjectFromClass
};