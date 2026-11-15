import { useState } from 'react';

const PAGE_SIZE = 5;

export default function DanhSachSinhVienTab({ data, onSelectForWarning }) {
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [profileSV, setProfileSV] = useState(null);

  const filteredStudents = data.sinhVien.filter(sv => {
    if (riskFilter === 'RISK') return (sv.DiemGPA !== null && sv.DiemGPA < 2.0) || (sv.SoMonNo > 0);
    if (riskFilter === 'TUITION') return sv.TrangThaiHocPhi && sv.TrangThaiHocPhi !== 'Đã đóng đủ';
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedStudents = filteredStudents.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleFilterChange = (filter) => {
    setRiskFilter(filter);
    setPage(1);
  };

  return (
    <>
      <div className="card">
        <div className="sv-list-header">
          <h3>Danh sách Sinh viên & Hồ sơ năng lực lớp phụ trách</h3>
          <div className="mode-switch">
            <button
              className={`mode-btn ${riskFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => handleFilterChange('ALL')}
            >
              Tất cả ({data.sinhVien.length})
            </button>
            <button
              className={`mode-btn ${riskFilter === 'RISK' ? 'active' : ''}`}
              onClick={() => handleFilterChange('RISK')}
            >
              Nguy cơ học vụ (GPA/Nợ môn)
            </button>
            <button
              className={`mode-btn ${riskFilter === 'TUITION' ? 'active' : ''}`}
              onClick={() => handleFilterChange('TUITION')}
            >
              Nợ / Trễ học phí
            </button>
          </div>
        </div>

        {pagedStudents.length === 0 ? (
          <p className="empty-text" style={{ textAlign: 'center', padding: '20px 0' }}>
            Không có sinh viên nào thuộc nhóm lọc này.
          </p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Mã SV</th>
                  <th>Họ và tên</th>
                  <th>Lớp</th>
                  <th>GPA (4.0)</th>
                  <th>Tín chỉ / Nợ môn</th>
                  <th>Học phí</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pagedStudents.map(sv => (
                  <tr key={sv.MaSV}>
                    <td><strong>{sv.MaSV}</strong></td>
                    <td>{sv.HoTen}</td>
                    <td>{sv.MaLop}</td>
                    <td>
                      <span className={`badge ${sv.DiemGPA !== null && sv.DiemGPA < 2.0 ? 'badge-danger' : 'badge-success'}`}>
                        {sv.DiemGPA ?? '—'}
                      </span>
                    </td>
                    <td>{sv.TinChiTichLuy ?? 0} TC • Nợ: <strong>{sv.SoMonNo ?? 0}</strong></td>
                    <td>
                      <span className={`badge ${sv.TrangThaiHocPhi === 'Đã đóng đủ' ? 'badge-success' : 'badge-danger'}`}>
                        {sv.TrangThaiHocPhi || 'Chưa cập nhật'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-small" onClick={() => setProfileSV(sv)}>
                        Xem hồ sơ
                      </button>
                      <button className="btn-delete" onClick={() => onSelectForWarning(sv.MaSV)}>
                        Rà soát CB
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="cv-pagination-bar">
                <button
                  type="button"
                  className="cv-page-btn"
                  disabled={safePage === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  ← Trước
                </button>
                <span className="cv-page-info">
                  Trang <strong>{safePage}</strong> / {totalPages} (Tổng {filteredStudents.length} sinh viên)
                </span>
                <button
                  type="button"
                  className="cv-page-btn"
                  disabled={safePage === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL CHI TIẾT HỒ SƠ NĂNG LỰC SINH VIÊN */}
      {profileSV && (
        <div className="modal-backdrop" onClick={() => setProfileSV(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="profile-modal-header">
              <div>
                <h3>Hồ sơ năng lực — {profileSV.HoTen} ({profileSV.MaSV})</h3>
                <p className="profile-modal-sub">
                  Lớp: {profileSV.TenLop || profileSV.MaLop} • Email: {profileSV.Email || 'Chưa cập nhật'}
                </p>
              </div>
              <button type="button" className="btn-delete" onClick={() => setProfileSV(null)}>Đóng</button>
            </div>

            <div className="profile-kpi-row">
              <div className="profile-kpi-box">
                <span>Tổng GPA tích lũy</span>
                <strong>{profileSV.DiemGPA ?? 0} / 4.0</strong>
              </div>
              <div className="profile-kpi-box">
                <span>Tín chỉ tích lũy</span>
                <strong>{profileSV.TinChiTichLuy ?? 0} TC</strong>
              </div>
              <div className="profile-kpi-box">
                <span>Số môn còn nợ</span>
                <strong>{profileSV.SoMonNo ?? 0} môn</strong>
              </div>
            </div>

            <h4>1. Bảng điểm học phần chi tiết</h4>
            <table className="profile-table">
              <thead>
                <tr>
                  <th>Tên môn học</th>
                  <th>Chuẩn LO</th>
                  <th>Điểm số</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {(data.minhChungNangLuc || [])
                  .filter(ct => ct.MaSV === profileSV.MaSV && ct.Loai === 'Môn học')
                  .map(mon => {
                    const passed = mon.DiemSo !== null && mon.DiemSo >= 5.0;
                    return (
                      <tr key={mon.MaChiTiet}>
                        <td><strong>{mon.TenMonHocOrChungChi}</strong></td>
                        <td>{mon.MaLO}</td>
                        <td><strong>{mon.DiemSo !== null ? mon.DiemSo : '—'}</strong></td>
                        <td>
                          <span className={`badge ${passed ? 'badge-success' : 'badge-danger'}`}>
                            {passed ? 'Đạt' : 'Chưa đạt'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            <h4>2. Tiến độ hoàn thành Chuẩn đầu ra (LO)</h4>
            {(data.chuanDauRa || [])
              .filter(lo => lo.MaSV === profileSV.MaSV)
              .map(lo => (
                <div key={lo.MaLO} className="profile-lo-item">
                  <div className="profile-lo-top">
                    <span><strong>{lo.MaLO}</strong> — {lo.TenChuan}</span>
                    <strong>{lo.TyLeDat}%</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${lo.TyLeDat}%` }} />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  );
}