var mysql = require('mysql');
var configDB = require('./database');
var connection = mysql.createConnection(configDB.connection);

connection.query('USE ' + configDB.database);

module.exports = function (app, passport) {
    app.get('/', function (req, res) {
        res.render('landing.ejs');
    });

    app.get('/homepage', loggedIn, function (req, res) {

        var uID = {};
        uID = JSON.stringify(req.user).split(',');
        var username = uID[0].split("\"");
        console.log(username[3]);
        
        var query = 'SELECT * FROM content WHERE public = TRUE OR id IN (SELECT share.id FROM share, member WHERE share.username = member.username_creator AND share.group_name = member.group_name AND member.username = \'' + username[3] + '\') ORDER BY timest DESC';

        connection.query(query, function (err, rows, fields) {
            res.render('homepage.ejs', {
                data:rows
            })
            console.log(JSON.stringify(rows)); 
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