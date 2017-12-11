var mysql = require('mysql');
var configDB = require('./database');
var connection = mysql.createConnection(configDB.connection);
var moment = require('moment');
var dateTime = require('node-datetime');


connection.query('USE ' + configDB.database);

module.exports = function (app, passport) {
    app.get('/', function (req, res) {
        res.render('landing.ejs');
    });

    function getContent(req, res, next) {
        var uID = {};
        uID = JSON.stringify(req.user).split(',');
        var username = uID[0].split("\"");

        var query = 'SELECT * FROM content WHERE public = TRUE OR id IN (SELECT share.id FROM share, member WHERE share.username = member.username_creator AND share.group_name = member.group_name AND member.username = \'' + username[3] + '\') ORDER BY timest DESC';

        connection.query(query, function (err, rows, fields) {
            if (err)
                throw err;

            console.log('SELECT * FROM content query - Sucess');
            req.content = rows;
            return next();
        });
    }

    function getFG(req, res, next) {
        var uID = {};
        uID = JSON.stringify(req.user).split(',');
        var username = uID[0].split("\"");

        var query = 'SELECT group_name FROM friendgroup WHERE username = \'' + username[3] + '\'';

        connection.query(query, function (err, rows, fields) {
            if (err)
                throw err;

            console.log('SELECT group_name FROM friendgroup query - Success')

            req.fg = rows;
            return next();
        });
    }

    function renderHomepage(req, res) {
        res.render('homepage.ejs', {
            content: req.content,
            fg: req.fg
        })
    }

    function loggedIn(req, res, next) {
        if (req.isAuthenticated())
            return next();

        res.redirect('/');
    }

    app.get('/homepage', loggedIn, getContent, getFG, renderHomepage);

    app.post('/', passport.authenticate('local-login', {
        successRedirect: '/homepage',
        failureRedirect: '/'
    }));

    function postContent(req, res, next) {
        var title = req.body.title,
            file_path = req.body.file_path,
            visibility = req.body.share_view;

        req.visible = visibility;

        var uID = {};
        uID = JSON.stringify(req.user).split(',');
        var username = uID[0].split("\"");

        var queryJSON;

        if (visibility == 'public') {
            queryJSON = {
                "username": username[3],
                "timest": "CURRENT_TIMESTAMP",
                "file_path": file_path,
                "content_name": title,
                "public": "1"
            }
        } else {
            queryJSON = {
                "username": username[3],
                "timest": "CURRENT_TIMESTAMP",
                "file_path": file_path,
                "content_name": title,
                "public": "0"
            }
        }

        console.log(queryJSON);

        connection.query("INSERT INTO content (username, timest, file_path, content_name, public) VALUES ('" +
            queryJSON.username + "', " +
            queryJSON.timest + ", '" +
            queryJSON.file_path + "', '" +
            queryJSON.content_name + "', " +
            queryJSON.public +
            ");", function (err, res) {
                if (err)
                    throw err;

                console.log('INSERT INTO content query - Success');
                return next();

            });
    }

    function getObjID(req, res, next) {
        var query = "SELECT * FROM content ORDER BY timest DESC LIMIT 1";

        connection.query(query, function (err, rows, fields) {
            req.objIDrow = JSON.stringify(rows);
            return next();
        });
    }

    app.post('/post_content', postContent, getObjID, function(req, res) {
        var uID = {};
        uID = JSON.stringify(req.user).split(',');
        var username = uID[0].split("\"");

        var x = req.objIDrow.split(',');
        var objID = x[0].split("\"");
        objID = objID[2].split(":");

        var query = "INSERT INTO share (id, group_name, username) VALUES (" +
            objID[1] + ", '" + req.visible + "', '" + username[3] + "');";

        if (req.visible != 'public') {
            connection.query(query, function (err, res) {
                if (err)
                    throw err;
                
                console.log('INSERT INTO share query - Success.');

            });
        }

        res.redirect('/homepage');

    });

    function searchFriend(req, res, next) {
        var uID = {};
        uID = JSON.stringify(req.user).split(',');
        var username = uID[0].split("\"");

        var query = "SELECT * FROM member WHERE username = '" + req.body.fd_username +
            "' AND group_name = '" + req.body.add_fd_group + "' AND username_creator = '" +
            username[3] + "'";

        connection.query(query, function (err, rows, fields) {
            if (err)
                throw err;
            console.log('SELECT * From member query - Success');
            if (rows.lenth == 0)
                req.isFriendInGroup = 0;
            else
                req.isFriendInGroup = rows;
            return next();

        });
    }

    function insertFriend(req, res, next) {
        var uID = {};
        uID = JSON.stringify(req.user).split(',');
        var username = uID[0].split("\"");

        var query;

        if (req.isFriendInGroup == 0) {
            query = "INSERT INTO member(username, group_name, username_creator) VALUES ('" +
                req.body.fd_username + "', '" +
                req.body.add_fd_group + "', '" +
                username[3] + "');";
        }

        connection.query(query, function (err, res) {
            if (err)
                throw err;
            console.log('INSERT INTO member query - Success');
        })

        return next();
    }

    app.post('/add_friend', searchFriend, insertFriend, function (req, res) {

        res.redirect('/homepage');

    });

}