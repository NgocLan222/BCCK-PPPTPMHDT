const { sql, poolPromise } = require('../config/db');

const HAN_DOI_MAT_KHAU_GIO = 24; // Thời hạn 24 giờ kể từ lúc cấp tài khoản

const resolveUsername = async (inputUser) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input('u', sql.NVarChar, inputUser)
        .query(`
            SELECT TOP 1 TenDangNhap FROM TaiKhoan WHERE TenDangNhap = @u
            UNION
            SELECT TOP 1 TenDangNhap FROM SinhVien WHERE MaSV = @u AND TenDangNhap IS NOT NULL
            UNION
            SELECT TOP 1 TenDangNhap FROM CoVanHocTap WHERE MaCV = @u AND TenDangNhap IS NOT NULL
        `);
    return res.recordset[0]?.TenDangNhap || inputUser;
};

const findAccount = async (tenDangNhap, matKhau) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input('user', sql.NVarChar, tenDangNhap)
        .input('pass', sql.NVarChar, matKhau)
        .query(`SELECT TenDangNhap, VaiTro, TrangThai, DaDoiMatKhau, NgayTao FROM TaiKhoan WHERE TenDangNhap = @user AND MatKhau = @pass`);
    return res.recordset[0];
};

const findStudentProfile = async (tenDangNhap) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input('user', sql.NVarChar, tenDangNhap)
        .query(`SELECT MaSV, HoTen, Email, MaLop FROM SinhVien WHERE TenDangNhap = @user`);
    return res.recordset[0];
};

const findAdvisorProfile = async (tenDangNhap) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input('user', sql.NVarChar, tenDangNhap)
        .query(`SELECT MaCV, HoTen, Email, Khoa FROM CoVanHocTap WHERE TenDangNhap = @user`);
    return res.recordset[0];
};

// Kiểm tra quyền đổi mật khẩu: chỉ cho phép khi CHƯA đổi lần nào (DaDoiMatKhau = 0) VÀ còn trong hạn 24h
const checkChangePasswordPermission = async (inputUser) => {
    const tenDangNhap = await resolveUsername(inputUser);
    const pool = await poolPromise;
    const res = await pool.request()
        .input('user', sql.NVarChar, tenDangNhap)
        .query(`
            SELECT TenDangNhap, VaiTro, DaDoiMatKhau,
                   DATEDIFF(MINUTE, NgayTao, GETDATE()) AS SoPhutDaTao
            FROM TaiKhoan
            WHERE TenDangNhap = @user
        `);
    const tk = res.recordset[0];
    if (!tk) throw new Error('Không tìm thấy tài khoản!');

    if (tk.VaiTro === 'Admin') {
        return { allowed: true, remainingMinutes: 999999, reason: '' };
    }

    if (tk.DaDoiMatKhau) {
        return {
            allowed: false,
            remainingMinutes: 0,
            reason: 'Tài khoản này đã thực hiện đổi mật khẩu 1 lần trước đó.'
        };
    }

    const maxMinutes = HAN_DOI_MAT_KHAU_GIO * 60;
    const remainingMinutes = maxMinutes - tk.SoPhutDaTao;

    if (remainingMinutes <= 0) {
        return {
            allowed: false,
            remainingMinutes: 0,
            reason: 'Đã quá thời hạn cho phép đổi mật khẩu kể từ lúc cấp tài khoản.'
        };
    }

    return { allowed: true, remainingMinutes, reason: '' };
};

const updatePassword = async (inputUser, matKhauCu, matKhauMoi) => {
    const tenDangNhap = await resolveUsername(inputUser);
    const perm = await checkChangePasswordPermission(tenDangNhap);
    if (!perm.allowed) {
        const err = new Error('Bạn không có quyền hạn thực hiện thao tác này. Vui lòng liên hệ người cung cấp tài khoản!');
        err.statusCode = 403;
        throw err;
    }

    const pool = await poolPromise;
    const check = await pool.request()
        .input('user', sql.NVarChar, tenDangNhap)
        .input('oldPass', sql.NVarChar, matKhauCu)
        .query(`SELECT TenDangNhap FROM TaiKhoan WHERE TenDangNhap = @user AND MatKhau = @oldPass`);

    if (check.recordset.length === 0) return false;

    await pool.request()
        .input('user', sql.NVarChar, tenDangNhap)
        .input('newPass', sql.NVarChar, matKhauMoi)
        .query(`UPDATE TaiKhoan SET MatKhau = @newPass, DaDoiMatKhau = 1 WHERE TenDangNhap = @user`);
    return true;
};
const requestForgotPasswordByEmail = async (emailInput) => {
    const email = String(emailInput || '').trim().toLowerCase();
    if (!email) throw new Error('Vui lòng nhập email đã được nhà trường cấp!');

    const pool = await poolPromise;

    const userRes = await pool.request()
        .input('email', sql.NVarChar, email)
        .query(`
            SELECT TOP 1 TenDangNhap, HoTen, Email FROM SinhVien WHERE LOWER(Email) = @email AND TenDangNhap IS NOT NULL
            UNION
            SELECT TOP 1 TenDangNhap, HoTen, Email FROM CoVanHocTap WHERE LOWER(Email) = @email AND TenDangNhap IS NOT NULL
        `);

    if (userRes.recordset.length === 0) {
        throw new Error('Email không tồn tại trong hệ thống hoặc tài khoản chưa được kích hoạt!');
    }

    const { TenDangNhap, HoTen, Email } = userRes.recordset[0];

    const pending = await pool.request()
        .input('user', sql.NVarChar, TenDangNhap)
        .query(`SELECT TOP 1 MaYeuCau FROM YeuCauDoiMatKhau WHERE TenDangNhap = @user AND TrangThai = N'Chờ xử lý'`);

    if (pending.recordset.length > 0) {
        throw new Error('Bạn đã gửi yêu cầu cấp lại mật khẩu trước đó, vui lòng chờ Admin xử lý!');
    }

    await pool.request()
        .input('user', sql.NVarChar, TenDangNhap)
        .input('lyDo', sql.NVarChar, `Quên mật khẩu - Email nhận: ${Email}`)
        .query(`
            INSERT INTO YeuCauDoiMatKhau (TenDangNhap, LyDo, TrangThai, NgayGui)
            VALUES (@user, @lyDo, N'Chờ xử lý', GETDATE())
        `);

    return { tenDangNhap: TenDangNhap, hoTen: HoTen, email: Email };
};

module.exports = {
    findAccount,
    findStudentProfile,
    findAdvisorProfile,
    checkChangePasswordPermission,
    updatePassword,
    requestForgotPasswordByEmail
};
