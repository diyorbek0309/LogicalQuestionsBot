const TelegramBot = require("node-telegram-bot-api");
const { TOKEN } = require("./config");
const GamerController = require("./controllers/GamerController");
const postgres = require("./modules/postgres");
const { questions } = require("./questions.js");

const bot = new TelegramBot(TOKEN, { polling: true });

async function main() {
  const psql = await postgres();

  await bot.onText(/^\/start$/, (message) => {
    const chatId = message.chat.id;
    bot.sendMessage(
      chatId,
      `Assalomu aleykum. Xush kelibsiz!\nBotdan toʻliq foydalanish uchun ism va familiyangizni kiriting!`
    );
    bot.once("message", (message) => {
      const name = message.text;
      bot.sendMessage(
        chatId,
        `Mantiqiy savollar testini boshlash uchun Boshlash'ni bosing!`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: "Boshlash", callback_data: "start" }]],
          },
        }
      );
    });
  });

  bot.on("callback_query", (callbackQuery) => {
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const user = callbackQuery.from.username;
    const data = callbackQuery.data;
    let score = 0;

    if (data === "start" || data === "restart") {
      const currentQuestion = questions[0];
      bot
        .sendMessage(chatId, `1-savol:\n\n${currentQuestion.question}`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: currentQuestion.options[0], callback_data: "A" }],
              [{ text: currentQuestion.options[1], callback_data: "B" }],
              [{ text: currentQuestion.options[2], callback_data: "C" }],
              [{ text: currentQuestion.options[3], callback_data: "D" }],
            ],
          },
        })
        .then(() => {
          bot.answerCallbackQuery(callbackQuery.id);
        });

      const timer = setTimeout(() => {
        bot.sendMessage(chatId, "Vaqt tugadi!", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Qayta urinish", callback_data: "restart" }],
            ],
          },
        });
      }, 5000);
    } else {
      const currentQuestion = questions[0];

      if (data[data.length - 1] === currentQuestion.answer) {
        score++;
        bot.sendMessage(
          chatId,
          `Ajoyib, ${user}! Ushbu savolga to'g'ri javob berdingiz!`,
          {
            reply_markup: {
              remove_keyboard: true,
            },
          }
        );
      } else {
        bot.sendMessage(
          chatId,
          `Afsuski, ushbu savolga noto'g'ri javob berdingiz!`,
          {
            reply_markup: {
              remove_keyboard: true,
            },
          }
        );
      }
      quiz.shift();

      if (quiz.length > 0) {
        setTimeout(() => {
          const nextQuestion = quiz[0];

          bot.sendMessage(chatId, nextQuestion.question, {
            reply_markup: {
              inline_keyboard: [
                [{ text: nextQuestion.options[0], callback_data: "A" }],
                [{ text: nextQuestion.options[1], callback_data: "B" }],
                [{ text: nextQuestion.options[2], callback_data: "C" }],
                [{ text: nextQuestion.options[3], callback_data: "D" }],
              ],
            },
          });

          setTimeout(() => {
            bot.sendMessage(chatId, "Vaqt tugadi!");
          }, 5000);
        }, 2000);
      } else {
        bot.sendMessage(chatId, "Savollarimiz tugadi!", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Qayta urinish", callback_data: "restart" }],
            ],
          },
        });
      }
    }
  });

  await bot.onText(/\/help/, (message) => {
    bot.sendMessage(
      message.chat.id,
      `Botdan foydalanish uchun buyruqlar:\n\n/startSvoyak - oʻyinni boshlash buyruqi. Ushbu buyruqni bergan foydalanuvchi oʻyin boshlovchisi hisoblanadi va ochko berish imkoniyatiga ega boʻladi. Ochkolar xabarga javob sifatida berilishi kerak.\n\n/changeCreator - boshlovchini oʻzgartirish buyruqi. Ushbu buyruqdan amaldagi boshlovchi yoki guruh adminlari foydalanishi mumkin. Buyruq xabarga javob sifatida berilishi kerak.\n\n/removeMe - tablodan oʻz ismingizni oʻchirish uchun ishlatishingiz mumkin.\n\n/endSvoyak - oʻyinni yakunlash va natijalarni e'lon qilish buyruqi. Ushbu buyruqdan amaldagi boshlovchi yoki guruh adminlari foydalanishi mumkin.`
    );
  });

  await bot.onText(/\/about/, (message) => {
    bot.sendMessage(
      message.chat.id,
      `Shaxsiy oʻyin jarayonida ochkolarni hisoblab boruvchi bot.\nDasturchi: @dasturchining_tundaligi`
    );
  });
}

main();
