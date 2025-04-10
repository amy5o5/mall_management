function checkAuth(req, res, next) {
    if (req.session && req.session.user_id) {
      return next(); 
    } else {
        return res.redirect('/user/login');
    }
  }
  
  module.exports = { checkAuth };
  