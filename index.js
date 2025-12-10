// index.js
const sequelize = require('./db');
const Projeto = require('./Projeto');

async function iniciarBanco() {
  try {
    // 1. Testa a conexão
    await sequelize.authenticate();
    console.log('✅ Conectado ao Supabase com sucesso!');

    // 2. Sincroniza (Cria a tabela se não existir)
    // 'force: true' apaga a tabela antiga e cria uma nova (cuidado em produção!)
    await sequelize.sync({ force: true });
    console.log('✅ Tabela Projetos criada!');

    // 3. Cria um projeto de teste
    await Projeto.create({
      titulo: 'Meu Site de Portfolio',
      descricao: 'Site criado com React e Supabase',
      link_site: 'https://front-and-bys3u6vm4.vercel.app/'
    });
    console.log('✅ Projeto inserido no banco de dados!');

  } catch (erro) {
    console.error('❌ Deu erro:', erro);
  }
}

iniciarBanco();