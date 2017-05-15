module.exports = function(sequelize, Sequelize) {
	// Sequelize user model is initialized earlier as User
	var User = sequelize.define('user', {
		id: { autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
		firstname: { type: Sequelize.STRING},
		lastname: { type: Sequelize.STRING},
		email: { type:Sequelize.STRING, validate: {isEmail:true} },
		email2: { type:Sequelize.STRING, validate: {isEmail:true} },
		password : {type: Sequelize.STRING }, 
		last_login: {type: Sequelize.DATE},
        status: {type: Sequelize.ENUM('active','inactive'),defaultValue:'active' }
	});
	return User;
}


 // references:{model:'F_user', key:'f_id'}