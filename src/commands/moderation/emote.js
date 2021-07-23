const Command = require('../commandModel');
const { createErrorMessage, createSuccessMessage } = require('../../utils/infoMessages')

const ACTION = Object.freeze({
  ADD: 'add',
  REMOVE: 'remove'
});

class Emote extends Command {
  constructor(client) {
    super(client, {
      name: 'emote',
      description: 'Add or remove emojis on the server',
      category: 'Moderation',
      usage: 'emote [add/remove] [name if add] [emote or emote url]',
      guildOnly: true,
      permLevel: 'Moderator',
      perms: ['MANAGE_EMOJIS'],
    });
    
    this.createUrl = (emote) => {
      const discordUrl = 'https://cdn.discordapp.com/emojis/';
      const ext = '.png';
      return `${discordUrl}${emote}${ext}`
    };

    this.getEmoteHash = (emote) => {
      const indexOfColon = emote.lastIndexOf(':');
      const indexOfEnd = emote.indexOf('>');
      return emote.slice(indexOfColon + 1, indexOfEnd);
    };
    
    this.getName = (emote) => {
      const isUrl = emote.indexOf('http') >= 0;
      if (isUrl) {
        const indexOfSlash = emote.lastIndexOf('/');
        const indexOfExt = emote.lastIndexOf('.');
        return emote.slice(indexOfSlash + 1, indexOfExt);
      }
      const indexOfFirstColon = emote.indexOf(':');
      const indexOfLastColon = emote.lastIndexOf(':');
      return emote.slice(indexOfFirstColon + 1, indexOfLastColon);
    }
  }

  async run(message, [action, name, emote]) {
    switch (action.toLowerCase()) {
      case ACTION.ADD: return this.addEmote(message, name, emote);
      case ACTION.REMOVE: return this.removeEmote(message, name);
      default: message.channel.send(createErrorMessage(`${action} is not a valid action`));
    }
  }

  async addEmote(message, name, emote) {

    if (!emote) {
      emote = name;
      name = this.getName(emote);
    }
    
    const isLink = emote.indexOf('http') >= 0;

    if (!isLink) {
      const emoteHash = this.getEmoteHash(emote);
      emote = this.createUrl(emoteHash);
    }
    
    try {
      const createdEmoji = await message.guild.emojis.create(emote, name)
      message.channel.send(createSuccessMessage(`emote ${createdEmoji.name} added`))
    } catch (err) {
      this.client.logger.error(err);
      return message.channel.send(createErrorMessage('Error adding the emote'));
    }
  }

  async removeEmote(message, name) {
    const emoteHash = this.getEmoteHash(name);
    const emoteToDelete = message.guild.emojis.cache.find(
      emote => emote.id === emoteHash
    );

    if (!emoteToDelete) {
      return message.channel.send(createErrorMessage('Emote does not exist in this guild'));
    }

    try {
      await emoteToDelete.delete();
      return message.channel.send(createSuccessMessage(`emote ${emoteToDelete.name} removed`))
    } catch (err) {
      this.client.logger.error(err);
      return message.channel.send(createErrorMessage('Error removing the emote'));
    }
  }
}

module.exports = Emote;
