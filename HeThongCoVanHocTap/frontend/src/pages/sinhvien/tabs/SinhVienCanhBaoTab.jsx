import { useState } from 'react';
import axios from 'axios';

export default function SinhVienCanhBaoTab({ data, onReload }) {
  const [replyTargetCB, setReplyTargetCB] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyFile, setReplyFile] = useState('');
  const [replyFileName, setReplyFileName] = useState('');

  const handleSelectReplyFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setReplyFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setReplyFile(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyTargetCB) return;
    try {
      const res = await axios.post('http://localhost:5000/api/sinhvien/phanhoi', {
        maCanhBao: replyTargetCB,
        noiDungGiaiTrinh: replyContent,
        tepMinhChung: replyFile,
        tenTep: replyFileName || 'don_giai_trinh_minh_chung.pdf'
      });
      alert(res.data.message);
      setReplyTargetCB(null);
      setReplyContent('');
      setReplyFile('');
      setReplyFileName('');
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi gửi phản hồi giải trình');
    }
  };

  return (
    <div className="card">
      <h3>Phiếu cảnh báo học vụ & Giải trình</h3>
      {data.canhBao.length === 0 ? (
        <p className="empty-text">Hiện tại bạn không có cảnh báo học vụ nào.</p>
      ) : (
        data.canhBao.map(cb => (
          <div key={cb.MaCanhBao} className="warning-box">
            <div className="warning-header">
              <strong>Phiếu {cb.MaCanhBao} • Mức rủi ro: {cb.MucDoRuiRo}</strong>
              <span className="badge badge-warning">{cb.TrangThai}</span>
            </div>

            <p className="warning-guide">
              <strong>Hướng dẫn hỗ trợ từ Cố vấn ({cb.TenCoVan}):</strong> {cb.HuongDanHoTro}
            </p>

            <div className="warning-evidence">
              <strong>Căn cứ / Bằng chứng vi phạm trích xuất:</strong>
              <ul>
                {(data.bangChung || [])
                  .filter(bc => bc.MaCanhBao === cb.MaCanhBao)
                  .map(bc => (
                    <li key={bc.MaBangChung}><strong>{bc.LoaiViPham}:</strong> {bc.ChiTiet}</li>
                  ))}
              </ul>
            </div>

            {cb.MaPhanHoi ? (
              <div className="reply-summary">
                <div><strong>Giải trình đã gửi:</strong> {cb.NoiDungGiaiTrinh}</div>
                <div><strong>Kết quả xét duyệt:</strong> <span className="badge badge-info">{cb.KetQuaDuyet}</span></div>
                {cb.YKienCoVan && <div><strong>Ý kiến Cố vấn:</strong> {cb.YKienCoVan}</div>}
              </div>
            ) : (
              cb.TrangThai === 'Chờ phản hồi' && (
                <>
                  {replyTargetCB === cb.MaCanhBao ? (
                    <form onSubmit={handleSubmitReply} className="reply-form">
                      <textarea
                        rows="3"
                        className="reply-textarea"
                        placeholder="Nhập nội dung giải trình (VD: Đã nộp giấy nghỉ ốm, đang phúc khảo điểm, đã đóng học phí...)"
                        value={replyContent}
                        onChange={e => setReplyContent(e.target.value)}
                        required
                      />
                      <div className="reply-actions">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleSelectReplyFile}
                          required
                        />
                        <button type="submit" className="btn-small">Gửi giải trình & Minh chứng</button>
                        <button type="button" className="btn-delete" onClick={() => setReplyTargetCB(null)}>Hủy</button>
                      </div>
                    </form>
                  ) : (
                    <button className="btn-small" onClick={() => setReplyTargetCB(cb.MaCanhBao)}>
                      Gửi phản hồi / Minh chứng giải trình
                    </button>
                  )}
                </>
              )
            )}
          </div>
        ))
      )}
    </div>
  );
}