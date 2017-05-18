module.exports = function(sequelize, Sequelize) {
	// Sequelize user model is initialized earlier as User
	var User = sequelize.define('user', {
		id 			: 		{ type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
		firstname	: 		{ type: Sequelize.STRING },
		lastname	: 		{ type: Sequelize.STRING },
		email 		: 		{ type: Sequelize.STRING, validate: {isEmail:true} },
		password 	: 		{ type: Sequelize.STRING }, 
		password_salt: 		{ type: Sequelize.STRING },
		f_id		:   	{ type: Sequelize.STRING },
		f_token		:   	{ type: Sequelize.STRING },
		f_name 		:   	{ type: Sequelize.STRING },
		g_id		:   	{ type: Sequelize.STRING },
		g_token		:   	{ type: Sequelize.STRING },
		g_name 		:   	{ type: Sequelize.STRING },
		t_id		:   	{ type: Sequelize.STRING },
		t_token		:   	{ type: Sequelize.STRING },
		t_name 		:   	{ type: Sequelize.STRING },
		last_login	: 		{ type: Sequelize.DATE },
        status 		: 		{ type: Sequelize.ENUM('active','inactive'),defaultValue:'active' }
	});

	// User.drop();
	return User;
}
