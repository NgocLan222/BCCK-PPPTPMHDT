const dongBoRepo = require('./covan/dongBoHocTapRepo');
const tongQuanRepo = require('./covan/tongQuanCoVanRepo');
const canhBaoRepo = require('./covan/canhBaoBangChungRepo');
const keHoachRepo = require('./covan/keHoachCanThiepRepo');

module.exports = {
    ...dongBoRepo,
    ...tongQuanRepo,
    ...canhBaoRepo,
    ...keHoachRepo
};