function checkRoles(...roles) {
    return function (req, res, next) {
        if (!req.session.user) {
            return res.status(401).json({message: ' ابتدا وارد شوید'});
        }
        if (!roles.includes(req.session.user.role)) {
            return res.status(403).json({message: 'دسترسی ندارید'});
        }
        next();
    };
}

module.exports = { checkRoles };