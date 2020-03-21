/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const { Client, Collection } = require('discord.js');
const { promisify } = require('util');
const readdir = promisify(require('fs').readdir);
const klaw = require('klaw');
const path = require('path');
const config = require('./assets/config');
const logger = require('./utils/logger');

class BotApplication extends Client {
  constructor() {
    super();
    this.config = config;
    this.logger = logger;

    // Create the necessary collections to run the bot
    this.commands = new Collection();
    this.aliases = new Collection();
  }

  async init() {
    // Login into Discord using the provided bot token in the config
    this.login(this.config.token);

    // Load commands and events into memory
    await this.loadEvents();
    await this.loadCommands();

    // Once the bootstrapping is ready, log to the console
    this.once('ready', () => {
      console.log('Locus is ready to operate!');
    });
  }

  /**
   * Loads the event files
   * @NOTE event files should be *named* as the corresponding discord.js event!
   */
  async loadEvents() {
    this.logger.log('Loading event files...');
    const eventFiles = await readdir('./src/events');

    eventFiles.forEach((file) => {
      const eventName = file.split('.')[0];
      const eventPath = `./events/${file}`;
      const event = new (require(eventPath))(this);

      this.on(eventName, (...args) => event.run(...args));

      delete require.cache[require.resolve(eventPath)];
    });

    this.logger.log(`Successfully loaded ${eventFiles.length} events`);
  }

  /**
   * Loads commands into the collection of the client object
   */
  loadCommands() {
    this.logger.log('Klawing through commands...');
    let counter = 0;

    klaw('./src/commands', { depthLimit: 2 })
      .on('data', (item) => {
        const commandFile = path.parse(item.path);

        // Ignore everything that's not a file or a .js file
        if (!commandFile.ext || commandFile.ext !== '.js') return;

        if (commandFile.name !== 'commandModel') {
          // Use the below function to load the command into the collection
          const commandLoaded = this.loadCommand(commandFile.dir, `${commandFile.name}`);

          // Increment the counter if a command is successfully loaded
          if (commandLoaded) {
            counter += 1;
          }
        }
      })
      .on('end', () => {
        this.logger.log(`Successfully loaded ${counter.toString()} commands`);
      });
  }

  /**
   * Require a command so that it can be loaded into the collection
   * @param {string} commandName name of the command
   * @param {string} commandPath absolute path of the command
   */
  loadCommand(commandPath, commandName) {
    try {
      const command = new (require(`${commandPath + path.sep + commandName}`))(this);
      command.conf.location = commandPath;

      if (command.init) {
        command.init(this);
      }

      this.commands.set(command.help.name, command);

      if (command.help.aliases) {
        command.help.aliases.forEach((alias) => {
          this.aliases.set(alias, command.help.name);
        });
      }
      return true;
    } catch (error) {
      this.logger.error(`Unable to load command ${commandName} ->\n${error}`);
      return false;
    }
  }
}

module.exports = BotApplication;
