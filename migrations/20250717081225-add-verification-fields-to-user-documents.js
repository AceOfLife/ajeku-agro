module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('UserDocuments', 'verifiedBy', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    });
    
    await queryInterface.addColumn('UserDocuments', 'verifiedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('UserDocuments', 'verifiedBy');
    await queryInterface.removeColumn('UserDocuments', 'verifiedAt');
  }
};