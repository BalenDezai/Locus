const InfoMessages = require('../utils/infoMessages');
const GeneralUtils = require('../utils/generalUtils');

class Message {
  constructor(_client) {
    this.client = _client;
  }

  async run(message) {
    // Ignore other bots' mesages
    if (!message.author.bot) {
      if (message.guild) {
        // Find an instance of the model in the DB (should be server unique, not user unique)
        this.client.xpModel.findOne({ where: { serverid: message.guild.id, userid: message.author.id } })
          .then(async (model) => {
            if (!model) {
              const msg = `Created database entry for server [${message.guild.id}] and user [${message.author.id}]`;

              // If the model is not present in the DB we need to create it and do the insert operation
              this.client.xpModel.create({
                serverid: message.guild.id,
                userid: message.author.id,
                xpamount: this.generateXpAmount(),
                lastxp: Math.floor(Date.now() / 1000),
              });

              // Sync to the database
              await this.tryDbSync(msg);
            } else {
              const timestampNow = Math.floor(Date.now() / 1000);
              const msg = `XPSYSTEM GUILD:[${message.guild.id}] USER:[${message.author.id}] - XP incremented`;

              // Check for XP cooldown
              if (timestampNow - model.lastxp > this.client.config.xp.cooldown) {
                this.client.xpModel.update(
                  { xpamount: model.xpamount + this.generateXpAmount(), lastxp: timestampNow },
                  { where: { serverid: message.guild.id, userid: message.author.id } },
                );

                await this.tryDbSync(msg);
              }
            }

            if (message.channel.permissionsFor(message.guild.me).missing('SEND_MESSAGES')) {
              // Fetch guild settings, then attach to message object
              const guildSettings = this.client.getServerSettings(message.guild.id);
              // eslint-disable-next-line no-param-reassign
              message.settings = guildSettings;

              // Check if the bot was mentioned
              const botMention = new RegExp(`^<@!?${this.client.user.id}>( |)$`);

              // If the bot was mentioned, return the current prefix
              if (message.content.match(botMention)) {
                return message.channel.reply(InfoMessages.createInfoMessage(`The current prefix for this server is: ${guildSettings.prefix}`))
                  .then((botMessage) => {
                    botMessage.delete(10000);
                  })
                  .catch((error) => {
                    this.client.Logger.error(error);
                  });
              }

              // Check the message start for the prefix
              if (message.content.indexOf(guildSettings.prefix) === 0) {
                const messageArguments = message.content.substring(1).trim().split(' ');
                const commandText = messageArguments.shift().toLowerCase();

                // Prevent caching errors by fetching the member if for any reason they should be
                // invisible or not cached
                if (message.guild && !message.member) {
                  await message.guild.fetchMember(message.author);
                }

                // Grab the command from the Collection
                const command = this.client.commands.get(commandText) || this.client.commands.get(this.client.aliases.get(commandText));

                // If the command exists, set the logic to execute it
                if (command) {
                  // Check if the level set in the command actually exists
                  if (typeof (this.client.levelCache[command.conf.permLevel]) !== 'number') {
                    return message.channel.send(InfoMessages.createErrorMessage('The command you\'re trying to execute was not properly configured. Please contact the bot\'s admin.'));
                  }

                  // Get the member's permission level
                  const levelObject = this.client.permLevel(message);
                  const userPerms = message.member.permissions.toArray();

                  // Check the required level against the command's required level
                  if (levelObject.lvl < this.client.levelCache[command.conf.permLevel]) {
                    // Check the user permissions
                    if (!GeneralUtils.hasPerms(userPerms, command.conf.perms)) {
                      // Notify the server if the user doesn't have permissions to execute the command
                      if (guildSettings.systemNotice) {
                        return message.channel.send(InfoMessages.createErrorMessage('You do not have enough permission to use this command.'));
                      }

                      return;
                    }
                  }

                  // Set the author's permission level in the message object to the current level
                  message.author.permLevel = levelObject.lvl;

                  // Log and run the command
                  this.client.logger.command(message.author.tag, message.author.id, command.help.name);
                  command.run(message, messageArguments, levelObject.lvl);
                }
              }
            }
          })
          .catch((err) => {
            this.client.logger.error(err);
            throw new Error(err);
          });
      } else {
        // Warn the user the bot cannot be used in DMs
        message.channel.send('Sorry, the bot cannot be used in DMs yet.');
      }
    }
  }

  /**
   * Generates a random amount of xp
   */
  generateXpAmount() {
    const { max, min } = this.client.config.xp;

    return Math.floor(
      Math.random() * (max - min) + min,
    );
  }

  /**
   * Does a try-catch for syncing to the database
   * @param {Model} this.client.xpModel sequelize model
   * @param {string} message message to show to the console
   */
  async tryDbSync(message) {
    try {
      await this.client.xpModel.sync();
      this.client.logger.log(message);
    } catch (error) {
      this.client.logger.error(error);
      throw new Error(error);
    }
  }
}

module.exports = Message;
