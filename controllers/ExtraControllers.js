module.exports = class ExtraControllers {
  static async StatsController(message, bot, psql) {
    const chatId = message.chat.id;
    try {
      const users = await psql.users.findAll();

      users.forEach((user) => {
        let bestPercent = 0;
        user.score.forEach((score) => {
          const percentCorrectAnswers =
            (score.correctAnswers / score.questionsCount) * 100;
          if (percentCorrectAnswers > bestPercent) {
            bestPercent = percentCorrectAnswers;
          }
        });
        user.bestPercent = bestPercent;
      });

      const sortedUsers = users.sort((a, b) => b.bestPercent - a.bestPercent);

      let message = "📊 Natijalar 📊\n\n";
      sortedUsers.forEach((user, index) => {
        const bestResult =
          user.score &&
          Math.max(...user.score.map((item) => item.correctAnswers));
        const bestResultPercentage =
          user.score && (bestResult / user.score[0].questionsCount) * 100;
        const bestResultFormatted =
          user.score && `${bestResult}/${user.score[0].questionsCount}`;

        message += bestResultPercentage
          ? `${getEmoji(index + 1)} ${
              user.name
            }: ${bestResultPercentage.toFixed(0)}%   ${bestResultFormatted}\n`
          : "";
      });

      await bot.sendMessage(chatId, message);
    } catch (error) {
      console.log(error);
      await bot.sendMessage(chatId, `Qandaydir xatolik sodir boʻldi!`);
    }
  }
};

function getEmoji(rank) {
  switch (rank) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return `${rank}.`;
  }
}
