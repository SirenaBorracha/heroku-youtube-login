const passport = require('passport');
const YoutubeV3Strategy = require('passport-youtube-v3').Strategy
const User = require('./models/user-model')

const YID = process.env.YID || require('./config/keys.js').youTube.clientID
const YSEC = process.env.YSEC || require('./config/keys.js').youTube.clientSecret
const API_KEY = process.env.YAPI || require('./config/keys.js').youTube.API_KEY

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => {
        done(null, user);
    });
});

var config = {
    clientID: YID,
    clientSecret: YSEC,
    callbackURL: '/auth/youtube/callback'
};
passport.use(new YoutubeV3Strategy({
                clientID: config.clientID,
                clientSecret: config.clientSecret,
                callbackURL: config.callbackURL,
                scope: ['https://www.googleapis.com/auth/youtube.force-ssl'],
                // scope: ['https://www.googleapis.com/auth/youtube.readonly'],
                // authorizationParams: {
                //     access_type: 'offline'
                // }
            }, (accessToken, refreshToken, profile, done) => {
                // check if user already exists in our own db
                User.findOneAndUpdate({ _id: profile.id }, { $set: { access_token: accessToken, refresh_token: refreshToken } }, { upsert: true, returnNewDocument: true }).then((currentUser) => {
                    if (currentUser) {
                        // already have this user
                        currentUser.refresh_token = refreshToken;
                        done(null, currentUser);
                    } else {
                        // if not, create user in our db
                        var user = new User({
                            _id: profile.id,
                            access_token: accessToken,
                            refresh_token: refreshToken,
                            name: profile.displayName
                        });
                        user.save(function(err) {
                                if (err)
                                    return done(err);
                                return done(null, user);
                            }).then(newUser => console.log('created', newUser))
                            .catch(err => console.error(err.message, 'from passport strategy))
                                }
                            });
                }))