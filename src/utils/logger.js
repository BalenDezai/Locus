const chalk = require('chalk');

class Logger {
  /**
   * Logs a message to the console
   * @param {string} content Content of the message
   * @param {string} type Type of the log message
   */
  static log(content, type = 'log') {
    const currentTimestamp = `<${new Date().toString()}>`;

    switch (type) {
      case 'log':
        return console.log(
          `${currentTimestamp} ${chalk.bgBlue(
            type.toUpperCase()
          )} -> ${content}`
        );
      case 'debug':
        return console.log(
          `${currentTimestamp} ${chalk.bgWhite(
            type.toUpperCase()
          )} -> ${content}`
        );
      case 'error':
        return console.log(
          `${currentTimestamp} ${chalk.bgRed(type.toUpperCase())} -> ${content}`
        );
      case 'warning':
        return console.log(
          `${currentTimestamp} ${chalk.bgYellow(
            type.toUpperCase()
          )} -> ${content}`
        );
      case 'success':
        return console.log(
          `${currentTimestamp} ${chalk.bgGreen(
            type.toUpperCase()
          )} -> ${content}`
        );
      case 'command':
        return console.log(
          `${currentTimestamp} ${chalk.bgMagenta(
            type.toUpperCase()
          )} -> ${content}`
        );
      default:
        throw new Error('Incorrect/unsupported logging type');
    }
  }

  static error(content) {
    return this.log(content, 'error');
  }

  static warning(content) {
    return this.log(content, 'warning');
  }

  static debug(content) {
    return this.log(content, 'debug');
  }

  /**
   * Logs the use of a command to the console in a standardized format
   * @param {string} tag the user's tag
   * @param {string} id the ID of the user
   * @param {string} commandName the name of the command
   */
  static command(tag, id, commandName) {
    return this.log(
      `User ${tag} (ID:${id}) is trying to run command ${commandName}`,
      'command'
    );
  }
}

module.exports = Logger;
