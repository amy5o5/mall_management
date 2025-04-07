const express = require('express');
const bcrypt = require('bcryptjs');
const connection = require('./../database/db_connect');
const router = express.Router();
const crypto = require("crypto");
const nodemailer = require('nodemailer');



router.post('/signup', async (req, res) => {
    const { full_name, email, username,mobile , password } = req.body;
    //console.log(req.body);
   
    if (!full_name || !mobile || !email || !username || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
      
        const checkExistingUserQuery = 'SELECT email, mobile, username FROM Admins WHERE email = ? OR mobile = ? OR username = ?';
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

        
        const hashedPassword = await bcrypt.hash(password, 10);

      
        const insertUserQuery = 'INSERT INTO Admins (full_name, email, username,mobile , password ) VALUES (?, ?, ?, ?,?)';
        await connection.promise().query(insertUserQuery, [full_name, email, username, mobile, hashedPassword]);

        res.status(201).json({ message: 'User registered successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.post('/login', (req, res) => {
    const { emailOrusername, password } = req.body;
    console.log(req.body);

    
    if (!emailOrusername || !password) {
        return res.status(400).json({ message: 'Please provide email/username and password' });
    }

   
    const query = "SELECT * FROM Admins WHERE email = ? OR username = ?";
    
   
    connection.query(query, [emailOrusername, emailOrusername], async (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }

        if (result.length === 0) {
            return res.status(400).json({ message: 'Invalid email/username or password' });
        }

        const user = result[0];

   
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email/username or password' });
        }

  
        req.session.user = {
            id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            role: user.role // مثلاً 'admin' یا 'user'
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

      
        res.clearCookie('connect.sid');

       
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

router.post("/admin-forgot-password", (req, res) => {
    const { emailOrusername } = req.body;

    if (!emailOrusername) {
        return res.status(400).json({ message: "Please provide email or username" });
    }

    connection.query(
        "SELECT email FROM Admins WHERE email = ? OR username = ?",
        [emailOrusername, emailOrusername], // اینجا مقدار صحیح ارسال می‌شود
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
                "UPDATE Admins SET reset_token = ?, reset_token_expiry = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE email = ? OR username = ?",
                [resetToken, emailOrusername, emailOrusername],
                (err) => {
                    if (err) {
                        console.error("Database Update Error:", err);
                        return res.status(500).json({ message: "Database error", error: err.sqlMessage });
                    }

                    if (!userEmail) {
                        return res.json({ message: "Reset token generated but no email found. Contact support." });
                    }

                    const resetLink = `http://192.168.1.183:5000/admin-reset-password/${resetToken}`;
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




router.post("/set-admin-new-Password", async (req, res) => {
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
