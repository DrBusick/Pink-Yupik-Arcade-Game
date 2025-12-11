// node server.js
const express = require('express');
const fetch = require('node-fetch'); // або вбудований fetch у нових node
const bodyParser = require('body-parser');

const app = express();
app.use(express.static('public')); // поклади index.html у public/
app.use(bodyParser.json());

const BOT_TOKEN = process.env.BOT_TOKEN || '<YOUR_BOT_TOKEN>';

app.post('/api/score', async (req, res) => {
  const { score, initData } = req.body;
  // if initData exists, parse tg init data to get chat id / user id
  // best is to pass chat_id from initData via Telegram WebApp.initDataUnsafe
  let chatId = null;
  try {
    if (initData && initData.user) {
      // if you used tg.initDataUnsafe.user then you'll have user.id; but safe approach — frontend should pass chat id explicitly
      chatId = initData.user.id;
    }
  } catch(e){}
  // fallback: set chatId to a configured chat (like admin)
  if (!chatId) chatId = process.env.DEFAULT_CHAT_ID;

  if (!chatId) {
    console.warn('No chat id to post score to.');
    return res.status(200).json({ ok: true });
  }

  const text = `🎮 Новий рахунок від гравця: ${score}`;
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ chat_id: chatId, text })
    });
  } catch (err) {
    console.error('Telegram send failed', err);
  }
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server listening on', PORT));

