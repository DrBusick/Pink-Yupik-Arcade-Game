require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://your-domain.com';
const PORT = process.env.PORT || 3000;
const DEFAULT_CHAT_ID = process.env.DEFAULT_CHAT_ID || null;

if (!BOT_TOKEN) {
  console.error("Please set BOT_TOKEN in .env");
  // continue so frontend can be tested without bot token
}

const bot = BOT_TOKEN ? new TelegramBot(BOT_TOKEN, { polling: true }) : null;

if (bot) {
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Готовий грати? Натисни кнопку нижче.', {
      reply_markup: {
        inline_keyboard: [[{ text: "Запустити гру 🎮", web_app: { url: WEBAPP_URL } }]]
      }
    });
  });
  console.log('Bot polling started');
}

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/score', (req, res) => {
  const { score, user } = req.body;
  console.log('Score received:', score, user || '');
  res.json({ ok:true });
});

app.get('/api/leaderboard', (req, res) => {
  res.json({ ok:true, leaderboard: [] });
});

app.listen(PORT, () => console.log('Server running on port', PORT));

