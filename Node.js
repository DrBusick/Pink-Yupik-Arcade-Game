app.post('/telegram', async (req, res) => {
  const update = req.body;

  if (update.message?.text === '/start') {
    await sendMessage(update.message.chat.id, {
      text: "Готовий грати?",
      reply_markup: {
        inline_keyboard: [[
          { 
            text: "Запустити гру 🎮",
            web_app: { url: "https://твій-домен-гри.com" }
          }
        ]]
      }
    });
  }

  res.sendStatus(200);
});

async function sendMessage(chatId, data) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      chat_id: chatId,
      ...data
    })
  });
}
