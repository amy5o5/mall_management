const express = require('express');
const router = express.Router();
const connection = require('../../database/db_connect'); 
const { checkRoles } = require('./../../middlewares/check-actor');
const { checkAuth } = require('../../middlewares/checkAuth');

router.get('/',checkRoles('user'), (req, res) => {

  if (req.session && req.session.user) {
      const user = req.session.user;
    //console.log(user);
 
      res.render('user/profile', { user });
  } else {
 
      res.redirect('/user/login');
  }
});
router.post('/update-profile', checkAuth ,(req, res) => {
  const { full_name, mobile, email, username, get_news } = req.body;
  
  const userId = req.session.user.user_id;

  if (!userId) {
    return res.status(401).json({ message: 'لطفاً وارد حساب کاربری خود شوید.' });
  }

  const updatedFields = {};

  if (full_name) updatedFields.full_name = full_name;
  if (mobile) updatedFields.mobile = mobile;
  if (email) updatedFields.email = email;
  if (username) updatedFields.username = username;
  updatedFields.get_news = get_news === 'on' ? 1 : 0;


  if (Object.keys(updatedFields).length === 0) {
    return res.status(400).json({ message: 'هیچ فیلدی برای بروزرسانی وارد نشده است.' });
  }

  const setQuery = Object.keys(updatedFields)
    .map((key) => `${key} = ?`)
    .join(', ');

  const queryParams = Object.values(updatedFields);

  connection.query(
    `UPDATE Users SET ${setQuery} WHERE user_id = ?`,
    [...queryParams, userId],
    (err, result) => {
      if (err) {
        console.error('Error updating profile:', err);
        return res.status(500).json({ message: 'خطا در بروزرسانی اطلاعات' });
      }


      const updatedUser = { ...req.session.user, ...updatedFields };
      req.session.user = updatedUser;


      return res.redirect('/user/profile');
    }
  );
});



module.exports = router;
