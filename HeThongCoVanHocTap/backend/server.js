const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const sinhVienRoutes = require('./routes/sinhVienRoutes');
const coVanRoutes = require('./routes/coVanRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Gắn các nhóm API theo từng phân hệ
app.use('/api', authRoutes);
app.use('/api/sinhvien', sinhVienRoutes);
app.use('/api/covan', coVanRoutes);
app.use('/api/admin', adminRoutes);

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Backend API đang chạy gọn gàng tại http://localhost:${PORT}`);
});