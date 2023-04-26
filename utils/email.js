//https://mailtrap.io/
const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // 1) tạo transporter
  //   const transporter = nodemailer.createTransport({
  //     // service: 'Gmail',
  //     host: process.env.EMAIL_HOST,
  //     port: process.env.EMAIL_PORT,
  //     auth: {
  //       user: process.env.EMAIL_USERNAME,
  //       password: process.env.EMAIL_PASSWORD
  //     }
  //   });
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // 2) thiết lập tùy chọn options
  const mailOptions = {
    from: 'Vũ Lê Bảo Long <vulebaolong1@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // html:
  };

  // 3) gửi email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
