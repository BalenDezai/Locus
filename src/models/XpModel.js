const { Schema, model } = require('mongoose');

/**
 * The xp model for our database
 */
const Xp = new Schema({
  userName: { type: String, trim: true },
  userId: { type: String },
  serverId: { type: String },
  xpAmount: { type: Number },
  lastXp: { type: Number },
});

module.exports = model('Xps', Xp);
