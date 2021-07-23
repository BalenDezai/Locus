const InfoMessages = require('../utils/infoMessages');
const GeneralUtils = require('../utils/generalUtils');

const MessageType = Object.freeze({ CREATED: 1, UPDATED: 2 });

class Message {
  constructor(_client) {
    this.client = _client;
    this.defaultLoggingMessage =
      'This is not working, fix your logging message';
    this.permissionMsg =
      'You do not have enough permission to use this command.';
  }

  async run(message) {
    // ignore other bots
    if (message.author.bot) return;
    // respond to dms
    if (!message.guild) {
      message.channel.send('Sorry, the bot cannot be used in DMs yet.');
      return;
    }

    const foundPerson = await this.findUser({
      serverId: message.guild.id,
      userId: message.author.id,
    });
    if (foundPerson) {
      await this.generateXpAndUpdateUser(foundPerson, message);
    } else {
      await this.createUserAndLog(message);
    }

    // Exit if no permission to send messages
    const HasMessagePerms = message.channel
      .permissionsFor(message.guild.me)
      .has('SEND_MESSAGES');
    if (!HasMessagePerms) return;

    // Fetch guild settings, then attach to message object
    const guildSettings = this.client.getServerSettings(message.guild.id);
    message.settings = guildSettings;

    // Check if the bot was mentioned
    const botMention = new RegExp(`^<@!?${this.client.user.id}>( |)$`);

    // If the bot was mentioned, return the current prefix
    if (message.content.match(botMention)) {
      return message
        .reply(
          InfoMessages.createInfoMessage(
            `The current prefix for this server is: ${guildSettings.prefix}`
          )
        )
        .then((botMessage) => {
          botMessage.delete({ timeout: 10000 });
        })
        .catch((error) => {
          this.client.Logger.error(error);
        });
    }

    // Exit if message doesn't  start with prefix
    const botNotMentioned = message.content.indexOf(guildSettings.prefix) < 0;

    if (botNotMentioned) return;

    const messageArguments = message.content
      .replace(guildSettings.prefix, '')
      .trim()
      .split(' ');
    const commandName = messageArguments.shift().toLowerCase();

    // Prevent caching errors by fetching the member if for any reason they should be
    // invisible or not cached
    if (message.guild && !message.member) {
      await message.guild.fetchMember(message.author);
    }

    // Grab the command from the Collection
    const command =
      this.client.commands.get(commandName) ||
      this.client.commands.get(this.client.aliases.get(commandName));

    // If the command doesn't exist, exit
    if (!command) return;

    // Check if the level set in the command actually exists
    if (typeof this.client.levelCache[command.conf.permLevel] !== 'number') {
      return message.channel.send(
        InfoMessages.createErrorMessage(
          "The command you're trying to execute was not properly configured. Please contact the bot's admin."
        )
      );
    }

    // Get the member's permission level
    const levelObject = this.client.permLevel(message);

    // Check the required level against the command's required level
    if (levelObject.lvl < this.client.levelCache[command.conf.permLevel]) {
      return this.permissionDeny(message, command, guildSettings.systemNotice);
    }

    // Set the author's permission level in the message object to the current level
    message.author.permLevel = levelObject.lvl;

    // Log and run the command
    this.runCommand(message, levelObject, command, messageArguments);
  }

  /**
   * Execute permission denied
   * @param {object} message
   * @param {object} command
   * @param {*} systemNotice
   * @returns
   */
  permissionDeny(message, command, systemNotice) {
    const userPerms = message.member.permissions.toArray();
    // Check the user permissions
    if (!GeneralUtils.hasPerms(userPerms, command.conf.perms)) {
      // Notify the server if the user doesn't have permissions to execute the command
      if (systemNotice) {
        return message.channel.send(
          InfoMessages.createErrorMessage(this.permissionMsg)
        );
      }
    }
    return false;
  }

  /**
   * Execute the found command with proper arguments
   * @param {object} message
   * @param {object} levelObject
   * @param {object} command
   * @param {Array} commandArgs
   */
  runCommand(message, levelObject, command, commandArgs) {
    // Set the author's permission level in the message object to the current level
    message.author.permLevel = levelObject.lvl;

    this.client.logger.command(
      message.author.tag,
      message.author.id,
      command.help.name
    );
    command.run(message, commandArgs, levelObject.lvl);
  }

  /**
   * Create user in database
   * @param {object} message
   */
  async createUserAndLog(message) {
    const msg = this.generateLoggingMessage(
      MessageType.CREATED,
      message.guild.id,
      message.author.id
    );
    const userToCreate = {
      userName: message.author.username,
      serverId: message.guild.id,
      userId: message.author.id,
      xpAmount: this.generateXpAmount(),
      lastXp: Math.floor(Date.now() / 1000),
    };

    this.createUser(userToCreate);
    this.client.logger.log(msg);
  }

  /**
   * Generate xp and update the user in the database
   * @param {object} user user to update
   * @param {object} message
   */
  async generateXpAndUpdateUser(user, message) {
    const timestampNow = Math.floor(Date.now() / 1000);
    const msg = this.generateLoggingMessage(
      MessageType.UPDATED,
      message.guild.id,
      message.author.id
    );
    // Check for XP cooldown
    const cooldownPassed =
      timestampNow - user.lastXp > this.client.config.xp.cooldown;

    if (cooldownPassed) {
      const findByObj = {
        serverId: message.guild.id,
        userId: message.author.id,
      };
      const updateByObj = {
        xpAmount: user.xpAmount + this.generateXpAmount(),
        lastXp: timestampNow,
      };

      await this.updateUser(findByObj, updateByObj);
      this.client.logger.log(msg);
    }
  }

  /**
   * Creates a user in the database
   * @param {object} userToCreateObj
   */
  async createUser(userToCreateObj) {
    try {
      await this.client.xpModel.create(userToCreateObj);
    } catch (err) {
      this.client.logger.log(err);
    }
  }

  /**
   * Retrieves a user from database
   * @param {object} findByObj
   * @returns found user
   */
  async findUser(findByObj = {}) {
    try {
      return await this.client.xpModel.findOne(findByObj).exec();
    } catch (err) {
      this.client.logger.error(err);
      throw new Error('Unable to retrieve message poster');
    }
  }

  /**
   * Updates user in database
   * @param {object} findByObj object to find user by
   * @param {object} updateByObj object to update the user with
   */
  async updateUser(findByObj, updateByObj) {
    try {
      await this.client.xpModel.update(findByObj, updateByObj).exec();
    } catch (err) {
      this.client.logger.error(err);
      throw new Error('Unable to update message poster');
    }
  }

  /**
   * Generate logging string
   * @param {MessageType} messageType
   * @returns string to log
   */
  generateLoggingMessage(messageType, guildId, authorId) {
    switch (messageType) {
      case MessageType.CREATED:
        return `Created database entry for server [${guildId}] and user [${authorId}]`;
      case MessageType.UPDATED:
        return `XPSYSTEM GUILD:[${guildId}] USER:[${authorId}] - XP incremented`;
      default:
        return this.defaultLoggingMessage;
    }
  }

  /**
   * Generates a random amount of xp
   * @returns generated xp
   */
  generateXpAmount() {
    const { max, min } = this.client.config.xp;

    return Math.floor(Math.random() * (max - min) + min);
  }
}

module.exports = Message;
