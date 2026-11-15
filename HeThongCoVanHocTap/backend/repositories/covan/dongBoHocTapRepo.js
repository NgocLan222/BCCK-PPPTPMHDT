const { sql } = require('../../config/db');

const ensureAllStudentsAcademicData = async (pool) => {
    const hkRes = await pool.request().query(`SELECT TOP 1 MaHocKy FROM HocKy ORDER BY MaHocKy DESC`);
    const maHK = hkRes.recordset[0]?.MaHocKy;
    if (!maHK) return;

    const svRes = await pool.request().query(`SELECT MaSV, MaLop FROM SinhVien`);
    for (let i = 0; i < svRes.recordset.length; i++) {
        const { MaSV: maSV, MaLop: maLop } = svRes.recordset[i];

        const cdrCheck = await pool.request()
            .input('maSV', sql.NVarChar, maSV)
            .query(`SELECT 1 FROM ChuanDauRa WHERE MaSV = @maSV`);

        if (cdrCheck.recordset.length === 0) {
            await pool.request()
                .input('maSV', sql.NVarChar, maSV)
                .query(`
                    INSERT INTO ChuanDauRa (MaLO, MaSV, TenChuan, TyLeDat) VALUES
                    (N'LO1_LapTrinh', @maSV, N'Kỹ năng lập trình cơ sở', 0),
                    (N'LO2_NgoaiNgu', @maSV, N'Chuẩn tiếng Anh B1', 0)
                `);

            await pool.request()
                .input('maSV', sql.NVarChar, maSV)
                .query(`
                    INSERT INTO ChiTietChuanDauRa (MaLO, MaSV, TenMonHocOrChungChi, Loai, DiemSo, TrangThaiDat, TrangThaiDuyet)
                    VALUES (N'LO2_NgoaiNgu', @maSV, N'Chứng chỉ TOEIC 450 / B1', N'Chứng chỉ', NULL, 0, N'Chờ duyệt')
                `);
        }

        const tkbMonRes = await pool.request()
            .input('maLop', sql.NVarChar, maLop)
            .query(`
                SELECT mh.TenMon, mh.MaLO
                FROM ThoiKhoaBieuLop t
                JOIN MonHoc mh ON t.MaMon = mh.MaMon
                WHERE t.MaLop = @maLop
            `);

        let insertedNewSubject = false;
        for (const mh of tkbMonRes.recordset) {
            const subExists = await pool.request()
                .input('maSV', sql.NVarChar, maSV)
                .input('tenMon', sql.NVarChar, mh.TenMon)
                .query(`SELECT 1 FROM ChiTietChuanDauRa WHERE MaSV = @maSV AND TenMonHocOrChungChi = @tenMon AND Loai = N'Môn học'`);

            if (subExists.recordset.length === 0) {
                const randScore = Number((1 + Math.random() * 9).toFixed(1));
                const passed = randScore >= 5.0 ? 1 : 0;

                await pool.request()
                    .input('maLO', sql.NVarChar, mh.MaLO)
                    .input('maSV', sql.NVarChar, maSV)
                    .input('tenMon', sql.NVarChar, mh.TenMon)
                    .input('diem', sql.Float, randScore)
                    .input('dat', sql.Bit, passed)
                    .input('tt', sql.NVarChar, passed ? 'Đã duyệt' : 'Từ chối')
                    .query(`
                        INSERT INTO ChiTietChuanDauRa (MaLO, MaSV, TenMonHocOrChungChi, Loai, DiemSo, TrangThaiDat, TrangThaiDuyet)
                        VALUES (@maLO, @maSV, @tenMon, N'Môn học', @diem, @dat, @tt)
                    `);
                insertedNewSubject = true;
            }
        }

        const kqCheck = await pool.request()
            .input('maSV', sql.NVarChar, maSV)
            .input('maHK', sql.NVarChar, maHK)
            .query(`SELECT 1 FROM KetQuaHocTap WHERE MaSV = @maSV AND MaHocKy = @maHK`);

        if (kqCheck.recordset.length === 0 || insertedNewSubject) {
            await pool.request()
                .input('maSV', sql.NVarChar, maSV)
                .query(`
                    UPDATE ChuanDauRa
                    SET TyLeDat = ISNULL((
                        SELECT CAST(SUM(CASE WHEN TrangThaiDat = 1 THEN 100.0 ELSE 0.0 END) / NULLIF(COUNT(*), 0) AS DECIMAL(5,2))
                        FROM ChiTietChuanDauRa
                        WHERE MaSV = @maSV AND MaLO = N'LO1_LapTrinh'
                    ), 0)
                    WHERE MaSV = @maSV AND MaLO = N'LO1_LapTrinh'
                `);

            const stats = await pool.request()
                .input('maSV', sql.NVarChar, maSV)
                .query(`
                    SELECT AVG(DiemSo) AS Avg10,
                           SUM(CASE WHEN DiemSo < 5.0 THEN 1 ELSE 0 END) AS FailedCount,
                           SUM(CASE WHEN DiemSo >= 5.0 THEN 3 ELSE 0 END) AS PassedCredits
                    FROM ChiTietChuanDauRa
                    WHERE MaSV = @maSV AND Loai = N'Môn học' AND DiemSo IS NOT NULL
                `);

            const avg10 = stats.recordset[0]?.Avg10 || 0;
            const failedCount = stats.recordset[0]?.FailedCount || 0;
            const credits = 30 + (stats.recordset[0]?.PassedCredits || 0);
            const gpa4 = Number(Math.min(4.0, (avg10 / 10) * 4).toFixed(2));

            if (kqCheck.recordset.length === 0) {
                await pool.request()
                    .input('maSV', sql.NVarChar, maSV)
                    .input('maHK', sql.NVarChar, maHK)
                    .input('gpa', sql.Float, gpa4)
                    .input('tc', sql.Int, credits)
                    .input('no', sql.Int, failedCount)
                    .query(`INSERT INTO KetQuaHocTap (MaSV, MaHocKy, DiemGPA, TinChiTichLuy, SoMonNo) VALUES (@maSV, @maHK, @gpa, @tc, @no)`);
            } else {
                await pool.request()
                    .input('maSV', sql.NVarChar, maSV)
                    .input('maHK', sql.NVarChar, maHK)
                    .input('gpa', sql.Float, gpa4)
                    .input('tc', sql.Int, credits)
                    .input('no', sql.Int, failedCount)
                    .query(`UPDATE KetQuaHocTap SET DiemGPA = @gpa, TinChiTichLuy = @tc, SoMonNo = @no WHERE MaSV = @maSV AND MaHocKy = @maHK`);
            }
        }

        const hpCheck = await pool.request()
            .input('maSV', sql.NVarChar, maSV)
            .input('maHK', sql.NVarChar, maHK)
            .query(`SELECT 1 FROM HocPhi WHERE MaSV = @maSV AND MaHocKy = @maHK`);

        if (hpCheck.recordset.length === 0) {
            const isDebt = (i % 4 === 1);
            await pool.request()
                .input('maHP', sql.NVarChar, `HP_${maSV}`)
                .input('maSV', sql.NVarChar, maSV)
                .input('maHK', sql.NVarChar, maHK)
                .input('daDong', sql.Decimal(18, 0), isDebt ? 0 : 8500000)
                .input('tt', sql.NVarChar, isDebt ? 'Còn nợ học phí' : 'Đã đóng đủ')
                .query(`
                    INSERT INTO HocPhi (MaHocPhi, MaSV, MaHocKy, SoTienPhaiDong, SoTienDaDong, HanDong, TrangThaiHocPhi)
                    VALUES (@maHP, @maSV, @maHK, 8500000, @daDong, '2026-04-30', @tt)
                `);
        }
    }
};

module.exports = { ensureAllStudentsAcademicData };