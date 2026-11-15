const { sql, poolPromise } = require('../../config/db');

const getOverview = async () => {
    const pool = await poolPromise;
    const taiKhoan = await pool.request().query(`
        SELECT tk.TenDangNhap, tk.VaiTro, tk.TrangThai,
               COALESCE(sv.MaSV, cv.MaCV, N'—') AS MaChuSoHuu,
               COALESCE(sv.HoTen, cv.HoTen, N'Quản trị hệ thống') AS HoTenChuSoHuu
        FROM TaiKhoan tk
        LEFT JOIN SinhVien sv ON tk.TenDangNhap = sv.TenDangNhap
        LEFT JOIN CoVanHocTap cv ON tk.TenDangNhap = cv.TenDangNhap
    `);
    const yeuCauMatKhau = await pool.request().query(`
        SELECT yc.MaYeuCau, yc.TenDangNhap, yc.LyDo, yc.TrangThai, yc.NgayGui,
               tk.VaiTro, COALESCE(sv.HoTen, cv.HoTen, yc.TenDangNhap) AS HoTen
        FROM YeuCauDoiMatKhau yc
        JOIN TaiKhoan tk ON yc.TenDangNhap = tk.TenDangNhap
        LEFT JOIN SinhVien sv ON tk.TenDangNhap = sv.TenDangNhap
        LEFT JOIN CoVanHocTap cv ON tk.TenDangNhap = cv.TenDangNhap
        ORDER BY CASE WHEN yc.TrangThai = N'Chờ xử lý' THEN 0 ELSE 1 END, yc.NgayGui DESC
    `);
    const svChuaCoTK = await pool.request().query(`SELECT MaSV, HoTen, MaLop FROM SinhVien WHERE TenDangNhap IS NULL`);
    const cvChuaCoTK = await pool.request().query(`SELECT MaCV, HoTen, Khoa FROM CoVanHocTap WHERE TenDangNhap IS NULL`);
    const lop = await pool.request().query(`SELECT l.MaLop, l.TenLop, l.MaCV, cv.HoTen AS TenCV FROM LopSinhHoat l LEFT JOIN CoVanHocTap cv ON l.MaCV = cv.MaCV`);
    const coVan = await pool.request().query(`SELECT MaCV, HoTen, Khoa FROM CoVanHocTap`);
    const hocPhi = await pool.request().query(`
        SELECT hp.*, sv.HoTen AS TenSV, hk.TenHocKy 
        FROM HocPhi hp JOIN SinhVien sv ON hp.MaSV = sv.MaSV JOIN HocKy hk ON hp.MaHocKy = hk.MaHocKy
    `);
    const chuanDauRa = await pool.request().query(`SELECT DISTINCT MaLO, TenChuan FROM ChuanDauRa`);

    return {
        taiKhoan: taiKhoan.recordset,
        yeuCauMatKhau: yeuCauMatKhau.recordset,
        svChuaCoTK: svChuaCoTK.recordset,
        cvChuaCoTK: cvChuaCoTK.recordset,
        lop: lop.recordset,
        coVan: coVan.recordset,
        hocPhi: hocPhi.recordset,
        chuanDauRa: chuanDauRa.recordset
    };
};

const bulkIssueStudentAccounts = async () => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const dsSV = await new sql.Request(transaction).query(`SELECT MaSV FROM SinhVien WHERE TenDangNhap IS NULL`);
        if (dsSV.recordset.length === 0) {
            await transaction.rollback();
            return 0;
        }
        for (const sv of dsSV.recordset) {
            await new sql.Request(transaction).input('user', sql.NVarChar, sv.MaSV)
                .query(`INSERT INTO TaiKhoan (TenDangNhap, MatKhau, VaiTro, TrangThai) VALUES (@user, N'123456', N'SinhVien', 1)`);
            await new sql.Request(transaction).input('user', sql.NVarChar, sv.MaSV)
                .query(`UPDATE SinhVien SET TenDangNhap = @user WHERE MaSV = @user`);
        }
        await transaction.commit();
        return dsSV.recordset.length;
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

const issueSingleAccount = async ({ mode, vaiTro, maDoiTuong, hoTen, email, khoa, maLop, tenDangNhap, matKhau }) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        await new sql.Request(transaction)
            .input('user', sql.NVarChar, tenDangNhap).input('pass', sql.NVarChar, matKhau).input('role', sql.NVarChar, vaiTro)
            .query(`INSERT INTO TaiKhoan (TenDangNhap, MatKhau, VaiTro, TrangThai) VALUES (@user, @pass, @role, 1)`);

        if (mode === 'existing') {
            if (vaiTro === 'SinhVien') {
                await new sql.Request(transaction).input('user', sql.NVarChar, tenDangNhap).input('maSV', sql.NVarChar, maDoiTuong)
                    .query(`UPDATE SinhVien SET TenDangNhap = @user WHERE MaSV = @maSV AND TenDangNhap IS NULL`);
            } else if (vaiTro === 'CoVan') {
                await new sql.Request(transaction).input('user', sql.NVarChar, tenDangNhap).input('maCV', sql.NVarChar, maDoiTuong)
                    .query(`UPDATE CoVanHocTap SET TenDangNhap = @user WHERE MaCV = @maCV AND TenDangNhap IS NULL`);
            }
        } else if (mode === 'new') {
            if (vaiTro === 'CoVan') {
                await new sql.Request(transaction)
                    .input('maCV', sql.NVarChar, maDoiTuong).input('hoTen', sql.NVarChar, hoTen)
                    .input('email', sql.NVarChar, email || `${maDoiTuong.toLowerCase()}@hcmue.edu.vn`)
                    .input('khoa', sql.NVarChar, khoa || 'Công nghệ Thông tin').input('user', sql.NVarChar, tenDangNhap)
                    .query(`INSERT INTO CoVanHocTap (MaCV, HoTen, Email, Khoa, TenDangNhap) VALUES (@maCV, @hoTen, @email, @khoa, @user)`);
            } else if (vaiTro === 'SinhVien') {
                await new sql.Request(transaction)
                    .input('maSV', sql.NVarChar, maDoiTuong).input('hoTen', sql.NVarChar, hoTen)
                    .input('email', sql.NVarChar, email || `${maDoiTuong.toLowerCase()}@student.edu.vn`)
                    .input('maLop', sql.NVarChar, maLop).input('user', sql.NVarChar, tenDangNhap)
                    .query(`INSERT INTO SinhVien (MaSV, HoTen, NgaySinh, Phai, Email, MaLop, TenDangNhap) VALUES (@maSV, @hoTen, '2004-01-01', N'Nam', @email, @maLop, @user)`);
            }
        }
        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

const toggleAccountStatus = async (user) => {
    const pool = await poolPromise;
    await pool.request().input('user', sql.NVarChar, user)
        .query(`UPDATE TaiKhoan SET TrangThai = CASE WHEN TrangThai = 1 THEN 0 ELSE 1 END WHERE TenDangNhap = @user`);
};

const deleteAccount = async (targetUser) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        await new sql.Request(transaction).input('user', sql.NVarChar, targetUser)
            .query(`UPDATE SinhVien SET TenDangNhap = NULL WHERE TenDangNhap = @user`);
        await new sql.Request(transaction).input('user', sql.NVarChar, targetUser)
            .query(`UPDATE CoVanHocTap SET TenDangNhap = NULL WHERE TenDangNhap = @user`);
        await new sql.Request(transaction).input('user', sql.NVarChar, targetUser)
            .query(`DELETE FROM TaiKhoan WHERE TenDangNhap = @user`);
        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

const unlockPasswordChange = async (maYeuCau, tenDangNhap) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        await new sql.Request(transaction)
            .input('user', sql.NVarChar, tenDangNhap)
            .query(`UPDATE TaiKhoan SET NgayTao = GETDATE(), DaDoiMatKhau = 0 WHERE TenDangNhap = @user`);

        if (maYeuCau) {
            await new sql.Request(transaction)
                .input('id', sql.Int, maYeuCau)
                .query(`UPDATE YeuCauDoiMatKhau SET TrangThai = N'Đã mở khóa' WHERE MaYeuCau = @id`);
        }
        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

const assignAdvisor = async (maLop, maCV) => {
    const pool = await poolPromise;
    await pool.request().input('maLop', sql.NVarChar, maLop).input('maCV', sql.NVarChar, maCV)
        .query(`UPDATE LopSinhHoat SET MaCV = @maCV WHERE MaLop = @maLop`);
};

const assignAdvisorToClass = async (maLop, maCV) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        await new sql.Request(transaction)
            .input('maLop', sql.NVarChar, maLop)
            .input('maCV', sql.NVarChar, maCV)
            .query(`UPDATE LopSinhHoat SET MaCV = @maCV WHERE MaLop = @maLop`);

        await new sql.Request(transaction)
            .input('maLop', sql.NVarChar, maLop)
            .input('maCV', sql.NVarChar, maCV)
            .query(`
                UPDATE cb
                SET cb.MaCV = @maCV
                FROM CanhBao cb
                JOIN SinhVien sv ON cb.MaSV = sv.MaSV
                WHERE sv.MaLop = @maLop AND cb.TrangThai <> N'Đã hủy'
            `);

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};
const { sendResetPasswordEmail } = require('../../config/mailer');

const generateRandomPassword = () => {
    const digits = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
    const specials = '!@#$%&*';
    const countSpecial = Math.random() < 0.5 ? 1 : 2;
    let specialPart = '';
    for (let i = 0; i < countSpecial; i++) {
        specialPart += specials[Math.floor(Math.random() * specials.length)];
    }
    return `${digits}${specialPart}`;
};

const resetPasswordAndSendEmail = async (maYeuCau, tenDangNhap) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    const matKhauMoi = generateRandomPassword();

    try {
        await transaction.begin();

        // Lấy Email thật của Sinh viên (hoặc Cố vấn) gắn với TenDangNhap
        const infoRes = await new sql.Request(transaction)
            .input('user', sql.NVarChar, tenDangNhap)
            .query(`
                SELECT TOP 1 Email, HoTen FROM SinhVien WHERE TenDangNhap = @user
                UNION
                SELECT TOP 1 Email, HoTen FROM CoVanHocTap WHERE TenDangNhap = @user
            `);

        const emailNhan = infoRes.recordset[0]?.Email || '';
        const hoTen = infoRes.recordset[0]?.HoTen || tenDangNhap;

        if (!emailNhan) {
            throw new Error(`Tài khoản ${tenDangNhap} chưa có địa chỉ Email trong hồ sơ!`);
        }

        // Cập nhật đè mật khẩu mới vào bảng TaiKhoan (mật khẩu cũ tự động mất hiệu lực)
        await new sql.Request(transaction)
            .input('user', sql.NVarChar, tenDangNhap)
            .input('newPass', sql.NVarChar, matKhauMoi)
            .query(`
                UPDATE TaiKhoan
                SET MatKhau = @newPass,
                    NgayTao = GETDATE(),
                    DaDoiMatKhau = 0
                WHERE TenDangNhap = @user
            `);

        // Cập nhật trạng thái yêu cầu sang 'Đã mở khóa'
        if (maYeuCau) {
            await new sql.Request(transaction)
                .input('id', sql.Int, maYeuCau)
                .query(`UPDATE YeuCauDoiMatKhau SET TrangThai = N'Đã mở khóa' WHERE MaYeuCau = @id`);
        }

        await transaction.commit();

        // Gửi email thật tới hộp thư của Sinh viên
        const mailResult = await sendResetPasswordEmail({
            toEmail: emailNhan,
            hoTen,
            tenDangNhap,
            matKhauMoi
        });

        return { matKhauMoi, emailNhan, mailResult };
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

module.exports = {
    getOverview,
    bulkIssueStudentAccounts,
    issueSingleAccount,
    toggleAccountStatus,
    deleteAccount,
    unlockPasswordChange,
    assignAdvisor,
    assignAdvisorToClass,
    resetPasswordAndSendEmail,
    generateRandomPassword
};