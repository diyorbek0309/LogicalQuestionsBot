module.exports = class Models {
  static async UserModel(Sequelize, sequelize) {
    return await sequelize.define(
      "user",
      {
        id: {
          type: Sequelize.DataTypes.UUID,
          defaultValue: Sequelize.DataTypes.UUIDV4,
          primaryKey: true,
        },
        user_id: {
          type: Sequelize.DataTypes.BIGINT,
        },
        user_name: {
          type: Sequelize.DataTypes.STRING,
        },
        name: {
          type: Sequelize.DataTypes.STRING,
        },
        score: {
          type: Sequelize.DataTypes.ARRAY(Sequelize.DataTypes.JSON),
          allowNull: true,
        },
        answeredQuestions: {
          type: Sequelize.DataTypes.ARRAY(Sequelize.DataTypes.INTEGER),
          allowNull: true,
        },
      },
      { timestamps: true }
    );
  }
};
