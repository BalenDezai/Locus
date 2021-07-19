class Command {
  constructor(
    client,
    {
      name = null,
      description = 'No description available',
      category = 'No category',
      usage = 'No usage examples available',
      enabled = true,
      guildOnly = true,
      aliases = [],
      permLevel = 'Member',
      perms = [],
    }
  ) {
    this.client = client;
    this.help = {
      name,
      description,
      category,
      usage,
      aliases,
    };
    this.conf = {
      enabled,
      guildOnly,
      permLevel,
      perms,
    };
  }
}

module.exports = Command;
