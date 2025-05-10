const express = require('express');
const bcrypt = require('bcryptjs');
const connection = require('../../database/db_connect');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { checkRoles } = require('../../middlewares/check-actor');






router.get('/add-shop', checkRoles('admin'), (req, res) => {
    res.render('admin/add-shop', {
        date: new Intl.DateTimeFormat('fa-IR').format(new Date()),
        time: new Date().toLocaleTimeString('fa-IR')
    });
});

router.post('/shpk-add', async (req, res) => {
  try {


    // تنظیمات Multer برای آپلود فایل‌ها
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
      limits: { fileSize: 2 * 1024 * 1024, files: 5 } // محدودیت حجم و تعداد فایل‌ها
    }).array('shop_images', 5);

    upload(req, res, async (err) => {
      if (err) {
        console.error('Error uploading files:', err);
        return res.status(400).json({ message: 'خطا در آپلود فایل‌ها.' });
      }

    
      const {
        full_name, email, password, mobile, national_id, username,
        shop_name, website, working_hours, unit_number, description, storeType
      } = req.body;

     
      if (!full_name || !email || !password || !mobile || !username || !storeType) {
        return res.status(400).json({ message: 'لطفاً تمام فیلدهای ضروری را پر کنید.' });
      }

     
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'ایمیل وارد شده معتبر نیست.' });
      }

     
      if (password.length < 8) {
        return res.status(400).json({ message: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' });
      }

     
      const hashedPassword = await bcrypt.hash(password, 10);

      
      let folder_path = null;
      if (req.files && req.files.length > 0) {
        const safeUsername = username.replace(/[^a-zA-Z0-9_-]/g, '');
        folder_path = `/uploads/${safeUsername}`;
      }


      const query = `
        INSERT INTO shpk (
          full_name, email, password, mobile, national_id, username,
          shop_name, website, working_hours, unit_number, images_path, description, storeType
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        full_name, email, hashedPassword, mobile, national_id, username,
        shop_name, website, working_hours, unit_number, folder_path, description, storeType
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


const upload = multer().none(); // برای پردازش داده‌های متنی
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

router.get('/shopsManagement', async (req, res) => {
  try {
    const query = `
      SELECT shop_id, shop_name, storeType, website, working_hours, unit_number, description, images_path
      FROM shpk
    `;

    connection.query(query, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('خطا در دریافت اطلاعات فروشگاه‌ها');
      }

      const shopsWithImages = results.map(shop => {
        let images = [];
      
        if (shop.images_path) {
          const shopImagesDir = path.join(__dirname, '../../uploads', shop.images_path.replace(/^\/uploads\//, ''));
          try {
            images = fs.readdirSync(shopImagesDir).map(file => `/uploads/${shop.images_path.replace(/^\/uploads\//, '')}/${file}`);
          } catch (error) {
            console.error(`Error reading images for shop ${shop.shop_name}:`, error);
          }
        } else {
          /*console.warn(`No images path found for shop ${shop.shop_name}`);*/
        }
      
        return { ...shop, images };
      });

      res.render('admin/shopsManagement', {
        title: 'مدیریت فروشگاه‌ها',
        shops: shopsWithImages,
        date: new Intl.DateTimeFormat('fa-IR').format(new Date()),
        time: new Date().toLocaleTimeString('fa-IR')
      });
    });
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).send('خطا در دریافت اطلاعات فروشگاه‌ها');
  }
});

router.get('/edit-shop/:shop_id', async (req, res) => {
  const shopId = req.params.shop_id;

  try {
    const query = `
      SELECT shop_id, full_name, email, mobile, national_id, username, shop_name, storeType, website, working_hours, unit_number, description, images_path
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

      // خواندن تصاویر از مسیر ذخیره‌شده
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
      
      res.render('admin/editShop', {
        date: new Intl.DateTimeFormat('fa-IR').format(new Date()),
        time: new Date().toLocaleTimeString('fa-IR'),
        shop,
        title: 'ویرایش مغازه'
      });
    });
  } catch (error) {
    console.error('Error fetching shop:', error);
    res.status(500).send('خطا در دریافت اطلاعات مغازه');
  }
});



router.delete('/delete-image', (req, res) => {
  const { imagePath } = req.body;
  c//onsole.log(imagePath);

  if (!imagePath) {
    return res.status(400).json({ message: 'مسیر تصویر ارسال نشده است.' });
  }

  // جلوگیری از دسترسی به مسیرهای غیرمجاز
  const uploadsDir = path.join(__dirname, '../../uploads');
  const absolutePath = path.join(__dirname, '../../', imagePath);

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

module.exports = router ;
