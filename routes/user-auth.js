const express = require('express');
const bcrypt = require('bcryptjs');
const connection = require('./../database/db_connect');
const router = express.Router();
const crypto = require("crypto");
const nodemailer = require('nodemailer');


router.post('/signup', async (req, res) => {
    const { full_name, national_id, mobile, email, username, password } = req.body;
    console.log(req.body);
    // بررسی اینکه آیا اطلاعات لازم ارسال شده است
    if (!full_name || !mobile || !email || !username || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        // بررسی اینکه آیا ایمیل، شماره موبایل یا نام کاربری قبلاً در سیستم ثبت شده است
        const checkExistingUserQuery = 'SELECT email, mobile, username FROM Users WHERE email = ? OR mobile = ? OR username = ?';
        const [existingUsers] = await connection.promise().query(checkExistingUserQuery, [email, mobile, username]);

        if (existingUsers.length > 0) {
            const existingUser = existingUsers[0];

            if (existingUser.email === email && existingUser.mobile === mobile && existingUser.username === username) {
                return res.status(400).json({ message: 'Email, mobile number, and username already exist' });
            } else if (existingUser.email === email && existingUser.mobile === mobile) {
                return res.status(400).json({ message: 'Email and mobile number already exist' });
            } else if (existingUser.email === email && existingUser.username === username) {
                return res.status(400).json({ message: 'Email and username already exist' });
            } else if (existingUser.mobile === mobile && existingUser.username === username) {
                return res.status(400).json({ message: 'Mobile number and username already exist' });
            } else if (existingUser.email === email) {
                return res.status(400).json({ message: 'Email already exists' });
            } else if (existingUser.mobile === mobile) {
                return res.status(400).json({ message: 'Mobile number already exists' });
            } else {
                return res.status(400).json({ message: 'Username already exists' });
            }
        }

        // هش کردن رمز عبور
        const hashedPassword = await bcrypt.hash(password, 10);

        // ذخیره کاربر در پایگاه داده
        const insertUserQuery = 'INSERT INTO Users (full_name, national_id, mobile, email, username, password) VALUES (?, ?, ?, ?, ?, ?)';
        await connection.promise().query(insertUserQuery, [full_name, national_id, mobile, email, username, hashedPassword]);

        res.status(201).json({ message: 'User registered successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



router.post('/login', (req, res) => {
    const { emailOrPhone, password } = req.body;

    // بررسی اینکه آیا ایمیل یا شماره تلفن و رمز عبور ارسال شده است
    if (!emailOrPhone || !password) {
        return res.status(400).json({ message: 'Please provide email/phone and password' });
    }

    // تشخیص اینکه ورودی ایمیل است یا شماره تلفن
    const query = emailOrPhone.includes('@') ? 
        'SELECT * FROM Users WHERE email = ?' : 
        'SELECT * FROM Users WHERE mobile = ?';

    // بررسی اینکه آیا کاربر در سیستم موجود است
    connection.query(query, [emailOrPhone], async (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }

        if (result.length === 0) {
            return res.status(400).json({ message: 'Invalid email/phone or password' });
        }

        const user = result[0];

        // مقایسه رمز عبور ورودی با رمز عبور ذخیره‌شده
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email/phone or password' });
        }

        req.session.user = {
            id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            role: user.role
        };

        res.json({ message: 'Login successful' });
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ message: 'Logout failed' });
        }

        // حذف کوکی سشن
        res.clearCookie('connect.sid');

        // هدایت به صفحه لاگین
        res.redirect('/login');
    });
});


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    }
});


router.post("/user-forgot-password", (req, res) => {
    const { emailOrPhone } = req.body;

    if (!emailOrPhone) {
        return res.status(400).json({ message: "Please provide email or phone number" });
    }

    connection.query(
        "SELECT email FROM Users WHERE email = ? OR mobile = ?",
        [emailOrPhone, emailOrPhone],
        (err, result) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ message: "Database error", error: err.sqlMessage });
            }

            if (result.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            const userEmail = result[0].email;
            const resetToken = crypto.randomBytes(32).toString("hex");

            connection.query(
                "UPDATE Users SET reset_token = ?, reset_token_expiry = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE email = ?",
                [resetToken, userEmail],
                (err) => {
                    if (err) {
                        console.error("Database Update Error:", err);
                        return res.status(500).json({ message: "Database error", error: err.sqlMessage });
                    }

                    const resetLink = `http://192.168.1.183:5000/user-reset-password/${resetToken}`;
                    const mailOptions = {
                        from: process.env.EMAIL_USER,
                        to: userEmail,
                        subject: "بازیابی رمز عبور",
                        text: `برای تغییر رمز عبور روی لینک زیر کلیک کنید:\n${resetLink}`
                    };

                    transporter.sendMail(mailOptions, (err, info) => {
                        if (err) {
                            console.error("Email Sending Error:", err);
                            return res.status(500).json({ message: "Failed to send email", error: err.message });
                        }

                        res.json({ message: "Password reset link sent to your email" });
                    });
                }
            );
        }
    );
});





router.post("/set-user-new-secPassword", async (req, res) => {
    const { token, password, confirm_password } = req.body;
    console.log(req.body);

    if (password !== confirm_password) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    try {
        // هش کردن رمز عبور جدید
        const hashedPassword = await bcrypt.hash(password, 10);

        // بررسی توکن و تنظیم رمز جدید
        connection.query(
            "SELECT email FROM Users WHERE reset_token = ? AND reset_token_expiry > NOW()",
            [token],
            (err, result) => {
                if (err) {
                    return res.status(500).json({ message: "Database error" });
                }

                if (result.length === 0) {
                    return res.status(400).json({ message: "Invalid or expired token" });
                }

                const userEmail = result[0].email;

                connection.query(
                    "UPDATE Users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE email = ?",
                    [hashedPassword, userEmail],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ message: "Database error" });
                        }

                        res.json({ message: "Password successfully reset" });
                    }
                );
            }
        );
    } catch (error) {
        return res.status(500).json({ message: "Error hashing password", error });
    }
});


module.exports = router;
