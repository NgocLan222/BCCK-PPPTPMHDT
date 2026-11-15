const express = require('express');
const router = express.Router();
const svController = require('../controllers/sinhVienController');

router.get('/:maSV/hoso', svController.getDashboard);
router.get('/:maSV/dashboard', svController.getDashboard);
router.post('/minhchung-nangluc', svController.uploadCompetencyProof);
router.post('/phanhoi', svController.submitPhanHoi);
router.put('/nhiemvu/:maNhiemVu', svController.toggleNhiemVu);
router.put('/hocphi/:maHocPhi/thanhtoan-qr', svController.payQR);
router.put('/hocphi/:maHocPhi/minhchung', svController.uploadTuitionProof);

module.exports = router;