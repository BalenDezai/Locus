const config = {
  // Discord IDs of the bot administrators (override all command permissions)
  botAdmins: [''],
  // Token from the bot application
  token: '',

  // Default settings for a server to be stored in the database
  defaultServerSettings: {
    prefix: '!',
    modLogChannel: 'mod-log',
    modRoleName: 'Moderator',
    adminRoleName: 'Administrator',
    systemNotice: true,
    welcomeEnabled: false,
    welcomeChannel: 'general',
    welcomeMessage: 'Welcome {{user}}!',
    byeEnabled: false,
    byeChannel: 'general',
    byeMessage: 'Bye {{user}}',
  },

  // Database connection information
  database: {
    hostname: '',
    username: '',
    password: '',
    name: '',
  },

  // XP System settings
  xp: {
    min: 10,
    max: 20,
    cooldown: 120, // seconds
  },

  // Command permission levels
  permLevels: [
    {
      lvl: 0,
      name: 'Member',
      check: () => true,
    },
    {
      lvl: 1,
      name: 'Moderator',
      check: (message) => {
        try {
          const modRole = message.guild.roles.find((r) => r.name.toLowerCase() === message.settings.modRoleName.toLowerCase());
          if (modRole && message.member.roles.has(modRole.id)) return true;
        } catch (e) {
          return false;
        }
        return false;
      },
    },
    {
      lvl: 2,
      name: 'Administrator',
      check: (message) => {
        try {
          const adminRole = message.guild.roles.find((r) => r.name.toLowerCase() === message.settings.adminRoleName.toLowerCase());
          if (adminRole && message.member.roles.has(adminRole.id)) return true;
        } catch (e) {
          return false;
        }
      },
    },
    {
      lvl: 3,
      name: 'Server Owner',
      check: (message) => (message.channel.type === 'text' ? (message.guild.owner.user.id === message.author.id) : false),

    },
    {
      lvl: 9,
      name: 'Bot Administrator',
      check: (message) => config.botAdmins.includes(message.author.id),
    },
    {
      lvl: 10,
      name: 'Bot Owner',
      check: (message) => {
        // eslint-disable-next-line arrow-body-style
        message.client.fetchApplication().then((application) => { return application.owner.id === message.author.id; });
      },
    },
  ],
};

module.exports = config;
