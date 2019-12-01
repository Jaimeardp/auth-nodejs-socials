const passport = require("passport");
const TwitterStrategy = require("passport-twitter");
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const keys = require("./keys");
const User = require("../models/user-model");
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(keys.GOOGLE_AUDIENCE_URL);

// serialize the user.id to save in the cookie session
// so the browser will remember the user when login
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// deserialize the cookieUserId to user in the database
passport.deserializeUser((id, done) => {
  User.findById(id)
    .then(user => {
      done(null, user);
    })
    .catch(e => {
      done(new Error("Failed to deserialize an user"));
    });
});

passport.use(
  new TwitterStrategy(
    {
      consumerKey: keys.TWITTER_CONSUMER_KEY,
      consumerSecret: keys.TWITTER_CONSUMER_SECRET,
      userProfileURL: "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true",
      callbackURL: "/auth/twitter/redirect"
    },
    async (token, tokenSecret, profile, done) => {
      // find current user in UserModel
      const currentUser = await User.findOne({
        twitterId: profile._json.id_str
      });
      // create new user if the database doesn't have this user
      if (!currentUser) {
        const newUser = await new User({
          nombre: profile._json.name,
          screenName: profile._json.screen_name,
          twitterId: profile._json.id_str,
          profileImageUrl: profile._json.profile_image_url,
          password: ':)',
          email: profile.emails[0].value
        }).save();
        if (newUser) {
          done(null, newUser);
        }
      }
      console.log(currentUser)
      done(null, currentUser);
    }
  )
);

async function verify(token) {
  const ticket = await client.verifyIdToken({
      idToken: token,
      audience: keys.GOOGLE_AUDIENCE_URL, 
      // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });
  const payload = ticket.getPayload();

  return {
      nombre: payload.name,
      email: payload.email,
      img: payload.picture,
      google: true
  }

}

passport.use(new GoogleStrategy({
  clientID: keys.GOOGLE_CLIENT_ID,
  clientSecret: keys.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/redirect"
},
async (accessToken, refreshToken, profile, done) => {
    const currentUser = await User.findOne({
      email: profile._json.email
    });
    // create new user if the database doesn't have this user
    if (!currentUser) {
      const newUser = await new User({
        nombre : profile._json.name,
        email : profile._json.email,
        img : profile._json.picture,
        google : true,
        password : ':)',
        googleId : profile.id
      }).save();
      if (newUser) {
        done(null, newUser);
      }
    }
    console.log(currentUser)
    done(null, currentUser);

}
));

passport.use(new FacebookStrategy({
  clientID: keys.FACEBOOK_CLIENT_ID,
  clientSecret: keys.FACEBOOK_CLIENT_SECRET,
  callbackURL: "/auth/facebook/redirect",
  profileFields: ['id', 'photos', 'name', 'displayName', 'gender', 'profileUrl', 'email']
},
async (accessToken, refreshToken, profile, done)=> {
  console.log(profile)
  const currentUser = await User.findOne({
    email: profile._json.email
  });
  // create new user if the database doesn't have this user
  if (!currentUser) {
    const newUser = await new User({
      nombre : profile._json.first_name,
      email : profile._json.email,
      img : profile.photos[0].value ,
      facebook : true,
      password : ':)',
      facebookId : profile.id
    }).save();
    if (newUser) {
      done(null, newUser);
    }
  }
  console.log(currentUser)
  done(null, currentUser);
}
));

