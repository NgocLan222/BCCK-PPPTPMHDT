const nodemailer = require('nodemailer');

const SMTP_USER = 'aotieu1@gmail.com';
const SMTP_PASS = 'json mfso cmga stsg'; 

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
    }
});

const sendResetPasswordEmail = async ({ toEmail, hoTen, tenDangNhap, matKhauMoi }) => {
    const mailOptions = {
        from: `"Hệ thống Cố vấn Học tập" <${SMTP_USER}>`,
        to: toEmail,
        subject: '[Thông báo] Cấp lại mật khẩu đăng nhập tài khoản',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
                <h3>Xin chào ${hoTen || tenDangNhap},</h3>
                <p>Quản trị viên đã phê duyệt yêu cầu cấp lại mật khẩu cho tài khoản của bạn.</p>
                <div style="background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 14px 18px; border-radius: 8px; margin: 14px 0;">
                    <p style="margin: 4px 0;"><strong>Tên đăng nhập:</strong> ${tenDangNhap}</p>
                    <p style="margin: 4px 0;"><strong>Mật khẩu mới được cấp:</strong> <span style="font-size: 18px; color: #dc2626; font-weight: bold;">${matKhauMoi}</span></p>
                </div>
                <p><strong>Lưu ý:</strong> Mật khẩu cũ đã hết hiệu lực. Vui lòng dùng mật khẩu mới này để đăng nhập lại vào hệ thống (bạn có 24 giờ để đổi sang mật khẩu cá nhân).</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { sent: true, note: `Đã gửi email thật chứa mật khẩu mới và thông báo tới ${toEmail}!` };
    } catch (err) {
        console.error('Lỗi gửi Gmail:', err.message);
        return { sent: false, note: `Lỗi gửi mail (${err.message})` };
    }
};

module.exports = { sendResetPasswordEmail };