const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const router = require("../routes/auth.route");
router.use(cookieParser());
function verifyToken(req, res, next) {
  const token = req.cookies.token; // خواندن توکن از کوکی

  if (!token) {
    // return res.status(401).json({ error: 'Access denied' });
    return res.redirect("/auth/login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // خواندن secret از .env
    req.user = decoded; // می‌توانید تمام اطلاعات decoded را به req اضافه کنید
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = verifyToken;
