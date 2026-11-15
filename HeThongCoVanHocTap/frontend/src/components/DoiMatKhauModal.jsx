import { useEffect, useState } from 'react';
import axios from 'axios';
import './DoiMatKhauModal.css';

export default function DoiMatKhauModal({ user, tenDangNhap: propUsername, isOpen = true, onClose, onSuccess }) {
  const currentUsername = user?.TenDangNhap || propUsername;
  const currentRole = user?.VaiTro || 'SinhVien';

  const [loading, setLoading] = useState(true);
  const [perm, setPerm] = useState({ allowed: true, remainingMinutes: 0, reason: '' });

  const [matKhauCu, setMatKhauCu] = useState('');
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [xacNhanMK, setXacNhanMK] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUsername || !isOpen) return;
    setLoading(true);
    axios.get(`http://localhost:5000/api/taikhoan/${currentUsername}/quyen-doimatkhau`)
      .then(res => setPerm(res.data))
      .catch(() => setPerm({ allowed: false, remainingMinutes: 0, reason: '' }))
      .finally(() => setLoading(false));
  }, [currentUsername, isOpen]);

  if (!isOpen || !currentUsername) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (matKhauMoi !== xacNhanMK) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }
    try {
      const res = await axios.put('http://localhost:5000/api/taikhoan/doimatkhau', {
        tenDangNhap: currentUsername,
        matKhauCu,
        matKhauMoi
      });
      alert(res.data.message);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi đổi mật khẩu');
    }
  };

  const hoursLeft = Math.floor(perm.remainingMinutes / 60);
  const minsLeft = perm.remainingMinutes % 60;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Đổi mật khẩu tài khoản</h3>
          <button type="button" className="btn-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Đang kiểm tra quyền hạn tài khoản...</p>
        ) : perm.allowed ? (
          <form onSubmit={handleSubmit}>
            {currentRole !== 'Admin' && (
              <div
                style={{
                  backgroundColor: 'var(--ice-blue)',
                  border: '1px solid var(--periwinkle)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  marginBottom: '14px'
                }}
              >
                Thời hạn tự đổi mật khẩu còn lại: <strong>{hoursLeft} giờ {minsLeft} phút</strong> (chỉ được đổi 1 lần duy nhất).
              </div>
            )}

            {error && <div className="error-box">{error}</div>}

            <div className="form-group">
              <label>Mật khẩu hiện tại</label>
              <input type="password" value={matKhauCu} onChange={e => setMatKhauCu(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input type="password" value={matKhauMoi} onChange={e => setMatKhauMoi(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Xác nhận mật khẩu mới</label>
              <input type="password" value={xacNhanMK} onChange={e => setXacNhanMK(e.target.value)} required />
            </div>

            <button type="submit" className="btn-primary">Cập nhật mật khẩu</button>
          </form>
        ) : (
          <div>
            <div
              style={{
                backgroundColor: 'var(--blush)',
                border: '1px solid var(--rose)',
                padding: '16px',
                borderRadius: '10px',
                fontSize: '13.5px',
                lineHeight: '1.6',
                marginBottom: '16px',
                textAlign: 'center'
              }}
            >
              <strong>Bạn không có quyền hạn đổi mật khẩu!</strong>
              <p style={{ margin: '8px 0 0 0' }}>
                {perm.reason && <>{perm.reason}<br /></>}
                Vui lòng liên hệ <strong>người cung cấp tài khoản (Quản trị viên / Admin)</strong> để được hỗ trợ.
              </p>
            </div>

            <button type="button" className="btn-primary" onClick={onClose}>
              Đã hiểu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}