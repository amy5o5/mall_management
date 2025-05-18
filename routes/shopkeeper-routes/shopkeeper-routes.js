const express = require('express');
const app = express();
const router = express.Router();
const { checkRoles } = require('./../../middlewares/check-actor');
const connection = require('./../../database/db_connect');
const shopkeeperAuth = require('./shopkeeper-auth');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const upload = multer().none(); 
const comment = require('./../shopkeeper-routes/comment');
const moment = require('moment-jalaali');

function toPersianNumber(number) {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return number.toString().replace(/\d/g, (digit) => persianNumbers[digit]);
}

router.use('/shopkeeperAuth', shopkeeperAuth);

router.use('/hndlComment', comment);

router.get("/login", (req, res) => {
  res.render("shop_keeper/shopkeeper-login");
});


router.get('/shkeeper-forgot-password', (req, res) => {
  res.render('shop_keeper/shkeeper-forgot-password');
});

router.get("/set-shkeeper-new-Password/:token", (req, res) => {
  const { token } = req.params;
  res.render("shop_keeper/shkeeper-reset-password", { token, errorMessage: null });
});

router.get("/edit-shop", async (req, res) => {

  const shopId = req.session.user.id; // تعریف درست

  const sql = 'SELECT * FROM comments WHERE shop_id = ?';
  connection.query(sql, [shopId], (err, comments) => {
    if (err) {
      console.error('خطا در دریافت نظرات:', err);
      return res.status(500).send("مشکلی در دریافت نظرات رخ داده است");
    }

    // فرمت کردن تاریخ و ساعت به تاریخ هجری شمسی و تبدیل اعداد به فارسی
    comments.forEach(comment => {
      const date = moment(comment.created_at).format('jYYYY-jMM-jDD HH:mm:ss'); // تبدیل به تاریخ شمسی
      comment.created_at = toPersianNumber(date); // تبدیل اعداد به فارسی
    });

    // بقیه کدها باید داخل این callback منتقل بشن، چون async هست
    const query = `
      SELECT shop_id, full_name, email, mobile, national_id, username,
            shop_name, storeType, website, working_hours, unit_number,
            description, images_path
      FROM shpk
      WHERE shop_id = ?
    `;

    connection.query(query, [shopId], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('خطا در دریافت اطلاعات مغازه');
      }

      if (results.length === 0) {
        return res.status(404).send('مغازه‌ای با این شناسه یافت نشد');
      }

      const shop = results[0];
      const images = [];

      if (shop.images_path) {
        const imagesDir = path.join(__dirname, '../../uploads', shop.images_path.replace(/^\/uploads\//, ''));
        try {
          const files = fs.readdirSync(imagesDir);
          files.forEach(file => {
            images.push(`/uploads/${shop.images_path.replace(/^\/uploads\//, '')}/${file}`);
          });
        } catch (error) {
          console.error('Error reading images:', error);
        }
      }

      shop.images = images;

      let seller = null;
      if (req.session.user && req.session.user.role === 'shpk') {
          seller = req.session.user;
      }

      res.render('shop_keeper/shop_owner_profile', {
        currentUrl: req.originalUrl,
        seller: req.session.user?.role === 'shpk' ? req.session.user : null,
        isUser: req.session.user?.role === 'user',
        date: new Intl.DateTimeFormat('fa-IR').format(new Date()),
        time: new Date().toLocaleTimeString('fa-IR'),
        shop,
        images,
        title: 'ویرایش مغازه',
        comments
      });
    });
  });
});

router.post('/update-shop/:shop_id', upload, async (req, res) => {
  const shopId = req.params.shop_id;

  // console.log('Request Body:', req.body); // بررسی داده‌های ارسال‌شده
  // console.log('Shop ID:', shopId); // بررسی شناسه مغازه

  try {
    // بررسی اینکه آیا shopId ارسال شده است
    if (!shopId) {
      return res.status(400).json({ message: 'شناسه مغازه ارسال نشده است.' });
    }

    // فیلدهای مجاز برای به‌روزرسانی
    const allowedFields = [
      'full_name', 'email', 'mobile', 'national_id', 'username',
      'shop_name', 'storeType', 'website', 'working_hours', 'unit_number', 'description'
    ];

    // ساخت کوئری داینامیک
    let query = 'UPDATE shpk SET ';
    const updates = [];
    const values = [];

    allowedFields.forEach(field => {
      if (req.body[field]) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    });

    // اگر هیچ فیلدی ارسال نشده باشد
    if (updates.length === 0) {
      return res.status(400).json({ message: 'هیچ فیلدی برای به‌روزرسانی ارسال نشده است.' });
    }

    // تکمیل کوئری
    query += updates.join(', ') + ' WHERE shop_id = ?';
    values.push(shopId);

    // اجرای کوئری
    connection.query(query, values, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'خطا در به‌روزرسانی اطلاعات در دیتابیس.' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'مغازه‌ای با این شناسه یافت نشد.' });
      }

      res.status(200).json({ message: 'اطلاعات مغازه با موفقیت به‌روزرسانی شد.' });
    });
  } catch (error) {
    console.error('Error updating shop:', error);
    res.status(500).json({ message: 'خطا در پردازش درخواست.', error });
  }
});



router.delete('/delete-image', checkRoles('shpk'), (req, res) => {
  const { images_path } = req.body;

  if (!images_path) {
    return res.status(400).json({ message: 'مسیر تصویر ارسال نشده است.' });
  }

  // مسیر مطلق به دایرکتوری uploads
  const uploadsDir = path.resolve(__dirname, '../../uploads');

  // حذف /uploads از مسیر و ساخت مسیر کامل
  const relativeImagePath = images_path.replace(/^\/uploads\//, '');
  const absolutePath = path.resolve(uploadsDir, relativeImagePath);

  // جلوگیری از حذف خارج از پوشه uploads
  if (!absolutePath.startsWith(uploadsDir)) {
    return res.status(403).json({ message: 'دسترسی غیرمجاز به فایل.' });
  }


  fs.unlink(absolutePath, (err) => {
    if (err) {
      console.error('Error deleting image:', err);
      return res.status(500).json({ message: 'خطا در حذف تصویر.' });
    }

    res.status(200).json({ message: 'تصویر با موفقیت حذف شد.' });
  });
});


router.post('/upload-shop-images/:username', (req, res) => {
  const username = req.params.username;
  const safeUsername = username.replace(/[^a-zA-Z0-9_-]/g, '');

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '../../uploads', safeUsername);
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueName + path.extname(file.originalname));
    }
  });

  const upload = multer({ storage }).array('shop_images', 5);

  upload(req, res, (err) => {
    if (err) return res.status(400).json({ message: 'خطا در آپلود فایل' });

    const imagePath = `/uploads/${safeUsername}`;

    // به‌روزرسانی مسیر در دیتابیس
    const sql = 'UPDATE shpk SET images_path = ? WHERE username = ?';
    connection.query(sql, [imagePath, username], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'خطا در به‌روزرسانی مسیر تصاویر.' });
      }
      res.json({ message: 'تصاویر با موفقیت آپلود و ثبت شدند.' });
    });
  });
});


module.exports = router;