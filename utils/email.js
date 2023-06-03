// nodemailer for sending forgot password
const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

// const { options } = require('../routes/tourRoutes');
// const SMTPTransport = require('nodemailer/lib/smtp-transport');
// const xoauth2 = require('xoauth2');

// new Email(user, url).sendWelcome();

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Nitesh Kumar <${process.env.EMAIL_FROM}>`
  }

  newTransport() {
    if(process.env.NODE_ENV === 'production') {
      // Sendgrid if use refer the jonas video
      // return nodemailer.createTransport({
      //   service: 'SendGrid',
      //   auth: {
      //     user: process.env.EMAIL_USERNAME,
      //     pass: process.env.APP_PASSWORD,
      //   },
      // });
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.APP_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.APP_PASSWORD,
      },
    });
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(
      `${__dirname}/../views/email/${template}.pug`, 
      {
        firstName: this.firstName,
        url: this.url,
        subject
      }
    );

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html)
      // html: options.html,
    };

    // 3) Create a transport and send email
    
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('Welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes');
  };
}

// const sendEmail = async (options) => {
  // 1) Creater a transporter

  // here if we do by mailtrap then we will provide credentials of mail trap 
  // if by google then app password and gmail of that account on which we want to send the mail
  // const transporter = nodemailer.createTransport({
  //   service: 'gmail',
  //   auth: {
  //     user: process.env.EMAIL_USERNAME,
  //     pass: process.env.APP_PASSWORD,
  //   },
  // });
//   console.log(transporter);

  // 2) Define the email options
  // const mailOptions = {
  //   from: 'nkoder404@gmail.com',
  //   to: options.email,
  //   subject: options.subject,
  //   text: options.message,
  //   // html: options.html,
  // };

  // 3) Actually send the email

  // await transporter.sendMail(mailOptions);

// };

// module.exports = sendEmail;
