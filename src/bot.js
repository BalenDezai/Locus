/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const { Client, Collection } = require('discord.js');
const { promisify } = require('util');
const readdir = promisify(require('fs').readdir);
const klaw = require('klaw');
const path = require('path');

class BotApplication extends Client {
  constructor(logger, config, Enmap) {
    super();
    this.config = config;
    this.logger = logger;

    // Create the necessary collections to run the bot
    this.commands = new Collection();
    this.aliases = new Collection();

    // Enmap settings
    this.settings = new Enmap({
      name: 'serverSettings',
      cloneLevel: 'deep',
      fetchAll: false,
      autoFetch: true,
    });

    // Cache for permission levels
    this.levelCache = {};
  }

  async init(Mongoose, XpModel) {
    // Login into Discord using the provided bot token in the config
    this.login(this.config.token);

    // Load commands and events into memory
    await this.loadEvents();
    this.loadCommands();

    // Set the permission level cache
    this.config.permLevels.forEach((permLevel) => {
      this.levelCache[permLevel.name] = permLevel.lvl;
    });

    const dbStr = `mongodb+srv://${this.config.database.username}:${this.config.database.password}@initcluster.33xti.mongodb.net/${this.config.database.name}?retryWrites=true&w=majority`;

    await Mongoose.connect(dbStr, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    this.xpModel = XpModel;
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

    klaw('./src/commands', { depthLimit: 2 })
      .on('data', (item) => {
        const commandFile = path.parse(item.path);

        // Ignore everything that's not a file or a .js file
        if (!commandFile.ext || commandFile.ext !== '.js') return;

        if (commandFile.name !== 'commandModel') {
          this.loadCommand(commandFile.dir, `${commandFile.name}`);
        }
      })
      .on('end', () => {
        this.logger.log(`Successfully loaded ${this.commands.size} commands`);
      });
  }

  /**
   * Require a command so that it can be loaded into the collection
   * @param {string} commandName name of the command
   * @param {string} commandPath absolute path of the command
   */
  loadCommand(commandPath, commandName) {
    try {
      const command = new (require(`${commandPath + path.sep + commandName}`))(
        this
      );
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

  /**
   * Gets the current server settings
   * @param {String} serverId the ID of the server
   */
  getServerSettings(serverId) {
    const defaultSettings = this.config.defaultServerSettings || {};
    const serverData = this.settings.get(serverId) || {};
    const settings = {};

    Object.keys(defaultSettings).forEach((key) => {
      settings[key] = serverData[key] || defaultSettings[key];
    });

    return settings;
  }

  /**
   * Override or add configuration items to the specified server
   * @param {string} serverId the ID of the server
   * @param {object} newSettings object containing the new settings to update
   */
  updateServerSettings(serverId, newSettings) {
    const defaultSettings = this.settings.get('default');
    // eslint-disable-next-line prefer-const
    let serverSettings = this.settings.get(serverId);

    if (typeof serverSettings === 'object') {
      Object.keys(newSettings).forEach((key) => {
        if (defaultSettings[key] !== newSettings[key]) {
          serverSettings[key] = newSettings[key];
        } else {
          delete serverSettings[key];
        }
      });
    } else {
      serverSettings = {};
    }

    this.settings.set(serverId, serverSettings);
  }

  /**
   * Awaits a user's response
   * @param {Object} userMessage message object from the user that activated the command
   * @param {String|Object} botMessageContent content of the message to send
   * @param {Number} timeLimit time limit (in milliseconds)
   */
  async awaitResponse(userMessage, botMessageContent, timeLimit = 60000) {
    await userMessage.channel.send(botMessageContent);

    try {
      const newMessages = await userMessage.channel.awaitMessages(
        (x) => x.author.id === userMessage.author.id,
        {
          max: 1,
          time: timeLimit,
          errors: ['time'],
        }
      );

      return newMessages.first().content;
    } catch (error) {
      this.logger.error(error.toString());
      return '';
    }
  }

  /**
   * Returns the permission level required for a specific command
   * @param {object} message the message object
   */
  permLevel(message) {
    const permOrder = this.config.permLevels
      .slice(0)
      .sort((a, b) => (a.lvl < b.lvl ? 1 : -1));

    while (permOrder.length) {
      const currentLevel = permOrder.shift();
      if (currentLevel.check(message)) {
        return currentLevel;
      }
    }

    return this.config.permLevels[0];
  }
}

module.exports = BotApplication;
