var LocalStrategy = require('passport-local').Strategy; // creating local strategy
var localUser          = require('../app/models/user');

var FacebookStrategy = require('passport-facebook').Strategy;
var facebookUser = require('../app/models/facebookUser');
var configAuth = require('./auth');
var bcrypt = require('bcrypt');

var mysql = require ('mysql');
var configDB = require('../config/database');
var connection = mysql.createConnection(configDB);
connection.connect(function(err){
	if(err) console.log("error in DB connection!");
	else console.log("connected to DB");
});


// module.exports allows its section to be available for the rest of programs 
module.exports = function(passport) {

	// serializing is to take all user information packed into one simple data (id)
	// we can store user id as session data
	passport.serializeUser(function(user, done){
		connection.query('SELECT id FROM users WHERE email = ?', user.email, function(err,res){
			if(err)	{return done(err);
			} else { 
				// console.log("this user id is serialized: ");
				// console.log(res);
			
				done(null, res);
			}
		});
	});		

	// deserializing is to retreive all user info from its user id only
	passport.deserializeUser(function(id, done){
		
		// TODO findById is a Mongo fucntion!
		
		var idString = JSON.stringify(id);
		// console.log(id);
		// console.log(idString);
		var idJson = JSON.parse(idString);
		// console.log(idJson);
		// console.log(idJson[0].id);


		connection.query('SELECT * FROM users WHERE id = ?', idJson[0].id, function(err,res){
			// console.log("this user id is deserialized: ");
			// console.log(id);
			// console.log(res);

		  	done(err, res); 
		});
	});

	// local signup passport
	passport.use('local-signup', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	},
	function(req, email, password, done){
		// process.nextTick is making the function ascnc. 
		process.nextTick(function(){
			connection.query('SELECT * FROM users WHERE email = ?', email, function(err,res){	
				if(err)
					return done(err);
				if(res.length > 0 && res.password != null){
					console.log(res);
					return done(null, false, req.flash('signupMessage', 'That email is already taken'));
				} else if (res.length > 0 && res.password == null){
					// var newUser = new localUser();
					encPass = bcrypt.hashSync(password, bcrypt.genSaltSync(9));

					connection.query('UPDATE users SET password = ? WHERE email = ?', [encPass, email], function (error, results, fields) {
  						if (error) 
  							throw error;
  						console.log("you are updating table");
  						return done(null,false, req.flash('signupMessage', 'You are successfully registered! login please...'));
					})

					}else{
					var newUser = new localUser();
					newUser.email = email;

					newUser.password = bcrypt.hashSync(password, bcrypt.genSaltSync(9));

					connection.query('INSERT INTO users SET ?', newUser, function(err,res){
						if(err)
							throw err;
						console.log("you are creating new user");

						return done(null, newUser);
					})
				}
			})

		});
	}));

	// strategy for local login
	passport.use('local-login', new LocalStrategy({
			usernameField: 'email',
			passwordField: 'password',
			passReqToCallback: true
		},
		function(req, email, password, done){
			// making process async
			process.nextTick(function(){
				connection.query('SELECT * FROM users WHERE email = ?', email, function(err,res){	

					if(err)
						return done(err);
					if(res.length == 0)
						return done(null, false, req.flash('loginMessage', 'No User found'));
					

					var resString = JSON.stringify(res);
					var resJson = JSON.parse(resString);

					console.log(resJson[0].password);
					

					if(!bcrypt.compareSync(password, resJson[0].password)) {
						
						return done(null, false, req.flash('loginMessage', 'invalid password'));
					}
					return done(null, resJson[0]); 

				});
			});
		}
	));


	// facebook signup passport
	passport.use(new FacebookStrategy({
	    clientID: configAuth.facebookAuth.clientID,
	    clientSecret: configAuth.facebookAuth.clientSecret,
	    callbackURL: configAuth.facebookAuth.callbackURL,
	    profileFields: ['id', 'emails', 'name', 'gender', 'photos']
	  },
	  function(accessToken, refreshToken, profile, done) {
	    	process.nextTick(function(){
	    		connection.query('SELECT * FROM users WHERE fid = ?', profile.id, function(err,res){	
	    			// console.log("I am in facebook strategy");
	    			if(err)
	    				return done(err);
	    			if(res.length > 0){
	    				// console.log("You are a returning user. Welcome back!");

	    				var resString = JSON.stringify(res);
						var resJson = JSON.parse(resString);
						// console.log("I found you!");
						// console.log(res);
						// console.log(resJson[0]);

	    				return done(null, resJson[0]);
	    			} else{
	    				// console.log("you are new user from facebook");
	    				// console.log(profile.id);
	    				// console.log(accessToken);
	    				// console.log(profile.displayName);
	    				// console.log(profile.emails[0].value , "\n\n");
	    				// console.log(profile);

	    				var newFuser 	= new facebookUser();
						newFuser.fid = profile.id;
	    				newFuser.ftoken = accessToken;
	    				// console.log(newFuser.fid);

	    				// console.log(profile._json.first_name);
	    				// console.log(profile.givenName);
	    				// console.log(profile.emails.length);


	    				newFuser.name = profile._json.first_name + ' ' + profile._json.last_name;
	    				
	    				newFuser.email = profile.emails[0].value;
	    				
	    				if (profile.emails.length>1) {
	    					newFuser.email2 = profile.emails[1].value;
						}
						console.log(newFuser);

						connection.query('INSERT INTO users SET ?', newFuser, function(err,res){
							if(err)
								throw err;
							return done(null, newFuser);
						})
	    			}
	    		});
	    	});
	    }
	));



};