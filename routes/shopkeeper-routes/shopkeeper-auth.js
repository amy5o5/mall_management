const express = require('express');
const bcrypt = require('bcryptjs');
const connection = require('../../database/db_connect');
const router = express.Router();
const crypto = require("crypto");
const nodemailer = require('nodemailer');


/*router.post('/signup', async (req, res) => {
    const { full_name, national_id, mobile, email, username, password } = req.body;
    console.log(req.body);

    if (!full_name || !mobile || !email || !username || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        // بررسی اینکه آیا ایمیل، شماره موبایل یا نام کاربری قبلاً در سیستم ثبت شده است
        const checkExistingUserQuery = 'SELECT email, mobile, username FROM Shop_Owners WHERE email = ? OR mobile = ? OR username = ?';
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
        const insertUserQuery = 'INSERT INTO Shop_Owners (full_name, national_id, mobile, email, username, password) VALUES (?, ?, ?, ?, ?, ?)';
        await connection.promise().query(insertUserQuery, [full_name, national_id, mobile, email, username, hashedPassword]);

        res.status(201).json({ message: 'User registered successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});*/

router.post('/login', async (req, res) => {
    const { emailOrPhone, password } = req.body;


    if (!emailOrPhone || !password) {
        return res.status(400).json({ message: 'Please provide email/phone and password' });
    }

    //console.log('Received emailOrPhone:', emailOrPhone); 

    const query = emailOrPhone.includes('@') ? 
        'SELECT * FROM shpk WHERE LOWER(email) = LOWER(?)' : 
        'SELECT * FROM shpk WHERE mobile = ?';

    connection.query(query, [emailOrPhone], async (err, result) => {
        if (err) {
            //console.log('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (result.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = result[0];
        //console.log(user);

        try {
            const isMatch = await bcrypt.compare(password, user.password);
            //console.log('Password match:', isMatch); 
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }
        } catch (error) {
            //console.log('Error comparing passwords:', error);
            return res.status(500).json({ message: 'Error comparing passwords' });
        }

        req.session.user = {
            id: user.shop_id,
            full_name: user.full_name,
            email: user.email,
            role: user.role
        };
        console.log(req.session.user.id);

        req.session.cookie.httpOnly = true;
        req.session.cookie.secure = process.env.NODE_ENV === 'production';

        res.json({ message: 'Login successful' });
    });
});



router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ message: 'Logout failed' });
        }

        
        res.clearCookie('connect.sid');

       
        res.redirect('/');
    });
});


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    }
});


router.post("/shkeeper-forgot-password", (req, res) => {
    const { emailOrPhone } = req.body;
    //console.log(emailOrPhone);

    if (!emailOrPhone) {
        return res.status(400).json({ message: "Please provide email or phone number" });
    }

    connection.query(
        "SELECT email FROM shpk WHERE email = ? OR mobile = ?",
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
                "UPDATE Shop_Owners SET reset_token = ?, reset_token_expiry = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE email = ?",
                [resetToken, userEmail],
                (err) => {
                    if (err) {
                        console.error("Database Update Error:", err);
                        return res.status(500).json({ message: "Database error", error: err.sqlMessage });
                    }

                    const resetLink = `http://192.168.1.183:5000/shk/set-shkeeper-new-Password/${resetToken}`;
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





router.post("/set-shkeeper-new-Password", async (req, res) => {
    const { token, password, confirm_password } = req.body;
    //console.log(req.body);

    if (password !== confirm_password) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    try {
       
        const hashedPassword = await bcrypt.hash(password, 10);

      
        connection.query(
            "SELECT email FROM shpk WHERE reset_token = ? AND reset_token_expiry > NOW()",
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
                    "UPDATE shpk SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE email = ?",
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
