const express = require('express');
const bcrypt = require('bcryptjs');
const connection = require('../../database/db_connect');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { checkRoles } = require('../../middlewares/check-actor');




async function getDailyVisits() {
  try {
    const query = `
      SELECT visit_date, SUM(visit_count) AS total_visits
      FROM Requests_Log
      GROUP BY visit_date
      ORDER BY visit_date DESC
    `;
    const [dailyVisits] = await connection.promise().query(query);
   
    return dailyVisits;
  } catch (error) {
    console.error('Error fetching daily visits:', error);
    throw new Error('خطا در دریافت اطلاعات بازدیدها.');
  }
}







router.post('/shpk-add', async (req, res) => {
  try {
   
    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const safeUsername = req.body.username.replace(/[^a-zA-Z0-9_-]/g, '');
        const shopFolder = `uploads/${safeUsername}`;
        fs.mkdirSync(shopFolder, { recursive: true });
        cb(null, shopFolder);
      },
      filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueName + path.extname(file.originalname));
      }
    });

    const upload = multer({
      storage,
      limits: { fileSize: 2 * 1024 * 1024, files: 5 } 
    }).array('shop_images', 5);

   
    upload(req, res, async (err) => {
      if (err) {
        console.error('Error uploading files:', err);
        return res.status(400).json({ message: 'خطا در آپلود فایل‌ها.' });
      }

      const {
        full_name, email, password, mobile, national_id, username,
        shop_name, website, working_hours, unit_number, description
      } = req.body;

     
      if (!full_name || !email || !password || !mobile || !username) {
        return res.status(400).json({ message: 'لطفاً تمام فیلدهای ضروری را پر کنید.' });
      }

     
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'ایمیل وارد شده معتبر نیست.' });
      }

     
      if (password.length < 8) {
        return res.status(400).json({ message: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' });
      }

      // هش کردن رمز عبور
      const hashedPassword = await bcrypt.hash(password, 10);

      // تنظیم مسیر فولدر
      let folder_path = null;
      if (req.files && req.files.length > 0) {
        const safeUsername = username.replace(/[^a-zA-Z0-9_-]/g, '');
        folder_path = `/uploads/${safeUsername}`;
      }

     
      const query = `
        INSERT INTO shpk (
          full_name, email, password, mobile, national_id, username,
          shop_name, website, working_hours, unit_number, images_path, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        full_name, email, hashedPassword, mobile, national_id, username,
        shop_name, website, working_hours, unit_number, folder_path, description
      ];

      connection.query(query, values, (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'خطا در ذخیره اطلاعات در دیتابیس.' });
        }

        res.status(201).json({
          message: 'فروشنده با مغازه‌اش ذخیره شد.',
          owner_id: results.insertId
        });
      });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'خطا در پردازش درخواست.', error: err });
  }
});





module.exports = {
  router,
  getDailyVisits
};