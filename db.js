// db.js
require('dotenv').config(); // Carrega a senha do arquivo .env
const { Sequelize } = require('sequelize');

// Verifica se o link do banco existe
if (!process.env.DATABASE_URL) {
  console.error("❌ ERRO GRAVE: A variável DATABASE_URL não está no arquivo .env");
  process.exit(1);
}

// Cria a conexão
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Necessário para conectar ao Supabase de fora
    }
  }
});

module.exports = sequelize;