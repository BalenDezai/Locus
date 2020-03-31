const { MessageEmbed } = require('discord.js');
const Command = require('./commandModel');
const InfoMessages = require('../utils/infoMessages');

class Settings extends Command {
  constructor(client) {
    super(client, {
      name: 'settings',
      description: 'Update/change or check current server settings',
      category: 'System',
      usage: 'settings [get/set/reset] [key] [value]',
      guildOnly: true,
      aliases: ['sets'],
      permLevel: 'Administrator',
    });
  }

  async run(message, [action, key, ...value]) {
    const { settings } = message;

    // Check if the current guild is in the settings, if not, create an entry in the Enmap
    if (!this.client.settings.has(message.guild.id)) {
      this.client.settings.set(message.guild.id, {});
    }

    // Check if the guild has any previously overridden settings in the Enmap
    const overriddenSettings = this.client.settings.get(message.guild.id);

    // Use a switch for the action type (should be a string)
    switch (action) {
      /* SET */
      case 'set':
      case 'edit': {
        if (this.validateCommandArguments(key, settings, message)) {
          if (value) {
            const valueString = value.join(' ');

            if (valueString.length < 1) {
              return message.channel.send(InfoMessages.createErrorMessage('Please specify a value for the setting'));
            }

            if (valueString === settings[key]) {
              return message.channel.send(InfoMessages.createErrorMessage('The setting you\'re trying to modify already has that value'));
            }

            this.client.settings.set(message.guild.id, valueString, key);
            message.channel.send(InfoMessages.createSuccessMessage(`**${key}** has been successfully set to **${valueString}**`));
            break;
          }

          break;
        } else {
          break;
        }
      }

      /* RESET */
      case 'reset':
      case 'delete':
      case 'del': {
        if (this.validateCommandArguments(key, settings, message)) {
          // If the key doesn't exist in the overridden settings it means it's already on default
          if (!overriddenSettings[key]) {
            return message.channel.send(InfoMessages.createErrorMessage(`The setting **${key}** is already set to default`));
          }

          const yesResponses = ['y', 'yes', 'accept'];
          const noResponses = ['n', 'no', 'cancel', 'deny', 'reject'];

          const confirmationMessage = new MessageEmbed()
            .setColor('#BC42F5')
            .setDescription(`:question: | Are you **sure** you want to reset ${key} to its default value?`)
            .setFooter('Respond with "yes" or "no"')
            .setTimestamp();

          const response = await this.client.awaitResponse(message, confirmationMessage, 15000);

          if (yesResponses.includes(response.toLowerCase())) {
            this.client.settings.delete(message.guild.id, key);
            return message.channel.send(InfoMessages.createSuccessMessage(`**${key}** has been reset to its default value.`));
          }

          if (noResponses.includes(response.toLowerCase())) {
            return message.channel.send(InfoMessages.createSuccessMessage(`The value for **${key}** will remain as **${settings[key]}**`));
          }

          return message.channel.send(InfoMessages.createErrorMessage('The command has timed out or your response was not valid.'));
        }

        break;
      }

      /* GET */
      case 'get':
      case 'view': {
        if (this.validateCommandArguments(key, settings, message)) {
          message.channel.send(InfoMessages.createSuccessMessage(`**${key}** is currently set to **${settings[key]}** for this server.`));
          break;
        }

        break;
      }

      /* DEFAULT (VIEW ALL) */
      default: {
        // Initialize empty strings for the keys and values
        let keys = '';
        let values = '';

        // Iterate through the settings and format the strings properly to display
        Object.entries(settings).forEach(([skey, svalue]) => {
          keys += (`${skey}\n`);
          values += (`${svalue}\n`);
        });

        // Create a new rich embed object to format the message
        const allSettings = new MessageEmbed()
          .setColor('#7ED321')
          .setDescription(`Viewing all settings for **${message.guild.name}**`)
          .addField('Setting', keys, true)
          .addField('Value', values, true)
          .setTimestamp();

        message.channel.send(allSettings);
        break;
      }
    }
  }

  validateCommandArguments(key, settings, message) {
    // Check whether there's a key to change
    if (!key) {
      message.channel.send(InfoMessages.createErrorMessage('You must specify a key to edit or view.'));
      this.client.logger.error('Settings command denied due to an empty key');
      return false;
    }

    // Check whether the key name exists in the settings
    if (!settings[key]) {
      message.channel.send(InfoMessages.createErrorMessage('The key you specified does not exist in the settings.'));
      this.client.logger.error('Settings command denied due to a nonexistant key');
      return false;
    }

    return true;
  }
}

module.exports = Settings;
