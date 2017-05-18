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
	var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
	var TwitterStrategy = require('passport-twitter').Strategy;

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
		  		password_salt = bCrypt.genSaltSync(9);
		  		return bCrypt.hashSync(password, password_salt, null);
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
						    password 	: userPassword,
						    password_salt: password_salt,
						    firstname 	: req.body.firstname,
						    lastname 	: req.body.lastname
					    };
					    // updating user info only!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
					    User.update(data, { where: { email: email} }).then(function(){
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
   						    password_salt: password_salt,
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
			  		return done(null, false, req.flash('loginMessage', 'You must register first or try social networks as before!'));
			  	}

			  	if (!isValidPassword(user.password,password)) {
			    	return done(null, false, req.flash('loginMessage', 'Incorrect password!'));
			  	}

			  	var userinfo = user.get();
			  	return done(null,userinfo);
			}).catch(function(err){
			  	console.log("###### Error : ",err);
			  	return done(null, false, req.flash('loginMessage', 'Something went wrong with your Signin!' ));
			});
		}
	));


	// facebook signup passport
	passport.use(new FacebookStrategy({
	    clientID 			: configAuth.facebookAuth.clientID,
	    clientSecret 		: configAuth.facebookAuth.clientSecret,
	    callbackURL 		: configAuth.facebookAuth.callbackURL,
	    profileFields 		: ['id', 'emails', 'name', 'displayName', 'photos'],
	   	passReqToCallback 	: true 
	},
		function(req, accessToken, refreshToken, profile, done) {
	    	process.nextTick(function(){				
				User.findOne({ where : { f_id: profile.id }}).then(function (user) {
	    			if(user){	    				
						var userinfo = user.get();
				  		return done(null,userinfo);
	    			}else {
				    	User.findOne({ where : { email : profile.emails[0].value }}).then(function(user){
				    		if(user){
								var dataForAuth_user =
					    		{ 
					    			auth_id 	: profile.id,
					    			token 		: accessToken,
					    			firstname 	: profile.name.givenName,
					    			lastname 	: profile.name.familyName,
					    			email 		: profile.emails[0].value,
					    			user_id  	: user.id,
					    			imageURL 	: profile.photos[0].value,
					    			displayName : profile.displayName,
					    			provider_id : 1
							    };

						    	Auth_user.create(dataForAuth_user).then(function(newAuthUser,created){
							     	if(!newAuthUser){
			  							return done(null, false, req.flash('loginMessage', 'Problem in registering your Facebook profile!' ));
							      	}else{
							        	console.log("A new facebook user is created!");
							        	return null;
							      	}
						    	}).catch(function(err){
			  						console.log("###### Error : ",err);
			  						return done(null, false, req.flash('loginMessage', 'Something went wrong while registering your Facebook profile in our database!' ));
								});
					    		var data = { 
								    f_id 	: profile.id,
								    f_token : accessToken,
								    f_name 	: profile.displayName
							    };
							    User.update(data, { where: { email: profile.emails[0].value} }).then(function(){
							    	var userinfo = user.get();
							    	return done(null, userinfo);
						    	}).catch(function(err){
			  						console.log("###### Error : ",err);
			  						return done(null, false, req.flash('loginMessage', 'Something went wrong while updating your profile based on Facebook data!' ));
								});
							    				
				    		}else{
				    			console.log("08- This is your first facebook and you did not yet registered locally!");
				    			var dataForUser =
					    		{ 
					    			firstname 	: profile.name.givenName,
					    			lastname 	: profile.name.familyName,
					    			f_id 		: profile.id,
					    			f_token 	: accessToken,
								    f_name 		: profile.displayName,
					    			email 		: profile.emails[0].value
							    };
				    			User.create(dataForUser).then(function(newUser,created){
				    				if(!newUser){
			  							return done(null, false, req.flash('loginMessage', 'Problem in creating your local profile based on facebook data!' ));
							      	}else{
							      		console.log("10- This is your first facebook and you are just registered locally!");
										var dataForAuth_user =
							    		{
							    			auth_id 	: profile.id,
							    			token 		: accessToken,
							    			firstname 	: profile.name.givenName,
							    			lastname 	: profile.name.familyName,
							    			email 		: profile.emails[0].value,
							    			user_id  	: newUser.id,
							    			imageURL 	: profile.photos[0].value,
							    			displayName : profile.displayName,
							    			provider_id : 1
									    };
								    	Auth_user.create(dataForAuth_user).then(function(newAuthUser,created){
									     	if(!newAuthUser){
			  									return done(null, false, req.flash('loginMessage', 'Problem in registering your Facebook profile!' ));
									      	}else{
									        	console.log("12- The new facebook user is created!");
									        	return null;
									      	}
								    	}).catch(function(err){
				  							console.log("###### Error : ",err);
				  							return done(null, false, req.flash('loginMessage', 'Problem in registering your Facebook profile!' ));
										});
							        	return done(null, newUser);
							      	}
				    			}).catch(function(err){
								  	console.log("###### Error : ",err);
								  	return done(null, false, req.flash('loginMessage', 'Problem in registering your local user profile!' ));
								});
				    		}
				    	}).catch(function(err){
				  			console.log("###### Error : ",err);
				  			return done(null, false, req.flash('loginMessage', 'Problem in searching the local user table for Facebook email!' ));
						});	
				    	// return null;
	    			}
	    		}).catch(function(err){
				  	console.log("###### Error : ",err);
				  	return done(null, false, req.flash('loginMessage', 'Problem in searching for facebook id in the local user table!' ));
				});
			
			});
		}
	));




	passport.use(new GoogleStrategy({
	    clientID: configAuth.googleAuth.clientID,
	    clientSecret: configAuth.googleAuth.clientSecret,
	    callbackURL: configAuth.googleAuth.callbackURL,
   	   	passReqToCallback : true 

	},
		function(req, accessToken, refreshToken, profile, done) {
	    	process.nextTick(function(){				
				User.findOne({ where : { g_id: profile.id }}).then(function (user) {
	    			if(user){	    				
						var userinfo = user.get();
				  		return done(null,userinfo);
	    			}else {
				    	User.findOne({ where : { email : profile.emails[0].value }}).then(function(user){
				    		if(user){
								var dataForAuth_user =
					    		{ 
					    			auth_id 	: profile.id,
					    			token 		: accessToken,
					    			firstname 	: profile.name.givenName,
					    			lastname 	: profile.name.familyName,
					    			email 		: profile.emails[0].value,
					    			user_id  	: user.id,
					    			imageURL 	: profile.photos[0].value,
					    			displayName : profile.displayName,
					    			provider_id : 2
							    };

						    	Auth_user.create(dataForAuth_user).then(function(newAuthUser,created){
							     	if(!newAuthUser){
			  							return done(null, false, req.flash('loginMessage', 'Problem in registering your Google profile!' ));
							      	}else{
							        	console.log("A new Google user is created!");
							        	return null;
							      	}
						    	}).catch(function(err){
			  						console.log("###### Error : ",err);
			  						return done(null, false, req.flash('loginMessage', 'Something went wrong while registering your Google profile in our database!' ));
								});
					    		var data = { 
								    g_id 	: profile.id,
								    g_token : accessToken,
								    g_name 	: profile.displayName
							    };
							    User.update(data, { where: { email: profile.emails[0].value} }).then(function(){
							    	var userinfo = user.get();
							    	return done(null, userinfo);
						    	}).catch(function(err){
			  						console.log("###### Error : ",err);
			  						return done(null, false, req.flash('loginMessage', 'Something went wrong while updating your profile based on Google data!' ));
								});
							    				
				    		}else{
				    			console.log("08- This is your first Google and you did not yet registered locally!");
				    			var dataForUser =
					    		{ 
					    			firstname 	: profile.name.givenName,
					    			lastname 	: profile.name.familyName,
					    			g_id 		: profile.id,
					    			g_token 	: accessToken,
								    g_name 		: profile.displayName,
					    			email 		: profile.emails[0].value
							    };
				    			User.create(dataForUser).then(function(newUser,created){
				    				if(!newUser){
			  							return done(null, false, req.flash('loginMessage', 'Problem in creating your local profile based on Google data!' ));
							      	}else{
							      		console.log("10- This is your first Google and you are just registered locally!");
										var dataForAuth_user =
							    		{
							    			auth_id 	: profile.id,
							    			token 		: accessToken,
							    			firstname 	: profile.name.givenName,
							    			lastname 	: profile.name.familyName,
							    			email 		: profile.emails[0].value,
							    			user_id  	: newUser.id,
							    			imageURL 	: profile.photos[0].value,
							    			displayName : profile.displayName,
							    			provider_id : 2
									    };
								    	Auth_user.create(dataForAuth_user).then(function(newAuthUser,created){
									     	if(!newAuthUser){
			  									return done(null, false, req.flash('loginMessage', 'Problem in registering your Google profile!' ));
									      	}else{
									        	console.log("12- The new Google user is created!");
									        	return null;
									      	}
								    	}).catch(function(err){
				  							console.log("###### Error : ",err);
				  							return done(null, false, req.flash('loginMessage', 'Problem in registering your Google profile!' ));
										});
							        	return done(null, newUser);
							      	}
				    			}).catch(function(err){
								  	console.log("###### Error : ",err);
								  	return done(null, false, req.flash('loginMessage', 'Problem in registering your local user profile!' ));
								});
				    		}
				    	}).catch(function(err){
				  			console.log("###### Error : ",err);
				  			return done(null, false, req.flash('loginMessage', 'Problem in searching the local user table for Google email!' ));
						});	
				    	// return null;
	    			}
	    		}).catch(function(err){
				  	console.log("###### Error : ",err);
				  	return done(null, false, req.flash('loginMessage', 'Problem in searching for Google id in the local user table!' ));
				});
			
			});
		}
	));


passport.use(new TwitterStrategy({
	    consumerKey: configAuth.twitterAuth.consumerKey,
	    consumerSecret: configAuth.twitterAuth.consumerSecret,
	    callbackURL: configAuth.twitterAuth.callbackURL,
	    userProfileURL: "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true",
	    includeEmail: true,
   	   	passReqToCallback : true 

	},
		function(req, accessToken, refreshToken, profile, done) {
	    	process.nextTick(function(){				
				User.findOne({ where : { t_id: profile.id }}).then(function (user) {
	    			if(user){	    				
						var userinfo = user.get();
				  		return done(null,userinfo);
	    			}else {
				    	User.findOne({ where : { email : profile.emails[0].value }}).then(function(user){
				    		if(user){
				    			var name = profile.displayName.split(" ");
								var dataForAuth_user =
					    		{ 
					    			auth_id 	: profile.id,
					    			token 		: accessToken,
					    			firstname 	: name[0],
					    			lastname 	: name[1],
					    			email 		: profile.emails[0].value,
					    			user_id  	: user.id,
					    			imageURL 	: profile.photos[0].value,
					    			displayName : profile.displayName,
					    			provider_id : 3
							    };

						    	Auth_user.create(dataForAuth_user).then(function(newAuthUser,created){
							     	if(!newAuthUser){
			  							return done(null, false, req.flash('loginMessage', 'Problem in registering your twitter profile!' ));
							      	}else{
							        	console.log("A new twitter user is created!");
							        	return null;
							      	}
						    	}).catch(function(err){
			  						console.log("###### Error : ",err);
			  						return done(null, false, req.flash('loginMessage', 'Something went wrong while registering your twitter profile in our database!' ));
								});
					    		var data = {
								    t_id 	: profile.id,
								    t_token : accessToken,
								    t_name 	: profile.displayName
							    };
							    User.update(data, { where: { email: profile.emails[0].value} }).then(function(){
							    	var userinfo = user.get();
							    	return done(null, userinfo);
						    	}).catch(function(err){
			  						console.log("###### Error : ",err);
			  						return done(null, false, req.flash('loginMessage', 'Something went wrong while updating your profile based on twitter data!' ));
								});
							    				
				    		}else{
				    			console.log("08- This is your first twitter and you did not yet registered locally!");
				    			var name = profile.displayName.split(" ");
				    			var dataForUser =
					    		{ 
					    			firstname 	: name[0],
					    			lastname 	: name[1],
					    			t_id 		: profile.id,
					    			t_token 	: accessToken,
								    t_name 		: profile.displayName,
					    			email 		: profile.emails[0].value
							    };
				    			User.create(dataForUser).then(function(newUser,created){
				    				if(!newUser){
			  							return done(null, false, req.flash('loginMessage', 'Problem in creating your local profile based on twitter data!' ));
							      	}else{
							      		console.log("10- This is your first twitter and you are just registered locally!");
						    			var name = profile.displayName.split(" ");
										var dataForAuth_user =
							    		{ 
							    			auth_id 	: profile.id,
							    			token 		: accessToken,
							    			firstname 	: name[0],
							    			lastname 	: name[1],
							    			email 		: profile.emails[0].value,
							    			user_id  	: newUser.id,
							    			imageURL 	: profile.photos[0].value,
							    			displayName : profile.displayName,
							    			provider_id : 3
									    };
								    	Auth_user.create(dataForAuth_user).then(function(newAuthUser,created){
									     	if(!newAuthUser){
			  									return done(null, false, req.flash('loginMessage', 'Problem in registering your twitter profile!' ));
									      	}else{
									        	console.log("12- The new twitter user is created!");
									        	return null;
									      	}
								    	}).catch(function(err){
				  							console.log("###### Error : ",err);
				  							return done(null, false, req.flash('loginMessage', 'Problem in registering your twitter profile!' ));
										});
							        	return done(null, newUser);
							      	}
				    			}).catch(function(err){
								  	console.log("###### Error : ",err);
								  	return done(null, false, req.flash('loginMessage', 'Problem in registering your local user profile!' ));
								});
				    		}
				    	}).catch(function(err){
				  			console.log("###### Error : ",err);
				  			return done(null, false, req.flash('loginMessage', 'Problem in searching the local user table for twitter email!' ));
						});	
				    	// return null;
	    			}
	    		}).catch(function(err){
				  	console.log("###### Error : ",err);
				  	return done(null, false, req.flash('loginMessage', 'Problem in searching for twitter id in the local user table!' ));
				});
			});
		}
	));
}