// loading bcrypt module to secure passwords
var bCrypt = require('bcrypt');
// validator module helps to easily validate user inputs. It has Promises that are rejected when validation fails.
// I used this because HTML input validator is not perfect.
var validator 	= require('validator');
// var User        = require('../app/models/user');
// var Auth_user   = require('../app/models/auth_user');

// db is imported to be able to use mysql functions (FIND_IN_SET) while querying in sequelize!
// var db = require('../app/models/index.js');

// this function may serve to extract an array of emails from profile.emails in social networks
function getFields(input, field) {
    var output = [];
    for (var i=0; i < input.length ; ++i)
        output.push(input[i][field]);
    return output;
}

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
   	    console.log("@@@@@@@@@@@ serializing...");
	    done(null, user.id);
	});

	// deserializing is to retrieve all user info from its user id
	passport.deserializeUser(function(id, done) {
	  	// Sequelize findById promise is to get the user, and if successful, an instance of the Sequelize model is returned.
	  	// To get the User object from this instance, we use the Sequelize getter: user.get().
	  	User.findById(id).then(function(user) {
   		    console.log("@@@@@@@@@@@ de-serializing...");
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
		   	
		   	// more detailed email validation based on validator module
		  	if (!validator.isEmail(email)) return done(null, false, req.flash('signupMessage', 'The email is not valid!'));

//////////////////////////// to search for email inside a comma separated field!
		  //  	User.findOne({where: (db.sequelize.fn('FIND_IN_SET', email, db.sequelize.col('email')))}).then(function(user){
		  //  		if (user)
				// 	{
				// 		console.log("USER           : ", user.firstname);
				// 		return done(null, false, req.flash('signupMessage', 'That email is already taken!'));
				// 	}
				// else
				// 	return done(null, false, req.flash('signupMessage', 'This is a new email!'));
		  //  	});
///////////////////////////end of search

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
					    return User.update(data, { where: { email: email} }).then(function(){
					    	req.flash('signupMessage', 'Your account is successfully updated. Proceed login!');
					    	var userinfo = user.get();
					    	return done(null, userinfo);
						}).catch(function(err){
						  	console.log("###### Error : ",err);
						  	return done(null, false, req.flash('signupMessage', 'Problem in updating user information in user table!' ));
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
			    	return User.create(data).then(function(newUser,created){
				     	if(!newUser){
				        	return done(null,false);
				      	}
				      	if(newUser){
				        	return done(null,newUser);
				      	}
			    	}).catch(function(err){
						  	console.log("###### Error : ",err);
						  	return done(null, false, req.flash('signupMessage', 'Problem in registering new user!' ));
						});
			  		}
			  	}
			}).catch(function(err){
				console.log("###### Error : ",err);
				return done(null, false, req.flash('signupMessage', 'Problem in searching for email in the user table!' ));
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
			  	return done(null, false, req.flash('loginMessage', 'Problem in searching your email in the our database!' ));
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
				console.log("@@@@@@@@@@@ searching for f_id in user");
				User.findOne({ where : { f_id: profile.id }}).then(function (user) {
	    			if(user){
	    				console.log("@@@@@@@@@@@ executing user.get");	    				
	    				var userinfo = user.get();
				  		return done(null,userinfo);
	    			}else{
	    				var emailArray = profile.emails.map(function(item) {return item.value;});
	    				console.log("array of emails: " , emailArray);
	    				console.log("@@@@@@@@@@@ searching for facebook emails in user table");
				    	return User.findOne({ where : { email : {$in : emailArray } } }).then(function(user){
				    		if(user){
				    			var dataForAuth_user =
					    		{ 
					    			auth_id 	: profile.id,
					    			token 		: accessToken,
					    			firstname 	: profile.name.givenName,
					    			lastname 	: profile.name.familyName,
					    			user_id  	: user.id,
					    			imageURL 	: profile.photos[0].value,
					    			displayName : profile.displayName,
					    			provider_id : 1
							    };
							    dataForAuth_user["email"] = emailArray.toString();
						    	var data = {
								    f_id 	: profile.id,
								    f_token : accessToken,
								    f_name 	: profile.displayName
							    };
							    console.log("@@@@@@@@@@@ searching for f_id in auth_user table");
				    			return Auth_user.findOne({ where : { auth_id : profile.id }}).then(function(auth_user){
				    				if(auth_user){
				    					console.log("@@@@@@@@@@@ Updating Auth_table with new data from facebook");
				    					return Auth_user.update(dataForAuth_user, { where: { auth_id : profile.id } }).then(function(){
				    						console.log("@@@@@@@@@@@ updating user table by inserting f_id and f_token");
										    return User.update(data, { where: { email : profile.emails[0].value } }).then(function(){
										    	console.log("@@@@@@@@@@@ executing user.get");
										    	var userinfo = user.get();
										    	return done(null, userinfo);
									    	}).catch(function(err){
						  						console.log("###### Error : ",err);
						  						return done(null, false, req.flash('loginMessage', 'Something went wrong while updating your profile based on Facebook data!' ));
											});
								    	}).catch(function(err){
					  						console.log("###### Error : ",err);
					  						return done(null, false, req.flash('loginMessage', 'Something went wrong while updating your profile based on Facebook data!' ));
										});
				    				}else{
				    					console.log("@@@@@@@@@@@ No f_id and creating new facebook user in auth-user table");
								    	return Auth_user.create(dataForAuth_user).then(function(newAuthUser,created){
									     	if(!newAuthUser){
					  							return done(null, false, req.flash('loginMessage', 'Problem in registering your Facebook profile!' ));
									      	}else{
									        	console.log("A new facebook user is created!");
									        	console.log("@@@@@@@@@@@ updating user table by inserting f_id and f_token");
											    return User.update(data, { where: { email : profile.emails[0].value } }).then(function(){
											    	console.log("@@@@@@@@@@@ executing user.get");
											    	var userinfo = user.get();
											    	return done(null, userinfo);
										    	}).catch(function(err){
							  						console.log("###### Error : ",err);
							  						return done(null, false, req.flash('loginMessage', 'Something went wrong while updating your profile based on Facebook data!' ));
												});
									      	}
								    	}).catch(function(err){
					  						console.log("###### Error : ",err);
					  						return done(null, false, req.flash('loginMessage', 'Something went wrong while registering your Facebook profile in our database!' ));
										});
					    			}
				    			}).catch(function(err){
			  						console.log("###### Error : ",err);
			  						return done(null, false, req.flash('loginMessage', 'Something went wrong while searching facebook id in auth_user table!' ));
								});
				    		}else{
				    			var dataForUser =
					    		{ 
					    			firstname 	: profile.name.givenName,
					    			lastname 	: profile.name.familyName,
					    			f_id 		: profile.id,
					    			f_token 	: accessToken,
								    f_name 		: profile.displayName,
					    			email 		: profile.emails[0].value
							    };
							    console.log("@@@@@@@@@@@ creating a new user based on facebook profile");
				    			return User.create(dataForUser).then(function(newUser,created){
				    				if(!newUser){
			  							return done(null, false, req.flash('loginMessage', 'Problem in creating your local profile based on facebook data!' ));
							      	}else{
										var dataForAuth_user =
							    		{
							    			auth_id 	: profile.id,
							    			token 		: accessToken,
							    			firstname 	: profile.name.givenName,
							    			lastname 	: profile.name.familyName,
							    			user_id  	: newUser.id,
							    			imageURL 	: profile.photos[0].value,
							    			displayName : profile.displayName,
							    			provider_id : 1
									    };
									    dataForAuth_user["email"] = emailArray.toString(); 
									    console.log("@@@@@@@@@@@ creating a facebook profile");
								    	return Auth_user.create(dataForAuth_user).then(function(newAuthUser,created){
									     	if(!newAuthUser){
			  									return done(null, false, req.flash('loginMessage', 'Problem in registering your Facebook profile!' ));
									      	}else{
									      		return done(null, newUser);
									      	}
								    	}).catch(function(err){
				  							console.log("###### Error : ",err);
				  							return done(null, false, req.flash('loginMessage', 'Problem in registering your Facebook profile!' ));
										});
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
 				console.log("@@@@@@@@@@@ searching for g_id in user");
	    		// console.log(profile.emails);
	    		//profile.emails = [{ value: 'neghabi.mr@gmail.com', type: 'account' }, { value: 'rezaneghabi@gmail.com', type: 'account' }];
				User.findOne({ where : { g_id: profile.id }}).then(function (user) {
	    			if(user){
	    			   	console.log("@@@@@@@@@@@ executing user.get");		
						var userinfo = user.get();
				  		return done(null,userinfo);
	    			}else {
	    				var emailArray = profile.emails.map(function(item) {return item.value;});
	    				console.log("array of emails: " , emailArray);
	    				console.log("@@@@@@@@@@@ searching for google emails in user table");
				    	return User.findOne({ where : { email : {$in : emailArray } } }).then(function(user){
				    		if(user){
								var dataForAuth_user =
					    		{ 
					    			auth_id 	: profile.id,
					    			token 		: accessToken,
					    			firstname 	: profile.name.givenName,
					    			lastname 	: profile.name.familyName,
					    			user_id  	: user.id,
					    			imageURL 	: profile.photos[0].value,
					    			displayName : profile.displayName,
					    			provider_id : 2
							    };
							    dataForAuth_user["email"] = emailArray.toString();
							    var data = { 
								    g_id 	: profile.id,
								    g_token : accessToken,
								    g_name 	: profile.displayName
							    };
							    console.log("@@@@@@@@@@@ searching for g_id in auth_user table");
							    return Auth_user.findOne({ where : { auth_id : profile.id }}).then(function(auth_user){
				    				if(auth_user){
				    					console.log("@@@@@@@@@@@ Updating Auth_table with new data from google");
				    					return Auth_user.update(dataForAuth_user, { where: { auth_id : profile.id } }).then(function(){
				    						console.log("@@@@@@@@@@@ updating user table by inserting g_id and g_token");
										    return User.update(data, { where: { email : profile.emails[0].value } }).then(function(){
										    	console.log("@@@@@@@@@@@ executing user.get");
										    	var userinfo = user.get();
										    	return done(null, userinfo);
									    	}).catch(function(err){
						  						console.log("###### Error : ",err);
						  						return done(null, false, req.flash('loginMessage', 'Something went wrong while updating user table based on Google data!' ));
											});
								    	}).catch(function(err){
					  						console.log("###### Error : ",err);
					  						return done(null, false, req.flash('loginMessage', 'Something went wrong while updating auth-user table based on Google data!' ));
										});
									}else{
				    					console.log("@@@@@@@@@@@ No g_id and creating new google user in auth-user table");
								    	return Auth_user.create(dataForAuth_user).then(function(newAuthUser,created){
									     	if(!newAuthUser){
					  							return done(null, false, req.flash('loginMessage', 'Problem in registering your Google profile in auth_table!' ));
									      	}else{
									        	console.log("A new Google user is created!");
									        	console.log("@@@@@@@@@@@ updating user table by inserting g_id and g_token");
											    return User.update(data, { where: { email : profile.emails[0].value } }).then(function(){
											    	console.log("@@@@@@@@@@@ executing user.get");
											    	var userinfo = user.get();
											    	return done(null, userinfo);
										    	}).catch(function(err){
							  						console.log("###### Error : ",err);
							  						return done(null, false, req.flash('loginMessage', 'Something went wrong while updating your profile based on Google data!' ));
												});
									      	}
								    	}).catch(function(err){
					  						console.log("###### Error : ",err);
					  						return done(null, false, req.flash('loginMessage', 'Something went wrong while registering your Google profile in our database!' ));
										}); 
					    			}
				    			}).catch(function(err){
			  						console.log("###### Error : ",err);
			  						return done(null, false, req.flash('loginMessage', 'Something went wrong while searching google id in auth_user table!' ));
								});			
				    		}else{
				    			var dataForUser =
					    		{ 
					    			firstname 	: profile.name.givenName,
					    			lastname 	: profile.name.familyName,
					    			g_id 		: profile.id,
					    			g_token 	: accessToken,
								    g_name 		: profile.displayName,
					    			email 		: profile.emails[0].value
							    };
							   	console.log("@@@@@@@@@@@ creating a new user based on google profile");
				    			return User.create(dataForUser).then(function(newUser,created){
				    				if(!newUser){
			  							return done(null, false, req.flash('loginMessage', 'Problem in creating your local profile based on Google data!' ));
							      	}else{
										var dataForAuth_user =
							    		{
							    			auth_id 	: profile.id,
							    			token 		: accessToken,
							    			firstname 	: profile.name.givenName,
							    			lastname 	: profile.name.familyName,
							    			user_id  	: newUser.id,
							    			imageURL 	: profile.photos[0].value,
							    			displayName : profile.displayName,
							    			provider_id : 2
									    };
									    dataForAuth_user["email"] = emailArray.toString();
										console.log("@@@@@@@@@@@ creating a google profile");
								    	return Auth_user.create(dataForAuth_user).then(function(newAuthUser,created){
									     	if(!newAuthUser){
			  									return done(null, false, req.flash('loginMessage', 'Problem in registering your Google profile!' ));
									      	}else{
							        			return done(null, newUser);
									      	}
								    	}).catch(function(err){
				  							console.log("###### Error : ",err);
				  							return done(null, false, req.flash('loginMessage', 'Problem in registering your Google profile!' ));
										});
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
				console.log("@@@@@@@@@@@ searching for t_id in user");   				
				User.findOne({ where : { t_id: profile.id }}).then(function (user) {
	    			if(user){
	    				console.log("@@@@@@@@@@@ executing user.get");	    				
						var userinfo = user.get();
				  		return done(null,userinfo);
	    			}else {
	    				var emailArray = profile.emails.map(function(item) {return item.value;});
	    				console.log("array of emails: " , emailArray);
				    	console.log("@@@@@@@@@@@ searching for twitter emails in user table");
				    	return User.findOne({ where : { email : {$in : emailArray } } }).then(function(user){
				    		if(user){
				    			var name = profile.displayName.split(" ");
								var dataForAuth_user =
					    		{ 
					    			auth_id 	: profile.id,
					    			token 		: accessToken,
					    			firstname 	: name[0],
					    			lastname 	: name[1],
					    			user_id  	: user.id,
					    			imageURL 	: profile.photos[0].value,
					    			displayName : profile.displayName,
					    			provider_id : 3
							    };
							    dataForAuth_user["email"] = emailArray.toString();
							    var data = {
								    t_id 	: profile.id,
								    t_token : accessToken,
								    t_name 	: profile.displayName
							    };
							    console.log("@@@@@@@@@@@ searching for t_id in auth_user table");
							    return Auth_user.findOne({ where : { auth_id : profile.id }}).then(function(auth_user){
				    				if(auth_user){
				    					console.log("@@@@@@@@@@@ Updating Auth_table with new data from twitter");
				    					return Auth_user.update(dataForAuth_user, { where: { auth_id : profile.id } }).then(function(){
				    						console.log("@@@@@@@@@@@ updating user table by inserting t_id and t_token");
										    return User.update(data, { where: { email : profile.emails[0].value } }).then(function(){
										    	console.log("@@@@@@@@@@@ executing user.get");
										    	var userinfo = user.get();
										    	return done(null, userinfo);
									    	}).catch(function(err){
						  						console.log("###### Error : ",err);
						  						return done(null, false, req.flash('loginMessage', 'Something went wrong while updating user table based on Twitter data!' ));
											});
								    	}).catch(function(err){
					  						console.log("###### Error : ",err);
					  						return done(null, false, req.flash('loginMessage', 'Something went wrong while updating  auth_yser table based on Twitter data!' ));
										});
				    				}else{
				    					console.log("@@@@@@@@@@@ No t_id and creating new twitter user in auth-user table");
								    	return Auth_user.create(dataForAuth_user).then(function(newAuthUser,created){
									     	if(!newAuthUser){
					  							return done(null, false, req.flash('loginMessage', 'Problem in registering your Twitter profile!' ));
									      	}else{
									        	console.log("A new twitter user is created!");
									        	console.log("@@@@@@@@@@@ updating user table by inserting t_id and t_token");
											    return User.update(data, { where: { email : profile.emails[0].value } }).then(function(){
											    	console.log("@@@@@@@@@@@ executing user.get");
											    	var userinfo = user.get();
											    	return done(null, userinfo);
										    	}).catch(function(err){
							  						console.log("###### Error : ",err);
							  						return done(null, false, req.flash('loginMessage', 'Something went wrong while updating user table based on Twitter data!' ));
												});
									      	}
								    	}).catch(function(err){
					  						console.log("###### Error : ",err);
					  						return done(null, false, req.flash('loginMessage', 'Something went wrong while registering auth_user table!' ));
										});
					    			}
				    			}).catch(function(err){
			  						console.log("###### Error : ",err);
			  						return done(null, false, req.flash('loginMessage', 'Something went wrong while searching t_id in auth_user table!' ));
								});
				    		}else{
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
							    console.log("@@@@@@@@@@@ creating a new user based on twitter profile");
				    			return User.create(dataForUser).then(function(newUser,created){
				    				if(!newUser){
			  							return done(null, false, req.flash('loginMessage', 'Problem in creating your local profile based on twitter data!' ));
							      	}else{
						    			var name = profile.displayName.split(" ");
										var dataForAuth_user =
							    		{ 
							    			auth_id 	: profile.id,
							    			token 		: accessToken,
							    			firstname 	: name[0],
							    			lastname 	: name[1],
							    			user_id  	: newUser.id,
							    			imageURL 	: profile.photos[0].value,
							    			displayName : profile.displayName,
							    			provider_id : 3
									    };
									    dataForAuth_user["email"] = emailArray.toString();
									    console.log("@@@@@@@@@@@ creating a twitter profile");
								    	return Auth_user.create(dataForAuth_user).then(function(newAuthUser,created){
									     	if(!newAuthUser){
			  									return done(null, false, req.flash('loginMessage', 'Problem in registering your twitter profile!' ));
									      	}else{
									       		return done(null, newUser);
									      	}
								    	}).catch(function(err){
				  							console.log("###### Error : ",err);
				  							return done(null, false, req.flash('loginMessage', 'Problem in registering your twitter profile!' ));
										});
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
	    			}
	    		}).catch(function(err){
				  	console.log("###### Error : ",err);
				  	return done(null, false, req.flash('loginMessage', 'Problem in searching for twitter id in the local user table!' ));
				});
			});
		}
	));
}