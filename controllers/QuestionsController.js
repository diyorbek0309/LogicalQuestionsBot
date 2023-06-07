const { questions } = require("../questions.js");

const MAX_TIME = 5000;
let currentQuestionIndex = 0;
let currentTimeoutId, currentMessageId;
let correctAnswers = 0;
let questionsCount = 5;
let selectedQuestions = shuffleQuestions(questions).slice(0, questionsCount);

async function QuestionsController(message, bot, psql) {
  const chatId = message.from.id;
  const { first_name, username } = message.from;

  const existingUser = await psql.users.findOne({
    where: {
      user_id: chatId,
    },
  });

  if (!existingUser) {
    clearTimeout(currentTimeoutId);
    await bot.sendMessage(
      chatId,
      `Assalomu aleykum. Xush kelibsiz!\nBotdan toʻliq foydalanish uchun ism va familiyangizni kiriting!`
    );
    bot.once("message", async (message) => {
      await psql.users.create({
        user_id: chatId,
        user_name: username ? `@${username}` : first_name,
        name: message.text,
      });

      await bot.sendMessage(
        chatId,
        `${message.text} Mantiqiy savollar botimizga Xush kelibsiz!\nHar bir savol uchun 30 sekund vaqt beriladi. Nechta savolga javob berishni xohlaysiz?`,
        {
          reply_markup: {
            keyboard: [[{ text: "5" }], [{ text: "10" }], [{ text: "20" }]],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }
      );

      bot.once("message", async (message) => {
        if (
          message.text === "5" ||
          message.text === "10" ||
          message.text === "20"
        ) {
          questionsCount = +message.text;
          selectedQuestions = shuffleQuestions(questions).slice(
            0,
            questionsCount
          );
          currentQuestionIndex = 0;
          correctAnswers = 0;
          await bot.sendMessage(
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
          bot.once("message", async (message) => {
            if (message.text === "Boshlash") {
              currentQuestionIndex = 0;
              correctAnswers = 0;
              await bot.sendMessage(chatId, "Test boshlandi!");
              setTimeout(() => {
                askNextQuestion(bot, message.chat.id, psql);
              }, 1000);
            } else {
              await bot.sendMessage(
                chatId,
                "Iltimos, Boshlash tugmasini bosing!"
              );
            }
          });
        }
      });
    });

    bot.on("callback_query", async (query) => {
      clearTimeout(currentTimeoutId);

      if (query.data === "restartQuiz") {
        await bot.sendMessage(
          chatId,
          `Nechta savolga javob berishni xohlaysiz?`,
          {
            reply_markup: {
              keyboard: [[{ text: "5" }], [{ text: "10" }], [{ text: "20" }]],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          }
        );
        bot.once("message", async (message) => {
          console.log(message);
          if (
            message.text === "5" ||
            message.text === "10" ||
            message.text === "20"
          ) {
            questionsCount = +message.text;
            selectedQuestions = shuffleQuestions(questions).slice(
              0,
              questionsCount
            );
            currentQuestionIndex = 0;
            correctAnswers = 0;

            await bot.sendMessage(
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
            bot.once("message", async (message) => {
              if (message.text === "Boshlash") {
                await bot.sendMessage(chatId, "Test boshlandi!");
                setTimeout(() => {
                  askNextQuestion(bot, message.chat.id, psql);
                }, 1000);
              } else {
                await bot.sendMessage(
                  chatId,
                  "Iltimos, Boshlash tugmasini bosing!"
                );
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
      }
      // hideAnswerOptions(bot, query.message.chat.id);
      currentQuestionIndex++;
      setTimeout(() => askNextQuestion(bot, query.message.chat.id, psql), 1000);
    });
  } else {
    await bot.sendMessage(
      chatId,
      `${existingUser.name} Mantiqiy savollar botimizga Xush kelibsiz!\nHar bir savol uchun 30 sekund vaqt beriladi. Nechta savolga javob berishni xohlaysiz?`,
      {
        reply_markup: {
          keyboard: [[{ text: "5" }], [{ text: "10" }], [{ text: "20" }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    );
    bot.once("message", async (message) => {
      if (
        message.text === "5" ||
        message.text === "10" ||
        message.text === "20"
      ) {
        questionsCount = +message.text;
        selectedQuestions = shuffleQuestions(questions).slice(
          0,
          questionsCount
        );
        currentQuestionIndex = 0;
        correctAnswers = 0;
        await bot.sendMessage(
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
        bot.once("message", async (message) => {
          if (message.text === "Boshlash") {
            currentQuestionIndex = 0;
            correctAnswers = 0;
            await bot.sendMessage(chatId, "Test boshlandi!");
            setTimeout(() => {
              askNextQuestion(bot, message.chat.id, psql);
            }, 1000);
          } else {
            await bot.sendMessage(
              chatId,
              "Iltimos, Boshlash tugmasini bosing!"
            );
          }
        });
      }
    });

    bot.on("callback_query", async (query) => {
      clearTimeout(currentTimeoutId);

      if (query.data === "restartQuiz") {
        await bot.sendMessage(
          chatId,
          `Nechta savolga javob berishni xohlaysiz?`,
          {
            reply_markup: {
              keyboard: [[{ text: "5" }], [{ text: "10" }], [{ text: "20" }]],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          }
        );
        bot.once("message", async (message) => {
          if (
            message.text === "5" ||
            message.text === "10" ||
            message.text === "20"
          ) {
            questionsCount = +message.text;
            selectedQuestions = shuffleQuestions(questions).slice(
              0,
              questionsCount
            );
            currentQuestionIndex = 0;
            correctAnswers = 0;

            await bot.sendMessage(
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
            bot.once("message", async (message) => {
              if (message.text === "Boshlash") {
                await bot.sendMessage(chatId, "Test boshlandi!");
                setTimeout(() => {
                  askNextQuestion(bot, message.chat.id, psql);
                }, 1000);
              } else {
                await bot.sendMessage(
                  chatId,
                  "Iltimos, Boshlash tugmasini bosing!"
                );
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
      }
      // hideAnswerOptions(bot, query.message.chat.id);
      currentQuestionIndex++;
      setTimeout(() => askNextQuestion(bot, query.message.chat.id, psql), 1000);
    });
  }
}

async function askNextQuestion(bot, chatId, psql) {
  // if (currentQuestionIndex > 1) {
  // hideAnswerOptions(bot, chatId);
  // }
  if (currentQuestionIndex >= questionsCount) {
    const user = await psql.users.findOne({
      where: {
        user_id: chatId,
      },
    });

    const currentScore = { correctAnswers, questionsCount, date: Date.now() };

    if (user.score) {
      user.score = [...user.score, currentScore];
    } else {
      user.score = [currentScore];
    }

    await user.save();

    const message = `Savollar tugadi.\nSiz ${questionsCount} ta savoldan ${correctAnswers} tasiga toʻgʻri javob berdingiz.`;
    const replyMarkup = {
      inline_keyboard: [
        [{ text: "Qayta boshlash", callback_data: "restartQuiz" }],
      ],
    };
    return bot.sendMessage(chatId, message, { reply_markup: replyMarkup });
  }

  const { question, options } = selectedQuestions[currentQuestionIndex];
  const replyMarkup = {
    inline_keyboard: [
      options.map((option) => ({ text: option, callback_data: option })),
    ],
  };
  await bot
    .sendMessage(chatId, question, { reply_markup: replyMarkup })
    .then((sentMessage) => {
      currentMessageId = sentMessage.message_id;
    });

  currentTimeoutId = setTimeout(() => {
    currentQuestionIndex++;
    askNextQuestion(bot, chatId, psql);
  }, MAX_TIME);
}

async function stopTest(bot, chatId) {
  clearTimeout(currentTimeoutId);
  const replyMarkup = {
    inline_keyboard: [[{ text: "Davom etish", callback_data: "restartQuiz" }]],
  };
  await bot.sendMessage(
    chatId,
    `Test toʻxtatildi.\nSiz ${
      currentQuestionIndex + 1
    } ta savoldan ${correctAnswers} tasiga toʻgʻri javob berdingiz.`,
    { reply_markup: replyMarkup }
  );
  currentQuestionIndex = 0;
  correctAnswers = 0;
  hideAnswerOptions(bot, chatId);
}

async function hideAnswerOptions(bot, chatId) {
  await bot.editMessageReplyMarkup(
    {},
    { chat_id: chatId, message_id: currentMessageId }
  );
}

function shuffleQuestions(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

module.exports = { QuestionsController, stopTest };
