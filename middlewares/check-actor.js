function checkRoles(...roles) {
    return function (req, res, next) {
        if (!req.session.user) {
            // اگر کاربر وارد نشده باشد
            return res.status(401).render('error', {
                message: 'ابتدا وارد شوید',
                redirectUrl: '/' // مسیر هدایت به صفحه ورود
            });
        }

        if (!roles.includes(req.session.user.role)) {
            // اگر نقش کاربر مجاز نباشد
            return res.status(403).render('error', {
                message: 'شما دسترسی لازم را ندارید',
                redirectUrl: '/'
            });
        }

        next(); // ادامه به مسیر بعدی
    };
}

module.exports = { checkRoles };