var express = require('express');
var app = express();
var port = 1337;
var passport = require('passport');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var session = require('express-session');
var moment = require('moment');


require('./passport')(passport);

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/views'));

app.use(express.json());
app.use(express.urlencoded());

app.set('view engine', 'ejs');

app.use(session({
    secret: 'nopassword',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

require('./routes.js')(app, passport);

app.listen(port);
console.log('Listening on port ' + port + '...');