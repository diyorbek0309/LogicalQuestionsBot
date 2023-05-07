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
  let questionsCount = 5;

  function askNextQuestion(chatId) {
    if (currentQuestionIndex >= questionsCount) {
      const message = `Savollar tugadi.\nSiz ${questionsCount} ta savoldan ${correctAnswers} tasiga toʻgʻri javob berdingiz.\nReytingdagi oʻrningiz: 12`;
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
      hideAnswerOptions(chatId);
      askNextQuestion(chatId);
    }, MAX_TIME);
  }

  function stopTest(chatId) {
    clearTimeout(currentTimeoutId);
    bot.sendMessage(
      chatId,
      `Test toʻxtatildi.\nSiz ${
        currentQuestionIndex + 1
      } ta savoldan ${correctAnswers} tasiga toʻgʻri javob berdingiz.\nReytingdagi oʻrningiz: 12`
    );
    currentQuestionIndex = 0;
    correctAnswers = 0;
    incorrectAnswers = 0;
    hideAnswerOptions(chatId);
  }

  function hideAnswerOptions(chatId) {
    bot.editMessageReplyMarkup(
      {},
      { chat_id: chatId, message_id: currentMessageId }
    );
  }

  bot.on("callback_query", (query) => {
    clearTimeout(currentTimeoutId);
    const answer = query.data[0].toUpperCase();
    const correctAnswer = questions[currentQuestionIndex].answer;
    const isCorrect = answer === correctAnswer;

    if (isCorrect) {
      bot.answerCallbackQuery(query.id, { text: "Toʻgʻri!" });
      correctAnswers++;
    } else {
      bot.answerCallbackQuery(query.id, { text: "Notoʻgʻri!" });
      incorrectAnswers++;
    }

    hideAnswerOptions(query.message.chat.id);
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
        `${name} Mantiqiy savollar botimizga Xush kelibsiz!\nHar bir savol uchun 30 sekund vaqt beriladi. Nechta savolga javob berishni xohlaysiz?`,
        {
          reply_markup: {
            keyboard: [[{ text: "5" }], [{ text: "10" }], [{ text: "20" }]],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }
      );
      bot.once("message", (message) => {
        if (
          message.text === "5" ||
          message.text === "10" ||
          message.text === "20"
        ) {
          questionsCount = +message.text;
          currentQuestionIndex = 0;
          correctAnswers = 0;
          incorrectAnswers = 0;
          bot.sendMessage(
            chatId,
            `${message.text} ta savol. Har bir savol uchun 30 sekund vaqt.\nTayyor bo'lsangiz Boshlash'ni bosing!`,
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
              setTimeout(() => {
                askNextQuestion(message.chat.id);
              }, 500);
            } else {
              bot.sendMessage(chatId, "Iltimos, Boshlash tugmasini bosing!");
            }
          });
        } else {
          bot.sendMessage(
            chatId,
            "Iltimos, quyidagi tugmalardan birini bosing!"
          );
        }
      });
    });
  });

  await bot.onText(/\/stopTest/, (msg) => {
    stopTest(msg.chat.id);
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
