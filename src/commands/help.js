const { MessageEmbed } = require('discord.js');
const Command = require('./commandModel');
const InfoMessages = require('../utils/infoMessages');

class Help extends Command {
  constructor(client) {
    super(client, {
      name: 'help',
      description: 'Help for the bot showcasing its different commands',
      category: 'System',
      usage: 'help [command name]',
      aliases: ['h'],
    });
  }

  async run(message, args, lvl) {
    if (!args[0]) {
      const { settings } = message;
      let commands;

      // Filter the commands by permission level
      if (message.guild) {
        commands = this.client.commands.filter((x) => this.client.levelCache[x.conf.permLevel] <= lvl);
      } else {
        commands = this.client.commands.filter((x) => this.client.levelCache[x.conf.permLevel] <= lvl && x.conf.guildOnly !== true);
      }

      // Sort the commands by category and name
      const sortedCommands = commands.array().sort((a, b) => {
        if (a.help.category > b.help.category) {
          return 1;
        }

        if (a.help.name > b.help.name && a.help.category === b.help.category) {
          return 1;
        }

        return -1;
      });

      const helpMessage = new MessageEmbed()
        .setColor('#7ED321')
        .setTitle('Available Commands')
        .setDescription(`Use \`${settings.prefix}help [command name]\` to get more information about a specific command`);

      // Get all the available categories
      const categories = [];

      sortedCommands.forEach((command) => {
        if (!categories.includes(command.help.category)) {
          categories.push(command.help.category);
        }
      });

      // Add the commands by category to the message
      categories.forEach((cat) => {
        const filteredCommands = sortedCommands.filter((x) => x.help.category === cat);
        const output = [];

        filteredCommands.forEach((x) => {
          output.push(x.help.name);
        });

        helpMessage.addField(cat, output.join(', '));
      });

      // Add the current timestamp
      helpMessage.setTimestamp();

      // Send the message
      message.channel.send(helpMessage);
    } else {
      // Get the command name from the arguments
      const commandName = args[0];
      // Fetch the command object from the collection
      const commandObject = this.client.commands.get(commandName);

      if (commandObject) {
        if (!(lvl < this.client.levelCache[commandObject.conf.permLevel])) {
          // Create a rich embed for the command arguments
          const helpMessage = new MessageEmbed()
            .setColor('#7ED321')
            .setTitle(`Command name: _${commandObject.help.name}_`)
            .setDescription(commandObject.help.description)
            .addField('Usage', commandObject.help.usage)
            .setTimestamp();

          // Populate the aliases list
          if (commandObject.conf.aliases.length > 0) {
            helpMessage.addField('Aliases', commandObject.conf.aliases.join(', '));
          }

          // Send the message
          message.channel.send(helpMessage);
        } else {
          message.channel.send(InfoMessages.createErrorMessage(`You do not have permission to view the help of the command ${commandName}`));
        }
      } else {
        message.channel.send(InfoMessages.createErrorMessage(`Command ${commandName} does not exist!`));
      }
    }
  }
}

module.exports = Help;
