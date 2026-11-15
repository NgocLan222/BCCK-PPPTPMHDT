import { useState } from 'react';
import axios from 'axios';

export default function AdminChuanDauRaTab({ data, onReload }) {
  const [newMaLO, setNewMaLO] = useState('');
  const [newTenChuan, setNewTenChuan] = useState('');
  const [editingLO, setEditingLO] = useState(null);
  const [editTenChuan, setEditTenChuan] = useState('');

  const handleAddLO = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/admin/chuandaura', {
        maLO: newMaLO,
        tenChuan: newTenChuan
      });
      alert(res.data.message);
      setNewMaLO('');
      setNewTenChuan('');
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi thêm chuẩn đầu ra');
    }
  };

  const handleSaveEditLO = async (maLO) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/admin/chuandaura/${maLO}`, {
        tenChuan: editTenChuan
      });
      alert(res.data.message);
      setEditingLO(null);
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật chuẩn đầu ra');
    }
  };

  const handleDeleteLO = async (maLO) => {
    if (!window.confirm(`Xác nhận xóa chuẩn đầu ra "${maLO}" khỏi toàn bộ chương trình đào tạo?`)) return;
    try {
      const res = await axios.delete(`http://localhost:5000/api/admin/chuandaura/${maLO}`);
      alert(res.data.message);
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa chuẩn đầu ra');
    }
  };

  return (
    <div className="card">
      <h3>Danh mục Chuẩn đầu ra Chương trình đào tạo (LO)</h3>

      <form className="inline-form" onSubmit={handleAddLO}>
        <input
          type="text"
          placeholder="Mã chuẩn (VD: LO3_KyNangMem)"
          value={newMaLO}
          onChange={e => setNewMaLO(e.target.value)}
          required
        />
        <input
          type="text"
          className="flex-input"
          placeholder="Tên chuẩn năng lực (VD: Kỹ năng làm việc nhóm & thuyết trình)"
          value={newTenChuan}
          onChange={e => setNewTenChuan(e.target.value)}
          required
        />
        <button type="submit" className="btn-small">+ Thêm chuẩn đầu ra</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Mã chuẩn (LO)</th>
            <th>Tên chuẩn năng lực</th>
            <th>Trạng thái áp dụng</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {data.chuanDauRa.map(lo => (
            <tr key={lo.MaLO}>
              <td><strong>{lo.MaLO}</strong></td>
              <td>
                {editingLO === lo.MaLO ? (
                  <input
                    type="text"
                    className="table-input"
                    value={editTenChuan}
                    onChange={e => setEditTenChuan(e.target.value)}
                  />
                ) : (
                  lo.TenChuan
                )}
              </td>
              <td><span className="badge badge-success">Đang áp dụng</span></td>
              <td>
                {editingLO === lo.MaLO ? (
                  <>
                    <button className="btn-small" onClick={() => handleSaveEditLO(lo.MaLO)}>Lưu</button>
                    <button className="btn-delete" onClick={() => setEditingLO(null)}>Hủy</button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn-small"
                      onClick={() => { setEditingLO(lo.MaLO); setEditTenChuan(lo.TenChuan); }}
                    >
                      Sửa
                    </button>
                    <button className="btn-delete" onClick={() => handleDeleteLO(lo.MaLO)}>
                      Xóa
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}