const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
app.use(express.json());


require("dotenv").config();
app.set("view engine", "ejs");

app.use(cookieParser()); // قرار دادن cookie-parser قبل از middleware‌های دیگر
app.use(express.static("public"));
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);  // اینجا مقداردهی اولیه کن

const connection = require('./database/db_connect');

// تعریف استور برای ذخیره سشن در دیتابیس
const sessionStore = new MySQLStore({}, connection);

app.use(session({
    secret: 'your-secret-key', 
    resave: false,   // جلوگیری از ذخیره سشن‌های بدون تغییر
    saveUninitialized: false, // جلوگیری از ذخیره سشن‌های خالی
    store: sessionStore,  // ذخیره در MySQL
    cookie: { secure: false, maxAge: 1000 * 60 * 30 } // 1 روز
}));



app.get("/", (req, res) => {
  res.render("main");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/doctor-login", (req, res) => {
  res.render("doctor-login");
});


const userAuth = require('./routes/user-auth');
app.use('/api/auth', userAuth);

const doctorAuth = require('./routes/doctor-auth');
app.use('/doctor/auth', doctorAuth);


const IP = process.env.IP;
const PORT = process.env.PORT;

app.listen(PORT, IP, () => {
  console.log(`App listening on port ${PORT} and ${IP}`);
});
