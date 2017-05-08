// "use strict";
// loading bcrypt module to secure passwords
var bCrypt = require('bcrypt');
// validator module helps to easily validate user inputs. It has Promises that are rejected when validation fails.
// I used this because HTML input validator is not perfect.
var validator = require('validator');
var User            = require('../app/models/user');


module.exports = function(passport,user){

	var User = user;
	var LocalStrategy = require('passport-local').Strategy;
	var FacebookStrategy = require('passport-facebook').Strategy;
	var configAuth = require('./auth');


	// passport has to save a user ID in the session, and it uses this to manage retrieving the user details when needed.
	// serializing is to take all user information packed into one simple data (id)
	// so that we can store user id as session data
	passport.serializeUser(function(user, done) {
	    done(null, user.id);
	});


	// deserializing is to retrieve all user info from its user id
	passport.deserializeUser(function(id, done) {
	  	// Sequelize findById promise is to get the user, and if successful, an instance of the Sequelize model is returned.
	  	// To get the User object from this instance, we use the Sequelize getter: user.get().
	  	User.findById(id).then(function(user) {
	    	if(user){
	      		done(null, user.get());
	    	}else{
	      		done(user.errors,null);
	    	}
	  	});
	});

	// local signup passport
	passport.use('local-signup', new LocalStrategy(
	{           
	  	// by default, local strategy uses username and password, we will override with email
	  	usernameField : 'email', 	// here we assign email as username for local-signup strategy
	  	passwordField : 'password',	// and password as password!
	  	passReqToCallback : true 	// allows us to pass back the entire request to the callback
	},
		// this function is a callback function for passport.use which is used to handle storing user's details
		function(req, email, password, done){
		   	
		   	// we are adding hashed password generating function inside the callback function
		  	var generateHash = function(password) {
		  	return bCrypt.hashSync(password, bCrypt.genSaltSync(9), null);
		  	};
		  	// User is an initializes Sequelize user model as per user.js
		  	// using User we check if the users already exist, and if not we add them to database 
		   	
		   	// more detailed email validation based on Sequelize
		   	
		  	if (!validator.isEmail(email)) return done(null, false, req.flash('signupMessage', 'The email is not valid!'));

		   	User.findOne({where: {email:email}}).then(function(user){

			  	if(user)
			  	{
			    	return done(null, false, req.flash('signupMessage', 'That email is already taken!'));
			  	}else if (req.body.password != req.body.password2){
			  			return done(null, false, req.flash('signupMessage', 'Passwords mismatch!'));
			  	}else {
			    	var userPassword = generateHash(password);
			    	// here req.body object contains inputs from signup form. 
			    	var data =
			    		{ 
			    			email:email,
						    password:userPassword,
						    firstname: req.body.firstname,
						    lastname: req.body.lastname
					    };
					// User.create is a Sequelize method for adding new entries to the database (similar to mongoose!)
			    	User.create(data).then(function(newUser,created){
				     	if(!newUser){
				        	return done(null,false);
				      	}
				      	if(newUser){
				        	return done(null,newUser);
				      	}

			    	});
			  	}
			}); 
		}
	));

	// local login passport
	passport.use('local-login', new LocalStrategy(
	{
	usernameField : 'email',
	passwordField : 'password',
	passReqToCallback : true
	},

		function(req, email, password, done) {
			var User = user;
			// isValidPassword function compares the password entered with the bCrypt comparison method
			// since we stored our password with bcrypt
			var isValidPassword = function(userpass,password){
			  	return bCrypt.compareSync(password, userpass);
			}

			User.findOne({ where : { email: email}}).then(function (user) {

			  	if (!user) {
			    	return done(null, false, req.flash('loginMessage', 'No user found!'));
			  	}

			  	if (!isValidPassword(user.password,password)) {
			    	return done(null, false, req.flash('loginMessage', 'Incorrect password!'));
			  	}

			  	var userinfo = user.get();
			  	return done(null,userinfo);
			}).catch(function(err){
			  	console.log("Error: ",err);
			  	return done(null, false, req.flash('loginMessage', 'Something went wrong with your Signin!' ));
			});
		}
	));





	// facebook signup passport
	passport.use(new FacebookStrategy({
	    clientID: configAuth.facebookAuth.clientID,
	    clientSecret: configAuth.facebookAuth.clientSecret,
	    callbackURL: configAuth.facebookAuth.callbackURL,
	    profileFields: ['id', 'emails', 'name']
	},
	  	// function(accessToken, refreshToken, profile, done) {
	  	function(accessToken, refreshToken, profile, done) {
	    	process.nextTick(function(){
   				
   				console.log("I am in facebook auth!");
   				console.log(profile.id);

				User.findOne({ where : { fid: profile.id}}).then(function (user) {

	    			if(user){
	    				var userinfo = user.get();
				  		return done(null,userinfo);
	    			}
	    			else {
	    				var data =
				    		{ 
				    			fid:profile.id,
				    			ftoken:accessToken, 
				    			email:profile.emails[0].value,
							    firstname:profile.name.givenName,
							    lastname:profile.name.familyName
						    };
						User.create(data).then(function(newUser,created){
					     	if(!newUser){
					        	return done(null,false);
					      	}else{
					        	return done(null,newUser);
					      	}
				    	});
				    	return null;
	    			}
	    		}).catch(function(err){
				  	console.log("Error: ",err);
				  	return done(null, false, req.flash('loginMessage', 'Something went wrong with your Signin!' ));
				});
			
			});

		}
	));
}
