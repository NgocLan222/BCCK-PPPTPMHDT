import { useState } from 'react';
import axios from 'axios';

const PAGE_SIZE = 5;

export default function DuyetMinhChungTab({ data, onPreviewFile, onReload }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [proofDecision, setProofDecision] = useState(null);
  const [proofReason, setProofReason] = useState('');

const allProofs = (data.minhChungNangLuc || []).filter(
  mc => mc.Loai === 'Chứng chỉ' && mc.TepMinhChung
);  const pendingCount = allProofs.filter(mc => mc.TrangThaiDuyet === 'Chờ duyệt').length;

  const filteredProofs = statusFilter === 'PENDING'
    ? allProofs.filter(mc => mc.TrangThaiDuyet === 'Chờ duyệt')
    : allProofs;

  const totalPages = Math.max(1, Math.ceil(filteredProofs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedProofs = filteredProofs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleFilterChange = (filter) => {
    setStatusFilter(filter);
    setPage(1);
  };

  const openApproveModal = (mc, chapThuan) => {
    setProofDecision({ mc, chapThuan });
    setProofReason(chapThuan ? 'Minh chứng hợp lệ, đạt chuẩn quy định.' : '');
  };

  const handleConfirmProofDecision = async (e) => {
    e.preventDefault();
    if (!proofDecision) return;
    if (!proofDecision.chapThuan && !proofReason.trim()) {
      alert('Vui lòng nhập nguyên nhân từ chối để sinh viên biết và bổ sung!');
      return;
    }

    try {
      const res = await axios.put(
        `http://localhost:5000/api/covan/minhchung-nangluc/${proofDecision.mc.MaChiTiet}/duyet`,
        {
          chapThuan: proofDecision.chapThuan,
          ghiChuCoVan: proofReason.trim()
        }
      );
      alert(res.data.message);
      setProofDecision(null);
      setProofReason('');
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi phê duyệt minh chứng năng lực');
    }
  };

  return (
    <>
      <div className="card">
        <div className="sv-list-header">
          <h3>Phê duyệt Minh chứng năng lực & Chứng chỉ sinh viên</h3>
          <div className="mode-switch">
            <button
              type="button"
              className={`mode-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => handleFilterChange('ALL')}
            >
              Tất cả ({allProofs.length})
            </button>
            <button
              type="button"
              className={`mode-btn ${statusFilter === 'PENDING' ? 'active' : ''}`}
              onClick={() => handleFilterChange('PENDING')}
            >
              Chờ duyệt ({pendingCount})
            </button>
          </div>
        </div>

        {pagedProofs.length === 0 ? (
          <p className="empty-text" style={{ textAlign: 'center', padding: '20px 0' }}>
            Không có hồ sơ minh chứng nào trong mục này.
          </p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Sinh viên</th>
                  <th>Chuẩn đầu ra (LO)</th>
                  <th>Môn học / Chứng chỉ</th>
                  <th>Điểm / Tệp</th>
                  <th>Trạng thái</th>
                  <th>Nhận xét / Lý do</th>
                  <th>Phê duyệt</th>
                </tr>
              </thead>
              <tbody>
                {pagedProofs.map(mc => (
                  <tr key={mc.MaChiTiet}>
                    <td>
                      <div className="sv-cell-name">{mc.TenSV}</div>
                      <div className="sv-cell-id">({mc.MaSV})</div>
                    </td>
                    <td><strong>{mc.MaLO}</strong></td>
                    <td>
                      <div className="cert-title">{mc.TenMonHocOrChungChi}</div>
                      <span className="badge badge-info badge-compact">{mc.Loai}</span>
                    </td>
                    <td>
                      {mc.DiemSo !== null ? (
                        <span>Điểm: <strong>{mc.DiemSo}</strong></span>
                      ) : (
                        <button
                          type="button"
                          className="btn-small nowrap-btn"
                          title={mc.TenTep || 'Xem tệp đính kèm'}
                          onClick={() =>
                            onPreviewFile({
                              title: `Minh chứng năng lực — ${mc.TenSV} (${mc.MaSV})`,
                              subtitle: `${mc.MaLO}: ${mc.TenMonHocOrChungChi}`,
                              fileName: mc.TenTep || mc.TepMinhChung || 'Hồ sơ đính kèm',
                              fileData: mc.TepMinhChung
                            })
                          }
                        >
                          Xem minh chứng
                        </button>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        mc.TrangThaiDuyet === 'Đã duyệt' ? 'badge-success' :
                        mc.TrangThaiDuyet === 'Từ chối' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {mc.TrangThaiDuyet}
                      </span>
                    </td>
                    <td className="advisor-note-cell">{mc.GhiChuCoVan || '—'}</td>
                    <td>
                      {mc.TrangThaiDuyet === 'Chờ duyệt' ? (
                        <div className="action-btn-pair">
                          <button className="btn-small" onClick={() => openApproveModal(mc, true)}>
                            Phê duyệt
                          </button>
                          <button className="btn-delete no-margin-left" onClick={() => openApproveModal(mc, false)}>
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="processed-text">Đã xử lý</span>
                      )}
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
                  Trang <strong>{safePage}</strong> / {totalPages} (Tổng {filteredProofs.length} hồ sơ)
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

      {/* MODAL NHẬP LÝ DO TỪ CHỐI HOẶC NHẬN XÉT PHÊ DUYỆT MINH CHỨNG */}
      {proofDecision && (
        <div className="modal-backdrop" onClick={() => setProofDecision(null)}>
          <div className="modal-card decision-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>{proofDecision.chapThuan ? 'Phê duyệt minh chứng' : 'Từ chối minh chứng'}</h3>
              <button type="button" className="btn-delete" onClick={() => setProofDecision(null)}>✕</button>
            </div>

            <p className="decision-info">
              Sinh viên: <strong>{proofDecision.mc.TenSV} ({proofDecision.mc.MaSV})</strong><br />
              Nội dung: <strong>{proofDecision.mc.TenMonHocOrChungChi}</strong> ({proofDecision.mc.MaLO})
            </p>

            <form onSubmit={handleConfirmProofDecision}>
              <div className="form-group">
                <label>
                  {proofDecision.chapThuan
                    ? 'Nhận xét phê duyệt (tùy chọn):'
                    : 'Nguyên nhân từ chối (bắt buộc để sinh viên bổ sung):'}
                </label>
                <textarea
                  rows="3"
                  placeholder={
                    proofDecision.chapThuan
                      ? 'Nhập nhận xét của Cố vấn...'
                      : 'VD: Ảnh chụp chứng chỉ bị mờ, thiếu dấu mộc hoặc chưa đạt mức điểm quy định...'
                  }
                  value={proofReason}
                  onChange={e => setProofReason(e.target.value)}
                  required={!proofDecision.chapThuan}
                />
              </div>

              {!proofDecision.chapThuan && (
                <div className="sample-reasons-wrap">
                  {[
                    'Ảnh chụp bị mờ, không đọc rõ thông tin',
                    'Chứng chỉ chưa đạt mức điểm chuẩn đầu ra',
                    'Chứng chỉ đã hết thời hạn hiệu lực'
                  ].map((sample, i) => (
                    <button
                      key={i}
                      type="button"
                      className="btn-small sample-reason-btn"
                      onClick={() => setProofReason(sample)}
                    >
                      + {sample}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="submit"
                className={`${proofDecision.chapThuan ? 'btn-primary' : 'btn-delete'} full-submit-btn`}
              >
                {proofDecision.chapThuan ? 'Xác nhận Phê duyệt' : 'Xác nhận Từ chối'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}