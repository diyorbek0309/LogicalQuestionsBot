module.exports = class ExtraControllers {
  static async StatsController(message, bot, psql) {
    const chatId = message.chat.id;
    try {
      const users = await psql.users.findAll();
      // console.log(users);
      // console.log(users[0].score);
      // console.log(users[1].score);

      function getBestResult(user) {
        if (!user.score || user.score.length === 0) {
          return null;
        }

        let best = user.score[0];
        for (const score of user.score) {
          const percent = (score.correctAnswers / score.questionsCount) * 100;
          const bestPercent = (best.correctAnswers / best.questionsCount) * 100;

          if (percent > bestPercent) {
            best = score;
          } else if (percent === bestPercent && score.date > best.date) {
            best = score;
          }
        }

        return best;
      }

      // Sort the users array based on the best result and correctness percentage
      const data = users.sort((a, b) => {
        const aBest = getBestResult(a);
        const bBest = getBestResult(b);

        if (!aBest && !bBest) {
          return 0;
        } else if (!aBest) {
          return 1;
        } else if (!bBest) {
          return -1;
        }

        const aPercent = (aBest.correctAnswers / aBest.questionsCount) * 100;
        const bPercent = (bBest.correctAnswers / bBest.questionsCount) * 100;

        if (aPercent > bPercent) {
          return -1;
        } else if (aPercent < bPercent) {
          return 1;
        } else if (aBest.date > bBest.date) {
          return -1;
        } else if (aBest.date < bBest.date) {
          return 1;
        } else {
          return 0;
        }
      });

      // console.log(data);

      // await bot.sendMessage(chatId, `Siz botda roʻyxatdan oʻtgansiz!`);
    } catch (error) {
      console.log(error);
      await bot.sendMessage(chatId, `Qandaydir xatolik sodir boʻldi!`);
    }
  }
};
