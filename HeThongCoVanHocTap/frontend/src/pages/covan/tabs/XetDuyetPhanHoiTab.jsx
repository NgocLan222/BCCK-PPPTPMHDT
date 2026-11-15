import { useState } from 'react';
import axios from 'axios';

export default function XetDuyetPhanHoiTab({ data, pendingFeedbacks, onPreviewFile, onReload }) {
  const [reviewNotes, setReviewNotes] = useState({});

  const handleReviewSingleItem = async (bc, cb, chapThuan) => {
    try {
      const res = await axios.put('http://localhost:5000/api/covan/bangchung/duyet-muc', {
        maBangChung: bc.MaBangChung,
        maCanhBao: cb.MaCanhBao,
        chapThuan,
        yKienCoVan: reviewNotes[cb.MaPhanHoi] || ''
      });
      alert(res.data.message);
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi duyệt mục vi phạm');
    }
  };

  const handleForwardTuitionItem = async (bc, cb) => {
    try {
      const res = await axios.post('http://localhost:5000/api/covan/bangchung/chuyen-admin-hocphi', {
        maBangChung: bc.MaBangChung,
        maCanhBao: cb.MaCanhBao,
        maSV: cb.MaSV,
        ghiChuChuyenTiep: reviewNotes[cb.MaPhanHoi] || cb.NoiDungGiaiTrinh
      });
      alert(res.data.message);
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi chuyển tiếp học phí sang Admin');
    }
  };

  return (
    <div className="card">
      <h3>Xét duyệt Đơn giải trình theo từng căn cứ vi phạm</h3>
      {pendingFeedbacks.length === 0 ? (
        <p className="empty-text">Hiện chưa có sinh viên nào gửi phản hồi cảnh báo.</p>
      ) : (
        pendingFeedbacks.map(cb => {
          const items = data.bangChung.filter(bc => bc.MaCanhBao === cb.MaCanhBao);
          return (
            <div key={cb.MaPhanHoi} className="review-card">
              <div className="review-card-header">
                <strong>Phiếu {cb.MaCanhBao} — {cb.TenSV} ({cb.MaSV} • Lớp {cb.MaLop})</strong>
                <span className={`badge ${
                  cb.TrangThai === 'Đã hủy' ? 'badge-success' :
                  cb.TrangThai === 'Cần can thiệp' ? 'badge-danger' : 'badge-warning'
                }`}>
                  Trạng thái phiếu: {cb.TrangThai}
                </span>
              </div>

              <p className="feedback-text">
                <strong>Nội dung sinh viên giải trình:</strong> {cb.NoiDungGiaiTrinh}
              </p>
              <p className="feedback-file-row">
                <strong>Tệp minh chứng đính kèm:</strong>{' '}
                <button
                  type="button"
                  className="btn-small"
                  onClick={() =>
                    onPreviewFile({
                      title: `Minh chứng giải trình — ${cb.TenSV} (${cb.MaSV})`,
                      subtitle: `Phiếu cảnh báo: ${cb.MaCanhBao}`,
                      fileName: cb.TenTep || 'Tệp giải trình',
                      fileData: cb.TepMinhChung
                    })
                  }
                >
                  Xem tệp ({cb.TenTep || 'Minh chứng'})
                </button>
              </p>

              {/* Danh sách từng lỗi trong phiếu để duyệt độc lập */}
              <div className="evidence-decision-list">
                {items.map(bc => {
                  const isTuition = bc.LoaiViPham.toLowerCase().includes('học phí');
                  const isResolved = bc.ChiTiet.startsWith('[Đã gỡ]');
                  const isKept = bc.ChiTiet.startsWith('[Giữ nguyên]');
                  const isForwarded = bc.ChiTiet.startsWith('[Chờ Admin duyệt HP]');

                  return (
                    <div key={bc.MaBangChung} className="evidence-decision-row">
                      <div className="evidence-decision-text">
                        <strong>{bc.LoaiViPham}:</strong> {bc.ChiTiet}
                      </div>

                      <div>
                        {isResolved ? (
                          <span className="badge badge-success">Đã gỡ lỗi này</span>
                        ) : isKept ? (
                          <span className="badge badge-danger">Giữ nguyên lỗi</span>
                        ) : isForwarded ? (
                          <span className="badge badge-info">Đã gửi Admin duyệt HP</span>
                        ) : isTuition ? (
                          <button
                            type="button"
                            className="btn-bulk forward-hp-btn"
                            onClick={() => handleForwardTuitionItem(bc, cb)}
                          >
                            Chuyển Admin đối soát HP
                          </button>
                        ) : (
                          <div className="action-btn-pair">
                            <button
                              type="button"
                              className="btn-small"
                              onClick={() => handleReviewSingleItem(bc, cb, true)}
                            >
                              Chấp thuận gỡ mục này
                            </button>
                            <button
                              type="button"
                              className="btn-delete no-margin-left"
                              onClick={() => handleReviewSingleItem(bc, cb, false)}
                            >
                              Bác bỏ (Giữ lỗi)
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <input
                type="text"
                className="advisor-summary-input"
                placeholder="Ghi chú tổng hợp của Cố vấn gửi sinh viên..."
                value={reviewNotes[cb.MaPhanHoi] || cb.YKienCoVan || ''}
                onChange={e => setReviewNotes({ ...reviewNotes, [cb.MaPhanHoi]: e.target.value })}
              />
            </div>
          );
        })
      )}
    </div>
  );
}