const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.get('/taikhoan/:user/quyen-doimatkhau', authController.getPasswordPermission);
router.put('/taikhoan/doimatkhau', authController.changePassword);
router.post('/quen-mat-khau', authController.forgotPassword);
module.exports = router;