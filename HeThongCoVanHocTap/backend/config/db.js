const sql = require('mssql');

const config = {
    user: 'sa',                         
    password: '123',                 
    server: 'localhost',                
    database: 'QuanLyCanhBaoHocVuDB',
    port: 1433,
    options: {
        encrypt: false,                
        trustServerCertificate: true
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ Đã kết nối SQL Server QuanLyCanhBaoHocVuDB thành công!');
        return pool;
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối SQL Server:', err);
    });

module.exports = { sql, poolPromise };