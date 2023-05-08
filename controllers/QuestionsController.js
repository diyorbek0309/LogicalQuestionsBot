const { questions } = require("../questions.js");
const askNextQuestion = require("../services/askNextQuestion.js");
const hideAnswerOptions = require("../services/askNextQuestion.js");

let currentQuestionIndex = 0;
let currentTimeoutId;
let correctAnswers = 0;
let incorrectAnswers = 0;
let questionsCount = 5;

module.exports = async function QuestionsController(message, bot, psql) {
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
              askNextQuestion(bot, message.chat.id);
            }, 500);
          } else {
            bot.sendMessage(chatId, "Iltimos, Boshlash tugmasini bosing!");
          }
        });
      } else {
        bot.sendMessage(chatId, "Iltimos, quyidagi tugmalardan birini bosing!");
      }
    });
  });

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
    console.log(query);
    hideAnswerOptions(bot, query.message.chat.id, query.message.id);
    currentQuestionIndex++;
    setTimeout(() => askNextQuestion(bot, query.message.chat.id), 1000);
  });
};
