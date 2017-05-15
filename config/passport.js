// "use strict";
// loading bcrypt module to secure passwords
var bCrypt = require('bcrypt');
// validator module helps to easily validate user inputs. It has Promises that are rejected when validation fails.
// I used this because HTML input validator is not perfect.
var validator 	= require('validator');
var User        = require('../app/models/user');
var Auth_user   = require('../app/models/auth_user');


module.exports = function(passport, user, auth_user){

	var User = user;
	var Auth_user = auth_user; 

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
	passport.use('local-signup', new LocalStrategy({           
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
		  	}
		  	// User is an initializes Sequelize user model as per user.js
		  	// using User we check if the users already exist, and if not we add them to database 
		   	
		   	// more detailed email validation based on Sequelize
		   	
		  	if (!validator.isEmail(email)) return done(null, false, req.flash('signupMessage', 'The email is not valid!'));

		   	User.findOne({where: {email:email}}).then(function(user) {

			  	if(user && user.password != null) {
			    	return done(null, false, req.flash('signupMessage', 'That email is already taken!'));
			  	} else if (user && user.password == null) {
			  		if (req.body.password != req.body.password2){
			  			return done(null, false, req.flash('signupMessage', 'Passwords mismatch!'));
			  		} else {
			  			var userPassword = generateHash(password);
			  			// here req.body object contains inputs from signup form. 
			    		var data = { 
			    			email 		: email,
						    password 	: userPassword,
						    firstname 	: req.body.firstname,
						    lastname 	: req.body.lastname
					    };
					    // updating user info only!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
					    User.update({ password: userPassword, firstname: req.body.firstname, lastname: req.body.lastname}, { where: { email: email} }).then(function(){
					    req.flash('signupMessage', 'Your account is successfully updated. Proceed login!');
					    // check return!!!!!!!!!!!!!!!user!!!!!!!!!!!!!!!!!!!111
					    var userinfo = user.get();
					    return done(null, userinfo);
						});
			  		}
			  		
			  	} else { // we must register new user
			  		if (req.body.password != req.body.password2){
			  			return done(null, false, req.flash('signupMessage', 'Passwords mismatch!'));
			  		} else {
			    	var userPassword = generateHash(password);
			    	// here req.body object contains inputs from signup form. 
			    	var data =
			    		{ 
			    			email 		: email,
						    password 	: userPassword,
						    firstname 	: req.body.firstname,
						    lastname 	: req.body.lastname
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
			  	}
			}); 
		}
	));

	// local login passport
	passport.use('local-login', new LocalStrategy({
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
			  	} else if (!user.password){
			  		return done(null, false, req.flash('loginMessage', 'You must register first or try Facebook login as before!'));
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
	   	// passReqToCallback : true 

	},
	  	function(accessToken, refreshToken, profile, done) {
	    	process.nextTick(function(){
   				console.log("I am in facebook auth!");
   				console.log(profile.id);
				
				User.findOne({ where : { auth_id: profile.id}}).then(function (user) {
	    			if(user){
	    				// TODO: get user info from corresponsing user or fuser table 
	    				var userinfo = user.get();
				  		return done(null,userinfo);
	    			}
	    			else {
	    				// TODO create a user in user table and save corresponding data in f-user as well
						var dataForUser =
				    		{ 
				    			firstname: profile.name.givenName,
				    			lastname: profile.name.familyName,
				    			auth_id:profile.id,
				    			email: profile.emails[0].value
						    };	    				

	    				var dataForAuth_user =
				    		{ 
				    			auth_id:profile.id,
				    			auth_token:accessToken,
				    			provider_id:1
						    };

						Auth_user.create(dataForAuth_user).then(function(newUser,created){
					     	if(!newUser){
					        	//return done(null,false);
					        	return null;
					      	}else{
					        	console.log("new facebook user is created!");
					        	// return done(null, newUser);
					        	return null;
					      	}
				    	});

				    	User.findOne({ where : { email : profile.emails[0].value}}).then(function(user){
				    		if(user){
				    			
				    			User.update({ auth_id:profile.id}, { where: { email: profile.emails[0].value} }).then(function(){
				    				var userinfo = user.get();
				    				return done(null, userinfo);		    				
				    			});
				    		}else{
				    			User.create(dataForUser).then(function(newUser,created){
				    				if(!newUser){
							        	return done(null,false);
							      	}else{
							        	return done(null, newUser);
							      	}
				    			});
				    		}
				    	});
				    	// return null;
	    			}
	    		}).catch(function(err){
				  	console.log("Error: ",err);
				  	return done(null, false, req.flash('loginMessage', 'Something went wrong with your Signin!' ));
				});
			
			});

		}
	));
}