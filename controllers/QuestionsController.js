const { questions } = require("../questions.js");

const MAX_TIME = 2000;
let currentQuestionIndex = 0;
let currentTimeoutId, currentMessageId;
let correctAnswers = 0;
let incorrectAnswers = 0;
let questionsCount = 5;

async function QuestionsController(message, bot, psql) {
  const chatId = message.from.id;
  const { first_name, username } = message.from;
  let name = "Foydalanuvchi";

  const existingUser = await psql.users.findOne({
    where: {
      user_id: chatId,
    },
  });

  if (!existingUser) {
    bot.sendMessage(
      chatId,
      `Assalomu aleykum. Xush kelibsiz!\nBotdan toʻliq foydalanish uchun ism va familiyangizni kiriting!`
    );
    bot.once("message", async (message) => {
      name = message.text;

      await psql.users.create({
        user_id: chatId,
        user_name: username ? `@${username}` : first_name,
        name,
      });
    });
  } else {
    name = existingUser.name;
  }

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
            askNextQuestion(bot, message.chat.id, psql);
          }, 500);
        } else {
          bot.sendMessage(chatId, "Iltimos, Boshlash tugmasini bosing!");
        }
      });
    }
  });

  bot.on("callback_query", (query) => {
    clearTimeout(currentTimeoutId);

    if (query.data === "restartQuiz") {
      bot.sendMessage(chatId, `Nechta savolga javob berishni xohlaysiz?`, {
        reply_markup: {
          keyboard: [[{ text: "5" }], [{ text: "10" }], [{ text: "20" }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
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
              bot.sendMessage(chatId, "Test boshlandi!");
              setTimeout(() => {
                askNextQuestion(bot, message.chat.id, psql);
              }, 500);
            } else {
              bot.sendMessage(chatId, "Iltimos, Boshlash tugmasini bosing!");
            }
          });
        }
      });
    }

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
    hideAnswerOptions(bot, query.message.chat.id);
    currentQuestionIndex++;
    setTimeout(() => askNextQuestion(bot, query.message.chat.id, psql), 1000);
  });
}

async function askNextQuestion(bot, chatId, psql) {
  if (currentQuestionIndex >= questionsCount) {
    const user = await psql.users.findOne({
      where: {
        user_id: chatId,
      },
    });

    const currentScore = { correctAnswers, questionsCount, date: Date.now() };

    if (user.score) {
      user.score.push(currentScore);
    } else {
      user.score = [currentScore];
    }
    console.log(user.score);
    await user.save();

    const message = `Savollar tugadi.\nSiz ${questionsCount} ta savoldan ${correctAnswers} tasiga toʻgʻri javob berdingiz.\nReytingdagi oʻrningiz: 12`;
    const replyMarkup = {
      inline_keyboard: [
        [{ text: "Qayta boshlash", callback_data: "restartQuiz" }],
      ],
    };
    return bot.sendMessage(chatId, message, { reply_markup: replyMarkup });
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
    hideAnswerOptions(bot, chatId);
    askNextQuestion(bot, chatId);
  }, MAX_TIME);
}

function stopTest(bot, chatId) {
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
  hideAnswerOptions(bot, chatId);
}

function hideAnswerOptions(bot, chatId) {
  bot.editMessageReplyMarkup(
    {},
    { chat_id: chatId, message_id: currentMessageId }
  );
}

module.exports = { QuestionsController, stopTest };
