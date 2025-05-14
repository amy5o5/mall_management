const express = require('express');
const app = express();
const router = express.Router();
const connection = require('../../database/db_connect');
const { checkRoles } = require('./../../middlewares/check-actor');




// ---------------------------
//  ثبت نظر جدید - POST /comments
// ---------------------------
router.post('/', (req, res) => {
    const { shopId, commentText, rating } = req.body;
    //console.log(req.body.shopId);
  
    if (!shopId) {
      return res.status(400).json({ error: 'shopId نداری' });
    }
  
    if (!commentText) {
      return res.status(400).json({ error: 'متن نداری' });
    }
    const user = req.session.user; // فرض بر اینکه قبلاً لاگین شده
    if (!user) return res.status(401).json({ error: 'کاربر احراز هویت نشده است.' });

    const fullName = user.full_name;
    const userName = user.username;
  
    const sql = `
      INSERT INTO comments (shop_id, username, full_name, comment_text, rating)
      VALUES (?, ?, ?, ?, ?)
    `;
  
    // استفاده از callback برای اجرای کوئری
    connection.query(sql, [shopId, userName || null, fullName || null, commentText, rating || null], (err, result) => {
      if (err) {
        console.error('خطا در ثبت نظر:', err);
        return res.status(500).json({ error: 'مشکلی در ثبت نظر رخ داده است' });
      }
  
      res.status(201).json({ message: 'نظر با موفقیت ثبت شد' });
    });
  });
  


router.get('/comments', (req, res) => {
    const sql = 'SELECT * FROM comments';
  
    connection.query(sql, (err, results) => {
      if (err) {
        console.error('خطا در دریافت نظرات:', err);
        return res.status(500).json({ error: 'مشکلی در دریافت نظرات رخ داده است' });
      }
  
      // ارسال نتایج به صفحه commentBox
      res.render('/shop_keeper/partials/commentBox', {
        comments: results // ارسال داده‌ها به صفحه
      });
    });
    console.log(comments);
  });

  router.post('/delete-comment', checkRoles('shpk', 'admin'), (req, res) => {
    const { comment_id, shop_id } = req.body;
  console.log(req.body);
    if (!comment_id || !shop_id) {
      return res.status(400).send('شناسه ناقص است');
    }
  
    const deleteQuery = 'DELETE FROM comments WHERE comment_id = ? AND shop_id = ?';
  
    connection.query(deleteQuery, [comment_id, shop_id], (err, result) => {
      if (err) {
        console.error('خطا در حذف نظر:', err);
        return res.status(500).send('خطا در حذف نظر');
      }
  
      // پس از حذف، ریدایرکت به صفحه ویرایش مغازه با shop_id
      res.redirect(`/admin/manageShpks/edit-shop/${shop_id}`);
    });
  });
  
  

module.exports = router;
