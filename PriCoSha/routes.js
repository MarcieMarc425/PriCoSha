var mysql = require('mysql');
var configDB = require('./database');
var connection = mysql.createConnection(configDB.connection);
var moment = require('moment')

connection.query('USE ' + configDB.database);

module.exports = function (app, passport) {
    app.get('/', function (req, res) {
        res.render('landing.ejs', { message: req.flash('loginMessage')});
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

            console.log(req.content);

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

    function getTagApprove(req, res, next) {
        var uID = {};
        uID = JSON.stringify(req.user).split(',');
        var username = uID[0].split("\"");

        var query = "SELECT * FROM tag WHERE username_taggee = '" + username[3] + "' AND status = 0 AND is_ignored = 0";

        connection.query(query, function (err, rows, fields) {
            if (err)
                throw err;

            req.managetag = rows;

            return next();
        });
    }

    function renderHomepage(req, res) {
        res.render('homepage.ejs', {
            content: req.content,
            fg: req.fg,
            tag: req.managetag
        })
    }

    function loggedIn(req, res, next) {
        if (req.isAuthenticated())
            return next();

        res.redirect('/');
    }

    app.get('/homepage', loggedIn, getContent, getFG, getTagApprove, renderHomepage);

    app.post('/', passport.authenticate('local-login', {
        successRedirect: '/homepage',
        failureRedirect: '/',
        failureFlash: true
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

    var cid;

    app.post('/tag', getContent, function (req, res) {
        var order = req.body.tag_person;
        var content_id = req.content[order].id;
        console.log(order);
        console.log(content_id);
        cid = content_id;
        res.render('tagperson.ejs', {

            cid: content_id,
            //message: req.flash('tagMessage')

        });

    });

    function isVisible(req, res, next) {
        var uID = {};
        uID = JSON.stringify(req.user).split(',');
        var username = uID[0].split("\"");
        req.tagger = username[3];
        req.taggee = req.body.uname;

        var query = "SELECT * FROM content WHERE public = 1 OR id in (SELECT id FROM member, share WHERE member.group_name = share.group_name AND member.username_creator = share.username AND member.username = '" + req.taggee + "')";

        connection.query(query, function (err, rows, fields) {
            if (err)
                throw err;

            console.log('ID visible query - Success');
            req.visibleID = rows;

            return next();

        });

    }

    function insertTag(req, res, next) {
        req.objID = 0;

        for (var i in req.visibleID) {
            if (cid == req.visibleID[i].id)
                req.objID = req.visibleID[i].id;
        }

        return next();

    }

    function completeTagHandler(req, res) {
        var query;

        console.log(req.objID);
        console.log(req.tagger);
        console.log(req.taggee);

        if (req.objID == 0) {
            console.log("Content not visible to taggee.");
            //req.flash('tagMessage', 'Failure to tag: Content not visible to taggee');
            res.redirect('/tag');
        } else if (req.tagger == req.taggee) {
            query = "INSERT INTO tag VALUES (" + req.objID + ", '" +
                req.tagger + "', '" + req.taggee + "', CURRENT_TIMESTAMP, 1, 0)";
            connection.query(query, function (err, res) {
                if (err)
                    throw err;
                console.log('INSERT INTO tag query - Success');
            });
            res.redirect('/homepage');
        } else {
            query = "INSERT INTO tag VALUES (" + req.objID + ", '" +
                req.tagger + "', '" + req.taggee + "', CURRENT_TIMESTAMP, 0, 0)";
            connection.query(query, function (err, res) {
                if (err)
                    throw err;
                console.log('INSERT INTO tag query - Success');
            });
            res.redirect('/homepage');
        }
    }

    app.post('/completetag', isVisible, insertTag, completeTagHandler);

    function getComment(req, res, next) {
        var order = req.body.additional_info;
        var content_id = req.content[order].id;
        console.log(content_id);
        var query = "SELECT * FROM comment WHERE id = " + content_id;

        connection.query(query, function (err, rows, fields) {
            if (err)
                throw err;

            req.comment = rows;

            console.log(req.comment);
            console.log('SELECT * FROM comment query success');
            return next();
        });
    }

    function getTag(req, res, next) {
        var order = req.body.additional_info;
        var content_id = req.content[order].id;

        var query = "SELECT * FROM tag WHERE id = " + content_id + " AND status = 1";

        connection.query(query, function (err, rows, fields) {
            if (err)
                throw err;

            req.tag = rows;

            console.log(req.comment);
            console.log('SELECT * FROM tag query success');
            return next();
        });
    }

    app.post('/add_info', getContent, getComment, getTag, function (req, res) {

        res.render('additioninfo.ejs', {

            comment: req.comment,
            tag: req.tag

        });
    });

    app.post('/accept_tag', function (req, res) {
        var uID = {};
        uID = JSON.stringify(req.user).split(',');
        var username = uID[0].split("\"");

        var query = "UPDATE tag SET status = 1 WHERE id = " + req.body.accept_tag +
            " AND username_tagger = '" + req.body.accept_tagger_uname +
            "' AND username_taggee = '" + username[3] +
            "' AND timest = '" + moment(new Date(req.body.accpet_tag_time)).format('YYYY-MM-DD HH:mm:ss') + "'";

        connection.query(query, function (err, res) {
            if (err)
                throw err;

            console.log('UPDATE tag query - SUCCESS');
        })

        res.redirect('/homepage');

    });

    app.post('/decline_tag', function (req, res) {
        var uID = {};
        uID = JSON.stringify(req.user).split(',');
        var username = uID[0].split("\"");

        var query = "DELETE FROM tag WHERE id = " + req.body.decline_tag +
            " AND username_tagger = '" + req.body.decline_tagger_uname +
            "' AND username_taggee = '" + username[3] +
            "' AND timest = '" + moment(new Date(req.body.decline_tag_time)).format('YYYY-MM-DD HH:mm:ss') + "'";

        connection.query(query, function (err, res) {
            if (err)
                throw err;

            console.log('DELETE tag query - SUCCESS');
        })

        res.redirect('/homepage');

    });

    app.post('/ignore_tag', function (req, res) {
        var uID = {};
        uID = JSON.stringify(req.user).split(',');
        var username = uID[0].split("\"");

        var query = "UPDATE tag SET is_ignored = 1 WHERE id = " + req.body.ignore_tag +
            " AND username_tagger = '" + req.body.ignore_tagger_uname +
            "' AND username_taggee = '" + username[3] +
            "' AND timest = '" + moment(new Date(req.body.ignore_tag_time)).format('YYYY-MM-DD HH:mm:ss') + "'";

        connection.query(query, function (err, res) {
            if (err)
                throw err;

            console.log('UPDATE tag query - SUCCESS');
        })

        res.redirect('/homepage');

    })


    app.post('/backtohome', function (req, res) {
        res.redirect('/homepage');
    });

    app.get('/logout', function (req, res) {
        req.session.destroy(function (err) {
            res.redirect('/');
        });
    });
}