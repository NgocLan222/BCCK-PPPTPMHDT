import { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './CoVanDashboard.css';

import DanhSachSinhVienTab from './tabs/DanhSachSinhVienTab';
import DuyetMinhChungTab from './tabs/DuyetMinhChungTab';
import BanHanhCanhBaoTab from './tabs/BanHanhCanhBaoTab';
import XetDuyetPhanHoiTab from './tabs/XetDuyetPhanHoiTab';
import KeHoachCanThiepTab from './tabs/KeHoachCanThiepTab';

export default function CoVanDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('sinhvien');
  const [data, setData] = useState({
    sinhVien: [],
    chuanDauRa: [],
    minhChungNangLuc: [],
    canhBao: [],
    bangChung: [],
    keHoach: [],
    nhiemVu: []
  });

  const [previewFile, setPreviewFile] = useState(null);
  const [preselectedSV, setPreselectedSV] = useState('');

  const loadData = () => {
    if (!user?.MaCV) return;
    axios.get(`http://localhost:5000/api/covan/${user.MaCV}/dashboard`)
      .then(res => setData(prev => ({ ...prev, ...res.data })))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadData();
  }, [user?.MaCV]);

  // Xuất báo cáo hoạt động CVHT (.xlsx)
  const handleExportReport = () => {
    const wb = XLSX.utils.book_new();

    const sheetSV = data.sinhVien.map(sv => ({
      MaSV: sv.MaSV,
      HoTen: sv.HoTen,
      Lop: sv.MaLop,
      GPA: sv.DiemGPA ?? 'Chưa có',
      TinChiTichLuy: sv.TinChiTichLuy ?? 0,
      SoMonNo: sv.SoMonNo ?? 0,
      TrangThaiHocPhi: sv.TrangThaiHocPhi || 'Chưa cập nhật'
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetSV), 'DanhSach_SinhVien');

    const sheetCB = data.canhBao.map(cb => ({
      MaCanhBao: cb.MaCanhBao,
      MaSV: cb.MaSV,
      HoTenSV: cb.TenSV,
      MucDoRuiRo: cb.MucDoRuiRo,
      TrangThai: cb.TrangThai,
      KetQuaDuyetPhanHoi: cb.KetQuaDuyet || 'Chưa phản hồi',
      HuongDanHoTro: cb.HuongDanHoTro
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetCB), 'TinhHinh_CanhBao');

    const sheetKH = data.keHoach.map(kh => ({
      MaKeHoach: kh.MaKeHoach,
      MaCanhBao: kh.MaCanhBao,
      SinhVien: `${kh.TenSV} (${kh.MaSV})`,
      MucTieu: kh.MucTieuTongThe,
      TranTinChi: kh.TranTinChi,
      TrangThaiNghiemThu: kh.TrangThai,
      DanhGiaNghiemThu: kh.DanhGiaNghiemThu || ''
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetKH), 'KeHoach_CanThiep');

    XLSX.writeFile(wb, `BaoCao_HoatDong_CVHT_${user.MaCV}.xlsx`);
  };

const pendingProofsCount = data.minhChungNangLuc.filter(
  mc => mc.Loai === 'Chứng chỉ' && mc.TepMinhChung && mc.TrangThaiDuyet === 'Chờ duyệt'
).length;  const pendingFeedbacks = data.canhBao.filter(cb => cb.MaPhanHoi);
  const unresolvedFeedbackCount = pendingFeedbacks.filter(cb =>
    data.bangChung.some(bc => bc.MaCanhBao === cb.MaCanhBao && !bc.ChiTiet.startsWith('['))
  ).length;
  const activePlansCount = data.keHoach.filter(kh => kh.TrangThai === 'Đang can thiệp').length;

  const handleGoToWarningTab = (maSV) => {
    setPreselectedSV(maSV);
    setActiveTab('canhbao');
  };

  return (
    <div className="container">
      {/* TIÊU ĐỀ & NÚT XUẤT BÁO CÁO HOẠT ĐỘNG CVHT */}
      <div className="cv-header-bar">
        <div className="page-header no-margin-bottom">
          <h2>Cố Vấn Học Tập: {user.HoTen || user.TenDangNhap}</h2>
          <p>Mã cố vấn: {user.MaCV} • Khoa {user.Khoa}</p>
        </div>
        <button type="button" className="btn-bulk" onClick={handleExportReport}>
          Xuất báo cáo hoạt động CVHT (.xlsx)
        </button>
      </div>

      {/* THỐNG KÊ NHANH LỚP PHỤ TRÁCH */}
      <div className="cv-stats-grid">
        <div className="cv-stat-card">
          <span>Tổng sinh viên phụ trách</span>
          <strong>{data.sinhVien.length} SV</strong>
        </div>
        <div className="cv-stat-card">
          <span>Minh chứng năng lực chờ duyệt</span>
          <strong>{pendingProofsCount} hồ sơ</strong>
        </div>
        <div className="cv-stat-card">
          <span>Phiếu cảnh báo đang theo dõi</span>
          <strong>{data.canhBao.filter(cb => cb.TrangThai !== 'Đã hủy').length} phiếu</strong>
        </div>
        <div className="cv-stat-card">
          <span>Kế hoạch can thiệp đang mở</span>
          <strong>{activePlansCount} kế hoạch</strong>
        </div>
      </div>

      {/* THANH 5 TAB NGHIỆP VỤ BO TRÒN HIỆN ĐẠI */}
      <nav className="cv-tabs-bar">
        <button
          type="button"
          className={`cv-pill-tab ${activeTab === 'sinhvien' ? 'active' : ''}`}
          onClick={() => setActiveTab('sinhvien')}
        >
          <span>1. Danh sách SV & Hồ sơ</span>
          <span className="cv-tab-count">{data.sinhVien.length}</span>
        </button>

        <button
          type="button"
          className={`cv-pill-tab ${activeTab === 'minhchung' ? 'active' : ''}`}
          onClick={() => setActiveTab('minhchung')}
        >
          <span>2. Duyệt minh chứng</span>
          {pendingProofsCount > 0 && <span className="cv-tab-badge">{pendingProofsCount}</span>}
        </button>

        <button
          type="button"
          className={`cv-pill-tab ${activeTab === 'canhbao' ? 'active' : ''}`}
          onClick={() => setActiveTab('canhbao')}
        >
          <span>3. Rà soát & Cảnh báo</span>
        </button>

        <button
          type="button"
          className={`cv-pill-tab ${activeTab === 'phanhoi' ? 'active' : ''}`}
          onClick={() => setActiveTab('phanhoi')}
        >
          <span>4. Phản hồi SV</span>
          {unresolvedFeedbackCount > 0 && <span className="cv-tab-badge">{unresolvedFeedbackCount}</span>}
        </button>

        <button
          type="button"
          className={`cv-pill-tab ${activeTab === 'canthiep' ? 'active' : ''}`}
          onClick={() => setActiveTab('canthiep')}
        >
          <span>5. Kế hoạch can thiệp</span>
          {activePlansCount > 0 && <span className="cv-tab-count">{activePlansCount}</span>}
        </button>
      </nav>

      {activeTab === 'sinhvien' && (
        <DanhSachSinhVienTab data={data} onSelectForWarning={handleGoToWarningTab} />
      )}
      {activeTab === 'minhchung' && (
        <DuyetMinhChungTab data={data} onPreviewFile={setPreviewFile} onReload={loadData} />
      )}
      {activeTab === 'canhbao' && (
        <BanHanhCanhBaoTab
          user={user}
          data={data}
          initialMaSV={preselectedSV}
          onClearInitialSV={() => setPreselectedSV('')}
          onReload={loadData}
        />
      )}
      {activeTab === 'phanhoi' && (
        <XetDuyetPhanHoiTab
          data={data}
          pendingFeedbacks={pendingFeedbacks}
          onPreviewFile={setPreviewFile}
          onReload={loadData}
        />
      )}
      {activeTab === 'canthiep' && (
        <KeHoachCanThiepTab data={data} onReload={loadData} />
      )}

      {/* MODAL XEM TRƯỚC ẢNH / PDF MINH CHỨNG */}
      {previewFile && (
        <div className="modal-backdrop" onClick={() => setPreviewFile(null)}>
          <div className="modal-card preview-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <h3>{previewFile.title}</h3>
                <p className="modal-subtitle">
                  {previewFile.subtitle} • Tên tệp: <strong>{previewFile.fileName}</strong>
                </p>
              </div>
              <button className="btn-delete" onClick={() => setPreviewFile(null)}>Đóng</button>
            </div>

            <div className="preview-box">
              {previewFile.fileData && previewFile.fileData.startsWith('data:image/') ? (
                <img src={previewFile.fileData} alt={previewFile.fileName} className="preview-img" />
              ) : previewFile.fileData && previewFile.fileData.startsWith('data:application/pdf') ? (
                <iframe src={previewFile.fileData} title={previewFile.fileName} className="preview-pdf" />
              ) : (
                <div className="preview-placeholder">
                  <p className="preview-placeholder-title">Tệp đính kèm: {previewFile.fileName}</p>
                  <p className="preview-placeholder-desc">
                    (Bản ghi dữ liệu mẫu khởi tạo ban đầu chưa đính kèm tệp nhị phân. Các minh chứng sinh viên tải lên từ giao diện sẽ hiển thị trực tiếp ảnh/PDF tại đây.)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}