-- ========================================================
-- KHỞI TẠO CƠ SỞ DỮ LIỆU QUẢN LÝ CẢNH BÁO HỌC VỤ
-- ========================================================
IF DB_ID(N'QuanLyCanhBaoHocVuDB') IS NULL
    CREATE DATABASE QuanLyCanhBaoHocVuDB;
GO

USE QuanLyCanhBaoHocVuDB;
GO

-- ========================================================
-- PHẦN 1: DỌN DẸP BẢNG CŨ (THEO THỨ TỰ KHÓA NGOẠI)
-- ========================================================
IF OBJECT_ID('dbo.NhiemVuCanThiep', 'U') IS NOT NULL DROP TABLE dbo.NhiemVuCanThiep;
IF OBJECT_ID('dbo.KeHoachCanThiep', 'U') IS NOT NULL DROP TABLE dbo.KeHoachCanThiep;
IF OBJECT_ID('dbo.PhanHoi', 'U') IS NOT NULL DROP TABLE dbo.PhanHoi;
IF OBJECT_ID('dbo.ChiTietBangChung', 'U') IS NOT NULL DROP TABLE dbo.ChiTietBangChung;
IF OBJECT_ID('dbo.CanhBao', 'U') IS NOT NULL DROP TABLE dbo.CanhBao;
IF OBJECT_ID('dbo.ChiTietChuanDauRa', 'U') IS NOT NULL DROP TABLE dbo.ChiTietChuanDauRa;
IF OBJECT_ID('dbo.ChuanDauRa', 'U') IS NOT NULL DROP TABLE dbo.ChuanDauRa;
IF OBJECT_ID('dbo.ThoiKhoaBieuLop', 'U') IS NOT NULL DROP TABLE dbo.ThoiKhoaBieuLop;
IF OBJECT_ID('dbo.MonHoc', 'U') IS NOT NULL DROP TABLE dbo.MonHoc;
IF OBJECT_ID('dbo.HocPhi', 'U') IS NOT NULL DROP TABLE dbo.HocPhi;
IF OBJECT_ID('dbo.KetQuaHocTap', 'U') IS NOT NULL DROP TABLE dbo.KetQuaHocTap;
IF OBJECT_ID('dbo.SinhVien', 'U') IS NOT NULL DROP TABLE dbo.SinhVien;
IF OBJECT_ID('dbo.LopSinhHoat', 'U') IS NOT NULL DROP TABLE dbo.LopSinhHoat;
IF OBJECT_ID('dbo.CoVanHocTap', 'U') IS NOT NULL DROP TABLE dbo.CoVanHocTap;
IF OBJECT_ID('dbo.HocKy', 'U') IS NOT NULL DROP TABLE dbo.HocKy;
IF OBJECT_ID('dbo.YeuCauDoiMatKhau', 'U') IS NOT NULL DROP TABLE dbo.YeuCauDoiMatKhau;
IF OBJECT_ID('dbo.TaiKhoan', 'U') IS NOT NULL DROP TABLE dbo.TaiKhoan;
GO

-- ========================================================
-- PHẦN 2: TẠO CẤU TRÚC CÁC BẢNG DỮ LIỆU
-- ========================================================

-- 1. Tài khoản hệ thống
CREATE TABLE dbo.TaiKhoan (
    TenDangNhap   NVARCHAR(50)  NOT NULL PRIMARY KEY,
    MatKhau       NVARCHAR(255) NOT NULL,
    VaiTro        NVARCHAR(30)  NOT NULL CHECK (VaiTro IN (N'Admin', N'CoVan', N'SinhVien')),
    TrangThai     BIT           NOT NULL DEFAULT 1,
    DaDoiMatKhau  BIT           NOT NULL DEFAULT 0,
    NgayTao       DATETIME      NOT NULL DEFAULT GETDATE()
);

-- 2. Yêu cầu cấp lại mật khẩu gửi Admin
CREATE TABLE dbo.YeuCauDoiMatKhau (
    MaYeuCau    INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    TenDangNhap NVARCHAR(50)      NOT NULL,
    LyDo        NVARCHAR(300)     NOT NULL,
    TrangThai   NVARCHAR(30)      NOT NULL DEFAULT N'Chờ xử lý'
                CHECK (TrangThai IN (N'Chờ xử lý', N'Đã mở khóa')),
    NgayGui     DATETIME          NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_YeuCauDMK_TaiKhoan FOREIGN KEY (TenDangNhap) REFERENCES dbo.TaiKhoan(TenDangNhap)
);

-- 3. Học kỳ
CREATE TABLE dbo.HocKy (
    MaHocKy      NVARCHAR(20) NOT NULL PRIMARY KEY,
    TenHocKy     NVARCHAR(50) NOT NULL,
    NamHoc       NVARCHAR(20) NOT NULL,
    NgayBatDau   DATE         NOT NULL,
    NgayKetThuc  DATE         NOT NULL,
    HocKyHienTai BIT          NOT NULL DEFAULT 0,
    CONSTRAINT CK_HocKy_Ngay CHECK (NgayKetThuc > NgayBatDau)
);

-- 4. Cố vấn học tập
CREATE TABLE dbo.CoVanHocTap (
    MaCV        NVARCHAR(20)  NOT NULL PRIMARY KEY,
    HoTen       NVARCHAR(100) NOT NULL,
    Email       NVARCHAR(100) NOT NULL UNIQUE,
    SoDienThoai NVARCHAR(20)  NULL,
    Khoa        NVARCHAR(100) NOT NULL,
    TenDangNhap NVARCHAR(50)  NULL,
    CONSTRAINT FK_CoVan_TaiKhoan FOREIGN KEY (TenDangNhap) REFERENCES dbo.TaiKhoan(TenDangNhap)
);

-- 5. Lớp sinh hoạt
CREATE TABLE dbo.LopSinhHoat (
    MaLop  NVARCHAR(20)  NOT NULL PRIMARY KEY,
    TenLop NVARCHAR(100) NOT NULL,
    MaCV   NVARCHAR(20)  NOT NULL,
    CONSTRAINT FK_Lop_CoVan FOREIGN KEY (MaCV) REFERENCES dbo.CoVanHocTap(MaCV)
);

-- 6. Sinh viên
CREATE TABLE dbo.SinhVien (
    MaSV        NVARCHAR(20)  NOT NULL PRIMARY KEY,
    HoTen       NVARCHAR(100) NOT NULL,
    NgaySinh    DATE          NOT NULL,
    Phai        NVARCHAR(10)  NOT NULL CHECK (Phai IN (N'Nam', N'Nữ')),
    Email       NVARCHAR(100) NOT NULL UNIQUE,
    SoDienThoai NVARCHAR(20)  NULL,
    MaLop       NVARCHAR(20)  NOT NULL,
    TenDangNhap NVARCHAR(50)  NULL,
    CONSTRAINT FK_SinhVien_Lop FOREIGN KEY (MaLop) REFERENCES dbo.LopSinhHoat(MaLop),
    CONSTRAINT FK_SinhVien_TaiKhoan FOREIGN KEY (TenDangNhap) REFERENCES dbo.TaiKhoan(TenDangNhap)
);

CREATE UNIQUE NONCLUSTERED INDEX UQ_CoVanHocTap_TenDangNhap
ON dbo.CoVanHocTap(TenDangNhap) WHERE TenDangNhap IS NOT NULL;

CREATE UNIQUE NONCLUSTERED INDEX UQ_SinhVien_TenDangNhap
ON dbo.SinhVien(TenDangNhap) WHERE TenDangNhap IS NOT NULL;

-- 7. Danh mục Môn học
CREATE TABLE dbo.MonHoc (
    MaMon    NVARCHAR(20)  NOT NULL PRIMARY KEY,
    TenMon   NVARCHAR(150) NOT NULL,
    SoTinChi INT           NOT NULL DEFAULT 3,
    MaLO     NVARCHAR(30)  NOT NULL DEFAULT N'LO1_LapTrinh'
);

-- 8. Thời khóa biểu & phân bổ môn học theo lớp
CREATE TABLE dbo.ThoiKhoaBieuLop (
    MaTKB        INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    MaLop        NVARCHAR(20)      NOT NULL FOREIGN KEY REFERENCES dbo.LopSinhHoat(MaLop) ON DELETE CASCADE,
    MaMon        NVARCHAR(20)      NOT NULL FOREIGN KEY REFERENCES dbo.MonHoc(MaMon) ON DELETE CASCADE,
    ThuTrongTuan NVARCHAR(20)      NOT NULL,
    TietHoc      NVARCHAR(30)      NOT NULL,
    PhongHoc     NVARCHAR(30)      NOT NULL,
    CONSTRAINT UQ_Lop_Mon UNIQUE (MaLop, MaMon)
);

-- 9. Kết quả học tập
CREATE TABLE dbo.KetQuaHocTap (
    MaKQ          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    MaSV          NVARCHAR(20)      NOT NULL,
    MaHocKy       NVARCHAR(20)      NOT NULL,
    DiemGPA       DECIMAL(3,2)      NOT NULL CHECK (DiemGPA >= 0.0 AND DiemGPA <= 4.0),
    TinChiTichLuy INT               NOT NULL CHECK (TinChiTichLuy >= 0),
    SoMonNo       INT               NOT NULL DEFAULT 0 CHECK (SoMonNo >= 0),
    CONSTRAINT FK_KQHT_SinhVien FOREIGN KEY (MaSV) REFERENCES dbo.SinhVien(MaSV),
    CONSTRAINT FK_KQHT_HocKy FOREIGN KEY (MaHocKy) REFERENCES dbo.HocKy(MaHocKy),
    CONSTRAINT UQ_KQHT_SV_HK UNIQUE (MaSV, MaHocKy)
);

-- 10. Học phí & minh chứng đóng tiền
CREATE TABLE dbo.HocPhi (
    MaHocPhi          NVARCHAR(30)  NOT NULL PRIMARY KEY,
    MaSV              NVARCHAR(20)  NOT NULL,
    MaHocKy           NVARCHAR(20)  NOT NULL,
    SoTienPhaiDong    DECIMAL(12,0) NOT NULL CHECK (SoTienPhaiDong >= 0),
    SoTienDaDong      DECIMAL(12,0) NOT NULL DEFAULT 0 CHECK (SoTienDaDong >= 0),
    HanDong           DATE          NOT NULL,
    NgayDongThucTe    DATE          NULL,
    TrangThaiHocPhi   NVARCHAR(30)  NOT NULL DEFAULT N'Còn nợ học phí'
                      CHECK (TrangThaiHocPhi IN (N'Đã đóng đủ', N'Đóng trễ hạn', N'Còn nợ học phí', N'Chờ duyệt minh chứng')),
    MinhChungDongTien NVARCHAR(MAX) NULL,
    GhiChuMinhChung   NVARCHAR(500) NULL,
    CONSTRAINT CK_HocPhi_Tien CHECK (SoTienDaDong <= SoTienPhaiDong),
    CONSTRAINT FK_HocPhi_SinhVien FOREIGN KEY (MaSV) REFERENCES dbo.SinhVien(MaSV),
    CONSTRAINT FK_HocPhi_HocKy FOREIGN KEY (MaHocKy) REFERENCES dbo.HocKy(MaHocKy),
    CONSTRAINT UQ_HocPhi_SV_HK UNIQUE (MaSV, MaHocKy)
);

-- 11. Chuẩn đầu ra tổng quan (LO)
CREATE TABLE dbo.ChuanDauRa (
    MaLO     NVARCHAR(30)  NOT NULL,
    MaSV     NVARCHAR(20)  NOT NULL,
    TenChuan NVARCHAR(100) NOT NULL,
    TyLeDat  DECIMAL(5,2)  NOT NULL CHECK (TyLeDat >= 0.0 AND TyLeDat <= 100.0),
    PRIMARY KEY (MaLO, MaSV),
    CONSTRAINT FK_CDR_SinhVien FOREIGN KEY (MaSV) REFERENCES dbo.SinhVien(MaSV)
);

-- 12. Chi tiết môn học / chứng chỉ theo chuẩn đầu ra
CREATE TABLE dbo.ChiTietChuanDauRa (
    MaChiTiet           INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    MaLO                NVARCHAR(30)      NOT NULL,
    MaSV                NVARCHAR(20)      NOT NULL,
    TenMonHocOrChungChi NVARCHAR(150)     NOT NULL,
    Loai                NVARCHAR(50)      NOT NULL CHECK (Loai IN (N'Môn học', N'Chứng chỉ')),
    DiemSo              DECIMAL(4,2)      NULL CHECK (DiemSo >= 0.0 AND DiemSo <= 10.0),
    TrangThaiDat        BIT               NOT NULL DEFAULT 0,
    TrangThaiDuyet      NVARCHAR(30)      NOT NULL DEFAULT N'Chờ duyệt',
    TepMinhChung        NVARCHAR(MAX)     NULL,
    TenTep              NVARCHAR(255)     NULL,
    GhiChuCoVan         NVARCHAR(300)     NULL,
    CONSTRAINT FK_CTCDR_ChuanDauRa FOREIGN KEY (MaLO, MaSV) REFERENCES dbo.ChuanDauRa(MaLO, MaSV)
);

-- 13. Phiếu cảnh báo học vụ
CREATE TABLE dbo.CanhBao (
    MaCanhBao     NVARCHAR(30)  NOT NULL PRIMARY KEY,
    MaSV          NVARCHAR(20)  NOT NULL,
    MaCV          NVARCHAR(20)  NOT NULL,
    MaHocKy       NVARCHAR(20)  NOT NULL,
    MucDoRuiRo    NVARCHAR(30)  NOT NULL CHECK (MucDoRuiRo IN (N'Cao', N'Trung bình', N'Thấp')),
    HuongDanHoTro NVARCHAR(500) NULL,
    TrangThai     NVARCHAR(30)  NOT NULL DEFAULT N'Bản nháp'
                  CHECK (TrangThai IN (N'Bản nháp', N'Chờ phản hồi', N'Đã phản hồi', N'Đã hủy', N'Cần can thiệp', N'Đang can thiệp')),
    NgayBanHanh   DATETIME      NULL,
    CONSTRAINT FK_CanhBao_SinhVien FOREIGN KEY (MaSV) REFERENCES dbo.SinhVien(MaSV),
    CONSTRAINT FK_CanhBao_CoVan FOREIGN KEY (MaCV) REFERENCES dbo.CoVanHocTap(MaCV),
    CONSTRAINT FK_CanhBao_HocKy FOREIGN KEY (MaHocKy) REFERENCES dbo.HocKy(MaHocKy)
);

-- 14. Chi tiết bằng chứng vi phạm
CREATE TABLE dbo.ChiTietBangChung (
    MaBangChung INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    MaCanhBao   NVARCHAR(30)      NOT NULL,
    LoaiViPham  NVARCHAR(100)     NOT NULL,
    SoBuoiVang  INT               NULL CHECK (SoBuoiVang >= 0),
    DiemLiet    DECIMAL(4,2)      NULL CHECK (DiemLiet >= 0.0 AND DiemLiet <= 10.0),
    ChiTiet     NVARCHAR(250)     NULL,
    CONSTRAINT FK_BangChung_CanhBao FOREIGN KEY (MaCanhBao) REFERENCES dbo.CanhBao(MaCanhBao)
);

-- 15. Phản hồi giải trình của sinh viên
CREATE TABLE dbo.PhanHoi (
    MaPhanHoi        NVARCHAR(30)  NOT NULL PRIMARY KEY,
    MaCanhBao        NVARCHAR(30)  NOT NULL UNIQUE,
    NoiDungGiaiTrinh NVARCHAR(500) NOT NULL,
    TepMinhChung     NVARCHAR(MAX) NOT NULL,
    TenTep           NVARCHAR(255) NULL,
    KetQuaDuyet      NVARCHAR(30)  NOT NULL DEFAULT N'Chờ duyệt'
                     CHECK (KetQuaDuyet IN (N'Chờ duyệt', N'Chấp thuận', N'Cần can thiệp')),
    YKienCoVan       NVARCHAR(500) NULL,
    NgayPhanHoi      DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_PhanHoi_CanhBao FOREIGN KEY (MaCanhBao) REFERENCES dbo.CanhBao(MaCanhBao)
);

-- 16. Kế hoạch can thiệp học tập
CREATE TABLE dbo.KeHoachCanThiep (
    MaKeHoach        NVARCHAR(30)  NOT NULL PRIMARY KEY,
    MaCanhBao        NVARCHAR(30)  NOT NULL UNIQUE,
    MucTieuTongThe   NVARCHAR(300) NOT NULL,
    TranTinChi       INT           NOT NULL DEFAULT 14 CHECK (TranTinChi > 0),
    TrangThai        NVARCHAR(30)  NOT NULL DEFAULT N'Đang can thiệp'
                     CHECK (TrangThai IN (N'Đang can thiệp', N'Hoàn thành', N'Không đạt')),
    NgayLap          DATE          NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    DanhGiaNghiemThu NVARCHAR(500) NULL,
    NgayNghiemThu    DATE          NULL,
    CONSTRAINT FK_KHCT_CanhBao FOREIGN KEY (MaCanhBao) REFERENCES dbo.CanhBao(MaCanhBao)
);

-- 17. Nhiệm vụ can thiệp chi tiết
CREATE TABLE dbo.NhiemVuCanThiep (
    MaNhiemVu          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    MaKeHoach          NVARCHAR(30)      NOT NULL,
    TenNhiemVu         NVARCHAR(200)     NOT NULL,
    HanChot            DATE              NOT NULL,
    TrangThaiHoanThanh BIT               NOT NULL DEFAULT 0,
    CONSTRAINT FK_NVCT_KeHoach FOREIGN KEY (MaKeHoach) REFERENCES dbo.KeHoachCanThiep(MaKeHoach)
);
GO

CREATE INDEX IX_SinhVien_Lop ON dbo.SinhVien(MaLop);
CREATE INDEX IX_HocPhi_SV_HK ON dbo.HocPhi(MaSV, MaHocKy);
CREATE INDEX IX_CanhBao_SV_HK ON dbo.CanhBao(MaSV, MaHocKy);
CREATE INDEX IX_NhiemVu_HanChot ON dbo.NhiemVuCanThiep(HanChot);
GO

-- ========================================================
-- PHẦN 3: DỮ LIỆU MẪU KHỞI TẠO CHUẨN
-- ========================================================
INSERT INTO dbo.TaiKhoan (TenDangNhap, MatKhau, VaiTro, TrangThai, DaDoiMatKhau) VALUES
(N'admin',      N'123456', N'Admin',    1, 1),
(N'tuantq',     N'123456', N'CoVan',    1, 0),
(N'mailt',      N'123456', N'CoVan',    1, 0),
(N'2100000001', N'123456', N'SinhVien', 1, 0),
(N'2100000002', N'123456', N'SinhVien', 1, 0);

INSERT INTO dbo.HocKy (MaHocKy, TenHocKy, NamHoc, NgayBatDau, NgayKetThuc, HocKyHienTai) VALUES
(N'HK1_2025', N'Học kỳ 1', N'2025-2026', '2025-09-01', '2026-01-15', 0),
(N'HK2_2025', N'Học kỳ 2', N'2025-2026', '2026-02-01', '2026-06-30', 1);

INSERT INTO dbo.CoVanHocTap (MaCV, HoTen, Email, SoDienThoai, Khoa, TenDangNhap) VALUES
(N'CV001', N'TS. Trần Quốc Tuấn', N'tuantq@hcmue.edu.vn', N'0908123456', N'Công nghệ Thông tin', N'tuantq'),
(N'CV002', N'ThS. Lê Thị Mai',     N'mailt@hcmue.edu.vn',  N'0908654321', N'Công nghệ Thông tin', N'mailt');

INSERT INTO dbo.LopSinhHoat (MaLop, TenLop, MaCV) VALUES
(N'21CNTT01', N'Cử nhân CNTT Khóa 21 - Lớp 1', N'CV001'),
(N'21CNTT02', N'Cử nhân CNTT Khóa 21 - Lớp 2', N'CV002');

INSERT INTO dbo.SinhVien (MaSV, HoTen, NgaySinh, Phai, Email, SoDienThoai, MaLop, TenDangNhap) VALUES
(N'SV2101', N'Nguyễn Văn An', '2003-04-15', N'Nam', N'an.nv2101@student.edu.vn',   N'0912000001', N'21CNTT01', N'2100000001'),
(N'SV2102', N'Trần Thị Bích', '2003-09-20', N'Nữ',  N'bich.tt2102@student.edu.vn', N'0912000002', N'21CNTT01', N'2100000002');

INSERT INTO dbo.KetQuaHocTap (MaSV, MaHocKy, DiemGPA, TinChiTichLuy, SoMonNo) VALUES
(N'SV2101', N'HK1_2025', 1.85, 45, 2),
(N'SV2102', N'HK1_2025', 3.20, 60, 0);

INSERT INTO dbo.HocPhi (MaHocPhi, MaSV, MaHocKy, SoTienPhaiDong, SoTienDaDong, HanDong, NgayDongThucTe, TrangThaiHocPhi) VALUES
(N'HP_SV2101_HK1', N'SV2101', N'HK1_2025', 8500000, 4000000, '2025-10-15', NULL,         N'Còn nợ học phí'),
(N'HP_SV2102_HK1', N'SV2102', N'HK1_2025', 8500000, 8500000, '2025-10-15', '2025-10-10', N'Đã đóng đủ');

INSERT INTO dbo.ChuanDauRa (MaLO, MaSV, TenChuan, TyLeDat) VALUES
(N'LO1_LapTrinh', N'SV2101', N'Kỹ năng lập trình cơ sở', 65.50),
(N'LO2_NgoaiNgu', N'SV2101', N'Chuẩn tiếng Anh B1',      40.00);

-- Điểm môn học hệ thống mặc định là Đã duyệt (chỉ chứng chỉ SV tự gửi mới ở trạng thái Chờ duyệt)
INSERT INTO dbo.ChiTietChuanDauRa (MaLO, MaSV, TenMonHocOrChungChi, Loai, DiemSo, TrangThaiDat, TrangThaiDuyet) VALUES
(N'LO1_LapTrinh', N'SV2101', N'Nhập môn lập trình', N'Môn học', 8.5, 1, N'Đã duyệt'),
(N'LO1_LapTrinh', N'SV2101', N'Cơ sở dữ liệu',      N'Môn học', 3.0, 0, N'Đã duyệt');

INSERT INTO dbo.CanhBao (MaCanhBao, MaSV, MaCV, MaHocKy, MucDoRuiRo, HuongDanHoTro, TrangThai, NgayBanHanh) VALUES
(N'CB2026_001', N'SV2101', N'CV001', N'HK1_2025', N'Cao', N'Cần đăng ký phụ đạo CSDL, hoàn tất công nợ học phí và gặp CVHT định kỳ.', N'Chờ phản hồi', GETDATE());

INSERT INTO dbo.ChiTietBangChung (MaCanhBao, LoaiViPham, SoBuoiVang, DiemLiet, ChiTiet) VALUES
(N'CB2026_001', N'Nghỉ học quá số buổi quy định', 4,    NULL, N'Vắng 4 buổi môn Cơ sở dữ liệu'),
(N'CB2026_001', N'Điểm kiểm tra giữa kỳ thấp',    NULL, 2.50, N'Điểm GK môn CSDL đạt 2.5/10'),
(N'CB2026_001', N'Nợ học phí học kỳ',             NULL, NULL, N'Còn nợ 4.500.000đ học phí HK1, quá hạn đóng so với mốc 15/10/2025');

INSERT INTO dbo.MonHoc (MaMon, TenMon, SoTinChi, MaLO) VALUES
(N'MH01', N'Nhập môn lập trình',              3, N'LO1_LapTrinh'),
(N'MH02', N'Cấu trúc dữ liệu & Giải thuật',   4, N'LO1_LapTrinh'),
(N'MH03', N'Cơ sở dữ liệu',                   3, N'LO1_LapTrinh'),
(N'MH04', N'Lập trình hướng đối tượng (OOP)', 3, N'LO1_LapTrinh'),
(N'MH05', N'Mạng máy tính',                   3, N'LO1_LapTrinh'),
(N'MH06', N'Hệ điều hành',                    3, N'LO1_LapTrinh'),
(N'MH07', N'Công nghệ phần mềm',              3, N'LO1_LapTrinh'),
(N'MH08', N'Phát triển ứng dụng Web',         3, N'LO1_LapTrinh'),
(N'MH09', N'Trí tuệ nhân tạo cơ bản',         3, N'LO1_LapTrinh'),
(N'MH10', N'An toàn & Bảo mật thông tin',     3, N'LO1_LapTrinh'),
(N'MH11', N'Phân tích thiết kế hệ thống',     3, N'LO1_LapTrinh'),
(N'MH12', N'Lập trình thiết bị di động',      3, N'LO1_LapTrinh');
GO

-- Xếp TKB tự động mỗi lớp 7 môn khác nhau
INSERT INTO dbo.ThoiKhoaBieuLop (MaLop, MaMon, ThuTrongTuan, TietHoc, PhongHoc)
SELECT
    l.MaLop,
    m.MaMon,
    CASE m.RN % 5
        WHEN 1 THEN N'Thứ 2'
        WHEN 2 THEN N'Thứ 3'
        WHEN 3 THEN N'Thứ 4'
        WHEN 4 THEN N'Thứ 5'
        ELSE N'Thứ 6'
    END,
    CASE m.RN % 2 WHEN 1 THEN N'Tiết 1 - 3' ELSE N'Tiết 7 - 9' END,
    N'A' + CAST(100 + l.LopIdx * 10 + m.RN AS NVARCHAR(10))
FROM (
    SELECT MaLop, ROW_NUMBER() OVER (ORDER BY MaLop) AS LopIdx
    FROM dbo.LopSinhHoat
) l
CROSS APPLY (
    SELECT TOP 7
        MaMon,
        ROW_NUMBER() OVER (ORDER BY (CAST(RIGHT(MaMon, 2) AS INT) + l.LopIdx * 3) % 12) AS RN
    FROM dbo.MonHoc
    ORDER BY (CAST(RIGHT(MaMon, 2) AS INT) + l.LopIdx * 3) % 12
) m;
GO

