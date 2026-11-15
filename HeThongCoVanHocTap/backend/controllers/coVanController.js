const cvRepo = require('../repositories/coVanRepository');

const getDashboard = async (req, res) => {
    try {
        const data = await cvRepo.getDashboardData(req.params.maCV);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const approveCompetency = async (req, res) => {
    try {
        await cvRepo.reviewCompetencyProof(req.params.maChiTiet, req.body);
        res.json({
            message: req.body.chapThuan
                ? 'Đã phê duyệt minh chứng và tự động cập nhật tỷ lệ chuẩn đầu ra (LO)!'
                : 'Đã từ chối minh chứng năng lực.'
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const extractEvidence = async (req, res) => {
    try {
        const result = await cvRepo.extractEvidenceForStudent(req.params.maSV);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const issueCanhBao = async (req, res) => {
    try {
        await cvRepo.createCanhBao(req.body);
        res.json({ message: 'Đã trích xuất bằng chứng và ban hành phiếu cảnh báo học vụ!' });
    } catch (err) {
        res.status(400).json({ message: 'Lỗi ban hành cảnh báo: ' + err.message });
    }
};

const publishDraft = async (req, res) => {
    try {
        await cvRepo.publishDraftCanhBao(req.params.maCanhBao, req.body.huongDanHoTro);
        res.json({ message: 'Đã ban hành phiếu cảnh báo nháp sang trạng thái Chờ phản hồi!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const approvePhanHoi = async (req, res) => {
    try {
        await cvRepo.reviewPhanHoi(req.params.maPhanHoi, req.body);
        res.json({ message: 'Đã xét duyệt phản hồi của sinh viên!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const createActionPlan = async (req, res) => {
    try {
        await cvRepo.createKeHoach(req.body);
        res.json({ message: 'Đã ban hành kế hoạch can thiệp học tập!' });
    } catch (err) {
        res.status(400).json({ message: 'Lỗi lập kế hoạch can thiệp: ' + err.message });
    }
};

const nghiemThuKeHoach = async (req, res) => {
    try {
        const result = await cvRepo.evaluateKeHoach(req.params.maKeHoach, req.body);
        const extraMsg = result.updatedSubjects.length > 0
            ? `\nHệ thống đã tự động cập nhật điểm cải thiện: ${result.updatedSubjects.join(', ')}.`
            : '';
        res.json({ message: `Đã lưu kết quả đánh giá nghiệm thu kế hoạch can thiệp!${extraMsg}` });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
const reviewEvidenceItem = async (req, res) => {
    try {
        const result = await cvRepo.reviewSingleEvidence(req.body);
        res.json({
            message: `Đã cập nhật mục bằng chứng (${result.resolvedCount}/${result.total} mục đã gỡ). Trạng thái phiếu: ${result.trangThaiCB}.`
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const forwardTuition = async (req, res) => {
    try {
        await cvRepo.forwardTuitionToAdmin(req.body);
        res.json({ message: 'Đã chuyển tiếp hồ sơ học phí sang Admin kiểm tra và cập nhật trạng thái!' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
const toggleTask = async (req, res) => {
    try {
        await cvRepo.toggleNhiemVuByAdvisor(req.params.maNhiemVu);
        res.json({ message: 'Đã cập nhật tiến độ mốc nhiệm vụ!' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = {
    getDashboard,
    approveCompetency,
    extractEvidence,
    issueCanhBao,
    publishDraft,
    approvePhanHoi,
    createActionPlan,
    nghiemThuKeHoach,
    reviewEvidenceItem,
    forwardTuition,
    toggleTask,

};