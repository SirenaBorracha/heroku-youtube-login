const router = require('express').Router();
const passport = require('passport');
var axios = require('axios')
var youtube = require('../youtubeLogic/youtube.js')
const User = require('../models/user-model');
const YID = process.env.YID || require('../config/keys.js').youTube.clientID
const YSEC = process.env.YSEC || require('../config/keys.js').youTube.clientSecret
const API_KEY = process.env.YAPI || require('../config/keys.js').youTube.API_KEY


router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:8080")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    next()
})

// auth login
router.get('/login', (req, res) => {
    res.render('login', { user: req.user });
});

// auth logout
router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

// auth with google+
router.get('/google', passport.authenticate('google', {
    scope: ['profile']
}))

// auth with youtube
router.get('/youtube',
    passport.authenticate('youtube')
)

// auth with twittew
router.get('/twitter',
    passport.authenticate('twitter')
)

//route twitter api rediects to
router.get('/twitter/callback',
    passport.authenticate('twitter'),
    (req, res) => {
        res.render('twitter', { user: req.user, status: req.user._json.status })
    }
)

// route that youtub api redirects to
router.get('/youtube/callback',
    passport.authenticate('youtube'),

    async(req, res) => {

        let userComplete = req.user

        let rawData = await youtube.gimmeAll(req.user._id, API_KEY)

        let userData = formatData(rawData)

        User.findOneAndUpdate({ _id: req.user._id }, { $set: { videos: userData.videos, comments: userData.comments, commentCountByVideoID: userData.commentCountByVideoID, wordCount: userData.wordCount } }, { upsert: true, returnNewDocument: true, fields: 'data' }, function(err, data) {
            if (err) {
                console.error(err.message, 'err in update db')
            }
        })

        // moveData(req.user, userData, userData.commentCountByVideoID)
        // res.redirect(`http://mariner-env.77qi7qvbf8.us-east-2.elasticbeanstalk.com/${req.user.name}/${req.user._id}`)
        let r = { comments: req.user.comments, user: req.user.name, thing: req.user.commentCountByVideoId }
        res.render('comments', r)

    })

// callback route for google to redirect to
router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
    res.render('profile', { user: req.user });
})


var moveData = async(user, userData, commentCountByVideoID) => {

    axios.post('https://fast-island-10012.herokuapp.com/comments', {
            videos: userData.videos,
            user: user,
            comments: userData.comments,
            commentCountByVideoID: userData.commentCountByVideoID
        })
        .then((response) => {
            console.log('success posting to CR ')
        })
        .catch((err) => {
            console.error('err in axios post to CR ', err.message);
        })


}
var formatData = (userData) => {
    if (userData.comments && userData.comments.length) {
        userData.commentCountByVideoID = userData.comments.reduce((cc, inc) => {
            cc[inc.videoId] ? cc[inc.videoId]++ : cc[inc.videoId] = 1
            return cc
        })
        for (let i = 0; i < userData.comments; i++) {
            if (userData.commentCountByVideoID[userData.comments[i].videoId]) {
                userData.commentCountByVideoID[userData.comments[i].videoId]++
            } else {
                userData.commentCountByVideoID[userData.comments[i].videoId] = 1
            }
        }
        console.log('created obect', Object.keys(userData.commentCountByVideoID))
    }
    userData.videos.forEach(video => {
        if (userData.commentCountByVideoID[video.videoId]) {
            video.commentCount = userData.commentCountByVideoID[video.videoId]
            console.log('video cc', video.commentCount)
        }
    })
    console.log('if fired')
    userData.videos.map(video => {
        video.commentCount = userData.commentCountByVideoID[video.videoId]
        console.log('setting comment count', video.commentCount)

        return video
    })
    userData.wordCount = userData.videos.reduce((wc, inc) => {
        wc[inc] ? wc[inc]++ : wc[inc] = 1
        return wc
    })


    return userData
}



module.exports = router;