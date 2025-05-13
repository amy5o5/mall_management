const express = require('express');
const app = express();
const router = express.Router();
const { checkRoles } = require('./../../middlewares/check-actor');
const connection = require('./../../database/db_connect');
const shopkeeperAuth = require('./shopkeeper-auth');
const path = require('path');
const fs = require('fs');


router.use('/shopkeeperAuth', shopkeeperAuth);

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
  const shopId = req.session.user.id;

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
    console.log(shop);
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
    // اینجا می‌توانید اطلاعات صاحب مغازه را از همان جدول shpk بگیرید
    res.render('shop_keeper/shop_owner_profile', {
      seller: seller,
      currentUrl: req.originalUrl,
      user: req.session.user || null,
      date: new Intl.DateTimeFormat('fa-IR').format(new Date()),
      time: new Date().toLocaleTimeString('fa-IR'),
      shop,
      images,
      title: 'ویرایش مغازه'
    });
    console.log(images);
  });
  
});
router.post('/update-shop/:id', (req, res) => {
  const shopId = req.params.id;
  
  const {
    full_name,
    email,
    mobile,
    national_id,
    username,
    shop_name,
    storeType,
    website,
    working_hours,
    unit_number,
    description
  } = req.body;

  const sql = `
    UPDATE shpk
    SET full_name = ?, email = ?, mobile = ?, national_id = ?, username = ?,
        shop_name = ?, storeType = ?, website = ?, working_hours = ?, unit_number = ?, description = ?
    WHERE shop_id = ?
  `;

  const values = [
    full_name,
    email,
    mobile,
    national_id,
    username,
    shop_name,
    storeType,
    website,
    working_hours,
    unit_number,
    description,
    shopId
  ];

  connection.query(sql, values, (err, results) => {
    if (err) {
      console.error('خطا در آپدیت:', err);
      return res.status(500).json({ message: 'خطا در آپدیت اطلاعات فروشگاه.' });
    }

    res.json({ message: 'اطلاعات فروشگاه با موفقیت به‌روزرسانی شد.' });
  });
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

  // حذف فایل
  fs.unlink(absolutePath, (err) => {
    if (err) {
      console.error('Error deleting image:', err);
      return res.status(500).json({ message: 'خطا در حذف تصویر.' });
    }

    res.status(200).json({ message: 'تصویر با موفقیت حذف شد.' });
  });
});




module.exports = router;