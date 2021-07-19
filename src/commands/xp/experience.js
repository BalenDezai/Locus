const Command = require('../commandModel');
const InfoMessages = require('../../utils/infoMessages');

class Experience extends Command {
  constructor(client) {
    super(client, {
      name: 'experience',
      description: 'Check your current xp level',
      category: 'XP',
      usage: 'experience',
      aliases: ['xp', 'rank'],
    });
  }

  async run(message) {
    this.client.xpModel
      .findOne({
        where: { serverid: message.guild.id, userid: message.author.id },
      })
      .then((model) => {
        if (model) {
          message.channel.send(
            InfoMessages.createSuccessMessage(
              `Viewing current xp and level\n**Current XP**: ${
                model.xpamount
              }\n**Current Level**: ${this.getLevelFromXp(model.xpamount)}`
            )
          );
        } else {
          message.channel.send(
            InfoMessages.createErrorMessage(
              'Database entry for this user does not exist'
            )
          );
        }
      });
  }

  /**
   * Level calculation equation
   * @param {number} level absolute level number
   */
  // eslint-disable-next-line class-methods-use-this
  getLevelExp(level) {
    return 5 * level ** 2 + 50 * level + 100;
  }

  /**
   * Gets the level number from the xp points
   * @param {number} xp number of current xp points
   */
  getLevelFromXp(xp) {
    let level = 0;

    while (xp >= this.getLevelExp(level)) {
      xp -= this.getLevelExp(level);
      level += 1;
    }

    return level + 1;
  }
}

module.exports = Experience;
