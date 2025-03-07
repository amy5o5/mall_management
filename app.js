const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
app.use(express.json());


//const db_connect = require('./database/db_connect');
require("dotenv").config();
app.set("view engine", "ejs");

app.use(cookieParser()); // قرار دادن cookie-parser قبل از middleware‌های دیگر
app.use(express.static("public"));
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.render("main");
});

app.get("/login", (req, res) => {
  res.render("login");
});

const userAuth = require('./routes/user-auth');
app.use('/api/auth', userAuth);

const IP = process.env.IP;
const PORT = process.env.PORT;

app.listen(PORT, IP, () => {
  console.log(`App listening on port ${PORT} and ${IP}`);
});
