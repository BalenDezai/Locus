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
        return console.log(`${currentTimestamp} ${chalk.bgBlue(type.toUpperCase())} -> ${content}`);
      case 'debug':
        return console.log(`${currentTimestamp} ${chalk.bgWhite(type.toUpperCase())} -> ${content}`);
      case 'error':
        return console.log(`${currentTimestamp} ${chalk.bgRed(type.toUpperCase())} -> ${content}`);
      case 'warning':
        return console.log(`${currentTimestamp} ${chalk.bgYellow(type.toUpperCase())} -> ${content}`);
      case 'success':
        return console.log(`${currentTimestamp} ${chalk.bgGreen(type.toUpperCase())} -> ${content}`);
      case 'command':
        return console.log(`${currentTimestamp} ${chalk.bgMagenta(type.toUpperCase())} -> ${content}`);
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

  static command(content) {
    return this.log(content, 'command');
  }
}

module.exports = Logger;
