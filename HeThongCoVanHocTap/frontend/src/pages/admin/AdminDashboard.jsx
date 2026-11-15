import { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

import AdminTaiKhoanTab from './tabs/AdminTaiKhoanTab';
import AdminYeuCauMatKhauTab from './tabs/AdminYeuCauMatKhauTab';
import AdminPhanCongTab from './tabs/AdminPhanCongTab';
import AdminChuanDauRaTab from './tabs/AdminChuanDauRaTab';
import AdminQuyTacTab from './tabs/AdminQuyTacTab';
import AdminDongBoTab from './tabs/AdminDongBoTab';
import AdminMonHocTKBTab from './tabs/AdminMonHocTKBTab';

export default function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('taikhoan');
  const [data, setData] = useState({
    taiKhoan: [],
    svChuaCoTK: [],
    cvChuaCoTK: [],
    lop: [],
    coVan: [],
    hocPhi: [],
    chuanDauRa: [],
    yeuCauMatKhau: []
  });

  const [monHocList, setMonHocList] = useState([]);
  const [tkbList, setTkbList] = useState([]);

  const loadAdminData = () => {
    axios.get('http://localhost:5000/api/admin/overview')
      .then(res => setData(prev => ({
        ...prev,
        ...res.data,
        svChuaCoTK: res.data.svChuaCoTK || [],
        cvChuaCoTK: res.data.cvChuaCoTK || [],
        yeuCauMatKhau: res.data.yeuCauMatKhau || []
      })))
      .catch(err => console.error(err));

    axios.get('http://localhost:5000/api/admin/monhoc-tkb')
      .then(res => {
        setMonHocList(res.data.monHoc || []);
        setTkbList(res.data.tkb || []);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const pendingResetCount = (data.yeuCauMatKhau || []).filter(yc => yc.TrangThai === 'Chờ xử lý').length;

  return (
    <div className="admin-layout">
      {/* CỘT TRÁI: SIDEBAR ĐIỀU HƯỚNG */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <h3>Quản Trị Hệ Thống</h3>
          <span>Admin: <strong>{user.TenDangNhap}</strong></span>
        </div>

        <nav className="sidebar-menu">
          <button
            className={`sidebar-item ${activeTab === 'taikhoan' ? 'active' : ''}`}
            onClick={() => setActiveTab('taikhoan')}
          >
            1. Người dùng & Phân quyền
          </button>

          <button
            className={`sidebar-item ${activeTab === 'yeucaumk' ? 'active' : ''}`}
            onClick={() => setActiveTab('yeucaumk')}
          >
            <span>2. Yêu cầu cấp lại MK</span>
            {pendingResetCount > 0 && <span className="sidebar-badge">{pendingResetCount}</span>}
          </button>

          <button
            className={`sidebar-item ${activeTab === 'phancong' ? 'active' : ''}`}
            onClick={() => setActiveTab('phancong')}
          >
            3. Phân công Cố vấn
          </button>

          <button
            className={`sidebar-item ${activeTab === 'chuandaura' ? 'active' : ''}`}
            onClick={() => setActiveTab('chuandaura')}
          >
            4. Chuẩn đầu ra & CTĐT
          </button>

          <button
            className={`sidebar-item ${activeTab === 'quytac' ? 'active' : ''}`}
            onClick={() => setActiveTab('quytac')}
          >
            5. Quy tắc cảnh báo
          </button>

          <button
            className={`sidebar-item ${activeTab === 'dongbo' ? 'active' : ''}`}
            onClick={() => setActiveTab('dongbo')}
          >
            6. Nhập / Đồng bộ dữ liệu
          </button>

          <button
            className={`sidebar-item ${activeTab === 'monhoc' ? 'active' : ''}`}
            onClick={() => setActiveTab('monhoc')}
          >
            7. Môn học & Xếp TKB ({monHocList.length})
          </button>
        </nav>
      </aside>

      {/* CỘT PHẢI: NỘI DUNG CHÍNH PHÓNG TO TOÀN MÀN HÌNH */}
      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <h2>Quản Trị Hệ Thống</h2>
            <p>Quản lý tài khoản, cấp lại mật khẩu, phân công cố vấn, môn học và đồng bộ dữ liệu</p>
          </div>
        </div>

        <div className="admin-content-area">
          {activeTab === 'taikhoan' && <AdminTaiKhoanTab data={data} onReload={loadAdminData} />}
          {activeTab === 'yeucaumk' && <AdminYeuCauMatKhauTab data={data} onReload={loadAdminData} />}
          {activeTab === 'phancong' && <AdminPhanCongTab data={data} onReload={loadAdminData} />}
          {activeTab === 'chuandaura' && <AdminChuanDauRaTab data={data} onReload={loadAdminData} />}
          {activeTab === 'quytac' && <AdminQuyTacTab />}
          {activeTab === 'dongbo' && <AdminDongBoTab data={data} onReload={loadAdminData} />}
          {activeTab === 'monhoc' && (
            <AdminMonHocTKBTab
              lopList={data.lop}
              chuanDauRaList={data.chuanDauRa}
              monHocList={monHocList}
              tkbList={tkbList}
              onReload={loadAdminData}
            />
          )}
        </div>
      </main>
    </div>
  );
}