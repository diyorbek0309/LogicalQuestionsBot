const { questions } = require("../questions.js");

const MAX_TIME = 10000;
let currentQuestionIndex = 0;
let currentTimeoutId, currentMessageId;
let correctAnswers = 0;
let incorrectAnswers = 0;
let questionsCount = 5;

module.exports = function askNextQuestion(bot, chatId) {
  console.log(bot, "123");
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
    console.log(currentMessageId);
    hideAnswerOptions(bot, chatId, currentMessageId);
    askNextQuestion(bot, chatId);
  }, MAX_TIME);
};

module.exports = function stopTest(bot, chatId) {
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
  // hideAnswerOptions(bot, chatId, currentMessageId);
};

module.exports = function hideAnswerOptions(bot, chatId, currentMessageId) {
  console.log(currentMessageId);
  bot.editMessageReplyMarkup(
    {},
    { chat_id: chatId, message_id: currentMessageId }
  );
};
