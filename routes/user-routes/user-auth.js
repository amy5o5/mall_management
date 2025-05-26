const express = require('express');
const bcrypt = require('bcryptjs');
const connection = require('./../../database/db_connect');
const router = express.Router();
const crypto = require("crypto");

const { sendEmail } = require('./../../utils/mailer');



router.post('/signup', async (req, res) => {
    let { full_name, mobile, email, username, password } = req.body;
    let get_news = req.body.get_news === 'on' ? 1 : 0;
    


    
    //console.log(req.body);
    //console.log(get_news);

    
    if (!full_name || !mobile || !email || !username || !password) {
        return res.status(400).json({ message: 'لطفاً تمامی فیلدها را پر کنید' });
    }

    try {
        // بررسی اینکه آیا ایمیل، شماره موبایل یا نام کاربری قبلاً در سیستم ثبت شده است
        const checkExistingUserQuery = `
            SELECT email, mobile, username
            FROM Users
            WHERE email = ? OR mobile = ? OR username = ?
        `;
        const [existingUsers] = await connection.promise().query(checkExistingUserQuery, [email, mobile, username]);

        if (existingUsers.length > 0) {
            const existingUser = existingUsers[0];

            // بررسی اینکه هر کدام از فیلدها قبلاً ثبت شده‌اند یا نه
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'این ایمیل قبلاً ثبت شده است' });
            } 
            if (existingUser.mobile === mobile) {
                return res.status(400).json({ message: 'این شماره موبایل قبلاً ثبت شده است' });
            }
            if (existingUser.username === username) {
                return res.status(400).json({ message: 'این نام کاربری قبلاً ثبت شده است' });
            }
        }

        // هش کردن رمز عبور
        const hashedPassword = await bcrypt.hash(password, 10);

        // مقدار پیش‌فرض role را به 'user' تنظیم می‌کنیم
        const role = 'user'; // مقدار پیش‌فرض

        // ذخیره کاربر در پایگاه داده
        const insertUserQuery = `
            INSERT INTO Users (full_name, mobile, email, username, password, role, get_news)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.promise().query(insertUserQuery, [full_name, mobile, email, username, hashedPassword, role, get_news]);

        res.status(201).json({ message: 'ثبت‌نام با موفقیت انجام شد' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطای داخلی سرور' });
    }
});




router.post('/login', (req, res) => {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
        return res.status(400).json({ message: 'Please provide email/phone and password' });
    }

    const query = emailOrPhone.includes('@') ? 
        'SELECT * FROM Users WHERE email = ?' : 
        'SELECT * FROM Users WHERE mobile = ?';

    connection.query(query, [emailOrPhone], async (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (result.length === 0) {
            return res.status(400).json({ message: 'Invalid email/phone or password' });
        }

        const user = result[0];
        //console.log(user);
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email/phone or password' });
        }

        req.session.user = {
            user_id: user.user_id,
            full_name: user.full_name,
            mobile: user.mobile,
            email: user.email,
            username: user.username,
            role: user.role
        };
        // if (user.role === 'user') {
        //     req.session.cookie.maxAge = 1000 * 30 * 60;
        // } 
        //console.log('Session after login:', req.session); 
        // console.log(user.role);

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
        res.redirect('/');
    });
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

                    const resetLink = `http://192.168.225.155:5000/user/user-reset-password/${resetToken}`;
                    const subject = "بازیابی رمز عبور";
                    const text = `برای تغییر رمز عبور روی لینک زیر کلیک کنید:\n${resetLink}`;

                    sendEmail(userEmail, subject, text)
                        .then(() => {
                            res.json({ message: "Password reset link sent to your email" });
                        })
                        .catch((err) => {
                            console.error("Email Sending Error:", err);
                            res.status(500).json({ message: "Failed to send email", error: err.message });
                        });
                }
            );
        }
    );
});





router.post("/set-user-new-Password", async (req, res) => {
    const { token, password, confirm_password } = req.body;
    //console.log(req.body);

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
