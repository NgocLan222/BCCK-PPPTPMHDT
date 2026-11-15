const adminRepo = require('../repositories/adminRepository');

const getOverview = async (req, res) => {
    try {
        const data = await adminRepo.getOverview();
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const importExcel = async (req, res) => {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ message: 'Danh sách sinh viên trống!' });
    }
    try {
        const { added, updated } = await adminRepo.importStudentsFromExcel(students);
        res.json({ message: `Đồng bộ Excel thành công: Thêm mới ${added} SV, cập nhật ${updated} SV.` });
    } catch (err) {
        res.status(400).json({ message: 'Lỗi nhập Excel: ' + err.message });
    }
};

const bulkIssue = async (req, res) => {
    try {
        const count = await adminRepo.bulkIssueStudentAccounts();
        if (count === 0) return res.status(400).json({ message: 'Tất cả sinh viên đều đã có tài khoản!' });
        res.json({ message: `Đã cấp tài khoản hàng loạt cho ${count} sinh viên (Mật khẩu mặc định: 123456)!` });
    } catch (err) {
        res.status(400).json({ message: 'Lỗi cấp hàng loạt: ' + err.message });
    }
};

const singleIssue = async (req, res) => {
    try {
        await adminRepo.issueSingleAccount(req.body);
        res.json({ message: 'Cấp tài khoản thành công!' });
    } catch (err) {
        res.status(400).json({ message: 'Trùng mã/tên đăng nhập hoặc thông tin không hợp lệ!' });
    }
};

const toggleStatus = async (req, res) => {
    try {
        await adminRepo.toggleAccountStatus(req.params.user);
        res.json({ message: 'Đã cập nhật trạng thái tài khoản.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const removeAccount = async (req, res) => {
    if (req.params.user === 'admin') {
        return res.status(400).json({ message: 'Không thể xóa tài khoản quản trị gốc!' });
    }
    try {
        await adminRepo.deleteAccount(req.params.user);
        res.json({ message: `Đã xóa tài khoản ${req.params.user}!` });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi xóa tài khoản: ' + err.message });
    }
};

const updateAdvisor = async (req, res) => {
    try {
        await adminRepo.assignAdvisor(req.params.maLop, req.body.maCV);
        res.json({ message: 'Đã cập nhật phân công cố vấn!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const syncHocPhi = async (req, res) => {
    try {
        await adminRepo.syncTuition();
        res.json({ message: 'Đã đồng bộ dữ liệu học phí từ Phòng Tài chính & quét nợ toàn trường!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const reviewHocPhiProof = async (req, res) => {
    try {
        await adminRepo.approveTuitionProof(req.params.maHocPhi, req.body.chapThuan);
        res.json({ message: req.body.chapThuan ? 'Đã xác nhận Đã đóng đủ học phí!' : 'Đã từ chối minh chứng.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
const createChuanDauRa = async (req, res) => {
    const { maLO, tenChuan } = req.body;
    if (!maLO || !tenChuan) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ Mã chuẩn (LO) và Tên chuẩn năng lực!' });
    }
    try {
        await adminRepo.addLearningOutcome(maLO, tenChuan);
        res.json({ message: `Đã thêm chuẩn đầu ra ${maLO.trim()} và áp dụng cho toàn bộ sinh viên!` });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const editChuanDauRa = async (req, res) => {
    const { tenChuan } = req.body;
    if (!tenChuan) {
        return res.status(400).json({ message: 'Tên chuẩn năng lực không được để trống!' });
    }
    try {
        await adminRepo.updateLearningOutcome(req.params.maLO, tenChuan);
        res.json({ message: 'Đã cập nhật tên chuẩn đầu ra!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const removeChuanDauRa = async (req, res) => {
    try {
        await adminRepo.deleteLearningOutcome(req.params.maLO);
        res.json({ message: `Đã xóa chuẩn đầu ra ${req.params.maLO}!` });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi xóa chuẩn đầu ra: ' + err.message });
    }
};
const grantPasswordChange = async (req, res) => {
    const { maYeuCau, tenDangNhap } = req.body;
    try {
        await adminRepo.unlockPasswordChange(maYeuCau, tenDangNhap);
        res.json({ message: `Đã mở khóa quyền đổi mật khẩu (hiệu lực 24 giờ) cho tài khoản ${tenDangNhap}!` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
const getMonHocVaTKB = async (req, res) => {
    try {
        const data = await adminRepo.getSubjectsAndSchedules();
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const addMonHoc = async (req, res) => {
    try {
        await adminRepo.createMonHoc(req.body);
        res.json({ message: 'Đã thêm môn học mới thành công!' });
    } catch (err) {
        res.status(400).json({ message: 'Lỗi thêm môn học (có thể trùng mã môn): ' + err.message });
    }
};

const editMonHoc = async (req, res) => {
    try {
        await adminRepo.updateMonHoc(req.params.maMon, req.body, req.body.oldTenMon);
        res.json({ message: 'Đã cập nhật thông tin môn học!' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const removeMonHoc = async (req, res) => {
    try {
        await adminRepo.deleteMonHoc(req.params.maMon);
        res.json({ message: 'Đã xóa môn học khỏi danh mục!' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const assignTKB = async (req, res) => {
    try {
        await adminRepo.assignSubjectToClass(req.body);
        res.json({ message: 'Đã xếp môn vào Thời khóa biểu lớp và đồng bộ bảng điểm sinh viên!' });
    } catch (err) {
        res.status(400).json({ message: 'Lớp này đã có môn học đó trong TKB!' });
    }
};

const removeTKB = async (req, res) => {
    try {
        await adminRepo.removeSubjectFromClass(req.params.maTKB);
        res.json({ message: 'Đã gỡ môn học khỏi Thời khóa biểu lớp!' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
const resetPasswordByEmail = async (req, res) => {
    const { maYeuCau, tenDangNhap } = req.body;
    try {
        const result = await adminRepo.resetPasswordAndSendEmail(maYeuCau, tenDangNhap);
        res.json({
            message: `Đã cấp lại mật khẩu mới (${result.matKhauMoi}) cho tài khoản ${tenDangNhap} và gửi tới ${result.emailNhan}. ${result.mailResult.note}`,
            matKhauMoi: result.matKhauMoi
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getOverview, importExcel, bulkIssue, singleIssue,
    toggleStatus, removeAccount, updateAdvisor, syncHocPhi, reviewHocPhiProof, createChuanDauRa, editChuanDauRa, removeChuanDauRa, grantPasswordChange,
    getMonHocVaTKB, addMonHoc, editMonHoc, removeMonHoc, assignTKB, removeTKB, resetPasswordByEmail
};