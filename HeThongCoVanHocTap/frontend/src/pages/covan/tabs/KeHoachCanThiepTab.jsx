import { useState } from 'react';
import axios from 'axios';

// Lấy chuỗi ngày YYYY-MM-DD theo thời gian thực địa phương (cộng thêm offsetDays ngày)
const getLocalDateString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createDefaultTasks = () => [
  {
    tenNhiemVu: 'Tham gia lớp phụ đạo & ôn tập kiến thức nền tảng',
    hanChot: getLocalDateString(14)
  },
  {
    tenNhiemVu: 'Gặp Cố vấn học tập báo cáo tiến độ định kỳ',
    hanChot: getLocalDateString(30)
  }
];

export default function KeHoachCanThiepTab({ data, onReload }) {
  const today = getLocalDateString(0);

  const [planMaCB, setPlanMaCB] = useState('');
  const [mucTieuTongThe, setMucTieuTongThe] = useState('');
  const [tranTinChi, setTranTinChi] = useState(14);
  const [tasks, setTasks] = useState(createDefaultTasks);
  const [evalNotes, setEvalNotes] = useState({});

  const eligibleWarningsForPlan = data.canhBao.filter(
    cb => ['Cần can thiệp', 'Chờ phản hồi', 'Đã phản hồi'].includes(cb.TrangThai)
  );

  const handleAddTaskRow = () => {
    if (tasks.length >= 3) {
      alert('Mỗi kế hoạch can thiệp chỉ nên thiết lập tối đa 3 mốc nhiệm vụ trọng tâm!');
      return;
    }
    setTasks([...tasks, { tenNhiemVu: '', hanChot: getLocalDateString(21) }]);
  };

  const handleRemoveTaskRow = (indexToRemove) => {
    if (tasks.length <= 1) return;
    setTasks(tasks.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();

    const hasPastDate = tasks.some(t => !t.hanChot || t.hanChot < today);
    if (hasPastDate) {
      alert('Hạn chót của các mốc nhiệm vụ phải từ ngày hôm nay trở đi!');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/covan/kehoach', {
        maCanhBao: planMaCB,
        mucTieuTongThe,
        tranTinChi: Number(tranTinChi),
        danhSachNhiemVu: tasks
      });
      alert(res.data.message);
      setPlanMaCB('');
      setMucTieuTongThe('');
      setTasks(createDefaultTasks());
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi lập kế hoạch can thiệp');
    }
  };

  const handleToggleAdvisorTask = async (maNhiemVu) => {
    try {
      await axios.put(`http://localhost:5000/api/covan/nhiemvu/${maNhiemVu}/toggle`);
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể cập nhật mốc nhiệm vụ');
    }
  };

  const handleEvaluatePlan = async (kh, ketQuaNghiemThu) => {
    const danhGiaNghiemThu = evalNotes[kh.MaKeHoach] || (
      ketQuaNghiemThu === 'Hoàn thành'
        ? 'Sinh viên hoàn thành tốt các mốc nhiệm vụ can thiệp, đủ điều kiện gỡ cảnh báo.'
        : 'Sinh viên chưa hoàn thành cam kết can thiệp, đề nghị chuyển xử lý học vụ.'
    );
    if (!window.confirm(`Xác nhận nghiệm thu kế hoạch ${kh.MaKeHoach} với kết quả: "${ketQuaNghiemThu}"?`)) return;

    try {
      const res = await axios.put(`http://localhost:5000/api/covan/kehoach/${kh.MaKeHoach}/nghiemthu`, {
        maCanhBao: kh.MaCanhBao,
        ketQuaNghiemThu,
        danhGiaNghiemThu
      });
      alert(res.data.message);
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi nghiệm thu kế hoạch can thiệp');
    }
  };

  return (
    <>
      {/* PHẦN A: LẬP KẾ HOẠCH CAN THIỆP */}
      <div className="card">
        <h3>Lập Kế hoạch can thiệp học tập mới</h3>
        <form onSubmit={handleCreatePlan}>
          <div className="inline-form">
            <select value={planMaCB} onChange={e => setPlanMaCB(e.target.value)} required>
              <option value="">-- Chọn phiếu cảnh báo cần can thiệp --</option>
              {eligibleWarningsForPlan.map(cb => (
                <option key={cb.MaCanhBao} value={cb.MaCanhBao}>
                  {cb.MaCanhBao} - {cb.TenSV} ({cb.MaSV}) [{cb.TrangThai}]
                </option>
              ))}
            </select>

            <input
              type="text"
              className="goal-input"
              placeholder="Mục tiêu cải thiện tổng thể (VD: Đạt GPA >= 2.2, trả nợ 2 môn)"
              value={mucTieuTongThe}
              onChange={e => setMucTieuTongThe(e.target.value)}
              required
            />

            <input
              type="number"
              className="credit-cap-input"
              min="6"
              max="24"
              value={tranTinChi}
              onChange={e => setTranTinChi(e.target.value)}
              title="Trần tín chỉ an toàn kỳ tới"
              required
            />
          </div>

          <div className="task-builder-section">
            <div className="task-builder-header">
              <strong>Danh sách mốc nhiệm vụ bổ trợ (1–3 mốc):</strong>
              <button type="button" className="btn-small" onClick={handleAddTaskRow}>+ Thêm mốc nhiệm vụ</button>
            </div>

            {tasks.map((t, idx) => (
              <div key={idx} className="inline-form task-builder-row">
                <input
                  type="text"
                  className="flex-1"
                  placeholder={`Nhiệm vụ ${idx + 1}`}
                  value={t.tenNhiemVu}
                  onChange={e => {
                    const copy = [...tasks];
                    copy[idx].tenNhiemVu = e.target.value;
                    setTasks(copy);
                  }}
                  required
                />
                <span className="task-deadline" style={{ whiteSpace: 'nowrap' }}>Hạn chót:</span>
                <input
                  type="date"
                  min={today}
                  value={t.hanChot}
                  title="Hạn chót hoàn thành mốc nhiệm vụ (từ hôm nay trở đi)"
                  onChange={e => {
                    const copy = [...tasks];
                    copy[idx].hanChot = e.target.value;
                    setTasks(copy);
                  }}
                  required
                />
                {tasks.length > 1 && (
                  <button
                    type="button"
                    className="btn-delete no-margin-left"
                    onClick={() => handleRemoveTaskRow(idx)}
                  >
                    Xóa
                  </button>
                )}
              </div>
            ))}
          </div>

          <button type="submit" className="btn-primary submit-fixed-btn">
            Ban hành kế hoạch can thiệp
          </button>
        </form>
      </div>

      {/* PHẦN B: ĐÁNH GIÁ & NGHIỆM THU CAN THIỆP */}
      <div className="card">
        <h3>Theo dõi tiến độ, Đánh giá & Nghiệm thu kế hoạch can thiệp</h3>
        {data.keHoach.length === 0 ? (
          <p className="empty-text">Chưa có kế hoạch can thiệp nào được lập.</p>
        ) : (
          data.keHoach.map(kh => {
            const khTasks = data.nhiemVu.filter(nv => nv.MaKeHoach === kh.MaKeHoach);
            const doneCount = khTasks.filter(nv => nv.TrangThaiHoanThanh).length;
            const percent = khTasks.length > 0 ? Math.round((doneCount / khTasks.length) * 100) : 0;
            const isOpen = kh.TrangThai === 'Đang can thiệp';
            const isAllTasksDone = khTasks.length > 0 && doneCount === khTasks.length;

            return (
              <div key={kh.MaKeHoach} className="review-card">
                <div className="review-card-header">
                  <strong>{kh.MaKeHoach} — {kh.TenSV} ({kh.MaSV})</strong>
                  <span className={`badge ${
                    kh.TrangThai === 'Hoàn thành' ? 'badge-success' :
                    kh.TrangThai === 'Không đạt' ? 'badge-danger' : 'badge-info'
                  }`}>
                    {kh.TrangThai}
                  </span>
                </div>

                <p className="review-card-meta">
                  <strong>Mục tiêu:</strong> {kh.MucTieuTongThe} • <strong>Trần tín chỉ:</strong> {kh.TranTinChi} TC
                </p>

                <div className="review-card-progress">
                  Tiến độ hoàn thành các mốc: <strong>{doneCount}/{khTasks.length} nhiệm vụ ({percent}%)</strong>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${percent}%` }} />
                  </div>

                  <div className="advisor-task-list">
                    {khTasks.map(nv => (
                      <label key={nv.MaNhiemVu} className={`advisor-task-row ${!isOpen ? 'locked' : ''}`}>
                        <span>
                          <input
                            type="checkbox"
                            checked={!!nv.TrangThaiHoanThanh}
                            disabled={!isOpen}
                            onChange={() => handleToggleAdvisorTask(nv.MaNhiemVu)}
                          />
                          <span className={nv.TrangThaiHoanThanh ? 'task-done-text' : ''}>
                            {nv.TenNhiemVu}
                          </span>
                        </span>
                        <span className="task-deadline">
                          Hạn: {new Date(nv.HanChot).toLocaleDateString('vi-VN')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {isOpen ? (
                  <div className="review-card-actions">
                    <input
                      type="text"
                      className="eval-note-input"
                      placeholder="Nhập nhận xét đánh giá nghiệm thu cuối kỳ..."
                      value={evalNotes[kh.MaKeHoach] || ''}
                      onChange={e => setEvalNotes({ ...evalNotes, [kh.MaKeHoach]: e.target.value })}
                    />
                    <div className="eval-btn-group">
                      <button
                        type="button"
                        className="btn-small"
                        disabled={!isAllTasksDone}
                        title={!isAllTasksDone ? 'Phải hoàn thành đủ 100% các mốc nhiệm vụ mới được nghiệm thu Hoàn thành' : ''}
                        onClick={() => handleEvaluatePlan(kh, 'Hoàn thành')}
                      >
                        Nghiệm thu: Hoàn thành (Gỡ cảnh báo)
                      </button>
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => handleEvaluatePlan(kh, 'Không đạt')}
                      >
                        Đánh giá: Không đạt
                      </button>
                    </div>
                    {!isAllTasksDone && (
                      <p className="eval-hint">
                        * Cần tick xác nhận hoàn thành đủ {khTasks.length}/{khTasks.length} mốc nhiệm vụ trước khi nghiệm thu Hoàn thành.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="review-card-result">
                    <strong>Kết luận nghiệm thu:</strong> {kh.DanhGiaNghiemThu || 'Đã hoàn tất đánh giá.'}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}