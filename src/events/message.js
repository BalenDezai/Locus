const InfoMessages = require('../utils/infoMessages.js');

class Message {
  constructor(_client) {
    this.client = _client;
  }

  async run(message) {
    // Ignore other bots' mesages
    if (!message.author.bot) {
      if (message.guild) {
        if (message.channel.permissionsFor(message.guild.me).missing('SEND_MESSAGES')) {
          // Check if the bot was mentioned
          const botMention = new RegExp(`^<@!?${this.client.user.id}>( |)$`);

          // If the bot was mentioned, return the current prefix
          if (message.content.match(botMention)) {
            return message.channel.reply(InfoMessages.createInfoMessage(`The current prefix for this server is: ${'!'}`))
              .then((botMessage) => {
                botMessage.delete(10000);
              })
              .catch((error) => {
                this.client.Logger.error(error);
              });
          }

          // Check the message start for the prefix
          /** @TODO change to guild settings prefix */
          if (message.content.indexOf('!') === 0) {
            const messageArguments = message.content.substring(1).trim().split(' ');
            const commandText = messageArguments.shift().toLowerCase();

            // Prevent caching errors by fetching the member if for any reason they should be
            // invisible or not cached
            if (message.guild && !message.member) {
              await message.guild.fetchMember(message.author);
            }

            const command = this.client.commands.get(commandText) || this.client.commands.get(this.client.aliases.get(commandText));

            if (command) {
              if (!message.guild && command.conf.guildOnly) {
                return message.channel.send(InfoMessages.createErrorMessage('Sorry, this command is unavailable to use in DMs.'));
              }

              command.run(message, messageArguments, 10);
            }
          }
        }
      }
    }
  }
}

module.exports = Message;
