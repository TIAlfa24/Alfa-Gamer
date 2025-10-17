import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({ origin: '*' })); // permite acesso de qualquer front-end
app.use(express.json());

// Cria client do Supabase usando variáveis de ambiente
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Rota de cadastro
app.post('/cadastro', async (req, res) => {
  const { nome, numero_aluno, senha } = req.body;

  if (!nome || !numero_aluno || !senha) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
    const { data, error } = await supabase
      .from('alunos')
      .insert([{ nome, numero_aluno, senha }]);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Inicia servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
