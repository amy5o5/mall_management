const dotenv = require('dotenv');
dotenv.config();

const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    }
});

// تعریف تابع ارسال ایمیل
const sendEmail = (to, subject, text, title) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: `${title} - ${subject}`, 
        text
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error("Email Sending Error:", err);
                reject(err);
            } else {
                resolve(info);
            }
        });
    });
};
// اکسپورت تابع sendEmail
module.exports = { sendEmail };