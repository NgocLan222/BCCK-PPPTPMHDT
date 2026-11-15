const hoSoRepo = require('./sinhvien/hoSoHocTapRepo');
const minhChungRepo = require('./sinhvien/minhChungGiaiTrinhRepo');
const hocPhiCanThiepRepo = require('./sinhvien/hocPhiCanThiepRepo');

module.exports = {
    ...hoSoRepo,
    ...minhChungRepo,
    ...hocPhiCanThiepRepo
};