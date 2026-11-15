import axios from 'axios';

export default function AdminPhanCongTab({ data, onReload }) {
  const handleChangeAdvisor = async (maLopTarget, maCV) => {
    await axios.put(`http://localhost:5000/api/admin/lop/${maLopTarget}/phancong`, { maCV });
    onReload();
  };

  return (
    <div className="card">
      <h3>Phân công Cố vấn học tập theo Lớp sinh hoạt</h3>
      <table>
        <thead>
          <tr>
            <th>Mã lớp</th>
            <th>Tên lớp sinh hoạt</th>
            <th>Cố vấn hiện tại</th>
            <th>Thay đổi phân công</th>
          </tr>
        </thead>
        <tbody>
          {data.lop.map(l => (
            <tr key={l.MaLop}>
              <td><strong>{l.MaLop}</strong></td>
              <td>{l.TenLop}</td>
              <td>{l.TenCV} ({l.MaCV})</td>
              <td>
                <select
                  className="table-select"
                  value={l.MaCV}
                  onChange={e => handleChangeAdvisor(l.MaLop, e.target.value)}
                >
                  {data.coVan.map(cv => (
                    <option key={cv.MaCV} value={cv.MaCV}>
                      {cv.HoTen} ({cv.MaCV})
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}