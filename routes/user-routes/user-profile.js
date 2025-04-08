const connection = require('./../../database/db_connect');

// روت برای نمایش اطلاعات پروفایل
app.get('/user-profile', checkRoles('user', 'admin'), (req, res) => {
  const userId = req.session.user.id;  // شناسه کاربر از سشن

  const query = 'SELECT user_id, full_name, mobile, email, username, role FROM users WHERE user_id = ?';

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'خطا در بارگذاری اطلاعات' });
    }

    const user = results[0];
    res.render('profile', { user });
  });
});
