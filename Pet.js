// Pet.js
const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Pet = sequelize.define('Pets', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  idade: {
    type: DataTypes.STRING
  },
  tipo: { // Cachorro, Gato ou Coelho
    type: DataTypes.STRING
  },
  raca: { 
    type: DataTypes.STRING,
  },
  localizacao: { 
    type: DataTypes.STRING,  
  },
  porte: { 
    type: DataTypes.STRING,  
  },
  vacinas: { 
    type: DataTypes.BOOLEAN, defaultValue: false 
  },
  descricao: {
    type: DataTypes.TEXT
  },
  imagem_url: { // Link da foto do bicho
    type: DataTypes.STRING
  }
});

module.exports = Pet;

