const { DiscordAPIError } = require('discord.js');
const Command = require('../commandModel');
const { createErrorMessage, createSuccessMessage } = require('../../utils/infoMessages');

class Ban extends Command {
  constructor(client) {
    super(client, {
      name: 'ban',
      description: 'Bans a mentioned user or users. You can specify the amount of days of messages to remove',
      category: 'Moderation',
      usage: ['ban [user mention(s)]', 'ban [user mention(s)] -d [days] -r [reason]'],
      guildOnly: true,
      permLevel: 'Moderator'
    });
    this.bannedUserTags = [];
    this.days = 0;
    this.reason = '';
    this.displaySuccess = true;
  }

  async run(message, args) {
    const indexOfD = args.indexOf('-d');
    const indexOfR = args.indexOf('-r');

    if (indexOfD >= 0) {
        //  parse the day argument
        this.days = parseInt(args.slice(indexOfD + 1, indexOfR), 10);
    }

    if (indexOfR >= 0) {
        //  separate the reason into a whole string
        this.reason = args.slice(indexOfR + 1).join(' ');
    }

    if (message.mentions.users.size === 0) {
        message.channel.send(createErrorMessage('You didn\'t mention any users to ban'));
    }
    
    this.banMentionedUsers(message);

    if (this.displaySuccess) {
        message.channel.send(
          createSuccessMessage(
            `Successfully kicked user(s) ${this.bannedUserTags.join(' ')}`
          )
        );
    };
  }

  banMentionedUsers(message) {
    message.mentions.users.forEach(async (user) => {
        const member = message.guild.member(user);
        if (member) {
            await this.banUser(message, member);
        } else {
            message.channel.send(
                createErrorMessage(`User ${user.tag} is not in this guild`)
            );
        }
    });
  }

  async banUser(message, member) {
    try {
        
        await member.ban({ reason: this.reason, days: this.days });
        this.bannedUserTags.push(member.user.tag);

    } catch (error) {
        
        if (error instanceof DiscordAPIError) {
            message.channel.send(createErrorMessage(error.message));
        } else {
            message.channel.send(
                createErrorMessage(
                    `Failed to ban user: **${member.user.tag}**`
                )
            );
        }

        this.displaySuccess = false;
        this.client.logger.error(error);
    }
  }
}

module.exports = Ban
