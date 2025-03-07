require('dotenv').config(); // بارگذاری متغیرهای محیطی از فایل .env
const mysql = require('mysql2');

// اتصال به پایگاه داده
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',  // استفاده از utf8mb4 برای پشتیبانی از کاراکترهای خاص
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Failed to connect to database:', err);
        return;
    }
    console.log('✅ Connected to database successfully');
});

module.exports = connection;
