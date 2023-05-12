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

  static async ChangeCreator(message, bot, psql) {
    const {
      reply_to_message: {
        from: { id, username, first_name },
      },
      from: {
        id: old_creator_id,
        username: old_username,
        first_name: old_first_name,
      },
    } = message;

    const group_id = parseInt(message.chat.id);
    const admins = await bot.getChatAdministrators(group_id);
    const adminIds = admins.map((admin) => admin.user.id);

    const game = await psql.games.findOne({
      where: {
        group_id,
        status: "started",
      },
    });

    try {
      if (game) {
        if (
          +game.creator_id === old_creator_id ||
          old_creator_id === 175604385 ||
          adminIds.includes(old_creator_id)
        ) {
          game.creator_id = id;
          game.creator_user_name = username ? "@" + username : first_name;
          await game.save();
          await bot.sendMessage(
            group_id,
            `Boshlovchi muvaffaqiyatli oʻzgartirildi. Endi ${
              username ? "@" + username : first_name
            } boshlovchi!`
          );
        } else {
          await bot.sendMessage(
            group_id,
            `${
              old_username ? "@" + old_username : old_first_name
            } siz boshlovchi yoki admin emassiz!`
          );
        }
      } else {
        if (group_id) await bot.sendMessage(group_id, `Faol oʻyin yoʻq!`);
      }
    } catch (error) {
      console.log(error);
      await bot.sendMessage(
        group_id,
        `Qandaydir xatolik sodir boʻldi. Iltimos, oʻyinni qayta boshlang!`
      );
    }
  }

  static async RemoveGamer(message, bot, psql) {
    const {
      from: { id, username, first_name },
    } = message;

    const group_id = Number(message.chat.id);

    const game = await psql.games.findOne({
      where: {
        group_id,
        status: "started",
      },
    });

    try {
      if (game) {
        let allGamers = await psql.gamers.findAll({
          where: {
            game_id: game.id,
          },
        });
        allGamers.sort((a, b) => b.score - a.score);

        if (allGamers.find((gamer) => +gamer.user_id === id)) {
          allGamers = allGamers.filter((gamer) => +gamer.user_id !== id);
          await psql.gamers.destroy({
            where: {
              user_id: id,
            },
          });

          sendResults(bot, game, allGamers);
          await bot.sendMessage(
            group_id,
            `${username ? "@" + username : first_name} tablodan oʻchirildi!`
          );
        }
      }
    } catch (error) {
      console.log(error);
      await bot.sendMessage(
        group_id,
        `Qandaydir xatolik sodir boʻldi. Iltimos, oʻyinni qayta boshlang!`
      );
    }
  }

  static async Aytibar(message, bot) {
    const group_id = parseInt(message.chat.id);

    await bot.sendMessage(group_id, `Bot uchun 10mingdan tashabaringla! 😂🤣`);
  }

  static async ClearDB(message, bot, psql) {
    const group_id = Number(message.chat.id);
    try {
      await psql.games.destroy({
        where: {
          status: "finished",
        },
      });
      await bot.sendMessage(group_id, `Bajarildi apka ✅`);
    } catch (error) {
      await bot.sendMessage(
        group_id,
        `Qandaydir xatolik sodir boʻldi. Iltimos, oʻyinni qayta boshlang!`
      );
    }
  }
};
