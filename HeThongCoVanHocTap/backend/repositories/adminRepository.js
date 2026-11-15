const taiKhoanRepo = require('./admin/taiKhoanPhanCongRepo');
const hocPhiRepo = require('./admin/dongBoHocPhiRepo');
const monHocRepo = require('./admin/monHocTkbRepo');

module.exports = {
    ...taiKhoanRepo,
    ...hocPhiRepo,
    ...monHocRepo
};