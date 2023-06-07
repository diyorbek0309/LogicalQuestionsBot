module.exports = class ExtraControllers {
  static async StatsController(message, bot, psql) {
    const chatId = message.chat.id;
    try {
      const users = await psql.users.findAll();
      console.log(users[0]);
      console.log(users[0].score);

      const sortedUsers = users.sort((a, b) => {
        const percentA =
          (a.score &&
            a.score.filter((item) => item.correctAnswers > 0).length /
              a.score.length) * 100;
        const percentB =
          (b.score &&
            b.score.filter((item) => item.correctAnswers > 0).length /
              b.score.length) * 100;
        return percentB - percentA;
      });

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
