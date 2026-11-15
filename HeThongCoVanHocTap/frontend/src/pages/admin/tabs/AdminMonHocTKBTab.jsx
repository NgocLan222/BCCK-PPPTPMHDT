import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminMonHocTKBTab({ lopList, chuanDauRaList, monHocList, tkbList, onReload }) {
  const [selectedLopTKB, setSelectedLopTKB] = useState('');
  const [editingMon, setEditingMon] = useState(null);
  const [monForm, setMonForm] = useState({ maMon: '', tenMon: '', soTinChi: 3, maLO: 'LO1_LapTrinh' });
  const [tkbForm, setTkbForm] = useState({ maMon: '', thuTrongTuan: 'Thứ 2', tietHoc: 'Tiết 1 - 3', phongHoc: 'A101' });

  useEffect(() => {
    if (!selectedLopTKB && lopList.length > 0) {
      setSelectedLopTKB(lopList[0].MaLop);
    }
  }, [lopList, selectedLopTKB]);

  const handleSaveMonHoc = async (e) => {
    e.preventDefault();
    try {
      if (editingMon) {
        await axios.put(`http://localhost:5000/api/admin/monhoc/${editingMon.MaMon}`, {
          ...monForm,
          oldTenMon: editingMon.TenMon
        });
        alert('Đã cập nhật môn học!');
      } else {
        await axios.post('http://localhost:5000/api/admin/monhoc', monForm);
        alert('Đã thêm môn học mới!');
      }
      setEditingMon(null);
      setMonForm({ maMon: '', tenMon: '', soTinChi: 3, maLO: 'LO1_LapTrinh' });
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi lưu môn học');
    }
  };

  const handleDeleteMonHoc = async (maMon) => {
    if (!window.confirm(`Xóa môn học ${maMon} sẽ gỡ môn này khỏi tất cả TKB và bảng điểm. Tiếp tục?`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/monhoc/${maMon}`);
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi xóa môn học');
    }
  };

  const handleAssignTKB = async (e) => {
    e.preventDefault();
    if (!selectedLopTKB || !tkbForm.maMon) return alert('Vui lòng chọn lớp và môn học!');
    try {
      const res = await axios.post('http://localhost:5000/api/admin/tkb', {
        maLop: selectedLopTKB,
        ...tkbForm
      });
      alert(res.data.message);
      setTkbForm({ ...tkbForm, maMon: '' });
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi xếp TKB');
    }
  };

  const handleRemoveTKB = async (maTKB) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/tkb/${maTKB}`);
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi gỡ môn khỏi TKB');
    }
  };

  return (
    <>
      <div className="card">
        <h3>A. Danh mục Môn học toàn trường ({monHocList.length} môn)</h3>
        <form onSubmit={handleSaveMonHoc} className="inline-form">
          <input
            type="text"
            placeholder="Mã môn (VD: MH13)"
            value={monForm.maMon}
            disabled={!!editingMon}
            onChange={e => setMonForm({ ...monForm, maMon: e.target.value })}
            required
          />
          <input
            type="text"
            className="flex-input"
            placeholder="Tên môn học..."
            value={monForm.tenMon}
            onChange={e => setMonForm({ ...monForm, tenMon: e.target.value })}
            required
          />
          <input
            type="number"
            min="1"
            max="10"
            placeholder="Số tín chỉ"
            value={monForm.soTinChi}
            onChange={e => setMonForm({ ...monForm, soTinChi: e.target.value })}
            required
          />
          <select value={monForm.maLO} onChange={e => setMonForm({ ...monForm, maLO: e.target.value })}>
            {chuanDauRaList.length > 0 ? (
              chuanDauRaList.map(lo => (
                <option key={lo.MaLO} value={lo.MaLO}>{lo.MaLO}</option>
              ))
            ) : (
              <>
                <option value="LO1_LapTrinh">LO1_LapTrinh</option>
                <option value="LO2_NgoaiNgu">LO2_NgoaiNgu</option>
              </>
            )}
          </select>
          <button type="submit" className="btn-small">
            {editingMon ? 'Lưu cập nhật' : '+ Thêm môn học'}
          </button>
          {editingMon && (
            <button
              type="button"
              className="btn-delete"
              onClick={() => {
                setEditingMon(null);
                setMonForm({ maMon: '', tenMon: '', soTinChi: 3, maLO: 'LO1_LapTrinh' });
              }}
            >
              Hủy sửa
            </button>
          )}
        </form>

        <table>
          <thead>
            <tr>
              <th>Mã môn</th>
              <th>Tên môn học</th>
              <th>Số tín chỉ</th>
              <th>Chuẩn đầu ra</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {monHocList.map(mh => (
              <tr key={mh.MaMon}>
                <td><strong>{mh.MaMon}</strong></td>
                <td>{mh.TenMon}</td>
                <td>{mh.SoTinChi} TC</td>
                <td><span className="badge badge-info">{mh.MaLO}</span></td>
                <td>
                  <button
                    type="button"
                    className="btn-small"
                    onClick={() => {
                      setEditingMon(mh);
                      setMonForm({
                        maMon: mh.MaMon,
                        tenMon: mh.TenMon,
                        soTinChi: mh.SoTinChi,
                        maLO: mh.MaLO
                      });
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => handleDeleteMonHoc(mh.MaMon)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>B. Xếp Thời khóa biểu & Phân bổ môn học theo Lớp</h3>
        <form onSubmit={handleAssignTKB} className="inline-form">
          <select value={selectedLopTKB} onChange={e => setSelectedLopTKB(e.target.value)}>
            {lopList.map(l => (
              <option key={l.MaLop} value={l.MaLop}>
                Lớp {l.MaLop} — {l.TenLop}
              </option>
            ))}
          </select>

          <select
            value={tkbForm.maMon}
            onChange={e => setTkbForm({ ...tkbForm, maMon: e.target.value })}
            required
          >
            <option value="">-- Chọn môn học xếp cho lớp --</option>
            {monHocList
              .filter(mh => !tkbList.some(t => t.MaLop === selectedLopTKB && t.MaMon === mh.MaMon))
              .map(mh => (
                <option key={mh.MaMon} value={mh.MaMon}>
                  {mh.MaMon} — {mh.TenMon} ({mh.SoTinChi} TC)
                </option>
              ))}
          </select>

          <select value={tkbForm.thuTrongTuan} onChange={e => setTkbForm({ ...tkbForm, thuTrongTuan: e.target.value })}>
            <option value="Thứ 2">Thứ 2</option>
            <option value="Thứ 3">Thứ 3</option>
            <option value="Thứ 4">Thứ 4</option>
            <option value="Thứ 5">Thứ 5</option>
            <option value="Thứ 6">Thứ 6</option>
            <option value="Thứ 7">Thứ 7</option>
          </select>

          <input
            type="text"
            placeholder="Tiết học (VD: Tiết 1 - 3)"
            value={tkbForm.tietHoc}
            onChange={e => setTkbForm({ ...tkbForm, tietHoc: e.target.value })}
            required
          />

          <input
            type="text"
            placeholder="Phòng (VD: A102)"
            value={tkbForm.phongHoc}
            onChange={e => setTkbForm({ ...tkbForm, phongHoc: e.target.value })}
            required
          />

          <button type="submit" className="btn-small">+ Xếp vào TKB lớp</button>
        </form>

        <table>
          <thead>
            <tr>
              <th>Lớp</th>
              <th>Mã môn</th>
              <th>Tên môn học</th>
              <th>Tín chỉ</th>
              <th>Lịch học</th>
              <th>Phòng</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {tkbList
              .filter(t => !selectedLopTKB || t.MaLop === selectedLopTKB)
              .map(t => (
                <tr key={t.MaTKB}>
                  <td><strong>{t.MaLop}</strong></td>
                  <td>{t.MaMon}</td>
                  <td><strong>{t.TenMon}</strong></td>
                  <td>{t.SoTinChi} TC</td>
                  <td>{t.ThuTrongTuan} ({t.TietHoc})</td>
                  <td>{t.PhongHoc}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => handleRemoveTKB(t.MaTKB)}
                    >
                      Gỡ khỏi lớp
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}