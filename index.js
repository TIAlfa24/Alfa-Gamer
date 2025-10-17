import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Rota padrão (teste)
app.get("/", (req, res) => {
  res.send("Servidor do Alfa Gamer rodando! ✅");
});

// Rota para cadastro
app.post("/cadastro", async (req, res) => {
  try {
    const { nome, numero_aluno, senha } = req.body;
    console.log("Dados recebidos:", { nome, numero_aluno, senha });

    // Aqui você colocaria a lógica do Supabase
    res.json({ sucesso: true, mensagem: "Dados recebidos com sucesso!" });
  } catch (erro) {
    console.error("Erro no servidor:", erro);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
