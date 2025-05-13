const express = require('express');
const app = express();
const router = express.Router();
const connection = require('../../database/db_connect');





// ---------------------------
//  ثبت نظر جدید - POST /comments
// ---------------------------
router.post('/', (req, res) => {
    const { shopId, userName, fullName, commentText, rating } = req.body;
    console.log(req.body.shopId);
  
    if (!shopId) {
      return res.status(400).json({ error: 'shopId نداری' });
    }
  
    if (!commentText) {
      return res.status(400).json({ error: 'متن نداری' });
    }
  
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
  
module.exports = router;
