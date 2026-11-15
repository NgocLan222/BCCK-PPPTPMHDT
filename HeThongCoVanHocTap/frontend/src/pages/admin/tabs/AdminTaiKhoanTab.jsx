import { useState } from 'react';
import axios from 'axios';

const PAGE_SIZE = 5;

export default function AdminTaiKhoanTab({ data, onReload }) {
  const [issueMode, setIssueMode] = useState('existing');
  const [vaiTro, setVaiTro] = useState('CoVan');
  const [maDoiTuong, setMaDoiTuong] = useState('');
  const [hoTen, setHoTen] = useState('');
  const [email, setEmail] = useState('');
  const [khoa, setKhoa] = useState('Công nghệ Thông tin');
  const [maLop, setMaLop] = useState('21CNTT01');
  const [tenDangNhap, setTenDangNhap] = useState('');
  const [matKhau, setMatKhau] = useState('123456');

  // Bộ lọc vai trò & phân trang 5 người/trang cho danh sách tài khoản
  const [listRole, setListRole] = useState('SinhVien'); // 'SinhVien' | 'CoVan' | 'Admin'
  const [page, setPage] = useState(1);

  const svAccounts = (data.taiKhoan || []).filter(tk => tk.VaiTro === 'SinhVien');
  const cvAccounts = (data.taiKhoan || []).filter(tk => tk.VaiTro === 'CoVan');
  const adminAccounts = (data.taiKhoan || []).filter(tk => tk.VaiTro === 'Admin');

  const currentAccounts =
    listRole === 'SinhVien' ? svAccounts : listRole === 'CoVan' ? cvAccounts : adminAccounts;

  const totalPages = Math.max(1, Math.ceil(currentAccounts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedAccounts = currentAccounts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSwitchListRole = (role) => {
    setListRole(role);
    setPage(1);
  };

  const handleBulkIssue = async () => {
    if (!window.confirm(`Xác nhận cấp tài khoản hàng loạt cho ${data.svChuaCoTK.length} sinh viên chưa có tài khoản?`)) {
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/admin/taikhoan/hangloat');
      alert(res.data.message);
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi cấp tài khoản hàng loạt');
    }
  };

  const handleSingleIssue = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/admin/taikhoan', {
        mode: issueMode,
        vaiTro,
        maDoiTuong,
        hoTen,
        email,
        khoa,
        maLop,
        tenDangNhap,
        matKhau
      });
      alert(res.data.message);
      setMaDoiTuong('');
      setHoTen('');
      setEmail('');
      setTenDangNhap('');
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi cấp tài khoản');
    }
  };

  const handleToggleStatus = async (userTarget) => {
    await axios.put(`http://localhost:5000/api/admin/taikhoan/${userTarget}/trangthai`);
    onReload();
  };

  const handleDeleteAccount = async (userTarget) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${userTarget}"?`)) return;
    try {
      const res = await axios.delete(`http://localhost:5000/api/admin/taikhoan/${userTarget}`);
      alert(res.data.message);
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa tài khoản');
    }
  };

  return (
    <div className="card">
      <h3>Cấp phát & Quản lý Tài khoản</h3>

      <div className="account-toolbar">
        <div className="mode-switch">
          <button
            type="button"
            className={`mode-btn ${issueMode === 'existing' ? 'active' : ''}`}
            onClick={() => { setIssueMode('existing'); setMaDoiTuong(''); setTenDangNhap(''); }}
          >
            Cấp từ danh sách có sẵn
          </button>
          <button
            type="button"
            className={`mode-btn ${issueMode === 'new' ? 'active' : ''}`}
            onClick={() => { setIssueMode('new'); setMaDoiTuong(''); setTenDangNhap(''); }}
          >
            + Thêm mới & Cấp tài khoản lẻ
          </button>
        </div>

        {data.svChuaCoTK.length > 0 && (
          <button type="button" className="btn-bulk" onClick={handleBulkIssue}>
            Cấp tài khoản hàng loạt ({data.svChuaCoTK.length} SV chưa có TK)
          </button>
        )}
      </div>

      <form className="inline-form" onSubmit={handleSingleIssue}>
        <select
          value={vaiTro}
          onChange={e => { setVaiTro(e.target.value); setMaDoiTuong(''); setTenDangNhap(''); }}
        >
          <option value="CoVan">Vai trò: Cố vấn học tập</option>
          <option value="SinhVien">Vai trò: Sinh viên</option>
          {issueMode === 'new' && <option value="Admin">Vai trò: Quản trị viên</option>}
        </select>

        {issueMode === 'existing' && vaiTro === 'CoVan' && (
          <select
            value={maDoiTuong}
            onChange={e => { setMaDoiTuong(e.target.value); setTenDangNhap(e.target.value); }}
            required
          >
            <option value="">-- Chọn Cố vấn chưa có TK ({data.cvChuaCoTK.length}) --</option>
            {data.cvChuaCoTK.map(cv => (
              <option key={cv.MaCV} value={cv.MaCV}>
                {cv.MaCV} - {cv.HoTen}
              </option>
            ))}
          </select>
        )}

        {issueMode === 'existing' && vaiTro === 'SinhVien' && (
          <select
            value={maDoiTuong}
            onChange={e => { setMaDoiTuong(e.target.value); setTenDangNhap(e.target.value); }}
            required
          >
            <option value="">-- Chọn Sinh viên chưa có TK ({data.svChuaCoTK.length}) --</option>
            {data.svChuaCoTK.map(sv => (
              <option key={sv.MaSV} value={sv.MaSV}>
                {sv.MaSV} - {sv.HoTen}
              </option>
            ))}
          </select>
        )}

        {issueMode === 'new' && vaiTro !== 'Admin' && (
          <>
            <input
              type="text"
              placeholder={vaiTro === 'CoVan' ? 'Mã CV (VD: CV005)' : 'Mã SV (VD: SV2107)'}
              value={maDoiTuong}
              onChange={e => { setMaDoiTuong(e.target.value); setTenDangNhap(e.target.value); }}
              required
            />
            <input
              type="text"
              placeholder="Họ và tên"
              value={hoTen}
              onChange={e => setHoTen(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </>
        )}

        {issueMode === 'new' && vaiTro === 'CoVan' && (
          <input
            type="text"
            placeholder="Khoa"
            value={khoa}
            onChange={e => setKhoa(e.target.value)}
            required
          />
        )}

        {issueMode === 'new' && vaiTro === 'SinhVien' && (
          <select value={maLop} onChange={e => setMaLop(e.target.value)}>
            {data.lop.map(l => (
              <option key={l.MaLop} value={l.MaLop}>{l.MaLop}</option>
            ))}
          </select>
        )}

        <input
          type="text"
          placeholder="Tên đăng nhập"
          value={tenDangNhap}
          onChange={e => setTenDangNhap(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Mật khẩu"
          value={matKhau}
          onChange={e => setMatKhau(e.target.value)}
          required
        />
        <button type="submit" className="btn-small">
          {issueMode === 'new' ? '+ Thêm & Cấp TK' : '+ Cấp tài khoản'}
        </button>
      </form>

      {/* Nút chia 2 bên: Sinh viên vs Cố vấn (kèm Quản trị viên) */}
      <div className="admin-section-header" style={{ marginTop: '20px' }}>
        <span className="sub-heading">Danh sách tài khoản hiện có</span>
        <div className="role-segment">
          <button
            type="button"
            className={`segment-btn ${listRole === 'SinhVien' ? 'active' : ''}`}
            onClick={() => handleSwitchListRole('SinhVien')}
          >
            Sinh viên ({svAccounts.length})
          </button>
          <button
            type="button"
            className={`segment-btn ${listRole === 'CoVan' ? 'active' : ''}`}
            onClick={() => handleSwitchListRole('CoVan')}
          >
            Cố vấn học tập ({cvAccounts.length})
          </button>
          <button
            type="button"
            className={`segment-btn ${listRole === 'Admin' ? 'active' : ''}`}
            onClick={() => handleSwitchListRole('Admin')}
          >
            Quản trị viên ({adminAccounts.length})
          </button>
        </div>
      </div>

      {pagedAccounts.length === 0 ? (
        <p className="empty-text">Chưa có tài khoản nào trong nhóm này.</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Tên đăng nhập</th>
                <th>Vai trò</th>
                <th>Chủ sở hữu</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pagedAccounts.map(tk => (
                <tr key={tk.TenDangNhap}>
                  <td><strong>{tk.TenDangNhap}</strong></td>
                  <td><span className="badge badge-info">{tk.VaiTro}</span></td>
                  <td>
                    {tk.MaChuSoHuu !== '—' ? `${tk.MaChuSoHuu} - ${tk.HoTenChuSoHuu}` : tk.HoTenChuSoHuu}
                  </td>
                  <td>
                    <span className={`badge ${tk.TrangThai ? 'badge-success' : 'badge-danger'}`}>
                      {tk.TrangThai ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td>
                    {tk.TenDangNhap !== 'admin' ? (
                      <>
                        <button className="btn-small" onClick={() => handleToggleStatus(tk.TenDangNhap)}>
                          {tk.TrangThai ? 'Khóa' : 'Mở khóa'}
                        </button>
                        <button className="btn-delete" onClick={() => handleDeleteAccount(tk.TenDangNhap)}>
                          Xóa
                        </button>
                      </>
                    ) : (
                      <span className="processed-text">Tài khoản gốc</span>
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
                Trang <strong>{safePage}</strong> / {totalPages} (Tổng {currentAccounts.length} tài khoản)
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