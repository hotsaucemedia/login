
module.exports = function(app, passport){
	
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
	app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email']}),function(req,res){});

	// routes after callback from facebook login
	app.get('/auth/facebook/callback', passport.authenticate('facebook', { 
		successRedirect: '/profile',
	    failureRedirect: '/' 
	}));

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