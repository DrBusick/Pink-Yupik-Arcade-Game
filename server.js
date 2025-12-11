require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const DEFAULT_CHAT_ID = process.env.DEFAULT_CHAT_ID || null;

if (!BOT_TOKEN) {
  console.error("Please set BOT_TOKEN in .env");
  process.exit(1);
}

// Use polling for simplicity (works well for dev)
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory leaderboard (simple)
const leaderboard = [];

app.post('/api/score', async (req, res) => {
  try {
    const { score, user } = req.body; // frontend should send { score, user }
    if (typeof score !== 'number') return res.status(400).json({ ok: false, error: 'Invalid score' });

    // store basic record
    const entry = {
      user: user || { id: null, first_name: 'Unknown' },
      score,
      ts: Date.now()
    };
    leaderboard.push(entry);
    // keep only top 50
    leaderboard.sort((a,b) => b.score - a.score);
    if (leaderboard.length > 50) leaderboard.length = 50;

    // Send message to the player (if user.id present) or to default chat
    const chatId = (user && user.id) ? user.id : DEFAULT_CHAT_ID;
    if (chatId) {
      const name = user && (user.first_name || user.username) ? `${user.first_name || user.username}` : 'Гравець';
      const text = `🎮 ${name} набрав(ла) ${score} очок!`;
      await bot.sendMessage(chatId, text);
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('Score API error', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Simple endpoint to get leaderboard
app.get('/api/leaderboard', (req, res) => {
  res.json({ ok: true, leaderboard });
});

// Simple webhook for /start handling (optional): when user sends /start we reply with the Web App button
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const reply = {
    reply_markup: {
      inline_keyboard: [[
        { text: "Запустити гру 🎮", web_app: { url: getWebAppUrl() } }
      ]]
    }
  };
  bot.sendMessage(chatId, 'Готовий грати? Натисни кнопку нижче.', reply);
});

// Utility: get URL where WebApp is hosted. For local dev we point to same server.
function getWebAppUrl() {
  // In prod, replace with your public HTTPS URL (example: https://mydomain.com)
  const host = process.env.WEBAPP_URL || (`https://your-domain.com`);
  return host;
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Make sure WEBAPP_URL in server or BotFather points to your public HTTPS URL (or use ngrok for local testing).');
});
