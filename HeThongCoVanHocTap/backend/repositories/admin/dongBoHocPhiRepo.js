const { sql, poolPromise } = require('../../config/db');

const importStudentsFromExcel = async (students) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        let added = 0, updated = 0;

        for (const sv of students) {
            const maSV = String(sv.MaSV || '').trim();
            const hoTen = String(sv.HoTen || '').trim();
            const maLop = String(sv.MaLop || '').trim();
            if (!maSV || !hoTen || !maLop) continue;

            const phai = String(sv.Phai || '').trim() === 'Nữ' ? 'Nữ' : 'Nam';
            const ngaySinh = sv.NgaySinh || '2004-01-01';
            const email = String(sv.Email || `${maSV.toLowerCase()}@student.edu.vn`).trim();
            const sdt = sv.SoDienThoai ? String(sv.SoDienThoai).trim() : null;

            const check = await new sql.Request(transaction).input('maSV', sql.NVarChar, maSV)
                .query(`SELECT MaSV FROM SinhVien WHERE MaSV = @maSV`);

            if (check.recordset.length === 0) {
                await new sql.Request(transaction)
                    .input('maSV', sql.NVarChar, maSV).input('hoTen', sql.NVarChar, hoTen)
                    .input('ngaySinh', sql.Date, ngaySinh).input('phai', sql.NVarChar, phai)
                    .input('email', sql.NVarChar, email).input('sdt', sql.NVarChar, sdt).input('maLop', sql.NVarChar, maLop)
                    .query(`INSERT INTO SinhVien (MaSV, HoTen, NgaySinh, Phai, Email, SoDienThoai, MaLop, TenDangNhap) VALUES (@maSV, @hoTen, @ngaySinh, @phai, @email, @sdt, @maLop, NULL)`);
                added++;
            } else {
                await new sql.Request(transaction)
                    .input('maSV', sql.NVarChar, maSV).input('hoTen', sql.NVarChar, hoTen)
                    .input('ngaySinh', sql.Date, ngaySinh).input('phai', sql.NVarChar, phai)
                    .input('email', sql.NVarChar, email).input('sdt', sql.NVarChar, sdt).input('maLop', sql.NVarChar, maLop)
                    .query(`UPDATE SinhVien SET HoTen = @hoTen, NgaySinh = @ngaySinh, Phai = @phai, Email = @email, SoDienThoai = @sdt, MaLop = @maLop WHERE MaSV = @maSV`);
                updated++;
            }
        }

        await new sql.Request(transaction).query(`
            INSERT INTO HocPhi (MaHocPhi, MaSV, MaHocKy, SoTienPhaiDong, SoTienDaDong, HanDong, TrangThaiHocPhi)
            SELECT N'HP_' + sv.MaSV + N'_' + hk.MaHocKy, sv.MaSV, hk.MaHocKy, 8500000, 0, '2026-03-15', N'Còn nợ học phí'
            FROM SinhVien sv
            CROSS JOIN (SELECT TOP 1 MaHocKy FROM HocKy WHERE HocKyHienTai = 1 ORDER BY MaHocKy DESC) hk
            WHERE NOT EXISTS (SELECT 1 FROM HocPhi hp WHERE hp.MaSV = sv.MaSV AND hp.MaHocKy = hk.MaHocKy)
        `);

        await transaction.commit();
        return { added, updated };
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

const syncTuition = async () => {
    const pool = await poolPromise;
    await pool.request().query(`
        INSERT INTO HocPhi (MaHocPhi, MaSV, MaHocKy, SoTienPhaiDong, SoTienDaDong, HanDong, TrangThaiHocPhi)
        SELECT N'HP_' + sv.MaSV + N'_' + hk.MaHocKy, sv.MaSV, hk.MaHocKy, 8500000, 0, '2026-03-15', N'Còn nợ học phí'
        FROM SinhVien sv
        CROSS JOIN (SELECT TOP 1 MaHocKy FROM HocKy WHERE HocKyHienTai = 1 ORDER BY MaHocKy DESC) hk
        WHERE NOT EXISTS (SELECT 1 FROM HocPhi hp WHERE hp.MaSV = sv.MaSV AND hp.MaHocKy = hk.MaHocKy)
    `);
    await pool.request().query(`
        UPDATE HocPhi
        SET TrangThaiHocPhi = CASE
            WHEN TrangThaiHocPhi = N'Chờ duyệt minh chứng' THEN N'Chờ duyệt minh chứng'
            WHEN SoTienDaDong >= SoTienPhaiDong AND (NgayDongThucTe IS NULL OR NgayDongThucTe <= HanDong) THEN N'Đã đóng đủ'
            WHEN SoTienDaDong >= SoTienPhaiDong AND NgayDongThucTe > HanDong THEN N'Đóng trễ hạn'
            ELSE N'Còn nợ học phí'
        END
    `);
};

const approveTuitionProof = async (maHocPhi, chapThuan, loaiHoanThanh = 'dung_han') => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const hpInfo = await new sql.Request(transaction)
            .input('id', sql.NVarChar, maHocPhi)
            .query(`SELECT MaSV FROM HocPhi WHERE MaHocPhi = @id`);

        if (hpInfo.recordset.length === 0) throw new Error('Không tìm thấy bản ghi học phí!');
        const { MaSV } = hpInfo.recordset[0];

        if (chapThuan) {
            const trangThaiMoi = loaiHoanThanh === 'tre_han' ? 'Đóng trễ hạn' : 'Đã đóng đủ';
            await new sql.Request(transaction)
                .input('id', sql.NVarChar, maHocPhi)
                .input('tt', sql.NVarChar, trangThaiMoi)
                .query(`
                    UPDATE HocPhi
                    SET SoTienDaDong = SoTienPhaiDong,
                        NgayDongThucTe = ISNULL(NgayDongThucTe, GETDATE()),
                        TrangThaiHocPhi = @tt
                    WHERE MaHocPhi = @id
                `);

            await new sql.Request(transaction)
                .input('maSV', sql.NVarChar, MaSV)
                .input('tt', sql.NVarChar, trangThaiMoi)
                .query(`
                    UPDATE bc
                    SET bc.ChiTiet = N'[Đã gỡ] Admin đã xác nhận học phí: ' + @tt
                    FROM ChiTietBangChung bc
                    JOIN CanhBao cb ON bc.MaCanhBao = cb.MaCanhBao
                    WHERE cb.MaSV = @maSV AND bc.LoaiViPham LIKE N'%học phí%'
                `);
        } else {
            await new sql.Request(transaction)
                .input('id', sql.NVarChar, maHocPhi)
                .query(`
                    UPDATE HocPhi
                    SET TrangThaiHocPhi = N'Còn nợ học phí',
                        GhiChuMinhChung = N'Admin từ chối minh chứng - Yêu cầu sinh viên đóng học phí bổ sung'
                    WHERE MaHocPhi = @id
                `);

            await new sql.Request(transaction)
                .input('maSV', sql.NVarChar, MaSV)
                .query(`
                    UPDATE bc
                    SET bc.ChiTiet = N'[Giữ nguyên] Admin từ chối minh chứng học phí - Vẫn còn nợ'
                    FROM ChiTietBangChung bc
                    JOIN CanhBao cb ON bc.MaCanhBao = cb.MaCanhBao
                    WHERE cb.MaSV = @maSV AND bc.LoaiViPham LIKE N'%học phí%'
                `);
        }

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

module.exports = {
    importStudentsFromExcel,
    syncTuition,
    approveTuitionProof
};