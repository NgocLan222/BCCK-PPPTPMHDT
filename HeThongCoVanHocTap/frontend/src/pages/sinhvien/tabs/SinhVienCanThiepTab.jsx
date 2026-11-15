export default function SinhVienCanThiepTab({ data }) {
  return (
    <div className="card">
      <h3>Lộ trình & Kế hoạch can thiệp học tập</h3>
      {data.keHoach.length === 0 ? (
        <p className="empty-text">Bạn chưa có kế hoạch can thiệp học tập nào.</p>
      ) : (
        data.keHoach.map(kh => {
          const myTasks = (data.nhiemVu || []).filter(nv => nv.MaKeHoach === kh.MaKeHoach);
          return (
            <div key={kh.MaKeHoach} className="lo-box">
              <div className="plan-header">
                <strong>{kh.MaKeHoach} — Mục tiêu: {kh.MucTieuTongThe}</strong>
                <span className={`badge ${
                  kh.TrangThai === 'Hoàn thành' ? 'badge-success' :
                  kh.TrangThai === 'Không đạt' ? 'badge-danger' : 'badge-info'
                }`}>
                  {kh.TrangThai}
                </span>
              </div>
              <p className="plan-meta">
                Trần tín chỉ an toàn kỳ tới: <strong>{kh.TranTinChi} tín chỉ</strong>
              </p>

              {myTasks.map(nv => (
                <div key={nv.MaNhiemVu} className="task-row readonly">
                  <span>
                    <input
                      type="checkbox"
                      checked={!!nv.TrangThaiHoanThanh}
                      disabled
                      readOnly
                    />
                    <span className={nv.TrangThaiHoanThanh ? 'task-done' : ''}>
                      {nv.TenNhiemVu}
                    </span>
                  </span>
                  <span className="task-date">
                    {nv.TrangThaiHoanThanh ? 'Đã đạt' : 'Chưa đạt'} • Hạn: {new Date(nv.HanChot).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              ))}

              {kh.DanhGiaNghiemThu && (
                <p className="plan-result">
                  <strong>Kết luận nghiệm thu của Cố vấn:</strong> {kh.DanhGiaNghiemThu}
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}