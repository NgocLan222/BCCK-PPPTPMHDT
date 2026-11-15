const svRepo = require('../repositories/sinhVienRepository');

const getDashboard = async (req, res) => {
    try {
        const data = await svRepo.getDashboardData(req.params.maSV);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const uploadCompetencyProof = async (req, res) => {
    const { maSV, maLO, tenMinhChung, tepMinhChung, tenTep } = req.body;
    if (!maLO || !tenMinhChung) {
        return res.status(400).json({ message: 'Vui lòng chọn chuẩn đầu ra và nhập tên chứng chỉ/minh chứng!' });
    }
    try {
        await svRepo.submitCompetencyProof({ maSV, maLO, tenMinhChung, tepMinhChung, tenTep });
        res.json({ message: 'Đã nộp minh chứng năng lực! Vui lòng chờ Cố vấn học tập phê duyệt.' });
    } catch (err) {
        res.status(400).json({ message: 'Lỗi nộp minh chứng: ' + err.message });
    }
};

const submitPhanHoi = async (req, res) => {
    const { maCanhBao, noiDungGiaiTrinh, tepMinhChung, tenTep } = req.body;
    try {
        await svRepo.createPhanHoi(maCanhBao, noiDungGiaiTrinh, tepMinhChung, tenTep);
        res.json({ message: 'Đã gửi đơn giải trình và tệp minh chứng cho Cố vấn học tập!' });
    } catch (err) {
        res.status(400).json({ message: 'Bạn đã gửi phản hồi cho cảnh báo này hoặc có lỗi xảy ra!' });
    }
};

const toggleNhiemVu = async (req, res) => {
    try {
        await svRepo.toggleNhiemVu(req.params.maNhiemVu);
        res.json({ message: 'Đã cập nhật tiến độ nhiệm vụ!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const payQR = async (req, res) => {
    try {
        await svRepo.payTuitionByQR(req.params.maHocPhi);
        res.json({ message: 'Thanh toán học phí qua QR thành công! Hệ thống đã cập nhật trạng thái.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const uploadTuitionProof = async (req, res) => {
    const { anhMinhChung, ghiChu } = req.body;
    if (!anhMinhChung) return res.status(400).json({ message: 'Vui lòng tải lên hình ảnh biên lai đóng học phí!' });
    try {
        await svRepo.submitTuitionProof(req.params.maHocPhi, anhMinhChung, ghiChu);
        res.json({ message: 'Đã gửi ảnh minh chứng đóng học phí! Vui lòng chờ Admin xác nhận.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getDashboard,
    uploadCompetencyProof,
    submitPhanHoi,
    toggleNhiemVu,
    payQR,
    uploadTuitionProof
};