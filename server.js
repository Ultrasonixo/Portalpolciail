// server.js (Versão Final e Robusta)

require('dotenv').config(); // Carrega variáveis de ambiente do arquivo .env

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); // Para controle de acesso Cross-Origin
const bcrypt = require('bcrypt'); // Para hashing de senhas
const multer = require('multer'); // Para upload de arquivos
const path = require('path'); // Para manipulação de caminhos de arquivo
const fs = require('fs'); // Para deletar arquivos (logo)
const jwt = require('jsonwebtoken'); // Para autenticação baseada em token
const crypto = require('crypto'); // Para gerar tokens aleatórios
const axios = require('axios'); // Para verificar reCAPTCHA
const helmet = require('helmet'); // Middleware de segurança para headers HTTP
const rateLimit = require('express-rate-limit'); // Middleware para limitar requisições
const cron = require('node-cron'); // Para tarefas agendadas

const app = express();
const PORT = process.env.PORT || 3000;

// =================================================================
// --- MIDDLEWARES DE SEGURANÇA ---
// =================================================================
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// --- Configuração do CORS ---
const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
const corsOptions = {
    origin: frontendURL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

app.use(express.json());
app.set('trust proxy', 1);

// --- Limite de Requisições ---
const limiterConfig = {
	windowMs: 15 * 60 * 1000,
	max: 200,
	standardHeaders: true,
	legacyHeaders: false,
    message: { message: 'Muitas requisições originadas deste IP. Por favor, tente novamente após 15 minutos.' },
};
const apiLimiter = rateLimit(limiterConfig);
app.use('/api/', apiLimiter);

// =================================================================
// --- VARIÁVEIS DE AMBIENTE E VALIDAÇÃO ---
// =================================================================
const { JWT_SECRET, RECAPTCHA_SECRET_KEY, DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE } = process.env;

if (!JWT_SECRET || !RECAPTCHA_SECRET_KEY || !DB_HOST || !DB_USER || !DB_DATABASE) {
    console.error("ERRO CRÍTICO: Variáveis de ambiente essenciais (JWT_SECRET, RECAPTCHA_SECRET_KEY, DB_*) não estão definidas no arquivo .env!");
    process.exit(1);
}

// --- SERVIR ARQUIVOS ESTÁTICOS ---
// Define a pasta 'uploads' como pública para que o frontend possa acessar as imagens
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =================================================================
// --- CONFIGURAÇÃO DE UPLOAD DE ARQUIVOS (MULTER) ---
// =================================================================
// Filtro de arquivo para aceitar apenas imagens
const imageFileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo inválido. Apenas imagens (jpeg, png, gif, webp) são permitidas.'), false);
    }
};

// Configuração de armazenamento (salva em /uploads com nome único)
const storage = multer.diskStorage({
    destination: function (req, file, cb) { 
        const uploadPath = 'uploads/';
        // Cria o diretório se não existir
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
         const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
         cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(safeOriginalName));
    }
});

// UPLOAD GERAL (usado para BOs, etc)
const uploadAnexos = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 25 }, // 25MB
    fileFilter: (req, file, cb) => {
         const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/mpeg', 'video/quicktime'];
         if (allowedMimeTypes.includes(file.mimetype)) { cb(null, true); } else { cb(new Error('Tipo de arquivo inválido. Apenas imagens e vídeos são permitidos.'), false); }
    }
});

// UPLOAD SÓ DE IMAGEM (usado para Perfil e Logo do Portal)
const uploadImagem = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB para logos/perfil
    fileFilter: imageFileFilter // Reutiliza o filtro de imagem
});


// =================================================================
// --- CONEXÃO COM BANCO DE DADOS ---
// =================================================================
const db = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

db.getConnection()
  .then(connection => {
    console.log('Backend conectado com sucesso ao banco de dados.');
    connection.release();
  })
  .catch(err => {
    console.error('ERRO FATAL AO CONECTAR AO BANCO DE DADOS:', err);
    process.exit(1);
  });

// =================================================================
// --- FUNÇÕES AUXILIARES E MIDDLEWARES DE AUTH ---
// =================================================================

// --- [CORREÇÃO] MOVIDO PARA CIMA ---
// Função auxiliar para obter a conexão (NECESSÁRIA ANTES DE SER USADA)
const getDbConnection = (req) => {
    // Esta é uma implementação simples que retorna o pool global.
    // Se você estivesse usando multi-tenant (vários bancos), você pegaria o dbName do req.
    return db; 
}
// --- FIM DA CORREÇÃO ---

async function logAdminAction(userId, action, details, ipAddress) {
    const db = getDbConnection(null); // Usa o DB global
    try {
        const detailsString = typeof details === 'object' ? JSON.stringify(details) : String(details);
        const sql = 'INSERT INTO logs_auditoria (usuario_id, acao, detalhes, ip_address, data_log) VALUES (?, ?, ?, ?, NOW())';
        await db.query(sql, [userId, action, detailsString, ipAddress]);
        console.log(`[Audit Log] User ${userId} | IP ${ipAddress} | Action: ${action}`);
    } catch (logErr) {
        console.error(`ERRO AO LOGAR AÇÃO para User ${userId} (${action}) IP ${ipAddress}:`, logErr);
    }
}
async function verifyRecaptcha(token, remoteIp) {
    if (!token) return { success: false, message: 'Token reCAPTCHA não fornecido.' };
    try {
        const verificationUrl = `https://www.google.com/recaptcha/api/siteverify`;
        const params = new URLSearchParams();
        params.append('secret', RECAPTCHA_SECRET_KEY);
        params.append('response', token);
        if (remoteIp) params.append('remoteip', remoteIp);
        const response = await axios.post(verificationUrl, params);
        if (!response || !response.data) {
            console.error("Erro ao verificar reCAPTCHA: Resposta da API do Google está vazia ou malformada.");
            return { success: false, message: 'Erro de comunicação com o serviço reCAPTCHA.' };
        }
        const { success, 'error-codes': errorCodes } = response.data;
        if (!success) {
            const errorMessage = `Falha na verificação reCAPTCHA: ${errorCodes ? errorCodes.join(', ') : 'Erro desconhecido.'}`;
            return { success: false, message: errorMessage };
        }
        return { success: true };
    } catch (error) {
        console.error("Erro ao verificar reCAPTCHA:", error.response?.data || error.message);
        return { success: false, message: 'Erro interno ao comunicar com o reCAPTCHA.' };
    }
}

// 💥 [CORREÇÃO CRUCIAL] LÓGICA DE AUTENTICAÇÃO E INICIALIZAÇÃO (ID 1)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return next();
    jwt.verify(token, JWT_SECRET, async (err, decodedPayload) => {
        if (err || !decodedPayload?.id) {
            if (err) console.error(`[Auth] Erro ao verificar token: ${err.message}`);
            return next();
        }
        const { id: userId } = decodedPayload;
        const db = getDbConnection(req);
        try {
            let user = null;
            let userType = null;
            
            // 1. TENTA BUSCAR NA TABELA DE POLICIAIS (usuariospoliciais)
            const [pRes] = await db.query('SELECT id, nome_completo, passaporte, patente, corporacao, divisao, permissoes, status FROM usuariospoliciais WHERE id = ?', [userId]);
            
            if (pRes.length > 0 && pRes[0].status === 'Aprovado') {
                user = pRes[0];
                userType = 'policial';
                try { user.permissoes = user.permissoes ? JSON.parse(user.permissoes) : {}; } catch (e) { user.permissoes = {}; }
                
                // 💥 LÓGICA DE INICIALIZAÇÃO: O PRIMEIRO POLICIAL (ID 1)
                // Se for o ID 1 e não tiver as permissões de staff e rh, aplica-as.
                if (user.id === 1 && (!user.permissoes.is_staff || !user.permissoes.is_rh || !user.permissoes.is_dev)) {
                    console.log(`[INIT] Aplicando permissão Staff/RH/Dev ao Policial ID ${user.id} (Primeiro login).`);
                    
                    const newPermissoes = { 
                        is_staff: true, 
                        is_rh: true, 
                        is_dev: true, 
                        ...user.permissoes // Mantém outras permissões se existirem
                    };
                    
                    const newPermissoesJson = JSON.stringify(newPermissoes);
                    
                    await db.query("UPDATE usuariospoliciais SET permissoes = ? WHERE id = 1", [newPermissoesJson]);
                    
                    // Atualiza o objeto do usuário na requisição
                    user.permissoes = newPermissoes;
                }
                
                // ⚠️ SE FOR POLICIAL APROVADO, ele é o usuário.
            } else {
                // 2. TENTA BUSCAR NA TABELA DE CIDADÃOS (SOMENTE SE NÃO FOR POLICIAL)
                // Se o token for de um civil, o Staff/RH NÃO conseguirá fazer login, o que é o objetivo.
                const [cRes] = await db.query('SELECT id, nome_completo, id_passaporte, cargo FROM usuarios WHERE id = ?', [userId]);
                if (cRes.length > 0) {
                    user = cRes[0];
                    user.passaporte = user.id_passaporte;
                    userType = 'civil';
                    user.permissoes = {};
                }
            }
            
            if (user) req.user = { ...user, type: userType };
            return next();
            
        } catch (dbErr) {
            console.error(`[Auth] Erro DB ao buscar usuário do token (ID: ${userId}):`, dbErr);
            return res.status(500).json({ message: 'Erro interno do servidor durante a autenticação.' });
        }
    });
};
app.use(authenticateToken);

const requireAuth = (type) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Acesso negado. Token é necessário.' });
    
    // Se o usuário é Staff ou RH, permite acesso total, ignorando a restrição de 'type'.
    // Isso garante que o RH/Staff Policial (type: 'policial') consiga acessar rotas civis e policiais.
    if (req.user.permissoes?.is_rh || req.user.permissoes?.is_staff) {
        return next();
    }
    
    if (type && req.user.type !== type) return res.status(403).json({ message: `Acesso negado. Apenas para ${type}s.` });
    
    next();
};

const checkRh = (req, res, next) => {
    if (req.user?.type === 'policial' && req.user.permissoes?.is_rh === true) next();
    else res.status(403).json({ message: 'Acesso negado. Apenas para administradores RH.' });
};
const checkCivilPolice = (req, res, next) => {
    if (req.user?.type === 'policial' && req.user.corporacao === 'PC') next();
    else res.status(403).json({ message: 'Acesso negado. Apenas Polícia Civil.' });
};

// --- [NOVO] MIDDLEWARE PARA STAFF ---
const checkStaff = (req, res, next) => {
    // Permite se for 'is_staff' OU 'is_city_admin' OU 'is_dev' (Dev pode tudo)
    if (req.user?.type === 'policial' && (req.user.permissoes?.is_staff === true || req.user.permissoes?.is_city_admin === true || req.user.permissoes?.is_dev === true)) {
        next();
    } else {
        res.status(403).json({ message: 'Acesso negado. Apenas para Staff da Cidade.' });
    }
};

// --- [NOVO] MIDDLEWARE PARA DEV ---
const checkDev = (req, res, next) => {
    if (req.user?.type === 'policial' && req.user.permissoes?.is_dev === true) {
        next();
    } else {
        res.status(403).json({ message: 'Acesso negado. Apenas para Desenvolvedores.' });
    }
};

// --- [NOVO] MIDDLEWARE COMBINADO PARA RH/LOGS/ESTRUTURA ---
const checkRhOrStaffOrDev = (req, res, next) => {
     // Permite se for RH, Staff, City Admin ou Dev
     if (req.user?.type === 'policial' && (req.user.permissoes?.is_rh === true || req.user.permissoes?.is_staff === true || req.user.permissoes?.is_city_admin === true || req.user.permissoes?.is_dev === true)) {
        next();
    } else {
        res.status(403).json({ message: 'Acesso negado. Apenas para RH, Staff ou Desenvolvedor.' });
    }
};

const checkIsCivilAuthenticated = requireAuth('civil');
const checkIsPoliceAuthenticated = requireAuth('policial');


// =================================================================
// --- ROTAS ---
// =================================================================

// --- ROTAS PÚBLICAS (sem requireAuth ou check*) ---

// --- [ATUALIZADO] ROTA PÚBLICA PARA CONFIGURAÇÕES DO PORTAL (COM DB) ---
app.get('/api/public/portal-settings', async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    // Define os padrões
    const defaults = {
        header_title: "Secretaria Policia",
        header_subtitle: "Portal Oficial",
        header_logo_url: "/brasao.png",
        footer_copyright: `© ${new Date().getFullYear()} Consolação Paulista Roleplay. Todos os direitos reservados.`
    };

    try {
        // Tenta buscar do DB. Requer tabela `portal_settings` com colunas `setting_key` (PK) e `setting_value`
        const [settings] = await db.query("SELECT setting_key, setting_value FROM portal_settings WHERE setting_key IN ('header_title', 'header_subtitle', 'header_logo_url', 'footer_copyright')");
        
        // Transforma o array [ {key, value}, ... ] em um objeto { key: value, ... }
        const settingsObj = settings.reduce((acc, { setting_key, setting_value }) => {
            if (setting_value) { // Só adiciona se o valor não for nulo/vazio
                 acc[setting_key] = setting_value;
            }
            return acc;
        }, {});
        
        // Mescla os padrões com o que veio do DB (o que veio do DB sobrescreve o padrão)
        const finalSettings = { ...defaults, ...settingsObj };

        res.status(200).json(finalSettings);
    
    } catch (err) {
         // Se a tabela 'portal_settings' não existir (err.code === 'ER_NO_SUCH_TABLE') ou outra falha
         console.error("Erro ao buscar portal_settings (Tabela existe?):", err.message);
         // Retorna o fallback mockado em caso de erro
         res.status(200).json(defaults);
    }
});


// Registro de Cidadão
app.post('/api/auth/register', async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const recaptchaToken = req.body.recaptchaToken; //
    const verificationResult = await verifyRecaptcha(recaptchaToken, req.ip); //
    if (!verificationResult.success) {
        return res.status(400).json({ message: verificationResult.message }); //
    }
    const { id_passaporte, nome_completo, telefone_rp, gmail, senha } = req.body; //
    if (!id_passaporte || !nome_completo || !gmail || !senha) return res.status(400).json({ message: 'Campos obrigatórios: Passaporte, Nome, Gmail e Senha.' }); //
    try {
        const salt = await bcrypt.genSalt(10); //
        const senha_hash = await bcrypt.hash(senha, salt); //
        await db.query('INSERT INTO usuarios (id_passaporte, nome_completo, telefone_rp, gmail, senha_hash) VALUES (?, ?, ?, ?, ?)', [id_passaporte, nome_completo, telefone_rp, gmail, senha_hash]); //
        return res.status(201).json({ message: 'Cadastro realizado com sucesso!' }); //
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Passaporte ou Gmail já cadastrado.' }); //
        console.error("Erro no registo de cidadão:", err);
        return res.status(500).json({ message: 'Erro interno do servidor ao tentar registrar.' }); //
    }
});

// Login de Cidadão
app.post('/api/auth/login', async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const recaptchaToken = req.body.recaptchaToken; //
    const verificationResult = await verifyRecaptcha(recaptchaToken, req.ip); //
    if (!verificationResult.success) {
        return res.status(400).json({ message: verificationResult.message }); //
    }
    const { id_passaporte, senha } = req.body; //
    if (!id_passaporte || !senha) return res.status(400).json({ message: 'Por favor, forneça o passaporte e a senha.' }); //
    try {
        const [results] = await db.query('SELECT id, id_passaporte, nome_completo, senha_hash, cargo FROM usuarios WHERE id_passaporte = ?', [id_passaporte]); //
        if (results.length === 0) return res.status(401).json({ message: 'Credenciais inválidas.' }); // Usuário não encontrado
        const usuario = results[0]; //
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash); //
        if (!senhaCorreta) return res.status(401).json({ message: 'Credenciais inválidas.' }); // Senha incorreta
        const payloadCidadao = { id: usuario.id }; // Payload do JWT contém apenas o ID
        const tokenCidadao = jwt.sign(payloadCidadao, JWT_SECRET, { expiresIn: '12h' }); // Token expira em 12 horas
        return res.status(200).json({
            message: 'Login bem-sucedido!', token: tokenCidadao, //
            // Retorna dados básicos do usuário para o frontend
            usuario: { id: usuario.id, id_passaporte: usuario.id_passaporte, nome_completo: usuario.nome_completo, cargo: usuario.cargo, type: 'civil' } //
        });
    } catch (err) { console.error("Erro no login de cidadão:", err); return res.status(500).json({ message: 'Erro interno do servidor durante o login.' }); } //
});

// Listar Concursos (Público)
app.get('/api/concursos', async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    try {
        // Tenta buscar incluindo as colunas mais recentes
        const [results] = await db.query('SELECT id, titulo, descricao, vagas, status, data_abertura, data_encerramento, link_edital, valor, corporacao FROM concursos ORDER BY data_abertura DESC, data_encerramento DESC');
        res.status(200).json(results);
    } catch (err) {
        // Se falhar por coluna inexistente, tenta buscar sem 'valor' e 'corporacao'
        if (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_UNKNOWN_COLUMN') {
            console.warn("[Public Concursos] Coluna(s) 'valor' ou 'corporacao' ausente(s), tentando fallback...");
            try {
                const [fallbackResults] = await db.query('SELECT id, titulo, descricao, vagas, status, data_abertura, data_encerramento, link_edital FROM concursos ORDER BY data_abertura DESC, data_encerramento DESC'); //
                // Adiciona as colunas faltantes com valor null para manter a API consistente
                const finalResults = fallbackResults.map(concurso => ({ ...concurso, valor: null, corporacao: null })); //
                res.status(200).json(finalResults);
            } catch (fallbackErr) {
                console.error("[Public Concursos] Erro no fallback:", fallbackErr);
                res.status(500).json({ message: "Erro interno ao buscar concursos (fallback falhou)." }); //
            }
        } else {
            // Outro tipo de erro
            console.error("[Public Concursos] Erro ao buscar concursos:", err);
            res.status(500).json({ message: "Erro interno ao buscar concursos." }); //
        }
    }
});


// --- ROTAS DE REGISTRO/LOGIN POLICIAL (sem requireAuth, mas têm reCAPTCHA) ---
// Registro Policial (requer token de registro)
app.post('/api/policia/register', async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const recaptchaToken = req.body.recaptchaToken; //
    const verificationResult = await verifyRecaptcha(recaptchaToken, req.ip); //
    if (!verificationResult.success) {
        return res.status(400).json({ message: verificationResult.message }); //
    }
    const { nome_completo, passaporte, discord_id, telefone_rp, gmail, senha, registration_token } = req.body; //
    // Validação de campos obrigatórios
    if (!nome_completo || !passaporte || !discord_id || !gmail || !senha || !registration_token) return res.status(400).json({ message: 'Preencha todos os campos obrigatórios e o Token de Registo.' }); //
    try {
        // Verifica a validade do token de registro
        const [resToken] = await db.query(`SELECT id, corporacao, max_uses, use_count, expires_at FROM registration_tokens WHERE token = ? AND is_active = TRUE`, [registration_token]);
        if (resToken.length === 0) return res.status(400).json({ message: "Token de Registo inválido ou inativo." }); //
        const tokenData = resToken[0]; //
        // Verifica expiração e limite de usos
        if (new Date(tokenData.expires_at) < new Date()) return res.status(400).json({ message: "Token de Registo expirado." }); //
        if (tokenData.use_count >= tokenData.max_uses) return res.status(400).json({ message: "Token de Registo atingiu o limite de usos." }); //
        // Cria o hash da senha
        const salt = await bcrypt.genSalt(10); //
        const senha_hash = await bcrypt.hash(senha, salt); //
        // Insere o novo policial com status 'Em Análise'
        const [resUser] = await db.query(`INSERT INTO usuariospoliciais (nome_completo, passaporte, discord_id, telefone_rp, gmail, senha_hash, status, corporacao) VALUES (?, ?, ?, ?, ?, ?, "Em Análise", ?)`, [nome_completo, passaporte, discord_id, telefone_rp, gmail, senha_hash, tokenData.corporacao]);
        const novoPolicialId = resUser.insertId; //
        // Atualiza o contador de uso do token e desativa se necessário
        const newUseCount = tokenData.use_count + 1; //
        await db.query(`UPDATE registration_tokens SET use_count = ?, used_at = NOW(), is_active = ? WHERE id = ?`, [newUseCount, newUseCount < tokenData.max_uses, tokenData.id]); //
        // Registra o evento no histórico do policial
        await db.query('INSERT INTO policial_historico (policial_id, tipo_evento, descricao, data_evento) VALUES (?, ?, ?, NOW())', [novoPolicialId, 'Criação de Conta', `Conta criada via token para ${tokenData.corporacao}.`]); //
        return res.status(201).json({ message: 'Registo enviado com sucesso! Aguarde a aprovação do RH.' }); //
    } catch (err) {
        // Trata erro de chave duplicada (passaporte, discord_id, gmail)
        if (err.code === 'ER_DUP_ENTRY') {
            let field = 'Dado único'; //
            if (err.message.includes('passaporte')) field = 'Passaporte'; //
            else if (err.message.includes('discord_id')) field = 'Discord ID'; //
            else if (err.message.includes('gmail')) field = 'Gmail'; //
            return res.status(409).json({ message: `${field} já cadastrado no sistema.` }); //
        }
        console.error("Erro no registo policial:", err);
        return res.status(500).json({ message: 'Erro interno do servidor ao tentar registrar policial.' }); //
    }
});

// Login Policial
app.post('/api/policia/login', async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const recaptchaToken = req.body.recaptchaToken; //
    const verificationResult = await verifyRecaptcha(recaptchaToken, req.ip); //
    if (!verificationResult.success) {
        return res.status(400).json({ message: verificationResult.message }); //
    }
    const { passaporte, senha } = req.body; //
    if (!passaporte || !senha) return res.status(400).json({ message: 'Passaporte e senha são obrigatórios.' }); //
    try {
        // ⚠️ [FOCO] Policiais (Staff/RH) devem sempre usar este login
        const [results] = await db.query('SELECT id, passaporte, nome_completo, senha_hash, status, patente, corporacao, divisao, permissoes FROM usuariospoliciais WHERE passaporte = ?', [passaporte]); //
        if (results.length === 0) return res.status(401).json({ message: 'Credenciais inválidas.' }); // Policial não encontrado
        const policial = results[0]; //
        const senhaCorreta = await bcrypt.compare(senha, policial.senha_hash); //
        if (!senhaCorreta) return res.status(401).json({ message: 'Credenciais inválidas.' }); // Senha incorreta
        // Verifica o status da conta
        if (policial.status === 'Reprovado') return res.status(403).json({ message: 'Seu alistamento foi reprovado.' }); //
        if (policial.status !== 'Aprovado') return res.status(403).json({ message: 'Sua conta está inativa ou aguardando análise.' }); //
        // Parseia as permissões
        let permissoesObj = {}; try { if (policial.permissoes) permissoesObj = JSON.parse(policial.permissoes); } catch (e) {} //
        const payload = { id: policial.id }; // Payload do JWT
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }); // Token válido por 24 horas
        return res.status(200).json({
            message: 'Login bem-sucedido!', token: token, //
            // Retorna dados do policial logado
            policial: { id: policial.id, passaporte: policial.passaporte, nome_completo: policial.nome_completo, patente: policial.patente, corporacao: policial.corporacao, divisao: policial.divisao, permissoes: permissoesObj, type: 'policial' } //
        });
    } catch (err) { console.error("Erro no login policial:", err); return res.status(500).json({ message: 'Erro interno do servidor durante o login.' }); } //
});


// --- ROTAS DO PAINEL DE ADMINISTRAÇÃO (protegidas com checkRh) ---
app.post('/api/admin/generate-token', checkRh, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const adminUser = req.user; //
    const ipAddress = req.ip; //
    const { max_uses = 1, duration_hours = 24, corporacao } = req.body; // <-- [CORRIGIDO] Recebe corporação do corpo
    const corpTarget = corporacao || adminUser.corporacao; // Usa a corporação passada ou a do Admin logado

    const maxUsesInt = parseInt(max_uses, 10); //
    const durationHoursInt = parseInt(duration_hours, 10); //
    if (isNaN(maxUsesInt) || maxUsesInt < 1 || isNaN(durationHoursInt) || durationHoursInt <= 0) return res.status(400).json({ message: "Quantidade de usos ou duração inválida." }); //
    
    // [CORRIGIDO] Se o RH é de uma corporação específica, ele só pode gerar tokens para ela
    if (adminUser?.corporacao && corpTarget !== adminUser.corporacao) {
         return res.status(403).json({ message: `Administrador RH só pode gerar tokens para sua corporação (${adminUser.corporacao}).` });
    }
    if (!corpTarget) return res.status(400).json({ message: "Corporação para o token não definida." }); //

    const newToken = crypto.randomBytes(32).toString('hex'); //
    const now = new Date(); //
    const expiresAt = new Date(now.getTime() + durationHoursInt * 60 * 60 * 1000); //
    try {
        const insertSql = `INSERT INTO registration_tokens (token, corporacao, created_by_admin_id, expires_at, max_uses, is_active) VALUES (?, ?, ?, ?, ?, TRUE)`; //
        await db.query(insertSql, [newToken, corpTarget, adminUser.id, expiresAt, maxUsesInt]); //
        const logDetails = { uses: maxUsesInt, duration: durationHoursInt, corp: corpTarget, tokenStart: newToken.substring(0, 8) }; //
        await logAdminAction(adminUser.id, 'Generate Registration Token', logDetails, ipAddress); //
        res.status(201).json({ message: `Token gerado! Válido por ${durationHoursInt}h para ${maxUsesInt} uso(s).`, token: newToken }); //
    } catch (err) { console.error(`Erro ao inserir token de registro (IP: ${ipAddress}):`, err); res.status(500).json({ message: "Erro interno ao gerar token." }); } //
});

app.get('/api/admin/recrutas', checkRh, async (req, res) => {
     const db = getDbConnection(req); // <-- [CORREÇÃO]
     const adminCorporacao = req.user.corporacao; //
     if (!adminCorporacao) return res.status(400).json({ message: "Administrador sem corporação definida." }); //
     try {
         const sql = ` SELECT id, nome_completo, passaporte, discord_id, corporacao FROM usuariospoliciais WHERE status = 'Em Análise' AND corporacao = ? ORDER BY id ASC`; //
         const [results] = await db.query(sql, [adminCorporacao]); //
         res.status(200).json(results);
     } catch (err) { console.error("Erro ao buscar recrutas pendentes:", err); res.status(500).json({ message: "Erro interno ao buscar recrutas." }); } //
 });

// Rota para Aprovar/Reprovar Recrutas
app.put('/api/admin/recrutas/:id', checkRh, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const { id } = req.params;
    // ✅ RECEBE 'patente' do frontend agora
    const { novoStatus, divisao, patente } = req.body;
    const adminUser = req.user;
    const ipAddress = req.ip;

    if (!novoStatus || (novoStatus !== 'Aprovado' && novoStatus !== 'Reprovado')) {
        return res.status(400).json({ message: 'Ação inválida (deve ser Aprovar ou Reprovar).' });
    }

    try {
        const getRecrutaSql = "SELECT corporacao, nome_completo FROM usuariospoliciais WHERE id = ? AND status = 'Em Análise'";
        const [resGet] = await db.query(getRecrutaSql, [id]);

        if (resGet.length === 0) {
            return res.status(404).json({ message: "Recruta não encontrado ou já processado." });
        }
        const recruta = resGet[0];

        if (adminUser.corporacao !== recruta.corporacao) {
            return res.status(403).json({ message: `Ação não permitida. Gerencie apenas recrutas da sua corporação (${adminUser.corporacao}).` });
        }

        let sql, values, histDesc, tipoEvento, logAction, patenteParaSalvar; // Adicionado patenteParaSalvar

        if (novoStatus === 'Aprovado') {
            // ✅ VALIDAÇÃO: Verifica se divisão E patente foram enviadas
            if (!divisao || !patente) {
                return res.status(400).json({ message: 'Divisão e Patente são obrigatórias para aprovação.' });
            }

            patenteParaSalvar = patente; // Usa a patente recebida
            tipoEvento = 'Aprovação';
            // ✅ SQL: Atualiza status, patente e divisão
            sql = "UPDATE usuariospoliciais SET status = ?, patente = ?, divisao = ? WHERE id = ?";
            // ✅ VALUES: Inclui a patente recebida
            values = [novoStatus, patenteParaSalvar, divisao, id];
            histDesc = `Aprovado por ${adminUser.nome_completo}. Corporação: ${recruta.corporacao}, Divisão: ${divisao}, Patente Inicial: ${patenteParaSalvar}.`; // Usa a patente correta
            logAction = 'Approve Recruit';

        } else { // Reprovado
            patenteParaSalvar = null; // Garante null para reprovação
            tipoEvento = 'Reprovação';
            sql = "UPDATE usuariospoliciais SET status = ?, patente = NULL, divisao = NULL WHERE id = ?";
            values = [novoStatus, id];
            histDesc = `Reprovado por ${adminUser.nome_completo}.`;
            logAction = 'Reject Recruit';
        }

        const [updRes] = await db.query(sql, values);
        if (updRes.affectedRows === 0) {
             console.warn(`[Aprovação/Reprovação Recruta] Nenhuma linha afetada para ID ${id}. Status pode já ter sido alterado.`);
             return res.status(404).json({ message: 'Falha ao atualizar o status. Recruta pode já ter sido processado.' });
        }

        // --- Registra no histórico ---
        const histSql = 'INSERT INTO policial_historico (policial_id, tipo_evento, descricao, data_evento, responsavel_id) VALUES (?, ?, ?, NOW(), ?)';
        await db.query(histSql, [id, tipoEvento, histDesc, adminUser.id]);

        // --- Registra no log de auditoria ---
        // ✅ LOG: Inclui a patente correta (patenteParaSalvar)
        const logDetails = {
            targetUserId: parseInt(id),
            targetName: recruta.nome_completo,
            newStatus: novoStatus,
            adminId: adminUser.id,
            ...(novoStatus === 'Aprovado' && { division: divisao, rank: patenteParaSalvar }) // Inclui rank e divisao
        };
        await logAdminAction(adminUser.id, logAction, logDetails, ipAddress);

        res.status(200).json({ message: `Recruta ${novoStatus.toLowerCase()} com sucesso!` });

    } catch (err) {
        console.error(`Erro ao processar recruta ${id} (IP: ${ipAddress}):`, err);
        res.status(500).json({ message: "Erro interno do servidor ao processar recruta." });
    }
});

app.put('/api/admin/gerenciar-policial', checkRh, async (req, res) => { // Rota para Promoção/Rebaixamento
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const { policialId, acao, novaPatente } = req.body; //
    const adminUser = req.user; //
    const ipAddress = req.ip; //
    if (!policialId || !acao || !novaPatente) return res.status(400).json({ message: 'Dados insuficientes: policialId, acao e novaPatente são obrigatórios.' }); //
    if (!['Promoção', 'Rebaixamento'].includes(acao)) return res.status(400).json({ message: 'Ação inválida. Use "Promoção" ou "Rebaixamento".' }); //

    try {
        const [target] = await db.query("SELECT id, nome_completo, corporacao, patente FROM usuariospoliciais WHERE id = ?", [policialId]); //
        if (target.length === 0) return res.status(404).json({ message: "Policial alvo não encontrado." }); //
        const targetUser = target[0]; //
        if (adminUser.corporacao !== targetUser.corporacao) return res.status(403).json({ message: `Não permitido. Gerencie apenas policiais da sua corporação (${adminUser.corporacao}).` }); //

        // Atualiza a patente
        const [updRes] = await db.query("UPDATE usuariospoliciais SET patente = ? WHERE id = ?", [novaPatente, policialId]); //
        if (updRes.affectedRows === 0) return res.status(500).json({ message: "Erro: Não foi possível atualizar a patente do policial." }); // Talvez o ID estivesse errado?

        // Registra no histórico
        const desc = `${acao === 'Promoção' ? 'Promovido' : 'Rebaixado'} para ${novaPatente} por ${adminUser.nome_completo}.`; //
        await db.query( 'INSERT INTO policial_historico (policial_id, tipo_evento, descricao, data_evento, responsavel_id) VALUES (?, ?, ?, NOW(), ?)', [policialId, acao, desc, adminUser.id] ); //

        // Registra no log de auditoria
        const logDetails = { targetUserId: parseInt(policialId), targetName: targetUser.nome_completo, action: acao, previousRank: targetUser.patente , newRank: novaPatente, adminId: adminUser.id }; //
        await logAdminAction(adminUser.id, 'Manage Career', logDetails, ipAddress); //

        res.status(200).json({ message: `Policial ${targetUser.nome_completo} ${acao.toLowerCase()} com sucesso para ${novaPatente}!` }); //
    } catch (err) {
        console.error(`Erro ao gerenciar carreira do policial ${policialId} (IP: ${ipAddress}):`, err);
        res.status(500).json({ message: "Erro interno do servidor ao gerenciar carreira." }); //
    }
});

app.get('/api/admin/lista-oficiais', checkRh, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const adminCorporacao = req.user.corporacao; //
    if (!adminCorporacao) return res.status(400).json({ message: "Administrador sem corporação definida." }); //
    try {
        // Retorna apenas policiais APROVADOS da mesma corporação
        const [results] = await db.query("SELECT id, nome_completo, patente FROM usuariospoliciais WHERE status = 'Aprovado' AND corporacao = ? ORDER BY nome_completo ASC", [adminCorporacao]); //
        res.status(200).json(results);
    } catch (err) { console.error("Erro ao listar oficiais (admin):", err); res.status(500).json({ message: "Erro interno ao listar oficiais." }); } //
});

// Rota para criar anúncios (AJUSTADA)
app.post('/api/admin/anuncios', checkRh, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    // Pega os dados do corpo da requisição
    // 'corporacao' pode ser null (para Geral), 'PM', 'PC', 'GCM', etc.
    const { titulo, conteudo, corporacao } = req.body;
    const autor_id = req.user.id; // ID do admin logado (do middleware checkRh)
    const ipAddress = req.ip;

    // --- Validação básica ---
    if (!titulo || !conteudo) {
        return res.status(400).json({ message: 'Título e conteúdo são obrigatórios.' });
    }

    // --- Validação do valor de 'corporacao' (Opcional, mas recomendado) ---
    // Busca as siglas válidas da tabela corporacoes para usar na validação
    let VALID_CORPORATIONS = [];
    try {
        const [corpRes] = await db.query("SELECT sigla FROM corporacoes");
        VALID_CORPORATIONS = corpRes.map(c => c.sigla);
    } catch (dbErr) {
        console.warn("Não foi possível carregar as siglas de corporação para validação de anúncio. Usando fallback PM/PC/GCM.");
        VALID_CORPORATIONS = ['PM', 'PC', 'GCM'];
    }

    let targetCorporacao = corporacao; // Variável para armazenar o valor final

    // Verifica se 'corporacao' foi enviado e não é uma das válidas
    // Permite null (ou 'GERAL', dependendo de como o frontend envia)
    if (targetCorporacao !== null && targetCorporacao !== 'GERAL' && !VALID_CORPORATIONS.includes(targetCorporacao)) {
         return res.status(400).json({ message: `Corporação alvo inválida: '${targetCorporacao}'. Use uma das opções válidas ou 'Geral'.` });
    }

    // Padroniza 'GERAL' para null no banco (se o frontend enviar 'GERAL')
    if (targetCorporacao === 'GERAL') {
        targetCorporacao = null;
    }

    // --- Inserção no Banco de Dados ---
    try {
        console.log(`[Anuncio] Admin ${autor_id} publicando para: ${targetCorporacao || 'Geral'}`); // Log

        const [result] = await db.query(
            'INSERT INTO anuncios (titulo, conteudo, autor_id, corporacao, data_publicacao) VALUES (?, ?, ?, ?, NOW())',
            [titulo, conteudo, autor_id, targetCorporacao] // Usa targetCorporacao (pode ser null)
        );

        // --- Log da Ação Administrativa ---
        const logDetails = {
            announcementId: result.insertId,
            title: titulo,
            targetCorp: targetCorporacao || 'Geral', // Para o log
            adminId: autor_id
        };
        await logAdminAction(autor_id, 'Create Announcement', logDetails, ipAddress);

        res.status(201).json({ message: 'Anúncio publicado com sucesso!', id: result.insertId });

    } catch (err) {
        console.error(`[Anuncio] Erro ao criar anúncio por ${autor_id} (IP: ${ipAddress}):`, err);
        res.status(500).json({ message: 'Erro interno ao publicar anúncio.' });
    }
});

app.put('/api/admin/demitir/:id', checkRh, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const targetId = req.params.id; //
    const adminUser = req.user; //
    const ipAddress = req.ip; //
    if (!targetId) return res.status(400).json({ message: "ID do policial a ser demitido não fornecido." }); //
    if (adminUser.id === parseInt(targetId, 10)) return res.status(400).json({ message: "Ação inválida. Você não pode demitir a si mesmo." }); //
    try {
        const [target] = await db.query("SELECT id, nome_completo, corporacao FROM usuariospoliciais WHERE id = ?", [targetId]); //
        if (target.length === 0) return res.status(404).json({ message: "Policial alvo não encontrado." }); //
        const targetUser = target[0]; //
        if (adminUser.corporacao !== targetUser.corporacao) return res.status(403).json({ message: `Ação não permitida. Demita apenas policiais da sua corporação (${adminUser.corporacao}).` }); //

        // Muda status para 'Reprovado' e limpa patente/divisão
        const [updRes] = await db.query("UPDATE usuariospoliciais SET status = 'Reprovado', patente = NULL, divisao = NULL WHERE id = ?", [targetId]); //
        if (updRes.affectedRows === 0) return res.status(500).json({ message: "Erro: Não foi possível atualizar o status do policial para demitido." }); //

        // Registra no histórico
        const desc = `Demitido por ${adminUser.nome_completo}. Status alterado para Reprovado.`; //
        await db.query('INSERT INTO policial_historico (policial_id, tipo_evento, descricao, data_evento, responsavel_id) VALUES (?, ?, ?, NOW(), ?)', [targetId, 'Demissão', desc, adminUser.id]); //

        // Registra no log de auditoria
        const logDetails = { targetUserId: parseInt(targetId), targetName: targetUser.nome_completo, adminId: adminUser.id }; //
        await logAdminAction(adminUser.id, 'Dismiss Policial', logDetails, ipAddress); //

        res.status(200).json({ message: `Policial ${targetUser.nome_completo} foi demitido com sucesso.` }); //
    } catch (err) { console.error(`Erro ao demitir policial ${targetId} (IP: ${ipAddress}):`, err); res.status(500).json({ message: "Erro interno ao tentar demitir policial." }); } //
});

// --- [ATUALIZADO] Rota de Logs agora usa checkRhOrStaffOrDev ---
app.get('/api/admin/logs', checkRhOrStaffOrDev, async (req, res) => { // <-- CORREÇÃO APLICADA AQUI!
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const { page = 1, limit = 15, text = '', action = '', date = '' } = req.query; //
    const offset = (parseInt(page) - 1) * parseInt(limit); //
    const adminUser = req.user; //
    const adminCorporacao = adminUser.corporacao; //
    
    // --- [ATUALIZADO] Lógica de permissão de visualização ---
    const isStaffOrDev = adminUser.permissoes?.is_staff === true || adminUser.permissoes?.is_city_admin === true || adminUser.permissoes?.is_dev === true;
    const isRhGeral = adminUser.permissoes?.is_rh === true && !adminCorporacao;
    const canViewAll = isStaffOrDev || isRhGeral;
    // --- Fim da atualização ---

    try {
        let whereClauses = []; //
        let params = []; //

        // Filtra por corporação se o admin NÃO for Staff/Dev E NÃO for RH Geral
        if (!canViewAll) {
            // Regra: Vê ações da própria corporação OU Bug Reports OU Logs onde o detalhe menciona a corporação
            whereClauses.push('(u.corporacao = ? OR l.acao = "Bug Report" OR l.detalhes LIKE ?)'); //
            params.push(adminCorporacao, `%"corp":"${adminCorporacao}"%`); //
            console.log(`[Logs] Acesso restrito para RH da corporação: ${adminCorporacao} (User: ${adminUser.id})`);
        } else {
            console.log(`[Logs] Acesso geral para Staff/Dev/RH Geral (User: ${adminUser.id})`);
            // Vê tudo, não adiciona filtro de corporação inicial
        }

        // Adiciona filtros de texto, ação e data
        if (text) {
            whereClauses.push('(l.detalhes LIKE ? OR u.nome_completo LIKE ? OR l.ip_address LIKE ?)'); //
            const searchText = `%${text}%`; //
            params.push(searchText, searchText, searchText); //
        }
        if (action && action !== 'Todos') { // 'Todos' significa sem filtro de ação
            whereClauses.push('l.acao = ?'); //
            params.push(action); //
        }
        if (date) { // Filtra pela data exata
            whereClauses.push('DATE(l.data_log) = ?'); //
            params.push(date); //
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''; //

        // Query para buscar os logs paginados
        const logSql = `
            SELECT l.id, l.usuario_id, l.acao, l.detalhes, l.ip_address, l.data_log,
                   u.nome_completo as admin_nome, u.corporacao as admin_corporacao
            FROM logs_auditoria l
            LEFT JOIN usuariospoliciais u ON l.usuario_id = u.id
            ${whereString}
            ORDER BY l.data_log DESC
            LIMIT ? OFFSET ?`; //

        // Query para contar o total de logs com os mesmos filtros (para paginação)
        const countSql = `
            SELECT COUNT(*) as total
            FROM logs_auditoria l
            LEFT JOIN usuariospoliciais u ON l.usuario_id = u.id
            ${whereString}`; //

        // Executa ambas as queries em paralelo
        const [[logs], [countResult]] = await Promise.all([
            db.query(logSql, [...params, parseInt(limit), offset]), //
            db.query(countSql, params) //
        ]);
        const totalLogs = countResult[0].total; //

        // Tenta parsear a coluna 'detalhes' se for um JSON string
        logs.forEach(log => { try { if (log.detalhes?.startsWith('{') && log.detalhes?.endsWith('}')) log.detalhes = JSON.parse(log.detalhes); } catch (e) { /* Ignora se não for JSON válido */ } }); //

        res.status(200).json({
            logs, //
            currentPage: parseInt(page), //
            totalPages: Math.ceil(totalLogs / parseInt(limit)), //
            totalLogs: totalLogs //
        });
    } catch (err) { console.error("Erro ao buscar logs de auditoria:", err); res.status(500).json({ message: "Erro interno do servidor ao buscar logs." }); } //
});

app.get('/api/admin/search-policiais', checkRh, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const adminCorp = req.user.corporacao; //
    const { query } = req.query; //
    if (!query) return res.status(200).json([]); // Retorna vazio se não houver query
    if (!adminCorp) return res.status(400).json({ message: "Administrador sem corporação definida para buscar." }); //

    const searchTerm = `%${query}%`; //
    try {
        // Busca por nome ou passaporte DENTRO da corporação do admin e que estejam APROVADOS
        const sql = `
            SELECT id, nome_completo, passaporte, patente, divisao, discord_id, telefone_rp, gmail, corporacao
            FROM usuariospoliciais
            WHERE (nome_completo LIKE ? OR CAST(passaporte AS CHAR) LIKE ?)
              AND corporacao = ?
              AND status = 'Aprovado'
            LIMIT 10`; // Limita a 10 resultados para performance
        const [results] = await db.query(sql, [searchTerm, searchTerm, adminCorp]); //
        res.status(200).json(results);
    } catch (err) {
        console.error("Erro na busca de policiais:", err);
        res.status(500).json({ message: "Erro interno do servidor ao buscar policiais." }); //
    }
});

app.put('/api/admin/update-policial/:id', checkRh, async (req, res) => { // Rota para editar dados gerais
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const admin = req.user; const targetId = req.params.id; const newData = req.body; //
    const ipAddress = req.ip; //
    // Validação básica
    if (!newData.nome_completo || !newData.passaporte || !newData.patente || !newData.divisao) return res.status(400).json({ message: "Campos obrigatórios: Nome, Passaporte, Patente e Divisão." }); //
    try {
        const [target] = await db.query("SELECT * FROM usuariospoliciais WHERE id = ?", [targetId]); //
        if (target.length === 0) return res.status(404).json({ message: "Policial alvo não encontrado." }); //
        const current = target[0]; //
        if (current.corporacao !== admin.corporacao) return res.status(403).json({ message: `Ação não permitida. Edite apenas policiais da sua corporação (${admin.corporacao}).` }); //

        // Compara os dados atuais com os novos para registrar as mudanças
        let changes = []; //
        const fieldsToCompare = ['nome_completo', 'passaporte', 'discord_id', 'telefone_rp', 'patente', 'divisao']; //
        fieldsToCompare.forEach(field => {
            // Trata null/undefined como string vazia para comparação e converte passaporte para string
            const currentValue = field === 'passaporte' ? String(current[field] || '') : (current[field] || ''); //
            const newValue = field === 'passaporte' ? String(newData[field] || '') : (newData[field] || ''); //
            if (currentValue !== newValue) {
                changes.push(`${field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: "${currentValue}" -> "${newValue}"`); //
            }
        });

        if (changes.length === 0) return res.status(200).json({ message: "Nenhuma alteração detectada." }); //

        // Atualiza os dados no banco
        const sql = `UPDATE usuariospoliciais SET nome_completo=?, passaporte=?, discord_id=?, telefone_rp=?, patente=?, divisao=? WHERE id=?`; //
        const vals = [newData.nome_completo, newData.passaporte, newData.discord_id || null, newData.telefone_rp || null, newData.patente, newData.divisao, targetId]; //
        await db.query(sql, vals); //

        // Registra no histórico do policial
        const histDesc = `Dados atualizados por ${admin.nome_completo}: ${changes.join('. ')}.`; //
        await db.query('INSERT INTO policial_historico (policial_id, tipo_evento, descricao, data_evento, responsavel_id) VALUES (?, ?, ?, NOW(), ?)', [targetId, 'Atualização de Dados', histDesc, admin.id]); //

        // Registra no log de auditoria
        const logDetails = { targetUserId: parseInt(targetId), targetName: current.nome_completo, changes: changes.join('; '), adminId: admin.id }; //
        await logAdminAction(admin.id, 'Update Policial Data', logDetails, ipAddress); //

        res.status(200).json({ message: "Perfil do policial atualizado com sucesso!" }); //
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Erro: Conflito de dados. O passaporte, Discord ID ou Gmail informado já pode estar em uso.' }); //
        console.error(`Erro ao atualizar dados do policial ${targetId} (IP: ${ipAddress}):`, err);
        res.status(500).json({ message: "Erro interno do servidor ao atualizar dados." }); //
    }
});

app.post('/api/admin/concursos', checkRh, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const adminUserId = req.user.id;
    const adminCorporacao = req.user.corporacao;
    const ipAddress = req.ip;
    const { titulo, descricao, vagas, status, data_abertura, data_encerramento, link_edital, valor } = req.body;
    const numVagas = parseInt(vagas, 10);

    if (!adminCorporacao) return res.status(400).json({ message: "Administrador sem corporação definida." });
    if (!titulo || !descricao || !vagas || !status || !data_abertura || !data_encerramento) return res.status(400).json({ message: "Preencha todos os campos obrigatórios." });
    if (isNaN(numVagas) || numVagas <= 0) return res.status(400).json({ message: "Número de vagas deve ser positivo." });

    try {
        const insertSql = `INSERT INTO concursos (titulo, descricao, vagas, status, data_abertura, data_encerramento, link_edital, autor_id, valor, data_publicacao, corporacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`;
        const values = [titulo, descricao, numVagas, status, data_abertura, data_encerramento, link_edital || null, adminUserId, valor || null, adminCorporacao];
        const [result] = await db.query(insertSql, values);
        
        const logDetails = { concursoId: result.insertId, title: titulo, corp: adminCorporacao, adminId: adminUserId };
        await logAdminAction(adminUserId, 'Create Concurso', logDetails, ipAddress);
        
        res.status(201).json({ message: `Concurso para ${adminCorporacao} criado com sucesso!`, concursoId: result.insertId });

    } catch (err) {
        if (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_UNKNOWN_COLUMN') {
            console.warn(`[Admin] Falha ao criar concurso (provavelmente 'valor' ou 'corporacao' ausente), tentando fallback V2... IP: ${ipAddress}. Erro: ${err.message}`);
            
            try {
                // Tenta sem 'valor'
                const fallbackSqlV2 = `INSERT INTO concursos (titulo, descricao, vagas, status, data_abertura, data_encerramento, link_edital, autor_id, data_publicacao, corporacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`;
                const fallbackValuesV2 = [titulo, descricao, numVagas, status, data_abertura, data_encerramento, link_edital || null, adminUserId, adminCorporacao];
                const [fallbackResult] = await db.query(fallbackSqlV2, fallbackValuesV2);
                
                const logDetails = { concursoId: fallbackResult.insertId, title: titulo, corp: adminCorporacao, adminId: adminUserId };
                await logAdminAction(adminUserId, 'Create Concurso (Fallback V2)', logDetails, ipAddress);

                res.status(201).json({ message: `Concurso (fallback) para ${adminCorporacao} criado com sucesso!`, concursoId: fallbackResult.insertId });

            } catch (fallbackErr) {
                console.error(`[Admin] Erro no fallback V2 (provavelmente 'corporacao' ausente). Tentando V1... IP ${ipAddress}:`, fallbackErr);
                
                try {
                    // Tenta sem 'valor' e sem 'corporacao'
                    const fallbackSqlV1 = `INSERT INTO concursos (titulo, descricao, vagas, status, data_abertura, data_encerramento, link_edital, autor_id, data_publicacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
                    const fallbackValuesV1 = [titulo, descricao, numVagas, status, data_abertura, data_encerramento, link_edital || null, adminUserId];
                    const [oldestResult] = await db.query(fallbackSqlV1, fallbackValuesV1);

                    const logDetails = { concursoId: oldestResult.insertId, title: titulo, corp: 'N/A (fallback V1)', adminId: adminUserId };
                    await logAdminAction(adminUserId, 'Create Concurso (Fallback V1)', logDetails, ipAddress);

                    res.status(201).json({ message: `Concurso (fallback V1) criado com sucesso!`, concursoId: oldestResult.insertId });
                } catch (oldestErr) {
                     console.error(`[Admin] Erro no fallback V1 (mais antigo) ao CRIAR concurso IP ${ipAddress}:`, oldestErr);
                     res.status(500).json({ message: "Erro interno (todos os fallbacks falharam)." });
                }
            }
        } else {
            console.error(`Erro ao criar concurso IP ${ipAddress}:`, err);
            res.status(500).json({ message: "Erro interno ao salvar o concurso." });
        }
    }
});



// Rota para buscar UM concurso 
app.get('/api/admin/concursos/:id', checkRh, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const { id } = req.params;
    const adminCorporacao = req.user.corporacao;

    try {
        const [results] = await db.query(
            'SELECT id, titulo, descricao, vagas, status, data_abertura, data_encerramento, link_edital, valor, corporacao FROM concursos WHERE id = ?', 
            [id]
        );
        
        if (!results[0]) {
            return res.status(404).json({ message: "Concurso não encontrado." });
        }
        
        const concurso = results[0];

        // --- CHECAGEM DE PERMISSÃO ---
        // Se o concurso tem uma corporação (não é "Geral") E ela é DIFERENTE da do admin
        if (concurso.corporacao && concurso.corporacao !== adminCorporacao) {
            console.warn(`[Admin] Acesso negado. Admin (${adminCorporacao}) tentou VER concurso ${id} (${concurso.corporacao}).`);
            return res.status(403).json({ message: "Acesso negado. Você só pode gerenciar concursos da sua corporação." });
        }
        // Se 'concurso.corporacao' for null (Geral) ou igual, ele passa.

        res.status(200).json(concurso);

    } catch (err) {
        if (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_UNKNOWN_COLUMN') {
            console.warn(`[Admin] Erro ao buscar concurso ${id} (coluna ausente), tentando fallback...`);
            try {
                // Tenta buscar SEM 'valor', MAS COM 'corporacao' (para checagem)
                const [fallbackResults] = await db.query(
                    'SELECT id, titulo, descricao, vagas, status, data_abertura, data_encerramento, link_edital, corporacao FROM concursos WHERE id = ?', 
                    [id]
                );

                if (!fallbackResults[0]) {
                    return res.status(404).json({ message: "Concurso não encontrado (fallback)." });
                }

                const concursoFallback = fallbackResults[0];

                // --- CHECAGEM DE PERMISSÃO (NO FALLBACK) ---
                if (concursoFallback.corporacao && concursoFallback.corporacao !== adminCorporacao) {
                    console.warn(`[Admin Fallback] Acesso negado. Admin (${adminCorporacao}) tentou VER concurso ${id} (${concursoFallback.corporacao}).`);
                    return res.status(403).json({ message: "Acesso negado. Você só pode gerenciar concursos da sua corporação." });
                }

                const finalResult = { ...concursoFallback, valor: null };
                res.status(200).json(finalResult);

            } catch (fallbackErr) {
                // Se o fallback V2 falhou (provavelmente 'corporacao' também não existe)
                if (fallbackErr.code === 'ER_BAD_FIELD_ERROR' || fallbackErr.code === 'ER_UNKNOWN_COLUMN') {
                    console.warn(`[Admin] Fallback V2 falhou (provavelmente 'corporacao' ausente), tentando V1...`);
                    const [v1Results] = await db.query(
                        'SELECT id, titulo, descricao, vagas, status, data_abertura, data_encerramento, link_edital FROM concursos WHERE id = ?', 
                        [id]
                    );
                    if (!v1Results[0]) return res.status(404).json({ message: "Concurso não encontrado (fallback V1)." });
                    
                    // Se 'corporacao' não existe, é "Geral". Permite o acesso.
                    const finalResultV1 = { ...v1Results[0], valor: null, corporacao: null };
                    res.status(200).json(finalResultV1);
                } else {
                    console.error(`[Admin] Erro no fallback V2 ao buscar concurso ${id}:`, fallbackErr);
                    res.status(500).json({ message: "Erro interno (fallback V2 falhou)." });
                }
            }
        } else {
            console.error(`[Admin] Erro ao buscar concurso ${id}:`, err);
            res.status(500).json({ message: "Erro interno ao buscar concurso." });
        }
    }
});


// Rota para ATUALIZAR um concurso 
app.put('/api/admin/concursos/:id', checkRh, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const { id } = req.params;
    const adminCorporacao = req.user.corporacao;
    const { titulo, descricao, vagas, status, data_abertura, data_encerramento, link_edital, valor } = req.body;
    
    // --- INÍCIO DA CHECAGEM DE PERMISSÃO (LÓGICA DO DELETE) ---
    let corporacaoDoConcurso = null;
    try {
        // 1. Tenta verificar a corporação do concurso
        const [concursoAtual] = await db.query("SELECT corporacao FROM concursos WHERE id = ?", [id]);
        if (concursoAtual.length === 0) return res.status(404).json({ message: "Concurso não encontrado." });
        
        corporacaoDoConcurso = concursoAtual[0].corporacao;

        // 2. Checagem de permissão
        // Se o concurso TEM uma corporação E ela é DIFERENTE da do admin
        if (corporacaoDoConcurso && corporacaoDoConcurso !== adminCorporacao) {
            console.warn(`[Admin] Acesso negado. Admin (${adminCorporacao}) tentou EDITAR concurso ${id} (${corporacaoDoConcurso}).`);
            return res.status(403).json({ message: `Não pode editar concursos de outra corporação (${corporacaoDoConcurso}).` });
        }
        // Se for null (Geral) ou da mesma corporação, permite.

    } catch (err) {
        // 3. Verifica se o erro foi a coluna 'corporacao' não existir
        if (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_UNKNOWN_COLUMN') {
            console.warn(`[Admin] Falha ao checar 'corporacao' (coluna ausente) para editar ${id}. Tentando fallback...`);
            // 4. Fallback: Apenas verifica se o concurso existe
            try {
                const [concursoAtual] = await db.query("SELECT id FROM concursos WHERE id = ?", [id]);
                if (concursoAtual.length === 0) return res.status(404).json({ message: "Concurso não encontrado (fallback)." });
                // Se existe e a coluna 'corporacao' não existe, é "Geral". Permite a edição.
                corporacaoDoConcurso = 'N/A (fallback)';
            } catch (fallbackErr) {
                console.error(`Erro no fallback (SELECT) ao editar ${id}:`, fallbackErr);
                return res.status(500).json({ message: "Erro interno (fallback de checagem falhou)." });
            }
        } else {
            // Outro erro no SELECT inicial
            console.error(`Erro ao checar permissão para editar ${id}:`, err);
            return res.status(500).json({ message: "Erro interno ao checar concurso." });
        }
    }
    // --- FIM DA CHECAGEM DE PERMISSÃO ---

    // Se chegou até aqui, o admin tem permissão. Pode fazer o UPDATE.
    try {
        // 1. Tenta a query NOVA (com 'valor')
        await db.query(
            'UPDATE concursos SET titulo = ?, descricao = ?, vagas = ?, status = ?, data_abertura = ?, data_encerramento = ?, link_edital = ?, valor = ? WHERE id = ?',
            [titulo, descricao, vagas, status, data_abertura, data_encerramento, link_edital || null, valor || null, id]
        );
        res.status(200).json({ message: "Concurso atualizado com sucesso." });

    } catch (err) {
        // 2. Verifica se o erro é de coluna inexistente ('valor')
        if (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_UNKNOWN_COLUMN') {
            console.warn(`[Admin] Falha ao atualizar concurso ${id} (provavelmente 'valor' ausente), tentando fallback...`);
            
            try {
                // 3. Tenta a query ANTIGA (sem 'valor')
                await db.query(
                    'UPDATE concursos SET titulo = ?, descricao = ?, vagas = ?, status = ?, data_abertura = ?, data_encerramento = ?, link_edital = ? WHERE id = ?',
                    [titulo, descricao, vagas, status, data_abertura, data_encerramento, link_edital || null, id]
                );
                res.status(200).json({ message: "Concurso atualizado (fallback)." });

            } catch (fallbackErr) {
                console.error(`[Admin] Erro no fallback ao ATUALIZAR concurso ${id}:`, fallbackErr);
                res.status(500).json({ message: "Erro interno (fallback ao atualizar falhou)." });
            }
        } else {
            // 4. Outro erro
            console.error(`[Admin] Erro ao ATUALIZAR concurso ${id}:`, err);
            res.status(500).json({ message: "Erro interno ao atualizar concurso." });
        }
    }
});



// Rota para EXCLUIR um concurso 
app.delete('/api/admin/concursos/:id', checkRh, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const { id } = req.params;
    const adminUserId = req.user.id;
    const adminCorporacao = req.user.corporacao;
    const ipAddress = req.ip;

    if (!adminCorporacao) return res.status(403).json({ message: "Administrador sem corporação definida." });

    let corporacaoDoConcurso = null;

    try {
        // 1. Tenta verificar a corporação (Query NOVA)
        const [concursoAtual] = await db.query("SELECT corporacao FROM concursos WHERE id = ?", [id]);
        if (concursoAtual.length === 0) return res.status(404).json({ message: "Concurso não encontrado." });
        
        corporacaoDoConcurso = concursoAtual[0].corporacao; // Guarda para o log

        // 2. Checagem de permissão
        if (corporacaoDoConcurso && corporacaoDoConcurso !== adminCorporacao) {
             return res.status(403).json({ message: `Não pode excluir concursos de outra corporação (${corporacaoDoConcurso}).` });
        }
        // Se corporacaoDoConcurso for null (antigo), permite excluir

    } catch (err) {
        // 3. Verifica se o erro foi a coluna 'corporacao' não existir
        if (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_UNKNOWN_COLUMN') {
            console.warn(`[Admin] Falha ao checar 'corporacao' (coluna ausente) para deletar ${id}. Tentando fallback... IP: ${ipAddress}`);
            // 4. Fallback: Apenas verifica se o concurso existe
            try {
                const [concursoAtual] = await db.query("SELECT id FROM concursos WHERE id = ?", [id]);
                if (concursoAtual.length === 0) return res.status(404).json({ message: "Concurso não encontrado (fallback)." });
                // Se existe e a coluna 'corporacao' não existe, permite a exclusão (regra antiga)
                corporacaoDoConcurso = 'N/A (fallback)';
            } catch (fallbackErr) {
                console.error(`Erro no fallback (SELECT) ao deletar ${id} IP ${ipAddress}:`, fallbackErr);
                return res.status(500).json({ message: "Erro interno (fallback delete falhou)." });
            }
        } else {
            // Outro erro no SELECT inicial
            console.error(`Erro ao checar permissão para deletar ${id} IP ${ipAddress}:`, err);
            return res.status(500).json({ message: "Erro interno ao checar concurso." });
        }
    }

    // 5. Se passou pelas checagens, executa o DELETE
    try {
        const deleteSql = "DELETE FROM concursos WHERE id = ?";
        const [result] = await db.query(deleteSql, [id]);

        if (result.affectedRows === 0) return res.status(404).json({ message: "Concurso não encontrado (já deletado?)." });
        
        const logDetails = { concursoId: parseInt(id), corp: corporacaoDoConcurso, adminId: adminUserId };
        await logAdminAction(adminUserId, 'Delete Concurso', logDetails, ipAddress);
        
        res.status(200).json({ message: "Concurso excluído!" });
    
    } catch (err) {
        console.error(`Erro ao EXCLUIR concurso ${id} IP ${ipAddress}:`, err);
        res.status(500).json({ message: "Erro interno ao excluir." });
    }
});



// --- [INÍCIO] ROTAS DO PAINEL STAFF (protegidas com checkStaff) ---

// Rota para buscar usuários GLOBAIS (Policiais E Civis)
app.post('/api/staff/search-users', checkStaff, async (req, res) => {
    const db = getDbConnection(req);
    const { searchQuery, searchType } = req.body;
    const adminUser = req.user;
    const ipAddress = req.ip;

    const queryTerm = searchQuery ? `%${searchQuery}%` : null;
    const hasSearchTerm = queryTerm !== null;
    
    let queryParts = []; // Armazena os trechos SQL para UNION ALL
    let queryParams = []; // Armazena os parâmetros para as consultas

    try {
        // --- 1. Query para Policiais (usuariospoliciais) ---
        if (searchType === 'Todos' || searchType === 'Policial') {
            let policeWhere = [];
            let policeParams = [];

            // Apenas aplica o filtro LIKE se houver um termo de busca
            if (hasSearchTerm) {
                policeWhere.push('(nome_completo LIKE ? OR CAST(passaporte AS CHAR) LIKE ?)');
                policeParams.push(queryTerm, queryTerm);
            }
            
            const policeWhereString = policeWhere.length > 0 ? `WHERE ${policeWhere.join(' AND ')}` : '';

            const policeSelect = `
                (SELECT 
                    id, 
                    nome_completo, 
                    passaporte, 
                    status, 
                    corporacao, 
                    'Policial' as tipo
                FROM usuariospoliciais
                ${policeWhereString})
            `;
            queryParts.push(policeSelect);
            queryParams.push(...policeParams);
        }

        // --- 2. Query para Civis (usuarios) ---
        if (searchType === 'Todos' || searchType === 'Civil') {
            let civilWhere = [];
            let civilParams = [];
            
            // Apenas aplica o filtro LIKE se houver um termo de busca
            if (hasSearchTerm) {
                civilWhere.push('(nome_completo LIKE ? OR CAST(id_passaporte AS CHAR) LIKE ?)');
                civilParams.push(queryTerm, queryTerm);
            }

            const civilWhereString = civilWhere.length > 0 ? `WHERE ${civilWhere.join(' AND ')}` : '';
            
            // ESSENCIAL: Padronizar colunas de saída
            const civilSelect = `
                (SELECT 
                    id, 
                    nome_completo, 
                    id_passaporte as passaporte, 
                    'Ativo' as status,      /* Status Padrão para Civil */
                    NULL as corporacao,     /* Corporação é NULL para Civis */
                    'Civil' as tipo
                FROM usuarios
                ${civilWhereString})
            `;
            queryParts.push(civilSelect);
            queryParams.push(...civilParams);
        }
        
        if (queryParts.length === 0) {
            // Isso só deve acontecer se searchType for inválido
            return res.status(200).json({ users: [] }); 
        }

        // --- 4. Constrói a Query Final ---
        combinedSql = queryParts.join(' UNION ALL ');
        combinedSql += ' ORDER BY nome_completo ASC LIMIT 50'; 

        // Executa a Query Combinada
        const [users] = await db.query(combinedSql, queryParams);

        // Ação de Log
        await logAdminAction(adminUser.id, 'Staff Search Users', { query: searchQuery, type: searchType, results: users.length }, ipAddress);
        
        res.status(200).json({ users });

    } catch (err) {
        console.error(`[Staff Search] Erro ao buscar usuários (IP: ${ipAddress}):`, err);
        // Em caso de erro, retorna a mensagem
        res.status(500).json({ message: "Erro interno ao buscar usuários." });
    }
});

// Rota para Gerar Token GLOBAL (para qualquer corporação)
app.post('/api/staff/generate-global-token', checkStaff, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const adminUser = req.user;
    const ipAddress = req.ip;
    // Staff DEVE fornecer a corporação
    const { max_uses = 1, duration_hours = 24, corporacao } = req.body; 

    if (!corporacao) {
        return res.status(400).json({ message: "Corporação é obrigatória para gerar token global." });
    }

    const maxUsesInt = parseInt(max_uses, 10);
    const durationHoursInt = parseInt(duration_hours, 10);

    if (isNaN(maxUsesInt) || maxUsesInt < 1 || isNaN(durationHoursInt) || durationHoursInt <= 0) {
        return res.status(400).json({ message: "Quantidade de usos ou duração inválida." });
    }

    const newToken = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationHoursInt * 60 * 60 * 1000);

    try {
        const insertSql = `INSERT INTO registration_tokens (token, corporacao, created_by_admin_id, expires_at, max_uses, is_active) VALUES (?, ?, ?, ?, ?, TRUE)`;
        await db.query(insertSql, [newToken, corporacao, adminUser.id, expiresAt, maxUsesInt]);

        const logDetails = { uses: maxUsesInt, duration: durationHoursInt, corp: corporacao, tokenStart: newToken.substring(0, 8), generatedBy: 'Staff' };
        await logAdminAction(adminUser.id, 'Generate Global Token', logDetails, ipAddress);

        res.status(201).json({ message: `Token gerado para ${corporacao}! Válido por ${durationHoursInt}h para ${maxUsesInt} uso(s).`, token: newToken });

    } catch (err) {
        console.error(`[Staff Token] Erro ao inserir token de registro (IP: ${ipAddress}):`, err);
        res.status(500).json({ message: "Erro interno ao gerar token." });
    }
});

// --- [INÍCIO] ROTAS DE ESTRUTURA (DEPARTAMENTOS E HIERARQUIA) ---

// [ATUALIZADO] Rota para buscar a estrutura (AGORA USA checkRhOrStaffOrDev)
app.get('/api/staff/structure', checkRhOrStaffOrDev, async (req, res) => { // <-- CORREÇÃO APLICADA AQUI!
    const db = getDbConnection(req); // Pega a conexão
    try {
        // Busca os dados reais das novas tabelas
        const [corporacoes] = await db.query("SELECT * FROM corporacoes ORDER BY nome ASC");
        const [patentes] = await db.query("SELECT * FROM patentes ORDER BY corporacao_sigla, ordem ASC");
        const [divisoes] = await db.query("SELECT * FROM divisoes ORDER BY corporacao_sigla, nome ASC");
        
        res.status(200).json({ corporacoes, patentes, divisoes });
    } catch (err) {
        console.error("[Staff Structure] Erro ao buscar estrutura do DB:", err.message);
        // Fallback mockado se as tabelas não existirem
        if (err.code === 'ER_NO_SUCH_TABLE') {
             console.warn("[Staff Structure] Usando dados mockados. Crie as tabelas 'corporacoes', 'patentes', 'divisoes'.");
             res.status(200).json({ 
                corporacoes: [{id: 1, nome: 'PM (Mock)', sigla: 'PM'}, {id: 2, nome: 'PC (Mock)', sigla: 'PC'}],
                patentes: [{id: 1, nome: 'Soldado (Mock)', corporacao_sigla: 'PM', ordem: 1}, {id: 2, nome: 'Delegado (Mock)', corporacao_sigla: 'PC', ordem: 1}],
                divisoes: [{id: 1, nome: 'ROTA (Mock)', corporacao_sigla: 'PM'}, {id: 2, nome: 'GARRA (Mock)', corporacao_sigla: 'PC'}]
             });
        } else {
            res.status(500).json({ message: "Erro ao buscar estrutura." });
        }
    }
});

// [NOVO] CRUD para Corporações (MANTÉM checkStaff, pois é função de staff/dev)
app.post('/api/staff/corporacoes', checkStaff, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO] Pega a conexão
    const { nome, sigla } = req.body;
    if (!nome || !sigla) return res.status(400).json({ message: "Nome e Sigla são obrigatórios." });
    try {
        const [result] = await db.query("INSERT INTO corporacoes (nome, sigla) VALUES (?, ?)", [nome, sigla.toUpperCase()]);
        res.status(201).json({ message: 'Corporação criada!', id: result.insertId, nome, sigla: sigla.toUpperCase() });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Sigla já existe.' });
        console.error("Erro ao criar corporação:", err);
        res.status(500).json({ message: err.message });
    }
});
app.put('/api/staff/corporacoes/:id', checkStaff, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO] Pega a conexão
    const { id } = req.params;
    const { nome, sigla } = req.body;
    if (!nome || !sigla) return res.status(400).json({ message: "Nome e Sigla são obrigatórios." });
    try {
        await db.query("UPDATE corporacoes SET nome = ?, sigla = ? WHERE id = ?", [nome, sigla.toUpperCase(), id]);
        res.status(200).json({ message: 'Corporação atualizada!' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Sigla já existe.' });
        console.error("Erro ao editar corporação:", err);
        res.status(500).json({ message: err.message });
    }
});
app.delete('/api/staff/corporacoes/:id', checkStaff, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO] Pega a conexão
    const { id } = req.params;
    try {
        // TODO: Adicionar verificação se há policiais/patentes/divisões usando esta corporação antes de deletar
        await db.query("DELETE FROM corporacoes WHERE id = ?", [id]);
        res.status(200).json({ message: 'Corporação deletada!' });
    } catch (err) {
        console.error("Erro ao deletar corporação:", err);
        res.status(500).json({ message: err.message });
    }
});

// [NOVO] CRUD para Patentes
app.post('/api/staff/patentes', checkStaff, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO] Pega a conexão
    const { nome, corporacao_sigla, ordem } = req.body;
    if (!nome || !corporacao_sigla) return res.status(400).json({ message: "Nome e Corporação são obrigatórios." });
    try {
        const [result] = await db.query("INSERT INTO patentes (nome, corporacao_sigla, ordem) VALUES (?, ?, ?)", [nome, corporacao_sigla, parseInt(ordem, 10) || 0]);
        res.status(201).json({ message: 'Patente criada!', id: result.insertId });
    } catch (err) { 
        console.error("Erro ao criar patente:", err);
        res.status(500).json({ message: err.message }); 
    }
});
app.put('/api/staff/patentes/:id', checkStaff, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO] Pega a conexão
    const { id } = req.params;
    const { nome, corporacao_sigla, ordem } = req.body;
    if (!nome || !corporacao_sigla) return res.status(400).json({ message: "Nome e Corporação são obrigatórios." });
    try {
        await db.query("UPDATE patentes SET nome = ?, corporacao_sigla = ?, ordem = ? WHERE id = ?", [nome, corporacao_sigla, parseInt(ordem, 10) || 0, id]);
        res.status(200).json({ message: 'Patente atualizada!' });
    } catch (err) { 
        console.error("Erro ao editar patente:", err);
        res.status(500).json({ message: err.message }); 
    }
});
app.delete('/api/staff/patentes/:id', checkStaff, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO] Pega a conexão
    const { id } = req.params;
    try {
        // TODO: Adicionar verificação se há policiais usando esta patente
        await db.query("DELETE FROM patentes WHERE id = ?", [id]);
        res.status(200).json({ message: 'Patente deletada!' });
    } catch (err) { 
        console.error("Erro ao deletar patente:", err);
        res.status(500).json({ message: err.message }); 
    }
});

// [NOVO] CRUD para Divisões
app.post('/api/staff/divisoes', checkStaff, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO] Pega a conexão
    const { nome, corporacao_sigla } = req.body;
    if (!nome || !corporacao_sigla) return res.status(400).json({ message: "Nome e Corporação são obrigatórios." });
    try {
        const [result] = await db.query("INSERT INTO divisoes (nome, corporacao_sigla) VALUES (?, ?)", [nome, corporacao_sigla]);
        res.status(201).json({ message: 'Divisão criada!', id: result.insertId });
    } catch (err) { 
        console.error("Erro ao criar divisão:", err);
        res.status(500).json({ message: err.message }); 
    }
});
app.put('/api/staff/divisoes/:id', checkStaff, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO] Pega a conexão
    const { id } = req.params;
    const { nome, corporacao_sigla } = req.body;
    if (!nome || !corporacao_sigla) return res.status(400).json({ message: "Nome e Corporação são obrigatórios." });
    try {
        await db.query("UPDATE divisoes SET nome = ?, corporacao_sigla = ? WHERE id = ?", [nome, corporacao_sigla, id]);
        res.status(200).json({ message: 'Divisão atualizada!' });
    } catch (err) { 
        console.error("Erro ao editar divisão:", err);
        res.status(500).json({ message: err.message }); 
    }
});
app.delete('/api/staff/divisoes/:id', checkStaff, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO] Pega a conexão
    const { id } = req.params;
    try {
        // TODO: Adicionar verificação se há policiais usando esta divisão
        await db.query("DELETE FROM divisoes WHERE id = ?", [id]);
        res.status(200).json({ message: 'Divisão deletada!' });
    } catch (err) { 
        console.error("Erro ao deletar divisão:", err);
        res.status(500).json({ message: err.message }); 
    }
});

// --- [FIM] ROTAS DE ESTRUTURA ---

// Rota para Gerenciar Configurações do Portal
// --- [ATUALIZADO] Aceita upload de arquivo 'header_logo_file' ---
app.put('/api/staff/portal-settings', checkStaff, uploadImagem.single('header_logo_file'), async (req, res) => {
     const db = getDbConnection(req); // <-- [CORREÇÃO]
     // Usa uploadImagem.single() para o logo
     const { header_title, header_subtitle, footer_copyright, old_logo_url } = req.body;
     const newLogoFile = req.file; // O arquivo vem de req.file
     const adminUser = req.user;
     const ipAddress = req.ip;
     
     let newLogoPath = null;
     const logDetails = { changes: {} };

     try {
        // --- [CORREÇÃO] Esta é a lógica REAL para salvar no DB ---
        // A query 'INSERT ... ON DUPLICATE KEY UPDATE' é segura e eficiente
        // Ela tenta INSERIR, mas se a 'setting_key' (que deve ser PRIMARY KEY) já existir, ela ATUALIZA.
        
        // Salva o título
        await db.query("INSERT INTO portal_settings (setting_key, setting_value) VALUES ('header_title', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)", [header_title]);
        logDetails.changes.header_title = header_title;
        
        // Salva o subtítulo (se você tiver no frontend)
        await db.query("INSERT INTO portal_settings (setting_key, setting_value) VALUES ('header_subtitle', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)", [header_subtitle || 'Portal Oficial']);
        logDetails.changes.header_subtitle = header_subtitle;

        // Salva o copyright
        await db.query("INSERT INTO portal_settings (setting_key, setting_value) VALUES ('footer_copyright', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)", [footer_copyright]);
        logDetails.changes.footer_copyright = footer_copyright;


        // Se um NOVO logo foi enviado
        if (newLogoFile) {
            newLogoPath = `/uploads/${newLogoFile.filename}`;
            // Salva o novo caminho do logo no DB
            await db.query("INSERT INTO portal_settings (setting_key, setting_value) VALUES ('header_logo_url', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)", [newLogoPath]);
            logDetails.changes.header_logo_url = newLogoPath;
            
            // Deleta o logo antigo, se ele existir e for um caminho local
            if (old_logo_url && old_logo_url.startsWith('/uploads/')) {
                const oldLogoDiskPath = path.join(__dirname, old_logo_url);
                // Verifica se o arquivo existe antes de tentar deletar
                if (fs.existsSync(oldLogoDiskPath)) {
                    fs.unlink(oldLogoDiskPath, (err) => {
                        if (err) console.error(`[Staff Settings] Falha ao deletar logo antigo: ${oldLogoDiskPath}`, err.message);
                        else console.log(`[Staff Settings] Logo antigo deletado: ${oldLogoDiskPath}`);
                    });
                } else {
                    console.warn(`[Staff Settings] Logo antigo não encontrado para deletar: ${oldLogoDiskPath}`);
                }
            }
        }

         await logAdminAction(adminUser.id, 'Update Portal Settings', logDetails, ipAddress);

         res.status(200).json({ 
            message: "Configurações do portal atualizadas com sucesso!",
            new_logo_url: newLogoPath // Retorna o caminho do novo logo para o frontend atualizar
         });
     } catch (err) {
         console.error(`[Staff Settings] Erro ao salvar configurações (IP: ${ipAddress}):`, err);
         // Se a tabela 'portal_settings' não existir
         if (err.code === 'ER_NO_SUCH_TABLE') {
             return res.status(500).json({ message: "Erro: A tabela 'portal_settings' não foi encontrada no banco de dados." });
         }
         res.status(500).json({ message: "Erro interno ao salvar configurações." });
     }
});

// --- [FIM] ROTAS DO PAINEL STAFF ---

// --- ROTAS POLICIAIS GERAIS (protegidas com checkIsPoliceAuthenticated) ---
app.get('/api/policia/dashboard-stats', checkIsPoliceAuthenticated, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    try {
        const [[totalBoletinsRes], [boletinsAbertosRes], [policiaisAtivosRes]] = await Promise.all([ //
            db.query("SELECT COUNT(*) as count FROM ocorrencias"), //
            db.query("SELECT COUNT(*) as count FROM ocorrencias WHERE status = 'Aguardando Análise' OR status = 'Em Investigação'"), //
            db.query("SELECT COUNT(*) as count FROM usuariospoliciais WHERE status = 'Aprovado'") //
        ]);
        res.status(200).json({
            totalBoletins: totalBoletinsRes[0].count, //
            boletinsAbertos: boletinsAbertosRes[0].count, //
            policiaisAtivos: policiaisAtivosRes[0].count //
        });
    } catch (err) {
        console.error("Erro ao buscar estatísticas do dashboard:", err);
        res.status(500).json({ message: "Erro interno ao carregar estatísticas." }); //
    }
});

app.get('/api/policia/boletins', checkIsPoliceAuthenticated, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    try {
        // Seleciona informações básicas e dados do denunciante para a listagem
        const sql = `
            SELECT o.id, o.protocolo, o.tipo, o.descricao, o.local, o.status, o.data_registro,
                   o.policial_responsavel_id,
                   u.nome_completo as denunciante_nome, u.id_passaporte as denunciante_passaporte
            FROM ocorrencias o
            LEFT JOIN usuarios u ON o.usuario_id = u.id
            ORDER BY o.data_registro DESC`; //
        const [results] = await db.query(sql); //
        res.status(200).json(results);
    } catch (err) {
        console.error("Erro ao buscar lista de boletins:", err);
        res.status(500).json({ message: "Erro interno ao carregar boletins." }); //
    }
});
app.get('/api/policia/policiais', checkIsPoliceAuthenticated, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const user = req.user;
    const userCorporacao = user.corporacao ? user.corporacao.trim() : null; // Limpa espaços em branco

    console.log(`\n--- Acesso a /api/policia/policiais por User ID: ${user.id} (${user.nome_completo}) ---`);
    console.log(`Corporação do utilizador (após trim): '${userCorporacao}'`);
    console.log(`Permissões: ${JSON.stringify(user.permissoes)}`);

    // Define se o usuário é um "RH Geral" (tem permissão mas não tem corporação associada)
    const isRhGeral = user.permissoes?.is_rh === true && !userCorporacao;
    console.log(`É considerado RH Geral? ${isRhGeral}`);

    let sql = `SELECT id, nome_completo, passaporte, patente, corporacao, divisao, status FROM usuariospoliciais WHERE status = 'Aprovado' `;
    const params = [];

    // Se o utilizador NÃO for um RH Geral, o filtro de corporação DEVE ser aplicado.
    if (!isRhGeral) {
        if (!userCorporacao) {
             console.warn(`[ACESSO NEGADO] Utilizador ${user.id} não é RH Geral e não tem corporação. Retornando lista vazia.`);
             return res.status(200).json([]);
        }
        // Aplica o filtro usando TRIM() também na query para garantir a correspondência
        sql += ' AND TRIM(corporacao) = ? ';
        params.push(userCorporacao);
        console.log(`FILTRO APLICADO para corporação: '${userCorporacao}'`);
    } else {
        console.log(`SEM FILTRO DE CORPORAÇÃO (Acesso de RH Geral).`);
    }

    sql += ' ORDER BY corporacao, nome_completo ASC';

    try {
        const [results] = await db.query(sql, params);
        console.log(`Query executada. ${results.length} resultados encontrados.`);
        res.status(200).json(results);
    } catch (err) {
        console.error("Erro ao buscar lista de policiais:", err);
        res.status(500).json({ message: "Erro interno ao listar policiais." });
    }
});

// Rota para ver perfil de um policial (VERSÃO ROBUSTA)
app.get('/api/policia/perfil/:id', checkIsPoliceAuthenticated, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const { id } = req.params;
    const userRequesting = req.user;

    if (isNaN(parseInt(id, 10))) return res.status(400).json({ message: "ID de perfil inválido." });

    try {
        const [result] = await db.query(`SELECT id, passaporte, nome_completo, discord_id, telefone_rp, gmail, foto_url, status, corporacao, patente, divisao, permissoes FROM usuariospoliciais WHERE id = ?`, [id]);
        if (result.length === 0) return res.status(404).json({ message: "Perfil policial não encontrado." });

        const perfilAlvo = result[0];
        
        const userCorporacao = userRequesting.corporacao ? userRequesting.corporacao.trim() : null;
        const perfilCorporacao = perfilAlvo.corporacao ? perfilAlvo.corporacao.trim() : null;

        const isRhGeral = userRequesting.permissoes?.is_rh === true && !userCorporacao;
        const isSameCorp = userCorporacao === perfilCorporacao;

        if (isRhGeral || isSameCorp) {
            try { perfilAlvo.permissoes = perfilAlvo.permissoes ? JSON.parse(perfilAlvo.permissoes) : {}; } catch (e) { perfilAlvo.permissoes = {}; }
            res.status(200).json(perfilAlvo);
        } else {
            console.warn(`[ACESSO DE PERFIL NEGADO] User ${userRequesting.id} ('${userCorporacao}') tentou ver perfil ${perfilAlvo.id} ('${perfilCorporacao}')`);
            return res.status(403).json({ message: "Acesso negado a perfis de outra corporação." });
        }
    } catch (err) {
        console.error(`Erro ao buscar perfil policial ${id}:`, err);
        res.status(500).json({ message: "Erro interno ao buscar perfil." });
    }
});

// Rota para ver histórico de um policial (VERSÃO ROBUSTA)
app.get('/api/policia/perfil/:id/historico', checkIsPoliceAuthenticated, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const { id } = req.params;
    const userRequesting = req.user;

    if (isNaN(parseInt(id, 10))) return res.status(400).json({ message: "ID de perfil inválido." });

    try {
        const [perfil] = await db.query(`SELECT corporacao FROM usuariospoliciais WHERE id = ?`, [id]);
        if (perfil.length === 0) return res.status(404).json({ message: "Perfil não encontrado." });

        const perfilAlvo = perfil[0];

        const userCorporacao = userRequesting.corporacao ? userRequesting.corporacao.trim() : null;
        const perfilCorporacao = perfilAlvo.corporacao ? perfilAlvo.corporacao.trim() : null;

        const isRhGeral = userRequesting.permissoes?.is_rh === true && !userCorporacao;
        const isSameCorp = userCorporacao === perfilCorporacao;

        if (isRhGeral || isSameCorp) {
            const sql = `SELECT h.id, h.tipo_evento, h.descricao, h.data_evento, r.nome_completo as responsavel_nome 
                         FROM policial_historico h 
                         LEFT JOIN usuariospoliciais r ON h.responsavel_id = r.id 
                         WHERE h.policial_id = ? 
                         ORDER BY h.data_evento DESC, h.id DESC`;
            const [results] = await db.query(sql, [id]);
            res.status(200).json(results);
        } else {
            console.warn(`[ACESSO DE HISTÓRICO NEGADO] User ${userRequesting.id} ('${userCorporacao}') tentou ver histórico do perfil ${id} ('${perfilCorporacao}')`);
            return res.status(403).json({ message: "Acesso negado ao histórico de outra corporação." });
        }
    } catch (err) {
        console.error(`Erro ao buscar histórico do policial ${id}:`, err);
        res.status(500).json({ message: "Erro interno ao buscar histórico." });
    }
});

// --- [ATUALIZADO] Rota de Perfil usa 'uploadImagem' ---
app.put('/api/policia/perfil/self', checkIsPoliceAuthenticated, uploadImagem.single('foto'), async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    if (req.user?.type !== 'policial') return res.status(401).json({ message: "Acesso negado." });
    const id = req.user.id;
    const { nome_completo, gmail } = req.body;
    const foto = req.file;
    if (!nome_completo || !gmail) return res.status(400).json({ message: 'Nome e Gmail obrigatórios.' });
    try {
        let sql, values;
        let updated = { nome_completo, gmail };
        if (foto) {
            sql = `UPDATE usuariospoliciais SET nome_completo = ?, gmail = ?, foto_url = ? WHERE id = ?`;
            values = [nome_completo, gmail, `/uploads/${foto.filename}`, id]; // <<< Adicionado /uploads/
            updated.foto_url = `/uploads/${foto.filename}`;
        } else {
            sql = `UPDATE usuariospoliciais SET nome_completo = ?, gmail = ? WHERE id = ?`;
            values = [nome_completo, gmail, id];
        }
        const [result] = await db.query(sql, values);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Utilizador não encontrado.' });
        res.status(200).json({ message: 'Perfil atualizado!', updatedUser: updated });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Gmail já em uso.' });
        console.error("Erro update self:", err);
        res.status(500).json({ message: 'Erro interno.' });
    }
});


app.get('/api/anuncios', requireAuth(), async (req, res) => { // Qualquer user logado (civil ou policial)
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const userCorp = req.user?.corporacao; // Pode ser undefined para civis
    const isRh = req.user?.permissoes?.is_rh === true; //
    try {
        let sql = `
            SELECT a.id, a.titulo, a.conteudo, a.data_publicacao,
                   COALESCE(u.nome_completo, 'Administração') as autor_nome, a.corporacao
            FROM anuncios a
            LEFT JOIN usuariospoliciais u ON a.autor_id = u.id `; //
        const params = []; //

        // Filtra anúncios se não for RH: mostra Gerais (corporacao IS NULL) ou da própria corporação
        if (!isRh) {
            sql += ' WHERE a.corporacao IS NULL '; //
            if (userCorp) { // Se for policial (tem corporação), adiciona OR
                sql += ' OR a.corporacao = ? '; //
                params.push(userCorp); //
            }
        }
        // RH vê todos, então não adiciona WHERE clause se for RH

        sql += ' ORDER BY a.data_publicacao DESC LIMIT 10 '; // Limita aos 10 mais recentes
        const [results] = await db.query(sql, params); //
        res.status(200).json(results);
    } catch (err) { console.error("Erro ao buscar anúncios:", err); res.status(500).json({ message: "Erro interno ao carregar anúncios." }); } //
});

app.get('/api/policia/relatorios/estatisticas', checkIsPoliceAuthenticated, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]

    if (req.user?.type !== 'policial') {

        return res.status(401).json({ message: "Acesso negado." });

    }

    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - 30);

    try {

        const queryBoletins = "SELECT status, COUNT(*) as count FROM ocorrencias GROUP BY status";

        const queryEfetivo = "SELECT corporacao, COUNT(*) as count FROM usuariospoliciais WHERE status='Aprovado' GROUP BY corporacao";

        const queryHistorico = `SELECT tipo_evento, COUNT(*) as count FROM policial_historico WHERE data_evento >= ? AND tipo_evento IN ('Promoção', 'Rebaixamento', 'Demissão', 'Aprovação') GROUP BY tipo_evento`;

        const [[boletinsResult], [efetivoResult], [historicoResult]] = await Promise.all([

            db.query(queryBoletins),

            db.query(queryEfetivo),

            db.query(queryHistorico, [dateFilter])

        ]);

        const boletins = { total: 0, aguardando: 0, investigacao: 0, resolvido: 0, arquivado: 0, falso: 0 };

        if (Array.isArray(boletinsResult)) { boletinsResult.forEach(row => { if (row.status === 'Aguardando Análise') boletins.aguardando = row.count; else if (row.status === 'Em Investigação') boletins.investigacao = row.count; else if (row.status === 'Resolvido') boletins.resolvido = row.count; else if (row.status === 'Arquivado') boletins.arquivado = row.count; else if (row.status === 'Falso') boletins.falso = row.count; boletins.total += row.count; }); }

        const efetivo = { total: 0 };

        if (Array.isArray(efetivoResult)) { efetivoResult.forEach(row => { if (row.corporacao) { efetivo[row.corporacao] = row.count; efetivo.total += row.count; } }); }

        const historico = { promocao: 0, rebaixamento: 0, demissao: 0, aprovacao: 0 };

        if (Array.isArray(historicoResult)) { historicoResult.forEach(row => { if (row.tipo_evento === 'Promoção') historico.promocao = row.count; else if (row.tipo_evento === 'Rebaixamento') historico.rebaixamento = row.count; else if (row.tipo_evento === 'Demissão') historico.demissao = row.count; else if (row.tipo_evento === 'Aprovação') historico.aprovacao = row.count; }); }

        res.status(200).json({ boletins, efetivo, historico });

    } catch (err) { console.error("Erro ao buscar estatísticas dos relatórios:", err); res.status(500).json({ message: "Erro interno do servidor." }); }

});
app.post('/api/policia/relatorios', checkIsPoliceAuthenticated, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]

    if (req.user?.type !== 'policial') return res.status(401).json({ message: "Acesso não autorizado." });

    const uid = req.user.id;

    const { tipo_relatorio, unidade_responsavel, status, id_ocorrencia_associada, local_ocorrencia, data_hora_fato, natureza_ocorrencia, descricao_detalhada, testemunhas, suspeitos, vitimas, veiculos_envolvidos, objetos_apreendidos, medidas_tomadas, observacoes_autor, mapa_x, mapa_y } = req.body;

    if (!tipo_relatorio || !descricao_detalhada) return res.status(400).json({ message: "Tipo e Descrição detalhada são obrigatórios." });

    const coordX = mapa_x != null && mapa_x !== '' ? parseFloat(mapa_x) : null;

    const coordY = mapa_y != null && mapa_y !== '' ? parseFloat(mapa_y) : null;

    if ((coordX !== null && isNaN(coordX)) || (coordY !== null && isNaN(coordY))) return res.status(400).json({ message: 'Coordenadas do mapa inválidas.' });

    try {

        const q = `INSERT INTO relatorios (tipo_relatorio, unidade_responsavel, id_policial_autor, status, id_ocorrencia_associada, local_ocorrencia, data_hora_fato, natureza_ocorrencia, mapa_x, mapa_y, descricao_detalhada, testemunhas, suspeitos, vitimas, veiculos_envolvidos, objetos_apreendidos, medidas_tomadas, observacoes_autor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const v = [tipo_relatorio, unidade_responsavel || null, uid, status || 'Em Aberto', id_ocorrencia_associada ? parseInt(id_ocorrencia_associada, 10) : null, local_ocorrencia || null, data_hora_fato || null, natureza_ocorrencia || null, coordX, coordY, descricao_detalhada, testemunhas || null, suspeitos || null, vitimas || null, veiculos_envolvidos || null, objetos_apreendidos || null, medidas_tomadas || null, observacoes_autor || null];

        if (q.split('?').length - 1 !== v.length) { console.error(`[Relatório ERRO FATAL] Disparidade SQL: ${q.split('?').length - 1} placeholders vs ${v.length} valores.`); return res.status(500).json({ message: "Erro interno crítico de configuração." }); }

        const [result] = await db.query(q, v);

        console.log(`[Relatório] ID ${result.insertId} criado por ${uid}. Coords: (${coordX}, ${coordY})`);

        res.status(201).json({ message: "Relatório criado com sucesso!", id_relatorio_criado: result.insertId });

    } catch (err) {

        if (err.code === 'ER_NO_REFERENCED_ROW_2' && err.message.includes('id_ocorrencia_associada')) return res.status(400).json({ message: `Erro: B.O. ID ${id_ocorrencia_associada} não encontrado ou inválido.` });

        console.error("Erro detalhado ao salvar relatório:", err.message, "| SQL State:", err.sqlState, "| Error Code:", err.errno);

        res.status(500).json({ message: `Erro interno ao salvar o relatório. Código: ${err.errno || 'N/A'}` });

    }

});
app.get('/api/crimes/heatmap-data', checkIsPoliceAuthenticated, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]

    if (!req.user || req.user.type !== 'policial') {

        return res.status(401).json({ message: "Acesso não autorizado." });

    }

    console.log(`[Heatmap] GET /api/crimes/heatmap-data acessado por ${req.user.type} ID ${req.user.id}`);

    const statusOcorrencias = ['Resolvido', 'Em Investigação', 'Aguardando Análise'];

    const statusRelatorios = ['Em Aberto', 'Concluído', 'Em Análise'];

    try {

        const sql = `

            (SELECT mapa_x, mapa_y, tipo FROM ocorrencias WHERE mapa_x IS NOT NULL AND mapa_y IS NOT NULL AND status IN (?))

            UNION ALL

            (SELECT mapa_x, mapa_y, natureza_ocorrencia AS tipo FROM relatorios WHERE mapa_x IS NOT NULL AND mapa_y IS NOT NULL AND tipo_relatorio = 'Ocorrência' AND status IN (?))

        `;

        const params = [statusOcorrencias, statusRelatorios];

        const [results] = await db.query(sql, params);

        const heatmapData = results.map(row => ({

            x: parseFloat(row.mapa_x),

            y: parseFloat(row.mapa_y),

            tipo: row.tipo || 'Indefinido'

        }));

        console.log(`[Heatmap] Enviando ${heatmapData.length} pontos de dados.`);

        res.status(200).json(heatmapData);

    } catch (err) {

        console.error("[Heatmap] Erro ao buscar dados:", err);

        res.status(500).json({ message: "Erro interno ao buscar dados para o mapa de calor." });

    }

});

// --- [NOVO] ROTA PARA REPORTAR BUG ---
app.post('/api/policia/report-bug', checkIsPoliceAuthenticated, async (req, res) => {
    // const db = getDbConnection(req); // <-- [CORREÇÃO] logAdminAction já pega o DB
    const { description } = req.body;
    const user = req.user;
    const ipAddress = req.ip;

    if (!description || description.trim().length < 10) {
        return res.status(400).json({ message: 'A descrição do bug é muito curta. Por favor, forneça mais detalhes.' });
    }

    try {
        const logDetails = {
            description: description,
            reporterId: user.id,
            reporterName: user.nome_completo,
            corporacao: user.corporacao || 'N/A'
        };

        // Usa a função logAdminAction para registrar o bug
        await logAdminAction(user.id, 'Bug Report', logDetails, ipAddress);

        res.status(201).json({ message: 'Relatório de bug enviado com sucesso! Agradecemos a colaboração.' });

    } catch (err) {
        console.error(`[Bug Report] Erro ao salvar bug report do usuário ${user.id} (IP: ${ipAddress}):`, err);
        res.status(500).json({ message: "Erro interno ao salvar o relatório de bug." });
    }
});


// --- ROTAS DE BOLETINS (protegidas por tipo específico) ---
// --- [ATUALIZADO] Rota de BO usa 'uploadAnexos' ---
app.post('/api/boletim/registrar', checkIsCivilAuthenticated, uploadAnexos.array('anexos', 5), async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const uid = req.user.id; //
    const { tipo, local, descricao, data_ocorrido } = req.body; //
    const anexos = req.files ? req.files.map(f => `/uploads/${f.filename}`) : []; // <-- [CORREÇÃO] Salva o caminho completo

    if (!tipo || !local || !descricao || !data_ocorrido) return res.status(400).json({ success: false, message: 'Campos obrigatórios: Tipo, Local, Descrição e Data do Ocorrido.' }); //

    // Gera um protocolo único (simples, pode ser melhorado)
    const proto = `BO-${Date.now()}-${uid}`; //
    try {
        const q = `INSERT INTO ocorrencias (protocolo, tipo, descricao, local, status, usuario_id, anexos_imagens, data_ocorrido, data_registro) VALUES (?, ?, ?, ?, 'Aguardando Análise', ?, ?, ?, NOW())`; //
        await db.query(q, [proto, tipo, descricao, local, uid, JSON.stringify(anexos), data_ocorrido]); //
        res.status(201).json({ success: true, message: `Ocorrência registrada com sucesso! Seu protocolo é: ${proto}` }); //
    } catch (err) { console.error("Erro ao registrar BO:", err); res.status(500).json({ success: false, message: 'Erro interno do servidor ao registrar ocorrência.' }); } //
});

app.get('/api/policia/boletins/:id', checkIsPoliceAuthenticated, async (req, res) => { // Removido checkCivilPolice para que todo policial veja
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const { id } = req.params; //
    if (isNaN(parseInt(id, 10))) return res.status(400).json({ message: "ID do boletim inválido." }); //
    try {
        // Query mais completa buscando dados do denunciante (u) e do policial responsável (p)
        const sql = `
            SELECT o.*,
                   u.nome_completo as denunciante_nome, u.id_passaporte as denunciante_passaporte,
                   u.gmail as denunciante_gmail, u.telefone_rp as denunciante_telefone,
                   p.nome_completo as policial_responsavel_nome, p.passaporte as policial_responsavel_passaporte
            FROM ocorrencias o
            LEFT JOIN usuarios u ON o.usuario_id = u.id
            LEFT JOIN usuariospoliciais p ON o.policial_responsavel_id = p.id
            WHERE o.id = ?`; //
        const [results] = await db.query(sql, [id]); //
        if (results.length === 0) return res.status(404).json({ message: "Boletim de ocorrência não encontrado." }); //

        const boletim = results[0]; //
        // Parseia campos JSON (envolvidos e anexos)
        try { boletim.envolvidos_identificados = boletim.envolvidos_identificados ? JSON.parse(boletim.envolvidos_identificados) : []; } catch (e) { boletim.envolvidos_identificados = []; } //
        try { boletim.anexos_imagens = boletim.anexos_imagens ? JSON.parse(boletim.anexos_imagens) : []; } catch (e) { boletim.anexos_imagens = []; } //

        res.status(200).json(boletim);
    } catch (err) { console.error(`Erro ao buscar detalhes do BO ${id}:`, err); res.status(500).json({ message: "Erro interno ao buscar detalhes do boletim." }); } //
});

// --- [ATUALIZADO] Rota de Editar BO usa 'uploadAnexos' ---
app.put('/api/policia/boletins/:id', checkCivilPolice, uploadAnexos.array('anexos', 5), async (req, res) => { // Apenas PC pode editar
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const { id } = req.params; //
    if (isNaN(parseInt(id, 10))) return res.status(400).json({ message: "ID do boletim inválido." }); //
    const policialId = req.user.id; // ID do policial logado
    // Pega todos os campos do corpo da requisição (que agora é FormData)
    const { status, unidade_policial, envolvidos_identificados, evidencias_coletadas, relato_policial, encaminhamento, observacoes_internas, imagens_existentes, mapa_x, mapa_y, tipo } = req.body; //

    // Converte coordenadas para float ou null
    const coordX = (mapa_x !== undefined && mapa_x !== null && mapa_x !== 'null' && mapa_x !== '') ? parseFloat(mapa_x) : null; //
    const coordY = (mapa_y !== undefined && mapa_y !== null && mapa_y !== 'null' && mapa_y !== '') ? parseFloat(mapa_y) : null; //
    if ((coordX !== null && isNaN(coordX)) || (coordY !== null && isNaN(coordY))) {
        return res.status(400).json({ message: 'Coordenadas do mapa inválidas.' }); //
    }

    // Combina imagens existentes (enviadas como JSON string) com as novas (de req.files)
    let anexosFinais = []; //
    try {
        const existentes = JSON.parse(imagens_existentes || '[]'); //
        const novas = req.files ? req.files.map(f => `/uploads/${f.filename}`) : []; // <-- [CORREÇÃO] Salva o caminho completo
        anexosFinais = [...existentes, ...novas]; //
    } catch (e) {
        console.error("Erro ao processar anexos:", e);
        return res.status(400).json({ message: "Formato inválido para imagens existentes." }); //
    }

    try {
        // Verifica se o policial logado é o responsável pelo caso (ou se o caso não tem responsável ainda)
        const [bo] = await db.query("SELECT policial_responsavel_id FROM ocorrencias WHERE id = ?", [id]); //
        if (bo.length === 0) return res.status(404).json({ message: "Boletim não encontrado." }); //
        // SÓ permite editar se for o responsável OU se ninguém assumiu ainda (permitindo assumir implicitamente ao editar)
        if (bo[0].policial_responsavel_id !== null && bo[0].policial_responsavel_id !== policialId) {
            return res.status(403).json({ message: "Ação não permitida. Você não é o policial responsável por este caso." }); //
        }

        // Define o policial responsável se ainda não houver um e o status for mudado para Investigação
        const setResponsavel = (bo[0].policial_responsavel_id === null && status === 'Em Investigação') ? policialId : bo[0].policial_responsavel_id; //
        const setDataAssumido = (bo[0].policial_responsavel_id === null && status === 'Em Investigação') ? 'NOW()' : 'data_assumido'; // Usa SQL NOW() ou mantém o valor existente

        // Query de atualização
        const sql = `
            UPDATE ocorrencias SET
                status = ?, unidade_policial = ?, envolvidos_identificados = ?,
                relato_policial = ?, encaminhamento = ?, observacoes_internas = ?,
                anexos_imagens = ?, mapa_x = ?, mapa_y = ?, tipo = ?,
                evidencias_coletadas = ?, policial_responsavel_id = ?, data_assumido = ${setDataAssumido}
            WHERE id = ?`; //
        const vals = [
            status, unidade_policial || null, envolvidos_identificados || '[]', //
            relato_policial || null, encaminhamento || null, observacoes_internas || null, //
            JSON.stringify(anexosFinais), coordX, coordY, tipo || 'Outros', //
            evidencias_coletadas || null, setResponsavel, // Define/mantém responsável
            id //
        ];
        await db.query(sql, vals); //
        res.status(200).json({ message: 'Boletim atualizado com sucesso!' }); //
    } catch (err) {
        console.error(`Erro ao atualizar BO ${id}:`, err);
        res.status(500).json({ message: "Erro interno do servidor ao salvar as alterações do boletim." }); //
    }
});

app.put('/api/policia/boletins/:id/assumir', checkCivilPolice, async (req, res) => { // Apenas PC pode assumir
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const { id } = req.params; //
    if (isNaN(parseInt(id, 10))) return res.status(400).json({ message: "ID do boletim inválido." }); //
    const policialId = req.user.id; // ID do PC logado
    try {
        // Tenta assumir o BO, definindo o responsável, status e data
        // SÓ FUNCIONA SE policial_responsavel_id FOR NULL
        const sql = `
            UPDATE ocorrencias SET
                status='Em Investigação',
                policial_responsavel_id = ?,
                data_assumido = NOW()
            WHERE id = ? AND policial_responsavel_id IS NULL`; //
        const [result] = await db.query(sql, [policialId, id]); //

        if (result.affectedRows === 0) {
            // Se não atualizou, verifica se é porque já tinha responsável ou se o BO não existe
            const [bo] = await db.query("SELECT id, policial_responsavel_id FROM ocorrencias WHERE id = ?", [id]); //
            if(bo.length > 0 && bo[0].policial_responsavel_id !== null) {
                return res.status(409).json({ message: 'Conflito: Este caso já foi assumido por outro policial.' }); // 409 Conflict
            } else {
                return res.status(404).json({ message: 'Boletim não encontrado ou já processado de outra forma.' }); // 404 Not Found
            }
        }
        res.status(200).json({ message: 'Caso assumido com sucesso! Você agora é o responsável.' }); //
    } catch (err) { console.error(`Erro ao assumir BO ${id} pelo policial ${policialId}:`, err); res.status(500).json({ message: "Erro interno do servidor ao tentar assumir o caso." }); } //
});


// =================================================================
// --- TAREFA AGENDADA (CRON) ---
// =================================================================
cron.schedule('1 0 * * *', async () => { // Roda todo dia à 00:01
    const db = getDbConnection(null); // Tarefa de admin global
    console.log('[CRON] Executando limpeza de tokens de registro expirados...');
    try {
        const [result] = await db.query( //
            "UPDATE registration_tokens SET is_active = FALSE, status_detail = 'Expirado Automaticamente' WHERE expires_at < NOW() AND is_active = TRUE" //
        );
        console.log(`[CRON] Tokens expirados desativados: ${result.affectedRows}`);
    } catch (err) {
        console.error('[CRON] Erro ao desativar tokens expirados:', err);
    }
});


// =================================================================
// --- TRATAMENTO DE ERROS GERAL (ÚLTIMO MIDDLEWARE) ---
// =================================================================
// Captura erros não tratados que ocorrem nas rotas
app.use((err, req, res, next) => {
    console.error(`[ERRO NÃO TRATADO] Rota: ${req.method} ${req.path}`, err.stack);

    // Trata erros específicos do Multer (upload)
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'Erro no upload: Arquivo excede o limite de 25MB.' }); //
        }
        return res.status(400).json({ message: `Erro no upload: ${err.message}` }); //
    }
    // Trata erro do nosso fileFilter personalizado
    if (err.message.includes('Tipo de arquivo inválido')) {
        return res.status(400).json({ message: err.message }); //
    }

    // Para outros tipos de erro, retorna uma mensagem genérica
    // Evita expor detalhes internos do servidor em produção
    res.status(500).json({ message: 'Ocorreu um erro interno inesperado no servidor.' }); //
});

// =================================================================

// --- ROTA PARA REPORT-BUG --- (Movido para cima)

// =================================================================

app.get('/api/policia/relatorios/tendencias', checkIsPoliceAuthenticated, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    console.log(`[Tendencias] GET /api/policia/relatorios/tendencias acessado por User ID: ${req.user.id}`);
    try {
        // Query para buscar tipo e data de registro das ocorrências válidas
        // Vamos agrupar por mês/ano. O formato DATE_FORMAT(data_registro, '%Y-%m') agrupa por ano e mês.
        const sql = `
            SELECT
                tipo,
                DATE_FORMAT(data_registro, '%Y-%m') as mes_ano,
                COUNT(*) as contagem
            FROM ocorrencias
            WHERE status NOT IN ('Falso', 'Arquivado') OR status IS NULL  -- Ignora BOs falsos ou arquivados
            GROUP BY tipo, mes_ano
            ORDER BY mes_ano ASC, tipo ASC;
        `;

        const [results] = await db.query(sql);

        // Processar os resultados para um formato mais fácil de usar no frontend
        // Ex: { "Roubo": [{"mes_ano": "2024-09", "contagem": 5}, {"mes_ano": "2024-10", "contagem": 8}], "Furto": [...] }
        const tendenciasPorTipo = results.reduce((acc, row) => {
            const { tipo, mes_ano, contagem } = row;
            if (!acc[tipo]) {
                acc[tipo] = [];
            }
            acc[tipo].push({ mes_ano, contagem });
            return acc;
        }, {});

        console.log(`[Tendencias] Enviando ${Object.keys(tendenciasPorTipo).length} tipos de ocorrências.`);
        res.status(200).json(tendenciasPorTipo);

    } catch (err) {
        console.error("[Tendencias] Erro ao buscar dados de tendências:", err);
        res.status(500).json({ message: "Erro interno ao processar dados de tendências." });
    }
});

// =================================================================
// --- INICIAR O CHARGELOG ---
// =================================================================

app.get('/api/changelog', async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    try {
        const sql = `
            SELECT c.id, c.version, c.title, c.content, c.created_at, u.nome_completo as author_name
            FROM changelog_entries c
            LEFT JOIN usuariospoliciais u ON c.author_id = u.id
            ORDER BY c.created_at DESC`; // Ordena do mais recente para o mais antigo
        const [entries] = await db.query(sql);
        res.status(200).json(entries);
    } catch (err) {
        console.error("Erro ao buscar changelog:", err);
        res.status(500).json({ message: "Erro interno ao buscar changelog." });
    }
});

// POST: Adicionar nova entrada ao Changelog (Apenas RH)
app.post('/api/admin/changelog', checkRh, async (req, res) => {
    const db = getDbConnection(req); // <-- [CORREÇÃO]
    const { title, content, version } = req.body;
    const author_id = req.user.id; // ID do admin logado
    const ipAddress = req.ip;

    if (!title || !content) {
        return res.status(400).json({ message: 'Título e Conteúdo são obrigatórios.' });
    }

    try {
        const sql = `
            INSERT INTO changelog_entries (version, title, content, author_id, created_at)
            VALUES (?, ?, ?, ?, NOW())`;
        const [result] = await db.query(sql, [version || null, title, content, author_id]);
        const newEntryId = result.insertId;

        // Log da ação administrativa
        const logDetails = {
            changelogId: newEntryId,
            title: title,
            version: version || 'N/A',
            adminId: author_id
        };
        // Adicione uma nova ação no LogDetails.jsx se quiser formatação específica
        await logAdminAction(author_id, 'Create Changelog Entry', logDetails, ipAddress);

        res.status(201).json({ message: 'Entrada do changelog adicionada com sucesso!', id: newEntryId });

    } catch (err) {
        console.error(`Erro ao adicionar changelog por ${author_id} (IP: ${ipAddress}):`, err);
        res.status(500).json({ message: 'Erro interno ao salvar entrada do changelog.' });
    }
});


// =================================================================
// --- INICIAR O SERVIDOR ---
// =================================================================
app.listen(PORT, () => {
    console.log(`****************************************************`);
    console.log(`* Servidor SGP-RP rodando em http://localhost:${PORT} *`); //
    console.log(`* URL do Frontend permitida (CORS): ${frontendURL}  *`); //
    // Correção: Acessar a configuração do limiter diretamente
    console.log(`* Limite de Requisições: ${limiterConfig.max} reqs / ${limiterConfig.windowMs / 60000} min por IP *`); //
    console.log(`****************************************************`);
});