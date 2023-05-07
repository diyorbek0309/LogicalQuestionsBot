const TelegramBot = require("node-telegram-bot-api");
const { TOKEN } = require("./config");
const GamerController = require("./controllers/GamerController");
const postgres = require("./modules/postgres");
const { questions } = require("./questions.js");

const bot = new TelegramBot(TOKEN, { polling: true });

async function main() {
  const psql = await postgres();

  const MAX_TIME = 10000;
  let currentQuestionIndex = 0;
  let currentTimeoutId;
  let correctAnswers = 0;
  let incorrectAnswers = 0;

  function askNextQuestion(chatId) {
    if (currentQuestionIndex >= questions.length) {
      const message = `Quiz ended. You got ${correctAnswers} out of ${questions.length} questions correct.`;
      return bot.sendMessage(chatId, message);
    }

    const { question, options } = questions[currentQuestionIndex];
    const replyMarkup = {
      inline_keyboard: [
        options.map((option) => ({ text: option, callback_data: option })),
      ],
    };
    bot
      .sendMessage(chatId, question, { reply_markup: replyMarkup })
      .then((sentMessage) => {
        currentMessageId = sentMessage.message_id;
      });

    currentTimeoutId = setTimeout(() => {
      incorrectAnswers++;
      currentQuestionIndex++;
      // deleteCurrentMessage(chatId);
      askNextQuestion(chatId);
    }, MAX_TIME);
  }

  function deleteCurrentMessage(chatId) {
    if (currentMessageId) {
      bot.deleteMessage(chatId, currentMessageId);
      currentMessageId = null;
    }
  }

  bot.on("callback_query", (query) => {
    clearTimeout(currentTimeoutId);
    const answer = query.data[0].toUpperCase();
    const correctAnswer = questions[currentQuestionIndex].answer;
    const isCorrect = answer === correctAnswer;

    if (isCorrect) {
      bot.answerCallbackQuery(query.id, { text: "Correct!" });
      correctAnswers++;
    } else {
      bot.answerCallbackQuery(query.id, { text: "Wrong!" });
      incorrectAnswers++;
    }

    deleteCurrentMessage(query.message.chat.id);
    currentQuestionIndex++;
    setTimeout(() => askNextQuestion(query.message.chat.id), 1000);
  });

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
            keyboard: [[{ text: "Boshlash" }]],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }
      );
      bot.once("message", (message) => {
        if (message.text === "Boshlash") {
          currentQuestionIndex = 0;
          correctAnswers = 0;
          incorrectAnswers = 0;
          bot.sendMessage(chatId, "Test boshlandi!");
          askNextQuestion(message.chat.id);
        } else {
          bot.sendMessage(chatId, "Iltimos, Boshlash tugmasini bosing!");
        }
      });
    });
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
