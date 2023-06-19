const isAdminLoggedIn = (req, res, next) => {
  try {
    if (req.session.admin_id) {
      next();
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isAdminLoggedOut = (req, res, next) => {
  try {
    if (req.session.admin_id) {
      res.redirect("/admin/home");
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};
const isUserLoggedIn = (req, res, next) => {
  try {
    if (req.session.userId) {
    } else {
      res.redirect("/login");
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};

const isUserLoggedOut = (req, res, next) => {
  try {
    if (req.session.userId) {
      res.redirect("/");
    } else {
      next();
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  isAdminLoggedOut,
  isAdminLoggedIn,
  isUserLoggedIn,
  isUserLoggedOut,
};
