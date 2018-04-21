const router = require('express').Router();

const YID = process.env.YID || require('../config/keys.js').youTube.clientID
const YSEC = process.env.YSEC || require('../config/keys.js').youTube.clientSecret
const API_KEY = process.env.YAPI || require('../config/keys.js').youTube.API_KEY

const google = require('googleapis')
const OAuth2 = google.google.auth.OAuth2
const youtube = require('../youtubeLogic/youtube.js')
const authCheck = (req, res, next) => {
    if (!req.user) {
        res.redirect('/auth/login');
    } else {
        next();
    }
};

router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://mariner-front-end.s3-website.us-east-2.amazonaws.com/")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    next()
})

router.get('/', authCheck, (req, res) => {
    res.render('comments', { user: req.user.name, comments: req.user.comments })
});
router.get('/video/comments/:id', authCheck, async(req, res) => {
    let videoComments = await youtube.getCommentsForVideo(req.params.id, API_KEY)
    let r = { comments: videoComments, user: req.user.name, thing: req.user.commentCountByVideoId, id: req.params.id }
    res.render('comments', r)
})
router.get('/videos', authCheck, (req, res) => {
    let r = { data: req.user.videos, user: req.user.name, thing: req.user.commentCountByVideoId }
    res.render('videos', r)
})
router.get('/video/:id', authCheck, (req, res) => {
    let r = { data: req.user.videos.slice(req.params.id, req.params.id + 9), user: req.user.name, thing: req.user.commentCountByVideoId }
    res.render('videos', r)
})
router.get('/comment/:id', authCheck, (req, res) => {
    let r = { comments: req.user.comments.slice(req.params.id, req.params.id + 9), user: req.user.name, thing: req.user.commentCountByVideoId }
    res.render('comments', r)
})
router.get('/comments', authCheck, (req, res) => {
    res.render('comments', { user: req.user.name, comments: req.user.comments })
})
router.get('/modal', authCheck, (req, res) => {
    res.render('modalTest', { user: req.user.name, comments: req.user.comments })
})
router.get('/search/', authCheck, (req, res) => {
    let r = {
        comments: req.user.comments.filter(e => {
            if (e.comment.split(' ').includes(req.query.query)) {
                return e
            }
        }),
        user: req.user.name,
        thing: req.user.commentCountByVideoId
    }
    res.render('comments', r)
})
router.get('/comment/sort/questions', authCheck, (req, res) => {
    let questions = req.user.comments.filter(e => e.comment.split(' ').includes('?'))
    let response = []
    if (questions.length) {
        response = questions
    } else {
        response = []
    }
    res.render('comments', { user: req.user.name, comments: response })
})


router.get('/youtube', function(req, res) {

    res.json({
        status: "ok",
        data: req.user
    });

});



module.exports = router;