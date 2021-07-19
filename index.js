const Enmap = require('enmap');
const Mongoose = require('mongoose');

const Bot = require('./src/bot');
const Logger = require('./src/utils/logger');
const config = require('./src/assets/config');
const XpModel = require('./src/models/XpModel');

const client = new Bot(Logger, config, Enmap);

client.init(Mongoose, XpModel);
