const { DiscordAPIError } = require('discord.js');
const Command = require('../commandModel');
const { createErrorMessage, createSuccessMessage } = require('../../utils/infoMessages');


class Kick extends Command {
  constructor(client) {
    super(client, {
      name: 'kick',
      description: 'Kick a mentioned user off the server',
      category: 'Moderation',
      usage: ['kick [user mention(s)]', 'kick [user mention/s] -r [reason]'],
      guildOnly: true,
      permLevel: 'Moderator',
    });
    this.kickedUserTags = [];
    this.reason = '';
    this.displaySuccess = true;
  }

  async run(message, args) {
    // if no mentioned users, exit
    if (message.mentions.users.size === 0) {
      return  message.channel.send(
        createErrorMessage('You didn\'t mention any users to kick')
      );
    };

    const indexOfR = args.indexOf('-r');

    // if there is a reason add it
    if (indexOfR !== -1) {
        this.reason = args.slice(indexOfR + 1).join(' ');
    };
    
    this.kickMentionedUsers(message);

    if (this.displaySuccess) {
      message.channel.send(
        createSuccessMessage(
          `Successfully kicked user(s) ${this.kickedUserTags.join(' ')}`
        )
      );
    };
  }

  /**
   * Kick each mentioned user
   * @param {object} message discordJs message object 
   */
  kickMentionedUsers(message) {
    message.mentions.users.forEach(async (user) => {
      const member = message.guild.member(user);
      if (member) {
        await this.kickUser(message, member, this.reason);
      } else {
        message.channel.send(
          createErrorMessage(`User ${user.tag} is not in this guild`)
        );
      };
    });
  }

  /**
   * Kick an individual member
   * @param {object} message discordJs message object 
   * @param {object} member discordJs member object
   */
  async kickUser(message, member) {

    try {

      await member.kick(this.reason);
      this.kickedUserTags.push(member.user.tag);

    } catch (error) {
      
      if (error instanceof DiscordAPIError) {
        message.channel.send(
          createErrorMessage(error.message)
        );
      } else {
        message.channel.send(
          createErrorMessage(`Failed to kick user ${member.user.tag}`)
        );
      }

      this.displaySuccess = false;
      this.client.logger.error(error);
    }
  }
}

module.exports = Kick;
