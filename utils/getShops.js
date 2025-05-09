const path = require('path');
const fs = require('fs');
const connection = require('../database/db_connect');

async function getShops() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT shop_id, shop_name, storeType, website, working_hours, unit_number, description, images_path
      FROM shpk
    `;

    connection.query(query, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return reject('خطا در دریافت اطلاعات فروشگاه‌ها');
      }

      // مسیر اصلی پروژه
      const uploadsDir = path.join(process.cwd(), 'uploads');

      const shopsWithImages = results.map(shop => {
        let images = [];

        if (shop.images_path) {
          const shopImagesDir = path.join(uploadsDir, shop.images_path.replace(/^\/uploads\//, ''));
          try {
            if (fs.existsSync(shopImagesDir)) {
              images = fs.readdirSync(shopImagesDir).map(file => `/uploads/${shop.images_path.replace(/^\/uploads\//, '')}/${file}`);
            } else {
              console.error(`Directory does not exist for shop ${shop.shop_name}: ${shopImagesDir}`);
            }
          } catch (error) {
            console.error(`Error reading images for shop ${shop.shop_name}:`, error);
          }
        }

        return { ...shop, images };
      });

      resolve(shopsWithImages);
    });
  });
}

module.exports = { getShops };