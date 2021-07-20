const { MessageEmbed } = require('discord.js');
const Command = require('../commandModel');
const { createErrorMessage } = require('../../utils/infoMessages')


class Avatar extends Command {
  constructor(client) {
    super(client, {
      name: 'avatar',
      description: 'Display self or mentioned users avatar',
      category: 'basic',
      usage: ['avatar', 'avatar [user mention]'],
      aliases: ['av'],
    });

    this.run = async (message) => {
        const avatarEmbed =  new MessageEmbed()
        .setColor(0xFF00FF);

        if (message.mentions.users.size === 0) {
            return this.selfAvatar(message, avatarEmbed);
        }
  
        if (message.mentions.users.size > 1) {
            return message.channel.send(
                createErrorMessage('Can only grab one users avatar')
            )
        }
        // return avatar of mentioned user
        const mentionedUser = message.mentions.users.first();
        const foundMember = message.guild.member(mentionedUser);
        const url = foundMember.user.displayAvatarURL({ dynamic: true, size: 1024 });
        avatarEmbed
        .setAuthor(foundMember.user.username)
        .setImage(url)
        .setDescription(`**[AVATAR URL](${url})**`);
        return message.channel.send(avatarEmbed);
    }

    /**
     * Return avatar of poster
     * @param {object} message discordJs message object 
     * @param {MessageEmbed} avatarEmbed 
     * @returns 
     */
    this.selfAvatar = (message, avatarEmbed) => {
        const url = message.author.avatarURL({ dynamic: true, size: 1024 });
        avatarEmbed
        .setAuthor(message.author.username)
        .setImage(url)
        .setDescription(`**[AVATAR URL](${url})**`);
        return message.channel.send(avatarEmbed);
    } 
  }
}

module.exports = Avatar;
