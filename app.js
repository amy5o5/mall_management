const express = require("express");
const app = express();
const router = express.Router();
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { checkRoles }= require('./middlewares/check-actor');
app.use(express.json());


require("dotenv").config();
app.set("view engine", "ejs");

app.use(cookieParser()); // قرار دادن cookie-parser قبل از middleware‌های دیگر
app.use(express.static("public"));
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session); 

const connection = require('./database/db_connect');


const sessionStore = new MySQLStore({}, connection);

app.use(session({
    secret: 'your-secret-key', 
    resave: false,  
    saveUninitialized: false,
    store: sessionStore,  
    cookie: { secure: false, maxAge: 1000 * 60 * 30 }
}));



app.get("/", (req, res) => {
  res.render("main");
});

//admin section *
const adminRoutes= require('./routes/admin-routes/admin-routes');
app.use('/admin', adminRoutes);

//shopkeeper *
const shopKeeperRoutes = require('./routes/shopkeeper-routes/shopkeeper-routes');
app.use('/shk', shopKeeperRoutes);

// normal user
const userRoutes = require('./routes/user-routes/user-routes');
app.use('/user', userRoutes);




/*app.get('/admin-fg-password', (req, res) => {
  res.render('admin/admin-forgot-password');
});

app.get("/admin-reset-password/:token", (req, res) => {
  const { token } = req.params;
  
  res.render("admin/admin-reset-password", { token, errorMessage: null });
});*/



/*
const SecurityGuyAuth = require('./routes/SecurityGuy-auth');
app.use('/sec/auth', SecurityGuyAuth);

app.get('/secGuy-forgot-password', (req, res) => {
  res.render('sec_guy/securityGuy-forgot-password');
});

app.get("/secGuy-login", (req, res) => {
  res.render("sec_guy/securityGuy-login");
});

app.get("/sec-dashboard", (req, res) => {
  res.render("sec_guy/sec-dashboard");
});


app.get("/securityGuy-reset-password/:token", (req, res) => {
  const { token } = req.params;
  
  res.render("sec_guy/securityGuy-reset-password", { token, errorMessage: null });
});
*/





/*console.log("🔍 تلاش برای اتصال به دیتابیس...");
connection.connect((err) => {
  if (err) {
      console.error("❌ خطا در اتصال به دیتابیس:", err);
  } else {
      console.log("✅ اتصال به دیتابیس برقرار شد!");
  }
});*/


const IP = process.env.IP;
const PORT = process.env.PORT;

app.listen(PORT, IP, () => {
  console.log(`App listening on port ${PORT} and ${IP}`);
});


