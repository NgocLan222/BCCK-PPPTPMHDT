import { useState } from 'react';

export default function AdminQuyTacTab() {
  const [rules, setRules] = useState({ minGPA: 2.0, maxAbsent: 20, maxTuitionLateDays: 15 });

  return (
    <div className="card">
      <h3>Cấu hình ngưỡng kích hoạt cảnh báo học vụ</h3>
      <div className="rule-grid">
        <div className="rule-item">
          <label>Điểm GPA tối thiểu (Thang 4.0)</label>
          <input
            type="number"
            step="0.1"
            value={rules.minGPA}
            onChange={e => setRules({ ...rules, minGPA: e.target.value })}
          />
        </div>
        <div className="rule-item">
          <label>Tỷ lệ vắng học tối đa (%)</label>
          <input
            type="number"
            value={rules.maxAbsent}
            onChange={e => setRules({ ...rules, maxAbsent: e.target.value })}
          />
        </div>
        <div className="rule-item">
          <label>Số ngày trễ học phí tối đa (Ngày)</label>
          <input
            type="number"
            value={rules.maxTuitionLateDays}
            onChange={e => setRules({ ...rules, maxTuitionLateDays: e.target.value })}
          />
        </div>
      </div>
      <button
        className="btn-primary save-rule-btn"
        onClick={() => alert('Đã lưu cấu hình quy tắc cảnh báo mới!')}
      >
        Lưu cấu hình
      </button>
    </div>
  );
}