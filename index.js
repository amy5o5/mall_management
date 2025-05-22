const express = require("express");
const app = express();
const router = express.Router();
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { checkRoles }= require('./middlewares/check-actor');
const { checkAuth } = require("./middlewares/checkAuth");

app.use(bodyParser.urlencoded({ extended: true }));



require("dotenv").config();
app.set("view engine", "ejs");

app.use(cookieParser());

app.use(express.static("public"));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    saveUninitialized: true,
    store: sessionStore,  
    cookie: { secure: false ,httpOnly:true, maxAge: 1000 * 60 * 30 }
}));


const visit_recorder = require('./services/visit-recorder');

const { getShops } = require('./utils/getShops');

app.get("/", visit_recorder, async (req, res) => {
  try {
    const shopsWithImages = await getShops(); // دریافت اطلاعات فروشگاه‌ها
    let seller = null;
    if (req.session.user && req.session.user.role === 'shpk') {
        seller = req.session.user;
    }


    res.render("main", {
      seller: req.session.user?.role === 'shpk' ? req.session.user : null,
      isUser: req.session.user?.role === 'user',
      title: "مدیریت فروشگاه‌ها",
      shops: shopsWithImages,
      linkBase: "/admin/manageShpks/edit-shop",
      date: new Intl.DateTimeFormat("fa-IR").format(new Date()),
      time: new Date().toLocaleTimeString("fa-IR"),

      currentUrl: req.originalUrl
    });
    
  } catch (error) {
    console.error("Error fetching shops:", error);
    res.status(500).send("خطا در دریافت اطلاعات فروشگاه‌ها");
  }
});


//admin section *
const adminRoutes= require('./routes/admin-routes/admin-routes');
app.use('/admin' ,adminRoutes);

//shopkeeper *
const shopKeeperRoutes = require('./routes/shopkeeper-routes/shopkeeper-routes');
app.use('/shk', shopKeeperRoutes);

// normal user
const userRoutes = require('./routes/user-routes/user-routes');

app.use('/user', userRoutes);

app.get('/logins', (req, res) => {
  res.render('logins');
});

app.get('/vahed-haye-tejari', (req,res) => {
  res.render('vahedTj', {
      seller: req.session.user?.role === 'shpk' ? req.session.user : null,
      isUser: req.session.user?.role === 'user',
      title: "مدیریت فروشگاه‌ها",
      linkBase: "/admin/manageShpks/edit-shop",
      date: new Intl.DateTimeFormat("fa-IR").format(new Date()),
      time: new Date().toLocaleTimeString("fa-IR"),

      currentUrl: req.originalUrl
    });
});

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





// const IP = process.env.IP;
// const PORT = process.env.PORT;

// app.listen(PORT, IP, () => {
//   console.log(`App listening on port ${PORT} and ${IP}`);
// });


