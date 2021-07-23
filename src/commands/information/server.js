const { MessageEmbed } = require('discord.js');
const Command = require('../commandModel');

class Server extends Command {
  constructor(client) {
    super(client, {
      name: 'server',
      description: 'Shows server information',
      category: 'information',
      usage: 'server',
      guildOnly: true,
      permLevel: 'Member',
    });

    this.run = async (message) => {
        const { guild } = message;
        const author = guild.member(message.author);
        const txtChSize = guild.channels.cache.filter(ch => ch.type === 'text').size;
        const vcChSize = guild.channels.cache.filter(ch => ch.type === 'voice').size;


        const serverInfo = new MessageEmbed()
            .setColor('#4287f5')
            .setDescription(`Server Id: ${guild.id}\nServerOwner: ${guild.owner}`)
            .addField('Verification Level:', this.verificationLevelString(guild.verificationLevel))
            .addField('Server Region:', guild.region, true)
            .addField('Members:', guild.memberCount, true)
            .addField('Channels:', `${guild.channels.cache.size} (${txtChSize} text, ${vcChSize} voice)`, true)
            .addField('Server creation Date:', guild.createdAt.toUTCString())
            .addField('You joined at:', author.joinedAt.toUTCString())
            .addField('Server Boosts', `Level:${guild.premiumTier}\nBoosts:${guild.premiumSubscriptionCount}`)
            .addField(`**Server Banner**`, `[BANNER URL](${guild.bannerURL({ dynamic: true , size: 1024 })})`);

        if (guild.iconURL) {
            const serverIconUrl = guild.iconURL({ dynamic:true , size: 256 });
            serverInfo.setAuthor(`${guild.name} (${guild.nameAcronym})`, `${serverIconUrl}`);
            serverInfo.setThumbnail(`${serverIconUrl}`)
        }
        return message.channel.send(serverInfo);
    }

    this.verificationLevelString = (verificationLevelStr) => {
        const verificationLevel = {
            NONE: 'None (Unrestricted)',
            LOW: 'Low (Must have a verified email on their Discord account)',
            MEDIUM: 'Medium (Must also be registered on discord for longer than 5 minutes)',
            HIGH: 'High (Must also be a member of this server for longer than 10 minutes)',
            VERY_HIGH: 'Very High (Must also have a verified phone on their discord account)',
          };
      
          return verificationLevel[verificationLevelStr];
    }
  }
}

module.exports = Server;
