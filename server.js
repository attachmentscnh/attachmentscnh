import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post('/chat', (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ reply: "No prompt received." });

  // Simple placeholder logic
  let reply = `You said: "${prompt}"`;
  if (prompt.toLowerCase().includes("hi")) reply = "Hello! How can I assist you?";
  
  res.json({ reply });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
