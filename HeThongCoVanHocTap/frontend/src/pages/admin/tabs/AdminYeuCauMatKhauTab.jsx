import { useState } from 'react';
import axios from 'axios';

const PAGE_SIZE = 5;

export default function AdminYeuCauMatKhauTab({ data, onReload }) {
  const [roleFilter, setRoleFilter] = useState('SinhVien'); // 'SinhVien' | 'CoVan'
  const [page, setPage] = useState(1);
  const [loadingId, setLoadingId] = useState(null);

  const allRequests = data.yeuCauMatKhau || [];
  const svList = allRequests.filter(yc => yc.VaiTro === 'SinhVien');
  const cvList = allRequests.filter(yc => yc.VaiTro === 'CoVan');

  const svPending = svList.filter(yc => yc.TrangThai === 'Chờ xử lý').length;
  const cvPending = cvList.filter(yc => yc.TrangThai === 'Chờ xử lý').length;

  const filteredList = roleFilter === 'SinhVien' ? svList : cvList;
  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedList = filteredList.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSwitchRole = (role) => {
    setRoleFilter(role);
    setPage(1);
  };

  const handleResetPasswordAndEmail = async (yc) => {
    setLoadingId(yc.MaYeuCau);
    try {
      const res = await axios.post('http://localhost:5000/api/admin/cap-lai-mat-khau', {
        maYeuCau: yc.MaYeuCau,
        tenDangNhap: yc.TenDangNhap
      });
      alert(res.data.message);
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi cấp lại mật khẩu qua email');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="card">
      <div className="admin-section-header">
        <h3>Yêu cầu cấp lại mật khẩu qua Email</h3>

        {/* Nút chuyển 2 bên: Sinh viên vs Cố vấn */}
        <div className="role-segment">
          <button
            type="button"
            className={`segment-btn ${roleFilter === 'SinhVien' ? 'active' : ''}`}
            onClick={() => handleSwitchRole('SinhVien')}
          >
            Sinh viên ({svList.length})
            {svPending > 0 && <span className="segment-badge">{svPending}</span>}
          </button>
          <button
            type="button"
            className={`segment-btn ${roleFilter === 'CoVan' ? 'active' : ''}`}
            onClick={() => handleSwitchRole('CoVan')}
          >
            Cố vấn học tập ({cvList.length})
            {cvPending > 0 && <span className="segment-badge">{cvPending}</span>}
          </button>
        </div>
      </div>

      {pagedList.length === 0 ? (
        <p className="empty-text">
          Chưa có yêu cầu cấp lại mật khẩu nào từ {roleFilter === 'SinhVien' ? 'Sinh viên' : 'Cố vấn học tập'}.
        </p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Họ và tên</th>
                <th>Nội dung / Email nhận</th>
                <th>Thời gian gửi</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pagedList.map(yc => (
                <tr key={yc.MaYeuCau}>
                  <td><strong>{yc.TenDangNhap}</strong></td>
                  <td>{yc.HoTen}</td>
                  <td>{yc.LyDo}</td>
                  <td>{new Date(yc.NgayGui).toLocaleString('vi-VN')}</td>
                  <td>
                    <span className={`badge ${yc.TrangThai === 'Chờ xử lý' ? 'badge-warning' : 'badge-success'}`}>
                      {yc.TrangThai}
                    </span>
                  </td>
                  <td>
                    {yc.TrangThai === 'Chờ xử lý' ? (
                      <button
                        type="button"
                        className="btn-small"
                        disabled={loadingId === yc.MaYeuCau}
                        onClick={() => handleResetPasswordAndEmail(yc)}
                      >
                        {loadingId === yc.MaYeuCau ? 'Đang gửi mail...' : 'Cấp lại MK & Gửi Email'}
                      </button>
                    ) : (
                      <span className="processed-text">Đã cấp lại MK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination-bar">
              <button
                type="button"
                className="page-btn"
                disabled={safePage === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                ← Trước
              </button>
              <span className="page-info">
                Trang <strong>{safePage}</strong> / {totalPages} (Tổng {filteredList.length} yêu cầu)
              </span>
              <button
                type="button"
                className="page-btn"
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
  );
}