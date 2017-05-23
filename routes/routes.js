
module.exports = function(app, passport, user){
	var User = user;
	// route to homepage
	app.get('/', function(req, res){
		res.render('index.ejs', { message: req.flash('signupMessage') });
	});

	// route to login
	app.get('/login', function(req, res){
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	app.post('/login', passport.authenticate('local-login', {
		successRedirect: 	'/profile',
		failureRedirect: 	'/login',
		failureFlash: 		true
	}));


	// route to signup page
	app.get('/signup', function(req, res){
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect: 	'/login',
		failureRedirect: 	'/signup',
		failureFlash: 		true
	}));

	// route to profile page
	// isLoggedIn is a function middleware to check before any access to profile page
	app.get('/profile', isLoggedIn, function(req, res){		
		res.render('profile.ejs', {user: req.user});
	});


	// route to facebook login
	app.get('/auth/facebook', passport.authenticate('facebook', { authType: 'rerequest', scope: [ 'email', 'user_friends'] }),function(req,res){});

	// routes after callback from facebook login
	app.get('/auth/facebook/callback', passport.authenticate('facebook', { 
		successRedirect: '/profile',
	    failureRedirect: '/login' 
	}));


	app.get('/auth/google', passport.authenticate('google', { authType: 'rerequest', scope: ['profile', 'email']}));

	app.get('/auth/google/callback', passport.authenticate('google', {
		successRedirect: '/profile',
		failureRedirect: '/login' 
	}));


	app.get('/auth/twitter', passport.authenticate('twitter', { authType: 'rerequest', scope: ['profile', 'email']}));

	app.get('/auth/twitter/callback', passport.authenticate('twitter', {
		successRedirect: '/profile',
		failureRedirect: '/login'
	}));


	app.get('/connect/facebook', passport.authorize('facebook', { authType: 'rerequest', scope: [ 'email', 'user_friends'] }));
	app.get('/connect/google', passport.authorize('google', { authType: 'rerequest', scope: ['profile', 'email']}));
	app.get('/connect/twitter', passport.authorize('twitter', { authType: 'rerequest', scope: ['profile', 'email']}));

	app.get('/unlink/facebook', function(req, res){
		var user = req.user;
		user.f_id = null;
		user.f_token = null;
		user.f_name = null;
	    User.update(user, { where: { email: req.user.email} }).then(function(){
	    	req.flash('profileMessage', 'Your facebook account is unlinked!');
	    	res.redirect('/profile');
		}).catch(function(err){
		  	console.log("###### Error : ",err);
		  	return done(null, false, req.flash('profileMessage', 'Problem in updating user information in user table!' ));
		});
	});

	app.get('/unlink/google', function(req, res){
		var user = req.user;
		user.g_id = null;
		user.g_token = null;
		user.g_name = null;
	    User.update(user, { where: { email: req.user.email} }).then(function(){
	    	req.flash('profileMessage', 'Your google account is unlinked!');
	    	res.redirect('/profile');
		}).catch(function(err){
		  	console.log("###### Error : ",err);
		  	return done(null, false, req.flash('profileMessage', 'Problem in updating user information in user table!' ));
		});
	});

	app.get('/unlink/twitter', function(req, res){
		var user = req.user;
		user.t_id = null;
		user.t_token = null;
		user.t_name = null;
	    User.update(user, { where: { email: req.user.email} }).then(function(){
	    	req.flash('profileMessage', 'Your twitter account is unlinked!');
	    	res.redirect('/profile');
		}).catch(function(err){
		  	console.log("###### Error : ",err);
		  	return done(null, false, req.flash('profileMessage', 'Problem in updating user information in user table!' ));
		});
	});

	// route to logout page
	app.get('/logout', function(req, res){
		// console.log(req.session);
  		req.session.destroy(function(err) {
  		// console.log(req.session);
  			res.redirect('/');
  		});
	});
};


function isLoggedIn(req, res, next) {
	if(req.isAuthenticated()){
		return next();
	} 
	res.redirect('/login');
}