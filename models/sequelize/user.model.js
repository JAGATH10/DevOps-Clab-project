module.exports = (sequelize, DataTypes) => {
	const User = sequelize.define(
		'user', // table name
		{
			// Model attributes are defined here
			id: {
				type: DataTypes.STRING(50),
				allowNull: false,
				primaryKey: true,
			},
			fullname: {
				type: DataTypes.STRING(100),
				allowNull: false,
			},
		},
		{
			tableName: 'user', // Explicitly set table name
		    timestamps: true,
		}
	);
	return User;
};
