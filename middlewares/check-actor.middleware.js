const jwt = require("jsonwebtoken");

function checkAccess(allowedRoles = []) {
  return (req, res, next) => {
    const token = req.cookies.token; // دریافت توکن از کوکی‌ها

    if (!token) {
      console.log("❌ توکن وجود ندارد!");
      return res.status(401).json({ error: "دسترسی غیرمجاز", redirect: "/login" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ توکن بررسی شد:", decoded);

      req.user = decoded;

      // بررسی اینکه آیا کاربر جزو نقش‌های مجاز است
      const userRole = req.user.admin ? "admin" : "user";
      if (!allowedRoles.includes(userRole)) {
        console.log("❌ دسترسی غیرمجاز!", req.user);
        return res.status(403).json({ error: "🚫 شما اجازه دسترسی ندارید!" });
      }

      next();
    } catch (error) {
      console.error("❌ JWT Error:", error.message);
      return res.status(401).json({ error: "توکن معتبر نیست" });
    }
  };
}

module.exports = checkAccess;
