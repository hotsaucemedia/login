module.exports = function(sequelize, Sequelize) {
	// Sequelize user model is initialized earlier as User
	var Auth_user = sequelize.define('auth_user', {
		// id: { autoIncrement: true, type: Sequelize.INTEGER, primaryKey: true },
		id 			: 	{ type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
		auth_id 	: 	{ type: Sequelize.STRING },
		token 		:	{ type: Sequelize.TEXT },
		firstname 	: 	{ type: Sequelize.STRING },
		lastname 	: 	{ type: Sequelize.STRING },
		displayName : 	{ type: Sequelize.STRING },
		imageURL 	: 	{ type: Sequelize.STRING },
		email 		: 	{ type: Sequelize.STRING, validate: {isEmail:true} }
	});
	// Auth_user.drop();
	return Auth_user; 
}
