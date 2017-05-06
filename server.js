var express = require('express');
var app = express();
var port = process.env.PORT || 3000;

var cookieParser = require('cookie-parser');
var session = require('express-session');
var morgan = require('morgan');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var passport = require('passport');
var flash = require('connect-flash');
var path = require('path');

var configDB = require('./config/database');
var connection = mysql.createConnection(configDB);

require('./config/passport')(passport);

// morgan prints all incoming traffic requests to the console
app.use(morgan('dev'));

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: 'keyboard cat',
				 saveUninitialized: true,
				 resave: true}));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

app.use("/public", express.static(path.join(__dirname, 'public'))); //static path declaration
app.set('view engine', 'ejs'); // assigning view engine


require('./app/routes.js')(app, passport); //we are passing app and passport to routes.js

app.listen(port);
console.log('Server running on port: ' + port + '...');




