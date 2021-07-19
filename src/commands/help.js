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
    const noAdditionalArgs = args.length === 0;
    if (noAdditionalArgs) {
      this.ShowAllCommands(message, lvl);
      return;
    }

    // Get the command name from the arguments
    const commandName = args[0];
    // Fetch the command object from the collection
    const commandObject = this.client.commands.get(commandName);

    if (!commandObject) {
      message.channel.send(
        InfoMessages.createErrorMessage(
          `Command ${commandName} does not exist!`
        )
      );
      return;
    }

    const UserNotAllowed =
      lvl < this.client.levelCache[commandObject.conf.permLevel];

    if (UserNotAllowed) {
      message.channel.send(
        InfoMessages.createErrorMessage(
          `You do not have permission to view the help of the command ${commandName}`
        )
      );
      return;
    }

    // Create a rich embed for the command arguments
    const helpMessage = new MessageEmbed()
      .setColor('#7ED321')
      .setTitle(`Command name: _${commandObject.help.name}_`)
      .setDescription(commandObject.help.description)
      .addField('Usage', commandObject.help.usage)
      .setTimestamp();

    // Populate the aliases list
    if (commandObject.help.aliases.length > 0) {
      helpMessage.addField('Aliases', commandObject.help.aliases.join(', '));
    }

    // Send the message
    message.channel.send(helpMessage);
  }

  /**
   * Show all available commands
   * @param {*} message
   * @param {*} lvl
   */
  ShowAllCommands(message, lvl) {
    const { settings } = message;
    let commands;

    // Filter the commands by permission level
    if (message.guild) {
      commands = this.client.commands.filter(
        (x) => this.client.levelCache[x.conf.permLevel] <= lvl
      );
    } else {
      commands = this.client.commands.filter(
        (x) =>
          this.client.levelCache[x.conf.permLevel] <= lvl &&
          x.conf.guildOnly !== true
      );
    }

    // Sort the commands by category and name
    const sortedCommands = this.sortCommands(commands);

    const helpMessage = this.createHelpMessage(settings);

    // Get all the available categories
    const categories = this.getAvailableCategories(sortedCommands);

    // Add the commands by category to the message
    categories.forEach((cat) => {
      const filteredCommands = sortedCommands.filter(
        (x) => x.help.category === cat
      );
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
  }

  /**
   * Sort commands by category and name
   * @param {Array} commands
   * @returns Sorted commands
   */
  // eslint-disable-next-line class-methods-use-this
  sortCommands(commands) {
    const sortedCommands = commands.array().sort((a, b) => {
      if (a.help.category > b.help.category) {
        return 1;
      }

      if (a.help.name > b.help.name && a.help.category === b.help.category) {
        return 1;
      }

      return -1;
    });
    return sortedCommands;
  }

  /**
   * get available commands
   * @param {Array} sortedCommands
   * @param {Array} categories
   * @returns
   */
  // eslint-disable-next-line class-methods-use-this
  getAvailableCategories(sortedCommands) {
    const categories = [];
    sortedCommands.forEach((command) => {
      if (!categories.includes(command.help.category)) {
        categories.push(command.help.category);
      }
    });
    return categories;
  }

  /**
   * Creates an embedded help message
   * @returns embedded message object
   */
  // eslint-disable-next-line class-methods-use-this
  createHelpMessage(settings) {
    return new MessageEmbed()
      .setColor('#7ED321')
      .setTitle('Available Commands')
      .setDescription(
        `Use \`${settings.prefix}help [command name]\` to get more information about a specific command`
      );
  }
}

module.exports = Help;
