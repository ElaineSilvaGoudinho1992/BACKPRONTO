// Usuario.js
const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Usuario = sequelize.define('Usuario', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true // Não permite emails repetidos
  },
  senha: {
    type: DataTypes.STRING, // Em um app real, aqui usaríamos criptografia (hash)
    allowNull: false
  },
  telefone: {
    type: DataTypes.STRING
  },
  endereco: {
    type: DataTypes.STRING
  },
  cpf: {
    type: DataTypes.STRING,
    unique: true // CPF também deve ser único
  },
  // Adicionei rendaMensal pois vi que estava no seu estado inicial do React
  rendaMensal: {
    type: DataTypes.STRING, 
    allowNull: true
  }
});

module.exports = Usuario;