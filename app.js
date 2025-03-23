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
  res.render("user/login");
});

app.get("/signup", (req, res) => {
  res.render("user/login");
});

app.get("/secGuy-login", (req, res) => {
  res.render("sec_guy/securityGuy-login");
});

app.get("/sec-dashboard", (req, res) => {
  res.render("sec_guy/sec-dashboard");
});




const shopkeeperAuth = require('./routes/shopkeeper-auth');
app.use('/shopkeeper/auth', shopkeeperAuth);

app.get("/shopkeeper-login", (req, res) => {
  res.render("shop_keeper/shopkeeper-login");
});


app.get('/shkeeper-forgot-password', (req, res) => {
  res.render('shop_keeper/shkeeper-forgot-password');
});

app.get("/set-shkeeper-new-Password/:token", (req, res) => {
  const { token } = req.params;
  
  res.render("sshop_keeper/shkeeper-reset-password", { token, errorMessage: null });
});



const SecurityGuyAuth = require('./routes/SecurityGuy-auth');
app.use('/sec/auth', SecurityGuyAuth);

app.get('/secGuy-forgot-password', (req, res) => {
  res.render('sec_guy/securityGuy-forgot-password');
});



app.get("/securityGuy-reset-password/:token", (req, res) => {
  const { token } = req.params;
  
  res.render("sec_guy/securityGuy-reset-password", { token, errorMessage: null });
});



const userAuth = require('./routes/user-auth');
app.use('/user/auth', userAuth);

app.get('/user-forgot-password', (req, res) => {
  res.render('user/user-forgot-password');
});

app.get("/user-reset-password/:token", (req, res) => {
  const { token } = req.params;
  
  res.render("user/user-reset-password", { token, errorMessage: null });
});



connection.connect((err) => {
  if (err) {
      console.error("❌ خطا در اتصال به دیتابیس:", err);
  } else {
      console.log("✅ اتصال به دیتابیس برقرار شد!");
  }
});

const IP = process.env.IP;
const PORT = process.env.PORT;

app.listen(PORT, IP, () => {
  console.log(`App listening on port ${PORT} and ${IP}`);
});


