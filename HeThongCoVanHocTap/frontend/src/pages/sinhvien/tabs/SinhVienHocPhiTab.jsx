import { useState } from 'react';
import axios from 'axios';

export default function SinhVienHocPhiTab({ user, data, onReload }) {
  const [selectedFee, setSelectedFee] = useState(null);
  const [feeTab, setFeeTab] = useState('qr');
  const [proofImage, setProofImage] = useState('');
  const [proofNote, setProofNote] = useState('');

  const getQrUrl = (hp) => {
    const soTienNo = Math.max(0, hp.SoTienPhaiDong - hp.SoTienDaDong);
    const noiDung = encodeURIComponent(`HP ${user.MaSV} ${hp.MaHocKy}`);
    return `https://img.vietqr.io/image/VCB-1029384756-compact2.png?amount=${soTienNo}&addInfo=${noiDung}&accountName=TRUONG%20DAI%20HOC%20SU%20PHAM`;
  };

  const handleDownloadQR = async (hp) => {
    try {
      const response = await fetch(getQrUrl(hp));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR_HocPhi_${user.MaSV}_${hp.MaHocKy}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(getQrUrl(hp), '_blank');
    }
  };

  const handleConfirmQRPayment = async () => {
    try {
      const res = await axios.put(`http://localhost:5000/api/sinhvien/hocphi/${selectedFee.MaHocPhi}/thanhtoan-qr`);
      alert(res.data.message);
      setSelectedFee(null);
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi xác nhận thanh toán.');
    }
  };

  const handleSelectProofFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProofImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmitFeeProof = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`http://localhost:5000/api/sinhvien/hocphi/${selectedFee.MaHocPhi}/minhchung`, {
        anhMinhChung: proofImage,
        ghiChu: proofNote
      });
      alert(res.data.message);
      setSelectedFee(null);
      setProofImage('');
      setProofNote('');
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi gửi minh chứng học phí.');
    }
  };

  return (
    <>
      <div className="card">
        <h3>Tình trạng học phí & Thanh toán trực tuyến</h3>
        <table>
          <thead>
            <tr>
              <th>Học kỳ</th>
              <th>Số tiền phải đóng</th>
              <th>Đã đóng</th>
              <th>Hạn đóng</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.hocPhi.map(hp => (
              <tr key={hp.MaHocPhi}>
                <td>{hp.TenHocKy} ({hp.NamHoc})</td>
                <td>{hp.SoTienPhaiDong.toLocaleString()} đ</td>
                <td>{hp.SoTienDaDong.toLocaleString()} đ</td>
                <td>{new Date(hp.HanDong).toLocaleDateString('vi-VN')}</td>
                <td>
                  <span className={`badge ${
                    hp.TrangThaiHocPhi === 'Đã đóng đủ' || hp.TrangThaiHocPhi === 'Đóng trễ hạn'
                      ? 'badge-success'
                      : hp.TrangThaiHocPhi === 'Chờ duyệt minh chứng'
                      ? 'badge-info'
                      : 'badge-danger'
                  }`}>
                    {hp.TrangThaiHocPhi}
                  </span>
                </td>
                <td>
                  {hp.TrangThaiHocPhi === 'Còn nợ học phí' && (
                    <button
                      className="btn-small"
                      onClick={() => { setSelectedFee(hp); setFeeTab('qr'); }}
                    >
                      Đóng học phí / Minh chứng
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* POPUP QUÉT MÃ QR ĐÓNG HỌC PHÍ HOẶC NỘP BIÊN LAI ĐỐI SOÁT */}
      {selectedFee && (
        <div className="modal-backdrop" onClick={() => setSelectedFee(null)}>
          <div className="modal-card qr-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>Học phí {selectedFee.TenHocKy}</h3>
              <button type="button" className="btn-delete" onClick={() => setSelectedFee(null)}>✕</button>
            </div>

            <div className="mode-switch modal-mode-switch">
              <button
                type="button"
                className={`mode-btn ${feeTab === 'qr' ? 'active' : ''}`}
                onClick={() => setFeeTab('qr')}
              >
                1. Quét mã QR đóng tiền
              </button>
              <button
                type="button"
                className={`mode-btn ${feeTab === 'proof' ? 'active' : ''}`}
                onClick={() => setFeeTab('proof')}
              >
                2. Nộp biên lai đã đóng
              </button>
            </div>

            {feeTab === 'qr' ? (
              <div>
                <div className="qr-container">
                  <img src={getQrUrl(selectedFee)} alt="Mã QR đóng học phí" className="qr-image" />
                  <div className="qr-info">
                    <div>Số tiền cần đóng: <strong>{(selectedFee.SoTienPhaiDong - selectedFee.SoTienDaDong).toLocaleString()} đ</strong></div>
                    <div>Nội dung CK: <strong>HP {user.MaSV} {selectedFee.MaHocKy}</strong></div>
                  </div>
                  <button type="button" className="btn-small" onClick={() => handleDownloadQR(selectedFee)}>
                    ⬇ Tải ảnh mã QR về máy
                  </button>
                </div>
                <button type="button" className="btn-primary" onClick={handleConfirmQRPayment}>
                  Tôi đã quét mã & Chuyển khoản xong
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeeProof}>
                <p className="proof-hint">
                  Chỉ sử dụng mục này nếu bạn đã đóng đủ học phí nhưng hệ thống vẫn báo nợ.
                </p>
                <div className="form-group">
                  <label>Hình ảnh / PDF biên lai xác nhận chuyển khoản</label>
                  <input type="file" accept=".pdf,image/*" onChange={handleSelectProofFile} required />
                  {proofImage && proofImage.startsWith('data:image/') && (
                    <img src={proofImage} alt="Xem trước biên lai" className="proof-preview" />
                  )}
                  {proofImage && proofImage.startsWith('data:application/pdf') && (
                    <iframe src={proofImage} title="Xem trước PDF" className="proof-pdf-preview" />
                  )}
                </div>
                <div className="form-group">
                  <label>Ghi chú đối soát (Ngày đóng, mã giao dịch...)</label>
                  <input
                    type="text"
                    placeholder="VD: Đã chuyển khoản qua VCB ngày 10/10/2025"
                    value={proofNote}
                    onChange={(e) => setProofNote(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary">Gửi minh chứng xác thực</button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}