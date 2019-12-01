const router = require("express").Router()
const passport = require("passport");

const CLIENT_HOME_PAGE_URL = "http://localhost:3001";

// when login is successful, retrieve user info
router.get("/login/success", (req, res) => {
    if (req.user) {
      res.json({
        success: true,
        message: "user has successfully authenticated",
        user: req.user,
        cookies: req.cookies
      });
    }
  });
  
  // when login failed, send failed msg
  router.get("/login/failed", (req, res) => {
    console.log("Fallo de la autenticacion")
    res.status(401).json({
      success: false,
      message: "user failed to authenticate."
    });
  });
  
  // When logout, redirect to client
  router.get("/logout", (req, res) => {
    req.logout();
    res.redirect(CLIENT_HOME_PAGE_URL);
  });
  
  // auth with twitter
  router.get("/twitter", passport.authenticate("twitter"));

  router.get('/google',
              passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login',
              'https://www.googleapis.com/auth/userinfo.profile',
              'https://www.googleapis.com/auth/userinfo.email'] }));
  
  // redirect to home page after successfully login via twitter
  router.get(
    "/twitter/redirect",
    passport.authenticate("twitter", {
      successRedirect: CLIENT_HOME_PAGE_URL,
      failureRedirect: "/auth/login/failed"
    })
  );

  router.get(
    '/google/redirect', 
    passport.authenticate('google', { failureRedirect: '/auth/login/failed' }),
    function(req, res) {
      res.redirect(CLIENT_HOME_PAGE_URL);
    }
  );

  router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }))

  // Facebook will redirect the user to this URL after approval.  Finish the
  // authentication process by attempting to obtain an access token.  If
  // access was granted, the user will be logged in.  Otherwise,
  // authentication has failed.
  router.get('/facebook/redirect',
  passport.authenticate('facebook', { successRedirect: CLIENT_HOME_PAGE_URL,
                                      failureRedirect: '/auth/login/failed' }));


module.exports = router