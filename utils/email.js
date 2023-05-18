//https://mailtrap.io/
const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Vũ Lê Bảo Long <${process.env.EMAIL_FORM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Send grid
      return 1;
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async send(template, subject) {
    // 1) Render HTML từ một pug
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      //object này sẽ trunền vào template email pug
      {
        firstName: this.firstName,
        url: this.url,
        subject
      }
    );

    // 2) thiết lập các tùy chọn email
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.htmlToText(html)
    };

    //3 tạo transporter và gửi email
    const transporter = this.newTransport();
    await transporter.sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Chào mừng đến với Natours Family');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Mật khâu sẽ reset token (chỉ có hiệu lực trong 10 phút)'
    );
  }
};

// const sendEmail = async options => {
//   // 1) tạo transporter
//     const transporter = nodemailer.createTransport({
//       // service: 'Gmail',
//       host: process.env.EMAIL_HOST,
//       port: process.env.EMAIL_PORT,
//       auth: {
//         user: process.env.EMAIL_USERNAME,
//         password: process.env.EMAIL_PASSWORD
//       }
//     });
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD
//     }
//   });

//   // 2) thiết lập tùy chọn options
//   const mailOptions = {
//     from: `Vũ Lê Bảo Long <${process.env.EMAIL_FORM}>`,
//     to: options.email,
//     subject: options.subject,
//     text: options.message
//     // html:
//   };
//   // 3) gửi email
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
