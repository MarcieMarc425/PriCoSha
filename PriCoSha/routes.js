﻿module.exports = function (app, passport) {
    app.get('/', function (req, res) {
        res.render('landing.ejs');
    });

    app.get('/homepage', loggedIn, function (req, res) {
        res.render('homepage.ejs', {
            user: req.user
        });
    });

    function loggedIn(req, res, next) {
        if (req.isAuthenticated())
            return next();

        res.redirect('/');
    }

    app.post('/', passport.authenticate('local-login', {
        successRedirect: '/homepage',
        failureRedirect: '/'
    }));
}