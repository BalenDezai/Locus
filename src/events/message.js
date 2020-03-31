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
              if (!message.guild && command.conf.guildOnly) {
                return message.channel.send(InfoMessages.createErrorMessage('Sorry, this command is unavailable to use in DMs.'));
              }

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
      }
    }
  }
}

module.exports = Message;
