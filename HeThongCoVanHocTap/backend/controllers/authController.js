const authRepo = require('../repositories/authRepository');

const login = async (req, res) => {
    const { tenDangNhap, matKhau } = req.body;
    try {
        const tk = await authRepo.findAccount(tenDangNhap, matKhau);
        if (!tk) return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu!' });
        if (!tk.TrangThai) return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa!' });

        let profile = {
            TenDangNhap: tk.TenDangNhap,
            VaiTro: tk.VaiTro,
            DaDoiMatKhau: tk.DaDoiMatKhau,
            NgayTao: tk.NgayTao
        };
        if (tk.VaiTro === 'SinhVien') {
            const sv = await authRepo.findStudentProfile(tk.TenDangNhap);
            if (sv) profile = { ...profile, ...sv };
        } else if (tk.VaiTro === 'CoVan') {
            const cv = await authRepo.findAdvisorProfile(tk.TenDangNhap);
            if (cv) profile = { ...profile, ...cv };
        }
        res.json(profile);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getPasswordPermission = async (req, res) => {
    try {
        const result = await authRepo.checkChangePasswordPermission(req.params.user);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const changePassword = async (req, res) => {
    const { tenDangNhap, matKhauCu, matKhauMoi } = req.body;
    try {
        const ok = await authRepo.updatePassword(tenDangNhap, matKhauCu, matKhauMoi);
        if (!ok) return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác!' });
        res.json({ message: 'Đổi mật khẩu thành công!' });
    } catch (err) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};

const requestUnlockPassword = async (req, res) => {
    const { tenDangNhap, lyDo } = req.body;
    try {
        await authRepo.createPasswordResetRequest(tenDangNhap, lyDo);
        res.json({ message: 'Đã gửi yêu cầu mở khóa quyền đổi mật khẩu về hệ thống Admin!' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
const forgotPassword = async (req, res) => {
    try {
        const result = await authRepo.requestForgotPasswordByEmail(req.body.email);
        res.json({
            message: `Đã gửi yêu cầu cấp lại mật khẩu về hệ thống Admin cho tài khoản ${result.tenDangNhap}. Vui lòng kiểm tra email ${result.email} sau khi Admin xử lý!`
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = { login, getPasswordPermission, changePassword, requestUnlockPassword, forgotPassword };