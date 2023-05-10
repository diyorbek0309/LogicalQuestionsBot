const TelegramBot = require("node-telegram-bot-api");
const { TOKEN } = require("./config");
const {
  QuestionsController,
  stopTest,
} = require("./controllers/QuestionsController");
const postgres = require("./modules/postgres");

const bot = new TelegramBot(TOKEN, { polling: true });

async function main() {
  const psql = await postgres();

  await bot.onText(/^\/start$/, (message) => {
    QuestionsController(message, bot, psql);
  });

  await bot.onText(/\/stopTest$/, (message) => {
    stopTest(message.chat.id);
  });

  await bot.onText(/\/help/, (message) => {
    bot.sendMessage(message.chat.id, `Botdan foydalanish uchun buyruqlar`);
  });

  await bot.onText(/\/about/, (message) => {
    bot.sendMessage(
      message.chat.id,
      `Shaxsiy oʻyin jarayonida ochkolarni hisoblab boruvchi bot.\nDasturchi: @dasturchining_tundaligi`
    );
  });
}

main();
