import { useState } from 'react';
import axios from 'axios';
import './styles/App.css';
import './styles/Login.css';
import SinhVienDashboard from './pages/sinhvien/SinhVienDashboard';
import CoVanDashboard from './pages/covan/CoVanDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import DoiMatKhauModal from './components/DoiMatKhauModal';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [tenDangNhap, setTenDangNhap] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [error, setError] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [showChangePass, setShowChangePass] = useState(false);

  // State cho chức năng Quên mật khẩu qua Email
  const [showForgotBox, setShowForgotBox] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setForgotMsg('');
    try {
      const res = await axios.post('http://localhost:5000/api/login', {
        tenDangNhap,
        matKhau
      });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Không kết nối được tới máy chủ.');
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setForgotMsg('');
    setForgotLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/quen-mat-khau', {
        email: forgotEmail
      });
      setForgotMsg(res.data.message);
      setForgotEmail('');
      setShowForgotBox(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi yêu cầu cấp lại mật khẩu.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setShowChangePass(false);
    localStorage.removeItem('user');
  };

  const handlePasswordChanged = () => {
    const updatedUser = { ...user, DaDoiMatKhau: true };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setShowChangePass(false);
  };

  if (!user) {
    return (
      <div className="login-wrapper">
        <div className="login-box">
          <h2 className="login-title">HỆ THỐNG CỐ VẤN HỌC TẬP</h2>

          {error && <div className="error-box">{error}</div>}
          {forgotMsg && <div className="info-box">{forgotMsg}</div>}

          {!showForgotBox ? (
            <form onSubmit={handleLogin}>
              <div className="login-row">
                <label htmlFor="username">Đăng nhập</label>
                <input
                  id="username"
                  type="text"
                  placeholder="Nhập tên đăng nhập"
                  value={tenDangNhap}
                  onChange={(e) => setTenDangNhap(e.target.value)}
                  required
                />
              </div>

              <div className="login-row">
                <label htmlFor="password">Mật khẩu</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={matKhau}
                  onChange={(e) => setMatKhau(e.target.value)}
                  required
                />
              </div>

              <div className="login-actions">
                <button type="submit" className="btn-primary btn-login-pill">
                  Đăng nhập
                </button>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => {
                    setError('');
                    setForgotMsg('');
                    setShowForgotBox(true);
                  }}
                >
                  Quên mật khẩu?
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotSubmit} className="forgot-panel">
              <div className="info-box forgot-notice">
                Bạn không thể tự đổi mật khẩu khi quên mật khẩu. Vui lòng nhập đúng <strong>Email đã được Admin cấp</strong> khi tạo tài khoản để gửi yêu cầu về hệ thống Quản trị viên, hoặc liên hệ trực tiếp Admin để được hỗ trợ.
              </div>

              <div className="login-row">
                <label htmlFor="forgot-email">Email cấp</label>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="VD: an.nv2101@student.edu.vn"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>

              <div className="login-actions">
                <button type="submit" className="btn-primary btn-login-pill" disabled={forgotLoading}>
                  {forgotLoading ? 'Đang gửi...' : 'Gửi yêu cầu về Admin'}
                </button>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => {
                    setError('');
                    setShowForgotBox(false);
                  }}
                >
                  ← Quay lại đăng nhập
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Chỉ hiện nhắc đổi mật khẩu & nút Đổi mật khẩu khi SV/Cố vấn chưa đổi mật khẩu
  const needPasswordAlert = user.VaiTro !== 'Admin' && !Boolean(user.DaDoiMatKhau);

  return (
    <div>
      <header className="navbar">
        <h1 className="navbar-title">Cố Vấn Học Tập & Hồ Sơ Năng Lực</h1>
        <div className="navbar-right">
          <span className="role-tag">Vai trò: {user.VaiTro}</span>
          {needPasswordAlert && (
            <button className="btn-banner" onClick={() => setShowChangePass(true)}>
              Đổi mật khẩu
            </button>
          )}
          <button className="btn-logout" onClick={handleLogout}>Đăng xuất</button>
        </div>
      </header>

      {needPasswordAlert && (
        <div className="password-banner">
          <span>Bạn đang sử dụng mật khẩu mặc định. Vui lòng đổi mật khẩu để bảo mật tài khoản.</span>
          <button className="btn-banner" onClick={() => setShowChangePass(true)}>
            Đổi mật khẩu ngay
          </button>
        </div>
      )}

      {showChangePass && (
        <DoiMatKhauModal
          user={user}
          tenDangNhap={user.TenDangNhap}
          onClose={() => setShowChangePass(false)}
          onSuccess={handlePasswordChanged}
        />
      )}

      {user.VaiTro === 'SinhVien' && <SinhVienDashboard user={user} />}
      {user.VaiTro === 'CoVan' && <CoVanDashboard user={user} />}
      {user.VaiTro === 'Admin' && <AdminDashboard user={user} />}
    </div>
  );
}

export default App;