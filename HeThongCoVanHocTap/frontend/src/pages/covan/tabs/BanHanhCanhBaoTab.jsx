import { useEffect, useState } from 'react';
import axios from 'axios';

export default function BanHanhCanhBaoTab({ user, data, initialMaSV, onClearInitialSV, onReload }) {
  const [selectedSVForCB, setSelectedSVForCB] = useState('');
  const [extractedEvidences, setExtractedEvidences] = useState([]);
  const [mucDoRuiRo, setMucDoRuiRo] = useState('Trung bình');
  const [huongDanHoTro, setHuongDanHoTro] = useState('');

  const handleExtractEvidence = async (maSVTarget) => {
    const target = maSVTarget || selectedSVForCB;
    if (!target) {
      alert('Vui lòng chọn sinh viên cần rà soát trước!');
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/covan/sinhvien/${target}/trichxuat-bangchung`);
      setExtractedEvidences(res.data.evidences || []);
      setMucDoRuiRo(res.data.mucDoDeXuat || 'Trung bình');
      setHuongDanHoTro(
        'Sinh viên cần khẩn trương rà soát lại các bằng chứng vi phạm đính kèm, hoàn tất nghĩa vụ học phí/học phần và gửi phản hồi giải trình trong vòng 7 ngày.'
      );
    } catch (err) {
      alert('Không trích xuất được bằng chứng: ' + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    if (initialMaSV) {
      setSelectedSVForCB(initialMaSV);
      handleExtractEvidence(initialMaSV);
      onClearInitialSV();
    }
  }, [initialMaSV]);

  const handleIssueCanhBao = async (e) => {
    e.preventDefault();
    if (!selectedSVForCB) return;
    try {
      const res = await axios.post('http://localhost:5000/api/covan/canhbao', {
        maSV: selectedSVForCB,
        maCV: user.MaCV,
        mucDoRuiRo,
        huongDanHoTro,
        danhSachBangChung: extractedEvidences
      });
      alert(res.data.message);
      setSelectedSVForCB('');
      setExtractedEvidences([]);
      setHuongDanHoTro('');
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi ban hành cảnh báo');
    }
  };

  const handlePublishDraft = async (cb) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/covan/canhbao/${cb.MaCanhBao}/banhanh`, {
        huongDanHoTro: cb.HuongDanHoTro || 'Cần liên hệ cố vấn học tập để được hỗ trợ.'
      });
      alert(res.data.message);
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi ban hành phiếu nháp');
    }
  };

  return (
    <>
      <div className="card">
        <h3>Rà soát hồ sơ & Ban hành cảnh báo học vụ mới</h3>
        <form onSubmit={handleIssueCanhBao}>
          <div className="inline-form">
            <select
              value={selectedSVForCB}
              onChange={e => { setSelectedSVForCB(e.target.value); setExtractedEvidences([]); }}
              required
            >
              <option value="">-- Chọn sinh viên cần rà soát --</option>
              {data.sinhVien.map(sv => (
                <option key={sv.MaSV} value={sv.MaSV}>
                  {sv.MaSV} - {sv.HoTen} (Lớp {sv.MaLop})
                </option>
              ))}
            </select>

            <button type="button" className="btn-bulk" onClick={() => handleExtractEvidence()}>
              Trích xuất bằng chứng tự động
            </button>

            <select value={mucDoRuiRo} onChange={e => setMucDoRuiRo(e.target.value)}>
              <option value="Thấp">Mức rủi ro: Thấp</option>
              <option value="Trung bình">Mức rủi ro: Trung bình</option>
              <option value="Cao">Mức rủi ro: Cao</option>
            </select>
          </div>

          {extractedEvidences.length > 0 && (
            <div className="evidence-extract-box">
              <h4 className="evidence-extract-title">
                Bằng chứng vi phạm trích xuất tự động từ CSDL ({extractedEvidences.length} căn cứ):
              </h4>
              {extractedEvidences.map((ev, idx) => (
                <div key={idx} className="evidence-item">
                  <strong>{ev.loaiViPham}:</strong> {ev.chiTiet}
                </div>
              ))}
            </div>
          )}

          <div className="form-group">
            <label>Hướng dẫn hỗ trợ / Lời khuyên từ Cố vấn học tập:</label>
            <textarea
              rows="3"
              placeholder="Nhập hướng dẫn cải thiện học tập, lịch hẹn tư vấn..."
              value={huongDanHoTro}
              onChange={e => setHuongDanHoTro(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary submit-fixed-btn">
            Ban hành phiếu cảnh báo
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Danh sách phiếu cảnh báo đã lập & Đề xuất nháp</h3>
        <table>
          <thead>
            <tr>
              <th>Mã CB</th>
              <th>Sinh viên</th>
              <th>Mức rủi ro</th>
              <th>Bằng chứng đính kèm</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.canhBao.map(cb => (
              <tr key={cb.MaCanhBao}>
                <td><strong>{cb.MaCanhBao}</strong></td>
                <td>{cb.TenSV} ({cb.MaSV})</td>
                <td><span className="badge badge-danger">{cb.MucDoRuiRo}</span></td>
                <td>
                  <ul className="evidence-table-list">
                    {data.bangChung
                      .filter(bc => bc.MaCanhBao === cb.MaCanhBao)
                      .map(bc => (
                        <li key={bc.MaBangChung}><strong>{bc.LoaiViPham}:</strong> {bc.ChiTiet}</li>
                      ))}
                  </ul>
                </td>
                <td><span className="badge badge-warning">{cb.TrangThai}</span></td>
                <td>
                  {cb.TrangThai === 'Bản nháp' ? (
                    <button className="btn-small" onClick={() => handlePublishDraft(cb)}>
                      Ban hành chính thức
                    </button>
                  ) : (
                    <span className="processed-text">Đã phát hành</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}