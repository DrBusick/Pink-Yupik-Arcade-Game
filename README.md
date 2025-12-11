# Telegram Platformer (template)

## Quick start (local)
1. Клонуй/створи папку та додай файли (package.json, server.js, public/*, .env).
2. Скопіюй `.env.example` -> `.env` і встанови BOT_TOKEN та (опційно) DEFAULT_CHAT_ID.
3. npm install
4. npm start
5. Відкрий: http://localhost:3000/ — але для Telegram WebApp потрібен публічний HTTPS URL.
   Для локальної розробки використовуй ngrok:
     ngrok http 3000
   і в BotFather / веб-кнопці вказуй https://<ngrok-id>.ngrok.io

## Подальші кроки
- Заміни polling на webhook (prod).
- Додай перевірку initData (signature) для валідації WebApp — обов'язково в проді.
- Заміни прямокутну графіку на спрайти/tileset + Tiled maps.
- Збереження лідерборду у БД (Postgres/Mongo).
