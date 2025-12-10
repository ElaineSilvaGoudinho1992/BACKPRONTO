// Adocao.js
const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Adocao = sequelize.define('Adocao', {
  localAdequado: {
    type: DataTypes.STRING,
    allowNull: false
  },
  outrosAnimais: {
    type: DataTypes.STRING
  },
  jaTeveAnimais: {
    type: DataTypes.STRING
  },
  motivo: {
    type: DataTypes.TEXT
  },
  nomeAnimal: {
    type: DataTypes.STRING 
  }
});

module.exports = Adocao;