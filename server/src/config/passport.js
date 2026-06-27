const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback';
console.log('🔑 Google OAuth callbackURL:', callbackURL);

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL
    }, async (accessToken, refreshToken, profile, done) => {
        try {
        // 1. Check if user exists by googleId
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            // Check if user is a driver (Drivers cannot use Google Login)
            if (user.role === 'driver') {
                return done(null, false, { message: 'Drivers must login with email and password.' });
            }
            return done(null, user);
        }

        // 2. Check if user exists by email (link accounts if needed, or return user)
        const email = profile.emails[0].value;
        user = await User.findOne({ email });

        if (user) {
            if (user.role === 'driver') {
                return done(null, false, { message: 'Drivers must login with email and password.' });
            }
            // Link Google ID to existing user
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
        }

        // 3. Create new user (Role is strictly 'rider' for Google users)
        user = await User.create({
            name: profile.displayName,
            email: email,
            googleId: profile.id,
            role: 'rider', // FORCE RIDER ROLE
            phone: '' // Phone might be collected later
        });

        return done(null, user);

    } catch (err) {
        console.error('Google Auth Error:', err);
        return done(err, false);
    }
}));
} else {
    console.warn('⚠️ Google OAuth credentials missing. Google login will be disabled.');
}

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;
