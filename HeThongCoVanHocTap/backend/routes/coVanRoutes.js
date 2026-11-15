const express = require('express');
const router = express.Router();
const cvController = require('../controllers/coVanController');

router.get('/:maCV/dashboard', cvController.getDashboard);
router.put('/minhchung-nangluc/:maChiTiet/duyet', cvController.approveCompetency);
router.get('/sinhvien/:maSV/trichxuat-bangchung', cvController.extractEvidence);
router.post('/canhbao', cvController.issueCanhBao);
router.put('/canhbao/:maCanhBao/banhanh', cvController.publishDraft);
router.put('/phanhoi/:maPhanHoi/duyet', cvController.approvePhanHoi);
router.post('/kehoach', cvController.createActionPlan);
router.put('/kehoach/:maKeHoach/nghiemthu', cvController.nghiemThuKeHoach);
router.put('/bangchung/duyet-muc', cvController.reviewEvidenceItem);
router.post('/bangchung/chuyen-admin-hocphi', cvController.forwardTuition);
router.put('/nhiemvu/:maNhiemVu/toggle', cvController.toggleTask);

module.exports = router;