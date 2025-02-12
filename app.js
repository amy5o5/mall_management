const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const checkAccess = require("./middlewares/check-actor.middleware");

//const db_connect = require('./database/db_connect');
require("dotenv").config();
app.set("view engine", "ejs");

app.use(cookieParser()); // قرار دادن cookie-parser قبل از middleware‌های دیگر
app.use(express.static("public"));
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", checkAccess(["user"]), (req, res) => {
  res.send("youre just a normal user!");
});

const adminRoute = require("./routes/admin.route");
app.use("/admin", adminRoute);

const authRoute = require("./routes/auth.route");
app.use("/auth", authRoute);

const IP = process.env.IP;
const PORT = process.env.PORT;

app.listen(PORT, IP, () => {
  console.log(`App listening on port ${PORT} and ${IP}`);
});
