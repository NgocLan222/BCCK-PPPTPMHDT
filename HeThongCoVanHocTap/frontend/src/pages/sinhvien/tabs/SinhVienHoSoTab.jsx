import { useState } from 'react';
import axios from 'axios';

const PAGE_SIZE = 5;

export default function SinhVienHoSoTab({ user, data, kq, onReload }) {
  const [selectedLO, setSelectedLO] = useState('');
  const [certName, setCertName] = useState('');
  const [certFile, setCertFile] = useState('');
  const [certFileName, setCertFileName] = useState('');
  const [page, setPage] = useState(1);

  const handleSelectCertFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCertFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setCertFile(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUploadCompetency = async (e) => {
    e.preventDefault();
    if (!certFile) {
      alert('Đang đọc tệp ảnh/PDF, vui lòng đợi 1 giây rồi bấm gửi lại!');
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/sinhvien/minhchung-nangluc', {
        maSV: user.MaSV,
        maLO: selectedLO,
        tenMinhChung: certName,
        tepMinhChung: certFile,
        tenTep: certFileName || 'minh_chung_chung_chi.pdf'
      });
      alert(res.data.message);
      setCertName('');
      setCertFile('');
      setCertFileName('');
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi nộp minh chứng năng lực');
    }
  };

  const subjects = (data.chiTietCDR || []).filter(ct => ct.Loai === 'Môn học');
  const totalPages = Math.max(1, Math.ceil(subjects.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedSubjects = subjects.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      <div className="card">
        <div className="grade-header">
          <h3>Bảng điểm học phần & Tổng kết GPA</h3>
          <span className="badge badge-info">GPA tích lũy: {kq.DiemGPA} / 4.0</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>Tên học phần</th>
              <th>Chuẩn đầu ra (LO)</th>
              <th>Điểm số (Hệ 10)</th>
              <th>Đánh giá</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {pagedSubjects.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-cell">Chưa có dữ liệu điểm học phần.</td>
              </tr>
            ) : (
              pagedSubjects.map(mon => {
                const passed = mon.DiemSo !== null && mon.DiemSo >= 5.0;
                return (
                  <tr key={mon.MaChiTiet}>
                    <td><strong>{mon.TenMonHocOrChungChi}</strong></td>
                    <td>{mon.MaLO}</td>
                    <td><strong>{mon.DiemSo !== null ? mon.DiemSo : '—'}</strong></td>
                    <td>
                      <span className={`badge ${passed ? 'badge-success' : 'badge-danger'}`}>
                        {passed ? 'Đạt' : 'Chưa đạt (Nợ môn)'}
                      </span>
                    </td>
                    <td className="grade-note">{mon.GhiChuCoVan || '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="sv-pagination-bar">
            <button
              type="button"
              className="sv-page-btn"
              disabled={safePage === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              ← Trước
            </button>
            <span className="sv-page-info">
              Trang <strong>{safePage}</strong> / {totalPages} (Tổng {subjects.length} học phần)
            </span>
            <button
              type="button"
              className="sv-page-btn"
              disabled={safePage === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Sau →
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Tiến độ hoàn thành Chuẩn đầu ra (LO)</h3>
        {(data.chuanDauRa || []).map(lo => (
          <div key={lo.MaLO} className="lo-box">
            <div className="lo-header">
              <span><strong>{lo.MaLO}</strong> — {lo.TenChuan}</span>
              <strong>{lo.TyLeDat}%</strong>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${lo.TyLeDat}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Nộp minh chứng chứng chỉ / rèn luyện mới</h3>
        <form className="inline-form" onSubmit={handleUploadCompetency}>
          <select value={selectedLO} onChange={e => setSelectedLO(e.target.value)} required>
            <option value="">-- Chọn chuẩn đầu ra (LO) --</option>
            {data.chuanDauRa.map(lo => (
              <option key={lo.MaLO} value={lo.MaLO}>{lo.MaLO} - {lo.TenChuan}</option>
            ))}
          </select>

          <input
            type="text"
            className="flex-input"
            placeholder="Tên chứng chỉ / minh chứng (VD: Chứng chỉ TOEIC 550)"
            value={certName}
            onChange={e => setCertName(e.target.value)}
            required
          />

          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleSelectCertFile}
            required
          />

          <button type="submit" className="btn-small">+ Gửi Cố vấn duyệt</button>
        </form>
      </div>
    </>
  );
}