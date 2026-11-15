import { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 5;

export default function AdminDongBoTab({ data, onReload }) {
  const [excelRows, setExcelRows] = useState([]);
  const [excelPage, setExcelPage] = useState(1);
  const [feePage, setFeePage] = useState(1);
  const [previewProof, setPreviewProof] = useState(null);

  const handleExcelFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: 'binary', cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const formatted = rows.map(r => {
        let dob = '2004-01-01';
        if (r.NgaySinh instanceof Date && !isNaN(r.NgaySinh)) {
          dob = r.NgaySinh.toISOString().split('T')[0];
        } else if (r.NgaySinh) {
          dob = String(r.NgaySinh).trim();
        }
        return { ...r, NgaySinh: dob };
      });
      setExcelRows(formatted);
      setExcelPage(1);
    };
    reader.readAsBinaryString(file);
  };

  const handleImportExcel = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/admin/import-sinhvien', {
        students: excelRows
      });
      alert(res.data.message);
      setExcelRows([]);
      setExcelPage(1);
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi nhập dữ liệu Excel');
    }
  };

  const handleSyncTuition = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/admin/dongbo-hocphi');
      alert(res.data.message);
      setFeePage(1);
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi đồng bộ học phí');
    }
  };

  const handleApproveFee = async (maHocPhi, chapThuan, loaiHoanThanh = 'dung_han') => {
    try {
      const res = await axios.put(`http://localhost:5000/api/admin/hocphi/${maHocPhi}/duyet`, {
        chapThuan,
        loaiHoanThanh
      });
      alert(res.data.message);
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi duyệt minh chứng học phí');
    }
  };

  // Phân trang 5 dòng/trang cho bảng xem trước Excel
  const excelTotalPages = Math.max(1, Math.ceil(excelRows.length / PAGE_SIZE));
  const safeExcelPage = Math.min(excelPage, excelTotalPages);
  const pagedExcelRows = excelRows.slice((safeExcelPage - 1) * PAGE_SIZE, safeExcelPage * PAGE_SIZE);

  // Phân trang 5 dòng/trang cho bảng Dữ liệu Học phí & Công nợ
  const hocPhiList = data.hocPhi || [];
  const feeTotalPages = Math.max(1, Math.ceil(hocPhiList.length / PAGE_SIZE));
  const safeFeePage = Math.min(feePage, feeTotalPages);
  const pagedHocPhi = hocPhiList.slice((safeFeePage - 1) * PAGE_SIZE, safeFeePage * PAGE_SIZE);

  return (
    <>
      <div className="card">
        <h3>Nhập danh sách Sinh viên từ file Excel</h3>

        <div className="excel-box">
          <input type="file" accept=".xlsx, .xls" onChange={handleExcelFile} />
          {excelRows.length > 0 && (
            <button type="button" className="btn-bulk" onClick={handleImportExcel}>
              Lưu {excelRows.length} sinh viên vào CSDL
            </button>
          )}
        </div>

        {excelRows.length > 0 && (
          <>
            <table>
              <thead>
                <tr>
                  <th>Mã SV</th>
                  <th>Họ và tên</th>
                  <th>Ngày sinh</th>
                  <th>Phái</th>
                  <th>Email</th>
                  <th>Mã lớp</th>
                </tr>
              </thead>
              <tbody>
                {pagedExcelRows.map((sv, idx) => (
                  <tr key={idx}>
                    <td><strong>{sv.MaSV}</strong></td>
                    <td>{sv.HoTen}</td>
                    <td>{sv.NgaySinh}</td>
                    <td>{sv.Phai}</td>
                    <td>{sv.Email}</td>
                    <td>{sv.MaLop}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {excelTotalPages > 1 && (
              <div className="pagination-bar">
                <button
                  type="button"
                  className="page-btn"
                  disabled={safeExcelPage === 1}
                  onClick={() => setExcelPage(p => Math.max(1, p - 1))}
                >
                  ← Trước
                </button>
                <span className="page-info">
                  Trang <strong>{safeExcelPage}</strong> / {excelTotalPages} (Tổng {excelRows.length} sinh viên)
                </span>
                <button
                  type="button"
                  className="page-btn"
                  disabled={safeExcelPage === excelTotalPages}
                  onClick={() => setExcelPage(p => Math.min(excelTotalPages, p + 1))}
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="card">
        <div className="card-header-row">
          <h3>Dữ liệu Học phí & Công nợ sinh viên</h3>
          <button className="btn-small" onClick={handleSyncTuition}>
            Đồng bộ & Quét nợ học phí
          </button>
        </div>

        {pagedHocPhi.length === 0 ? (
          <p className="empty-text">Chưa có dữ liệu học phí nào.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Sinh viên</th>
                  <th>Học kỳ</th>
                  <th>Phải đóng</th>
                  <th>Đã đóng</th>
                  <th>Hạn đóng</th>
                  <th>Trạng thái</th>
                  <th>Minh chứng & Xác nhận</th>
                </tr>
              </thead>
              <tbody>
                {pagedHocPhi.map(hp => (
                  <tr key={hp.MaHocPhi}>
                    <td>{hp.TenSV} ({hp.MaSV})</td>
                    <td>{hp.TenHocKy}</td>
                    <td>{hp.SoTienPhaiDong.toLocaleString()} đ</td>
                    <td>{hp.SoTienDaDong.toLocaleString()} đ</td>
                    <td>{new Date(hp.HanDong).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <span className={`badge ${
                        hp.TrangThaiHocPhi === 'Đã đóng đủ' ? 'badge-success' :
                        hp.TrangThaiHocPhi === 'Chờ duyệt minh chứng' ? 'badge-info' : 'badge-danger'
                      }`}>
                        {hp.TrangThaiHocPhi}
                      </span>
                    </td>
                    <td>
                      {hp.TrangThaiHocPhi === 'Chờ duyệt minh chứng' || hp.MinhChungDongTien ? (
                        <div className="fee-proof-actions">
                          {hp.GhiChuMinhChung && (
                            <span className="fee-proof-note">{hp.GhiChuMinhChung}</span>
                          )}
                          {hp.MinhChungDongTien && (
                            <button
                              type="button"
                              className="btn-small"
                              onClick={() =>
                                setPreviewProof({
                                  student: `${hp.TenSV} (${hp.MaSV})`,
                                  semester: hp.TenHocKy,
                                  note: hp.GhiChuMinhChung || '',
                                  fileData: hp.MinhChungDongTien
                                })
                              }
                            >
                              Xem minh chứng biên lai
                            </button>
                          )}
                          {hp.TrangThaiHocPhi === 'Chờ duyệt minh chứng' && (
                            <div className="fee-approve-row">
                              <button
                                type="button"
                                className="btn-small"
                                onClick={() => handleApproveFee(hp.MaHocPhi, true, 'dung_han')}
                              >
                                Đã đóng đủ
                              </button>
                              <button
                                type="button"
                                className="btn-bulk"
                                onClick={() => handleApproveFee(hp.MaHocPhi, true, 'tre_han')}
                              >
                                Đóng trễ hạn
                              </button>
                              <button
                                type="button"
                                className="btn-delete"
                                onClick={() => handleApproveFee(hp.MaHocPhi, false)}
                              >
                                Từ chối
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="fee-empty">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {feeTotalPages > 1 && (
              <div className="pagination-bar">
                <button
                  type="button"
                  className="page-btn"
                  disabled={safeFeePage === 1}
                  onClick={() => setFeePage(p => Math.max(1, p - 1))}
                >
                  ← Trước
                </button>
                <span className="page-info">
                  Trang <strong>{safeFeePage}</strong> / {feeTotalPages} (Tổng {hocPhiList.length} bản ghi)
                </span>
                <button
                  type="button"
                  className="page-btn"
                  disabled={safeFeePage === feeTotalPages}
                  onClick={() => setFeePage(p => Math.min(feeTotalPages, p + 1))}
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL XEM TRƯỚC ẢNH / PDF BIÊN LAI HỌC PHÍ */}
      {previewProof && (
        <div className="proof-modal-backdrop" onClick={() => setPreviewProof(null)}>
          <div className="proof-modal-card" onClick={e => e.stopPropagation()}>
            <div className="proof-modal-header">
              <div>
                <h3>Biên lai học phí — {previewProof.student}</h3>
                <p className="proof-modal-subtitle">
                  {previewProof.semester} {previewProof.note && `• ${previewProof.note}`}
                </p>
              </div>
              <button type="button" className="btn-delete" onClick={() => setPreviewProof(null)}>
                Đóng
              </button>
            </div>

            <div className="proof-modal-body">
              {previewProof.fileData?.startsWith('data:image/') ? (
                <img
                  src={previewProof.fileData}
                  alt="Biên lai đóng học phí"
                  className="proof-modal-image"
                />
              ) : previewProof.fileData?.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewProof.fileData}
                  title="Biên lai PDF"
                  className="proof-modal-pdf"
                />
              ) : (
                <p>Tệp đính kèm: <strong>{previewProof.fileData}</strong></p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}