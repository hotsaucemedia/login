module.exports = function(sequelize, Sequelize) {
	// Sequelize user model is initialized earlier as User
	var Auth_user = sequelize.define('auth_user', {
		// id: { autoIncrement: true, type: Sequelize.INTEGER, primaryKey: true },
		auth_id: { type: Sequelize.STRING, primaryKey: true },
		auth_token: {type:Sequelize.TEXT}
	});
	return Auth_user; 
}
