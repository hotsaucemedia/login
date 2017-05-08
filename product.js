module.exports = function(sequelize, Sequelize) {
	// Sequelize user model is initialized earlier as User
	var Product = sequelize.define('product', {
		pid: { autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER},
		p_name: { type: Sequelize.STRING,notEmpty: true},
		P_desc: { type: Sequelize.STRING,notEmpty: true},
		p_category: {type: Sequelize.ENUM('general','special'),defaultValue:'general'},
		p_price : {type: Sequelize.INTEGER},
        status: {type: Sequelize.ENUM('available','notInStock'),defaultValue:'available' }
	});

	return Product; 

}
