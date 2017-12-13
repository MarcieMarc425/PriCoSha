var LocalStrategy = require('passport-local').Strategy;
var mysql = require('mysql');
var configDB = require('./database');
var connection = mysql.createConnection(configDB.connection);
var md5 = require('md5');

connection.query('USE ' + configDB.database);

module.exports = function (passport) {

    passport.serializeUser(function (user, done) {
        done(null, user.username);
    });

    passport.deserializeUser(function (username, done) {
        connection.query("SELECT * FROM person WHERE username = ?", [username], function (err, rows) {
            done(err, rows[0]);
        });
    });

    passport.use(
        'local-login',
        new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (req, username, password, done) {
            connection.query("SELECT * FROM person WHERE username = ?", [username], function (err, rows) {
                if (err)
                    return done(err);
                if (!rows.length) {
                    return done(null, false, req.flash('loginMessage', 'User does not exist.'));
                }

                if (md5(password) != rows[0].password)
                    return done(null, false, req.flash('loginMessage', 'Wrong password.'));

                return done(null, rows[0]);
            });
        })
    );

};