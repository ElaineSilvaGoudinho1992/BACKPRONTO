const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes, Op } = require('sequelize');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuração para Supabase
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

// 2. MODELOS DO BANCO (ATUALIZADOS)

// Modelo: Pet
const Pet = sequelize.define('Pets', {
    nome: { type: DataTypes.STRING, allowNull: false },
    idade: DataTypes.STRING,
    tipo: DataTypes.STRING,
    descricao: DataTypes.TEXT,
    raca: { type: DataTypes.STRING, defaultValue: 'SRD' },
    localizacao: { type: DataTypes.STRING, defaultValue: 'Abrigo' },
    porte: { type: DataTypes.STRING, defaultValue: 'Médio' },
    vacinas: { type: DataTypes.BOOLEAN, defaultValue: false },
    imagemUrl: { type: DataTypes.TEXT, field: 'imagem_url' },
    
    // NOVO CAMPO: Status de Adoção (substitui 'disponivel')
    statusAdocao: { 
        type: DataTypes.STRING, 
        defaultValue: 'Disponível', 
        allowNull: false 
    },
    // NOVO CAMPO: Referência ao Usuário que adotou (chave estrangeira)
    adotanteId: { 
        type: DataTypes.INTEGER, 
        allowNull: true 
    }
});

// Modelo: Usuário
const Usuario = sequelize.define('Usuarios', {
    nome: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    senha: { type: DataTypes.STRING, allowNull: false },
    telefone: DataTypes.STRING,
    endereco: DataTypes.STRING,
    cpf: DataTypes.STRING,
    isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
    tipoUsuario: { type: DataTypes.STRING, defaultValue: 'Adotante' }
});

// Modelo: Adoção
const Adocao = sequelize.define('Adocoes', {
    localAdequado: DataTypes.STRING,
    outrosAnimais: DataTypes.STRING,
    jaTeveAnimais: DataTypes.STRING,
    motivo: DataTypes.TEXT,
    status: { type: DataTypes.STRING, defaultValue: 'Pendente' } // Pendente, Aprovada, Rejeitada
});

// 2.1. ASSOCIAÇÕES (CHAVES ESTRANGEIRAS)

// Adoção se relaciona com Pet e Usuário
Adocao.belongsTo(Pet, { foreignKey: 'petId' });
Pet.hasMany(Adocao, { foreignKey: 'petId' });
Adocao.belongsTo(Usuario, { foreignKey: 'usuarioId' });
Usuario.hasMany(Adocao, { foreignKey: 'usuarioId' });

// Pet se relaciona diretamente com o Adotante (Usuário)
Pet.belongsTo(Usuario, { as: 'Adotante', foreignKey: 'adotanteId' });


sequelize
  .sync({ force: false })
  .then(async () => {   // <-- AGORA O THEN É ASYNC
    console.log('✅ Banco de dados sincronizado e tabelas criadas!');

    // CRIAÇÃO DE UM ADMIN PADRÃO (SE NÃO EXISTIR)
    const adminExists = await Usuario.findOne({ where: { email: 'admin@finalfeliz.com' } });

    if (!adminExists) {
      await Usuario.create({
        nome: 'Administrador Padrão',
        email: 'admin@finalfeliz.com',
        senha: 'admin', // Mude no futuro!
        isAdmin: true,
        tipoUsuario: 'Admin',
        telefone: '0000',
        endereco: 'Rua do Admin',
        cpf: '00000000000'
      });

      console.log("-> Admin padrão criado: admin@finalfeliz.com / admin");
    }

    // Só inicia o servidor DEPOIS de sincronizar e criar admin
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });

  })
  .catch(err => console.error("❌ Erro no banco:", err));

// 3. ROTAS DA API

// --- Rota Login ---
app.post('/api/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const user = await Usuario.findOne({ where: { email, senha } }); 
        if (user) {
            res.json({ 
                success: true, 
                user: { 
                    id: user.id,
                    nome: user.nome, 
                    email: user.email,
                    isAdmin: user.isAdmin,
                    tipoUsuario: user.tipoUsuario 
                } 
            });
        } else {
            res.status(401).json({ success: false, message: 'Email ou senha incorretos' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro no login' });
    }
});

// --- Rota Cadastro Usuário ---
app.post('/api/cadastro', async (req, res) => {
    try {
        const userData = { ...req.body, isAdmin: false, tipoUsuario: 'Adotante' };
        const novoUsuario = await Usuario.create(userData);
        res.json({ success: true, id: novoUsuario.id });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: 'Erro ao cadastrar. Email já existe?' });
    }
});

// --- Rota POST Adocao (ATUALIZADA: Seta status Pet para 'Em Análise') ---
app.post('/api/adocao', async (req, res) => {
    try {
        // Assume que req.body contém petId, usuarioId e os campos do formulário
        const { petId } = req.body;
        
        // 1. Verifica se o pet está disponível para evitar spam
        const pet = await Pet.findByPk(petId);
        if (!pet || pet.statusAdocao !== 'Disponível') {
             return res.status(400).json({ success: false, message: `O pet não está disponível (Status: ${pet.statusAdocao}).` });
        }

        // 2. Cria a solicitação de adoção (status 'Pendente' por padrão)
        await Adocao.create(req.body); 
        
        // 3. ATUALIZA o status do Pet para 'Em Análise'
        await Pet.update({ statusAdocao: 'Em Análise' }, {
            where: { id: petId } 
        });

        res.json({ success: true, message: 'Solicitação de adoção registrada com sucesso! O pet está agora "Em Análise".' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro ao registrar adoção.' });
    }
});


// --- Rota GET Adocoes (Para Painel Admin) ---
app.get('/api/adocoes', async (req, res) => {
    try {
        const adocoes = await Adocao.findAll({
            include: [
                { model: Pet, attributes: ['id', 'nome', 'tipo'] },
                { model: Usuario, attributes: ['id', 'nome', 'email'] }
            ],
            order: [['status', 'DESC'], ['createdAt', 'DESC']]
        });
        res.json(adocoes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar solicitações de adoção.' });
    }
});

// --- Rota PUT Adocoes (ATUALIZADA: Gerencia status Pet/Adotante) ---
app.put('/api/adocoes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Apenas o novo status ('Aprovada' ou 'Rejeitada') é necessário no body

        // 1. Busca a Adocao para obter o petId e usuarioId
        const adocao = await Adocao.findByPk(id);

        if (!adocao) {
             return res.status(404).json({ success: false, message: 'Solicitação de adoção não encontrada.' });
        }

        // 2. Atualiza o status da Adocao
        await adocao.update({ status: status });

        // 3. Lógica para Pet e outras Adoções
        if (status === 'Aprovada') {
            // Se APROVADA: Pet vai para 'Adotado' e registra quem adotou
            await Pet.update({ 
                statusAdocao: 'Adotado',
                adotanteId: adocao.usuarioId // Usa o ID do usuário da solicitação aprovada
            }, { where: { id: adocao.petId } });
            
            // Rejeita automaticamente as outras PENDENTES
            await Adocao.update({ status: 'Rejeitada' }, {
                where: { petId: adocao.petId, id: { [Op.ne]: id }, status: 'Pendente' }
            });
            return res.json({ success: true, message: 'Solicitação aprovada. Pet marcado como ADOTADO.' });
        
        } else if (status === 'Rejeitada') {
            // Se REJEITADA:
            // 1. Verifica se há outras solicitações 'Pendente' para o Pet
            const outrasPendentes = await Adocao.count({
                where: { petId: adocao.petId, status: 'Pendente' }
            });

            if (outrasPendentes === 0) {
                // Se não houver outras, Pet volta para 'Disponível'
                await Pet.update({ statusAdocao: 'Disponível' }, { where: { id: adocao.petId } });
                return res.json({ success: true, message: 'Solicitação rejeitada. Pet voltou para DISPONÍVEL.' });
            }
        }

        res.json({ success: true, message: `Solicitação marcada como ${status}.` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro ao processar solicitação de adoção.' });
    }
});


// --- Rota GET /api/pets (ATUALIZADA: Inclui o Adotante para a ListaAnimais) ---
app.get('/api/pets', async (req, res) => {
    try {
        const pets = await Pet.findAll({
            // Inclui o Adotante (Usuário) se houver um adotanteId
            include: [
                { 
                    model: Usuario, 
                    as: 'Adotante', 
                    attributes: ['nome'], // Apenas o nome é necessário para o frontend
                    required: false // LEFT JOIN: Retorna Pets mesmo que não tenham Adotante
                }
            ]
        });
        res.json(pets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar pets' });
    }
});


app.post('/api/pets', async (req, res) => {
    try {
        // Garante que o pet é criado como 'Disponível' por padrão (configurado no modelo)
        const novoPet = await Pet.create(req.body); 
        res.status(201).json({ success: true, pet: novoPet });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Erro ao salvar pet" });
    }
});

// --- Rota DELETE Pet ---
app.delete('/api/pets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await Pet.destroy({ where: { id: id } });

        if (resultado === 0) {
            return res.status(404).json({ success: false, message: 'Pet não encontrado.' });
        }
        res.status(200).json({ success: true, message: 'Pet excluído com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro ao excluir o pet.' });
    }
});

// --- Rota PUT Pet (Mantida, mas o PUT Adocoes faz a maior parte do controle de status) ---
app.put('/api/pets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // O PUT Pet agora pode ser usado para atualizar qualquer campo, mas o statusAdocao é controlado pelo admin.
        const [linhasAfetadas] = await Pet.update(req.body, { where: { id: id } });

        if (linhasAfetadas === 0) {
            return res.status(404).json({ success: false, message: 'Pet não encontrado ou nenhum dado alterado.' });
        }

        res.json({ success: true, message: 'Pet atualizado com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro ao atualizar o pet.' });
    }
});

// Usa a porta do Render ou a 3001 localmente
    const PORT = process.env.PORT || 3001;
    
    app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
}).catch((error) => {
    console.error('❌ Erro fatal ao conectar no banco:', error);
});
