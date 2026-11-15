const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/overview', adminController.getOverview);
router.post('/import-sinhvien', adminController.importExcel);
router.post('/taikhoan/hangloat', adminController.bulkIssue);
router.post('/taikhoan', adminController.singleIssue);
router.put('/taikhoan/:user/trangthai', adminController.toggleStatus);
router.delete('/taikhoan/:user', adminController.removeAccount);
router.put('/lop/:maLop/phancong', adminController.updateAdvisor);
router.post('/dongbo-hocphi', adminController.syncHocPhi);
router.put('/hocphi/:maHocPhi/duyet', adminController.reviewHocPhiProof);
router.post('/chuandaura', adminController.createChuanDauRa);
router.put('/chuandaura/:maLO', adminController.editChuanDauRa);
router.delete('/chuandaura/:maLO', adminController.removeChuanDauRa);
router.put('/taikhoan/mokhoa-doimatkhau', adminController.grantPasswordChange);
router.get('/monhoc-tkb', adminController.getMonHocVaTKB);
router.post('/monhoc', adminController.addMonHoc);
router.put('/monhoc/:maMon', adminController.editMonHoc);
router.delete('/monhoc/:maMon', adminController.removeMonHoc);
router.post('/tkb', adminController.assignTKB);
router.delete('/tkb/:maTKB', adminController.removeTKB);
router.post('/cap-lai-mat-khau', adminController.resetPasswordByEmail);

module.exports = router;