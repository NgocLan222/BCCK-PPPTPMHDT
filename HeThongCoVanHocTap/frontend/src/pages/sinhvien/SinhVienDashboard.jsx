import { useEffect, useState } from 'react';
import axios from 'axios';
import './SinhVienDashboard.css';

import SinhVienHoSoTab from './tabs/SinhVienHoSoTab';
import SinhVienCanhBaoTab from './tabs/SinhVienCanhBaoTab';
import SinhVienCanThiepTab from './tabs/SinhVienCanThiepTab';
import SinhVienHocPhiTab from './tabs/SinhVienHocPhiTab';

export default function SinhVienDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('hoso');
  const [data, setData] = useState(null);

  const loadData = () => {
    if (!user?.MaSV) return;
    axios.get(`http://localhost:5000/api/sinhvien/${user.MaSV}/hoso`)
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadData();
  }, [user?.MaSV]);

  if (!data) return <div className="container">Đang tải hồ sơ năng lực...</div>;

  const kq = (data.ketQuaHocTap && data.ketQuaHocTap[0]) || { DiemGPA: 0, TinChiTichLuy: 0, SoMonNo: 0 };
  const warningCount = (data.canhBao || []).length;
  const activePlansCount = (data.keHoach || []).filter(kh => kh.TrangThai === 'Đang can thiệp').length;

  return (
    <div className="container">
      <div className="page-header">
        <h2>Xin chào, {user.HoTen || user.TenSV || user.TenDangNhap}</h2>
        <p>Mã sinh viên: {user.MaSV} • Lớp sinh hoạt: {user.MaLop}</p>
      </div>

      {/* 3 Ô KPI TỔNG QUAN */}
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <span>Điểm GPA tích lũy</span>
          <h3>{kq.DiemGPA} / 4.0</h3>
        </div>
        <div className="kpi-card purple">
          <span>Tín chỉ tích lũy</span>
          <h3>{kq.TinChiTichLuy} TC</h3>
        </div>
        <div className="kpi-card pink">
          <span>Số môn còn nợ</span>
          <h3>{kq.SoMonNo} môn</h3>
        </div>
      </div>

      {/* THANH CHUYỂN 4 TAB SINH VIÊN BO TRÒN HIỆN ĐẠI */}
      <nav className="sv-tabs-bar">
        <button
          type="button"
          className={`sv-pill-tab ${activeTab === 'hoso' ? 'active' : ''}`}
          onClick={() => setActiveTab('hoso')}
        >
          <span>1. Hồ sơ năng lực & Minh chứng</span>
        </button>

        <button
          type="button"
          className={`sv-pill-tab ${activeTab === 'canhbao' ? 'active' : ''}`}
          onClick={() => setActiveTab('canhbao')}
        >
          <span>2. Cảnh báo & Phản hồi</span>
          {warningCount > 0 && <span className="sv-tab-badge">{warningCount}</span>}
        </button>

        <button
          type="button"
          className={`sv-pill-tab ${activeTab === 'canthiep' ? 'active' : ''}`}
          onClick={() => setActiveTab('canthiep')}
        >
          <span>3. Kế hoạch can thiệp</span>
          {activePlansCount > 0 && <span className="sv-tab-count">{activePlansCount}</span>}
        </button>

        <button
          type="button"
          className={`sv-pill-tab ${activeTab === 'hocphi' ? 'active' : ''}`}
          onClick={() => setActiveTab('hocphi')}
        >
          <span>4. Học phí & Thanh toán QR</span>
        </button>
      </nav>

      {activeTab === 'hoso' && <SinhVienHoSoTab user={user} data={data} kq={kq} onReload={loadData} />}
      {activeTab === 'canhbao' && <SinhVienCanhBaoTab data={data} onReload={loadData} />}
      {activeTab === 'canthiep' && <SinhVienCanThiepTab data={data} />}
      {activeTab === 'hocphi' && <SinhVienHocPhiTab user={user} data={data} onReload={loadData} />}
    </div>
  );
}