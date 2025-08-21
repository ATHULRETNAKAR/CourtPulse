const passport = require('passport');
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require('../models/userSchema');
const env = require('dotenv').config();


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
    passReqToCallback: true
},
    async (req, accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });
            
            if (user) {
                return done(null, user);
            }

            // Check if email exists without Google ID
            let existingEmailUser = await User.findOne({ email: profile.emails[0].value });

            if (existingEmailUser) {
                if (!existingEmailUser.googleId) {
                    // Reject login (send message)
                    return done(null, false, { message: "google_email_conflict" });
                }
            }

            // If no conflict, create new Google user
            user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id
            });

            await user.save();
            return done(null, user);

        } catch (error) {
            return done(error, null);
        }
    }));

passport.serializeUser((user, done) => {
    // Store both id and googleId in session
    done(null, { id: user.id, googleId: user.googleId });
});

passport.deserializeUser((data, done) => {
    User.findById(data.id)
        .then(user => {
            if (user) {
                // attach googleId back so it's accessible
                user.googleId = data.googleId;
            }
            done(null, user);
        })
        .catch(err => done(err, null));
});

module.exports = passport;