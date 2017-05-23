var express = require('express');
var app = express();
var port = process.env.PORT || 3000;

var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var mysql = require('mysql');

var passport = require('passport');
var session = require('express-session');

var bodyParser = require('body-parser');
var flash = require('connect-flash');
var path = require('path');

// compressin is used to increase performance
var compression = require('compression');

// dotenv handles environment variables
var env        = require('dotenv').load()


// body-parser module extracts the entire body part of an incoming request and exposes it in a format that is easier to work with.
// in this case, JSON format is used.
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// note to this position: if I put this line below session declaration, deserializer invokes enerytime I am loding un image, css or js file! too bad!
app.use("/public", express.static(path.join(__dirname, 'public'))); //static path declaration

app.use(compression());

// both passport and express-session modules are needed to handle authentication.
// initializing passport and the express session and passport session 
app.use(session({secret: 'keyboard cat',
				 saveUninitialized: true,
				 resave: true}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

// morgan prints all incoming traffic requests to the console
app.use(morgan('dev'));
app.use(cookieParser());
app.use(flash()); // use connect-flash for flash messages stored in session

app.set('view engine', 'ejs'); // assigning view engine
app.engine('html', require('ejs').renderFile);


// importing models
var models = require("./app/models");


// calling the Sequelize sync function to sync database
models.sequelize.sync().then(function(){
	// console.log(models.user);
    console.log('You are connected to the database using sequelize module!');
    }).catch(function(err){
    console.log(err,"Some problems with database connection!!!");
});


// importing routes and passing passport as auth.js need it
var authRoute = require('./routes/routes.js')(app,passport,models.user);

//loading passport strategies
require('./config/passport.js')(passport, models.user, models.auth_user);



app.listen(port, function(err){
	if(!err)
		console.log('Server running on port: ' + port + '...');
	else console.log(err)

});




