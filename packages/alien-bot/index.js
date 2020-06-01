const process = require('process');
const Client = require('../eminem/Client');
const {Bot, Command, executeMenu} = require('../hal-9000');

/**
 * Register command handlers and start the Bot instance.
 * @param {Bot} bot
 * @param {String} token
 */
function start(bot, token) {
  /**
   * @param {Message} message
   */

  const state = {};
  const numPlayers = 0;
  let startTimeout;

  const startCallback = async (message) => {
    message.reply(message.author.username + `is looking to start a game of 
    Push the Button! Type \'!ptb join\' to play!`);

    numPlayers++;
    state[channelID][numPlayers] = message.author;

    startTimeout = setTimeout(function() {
      if (numPlayers < 4) {
        message.reply('Game aborted due to lack of players (4 min)');
      }
    }, 60000);

    message.reply('Push the Button now starting...');
  };

  const startCommand = new Command(
      'start', 'Start a new game of \'Push the Button\'', startCallback,
  );

  const joinCallback = async (message) => {
    message.reply(message.author.username + ' joined the game');
    numPlayers++;
    state[channelID][numPlayers] = message.author;
    if (numPlayers === 10) {
      clearTimeout(startTimeout);
      message.reply('Push the Button now starting...');
    }
  };

  const joinCommand = new Command(
      'join', 'Join a game of \'Push the Button\'', joinCallback,
  );

  const testCallback = async (message) => {
    const choice = await executeMenu(
        message.channel, message.author, 'menu text!', 10, 'choice1', 'choice2',
    );
    console.log(choice);
  };

  const testCommand = new Command(
      'test', 'You have joined \'Push the Button\'', testCallback,
  );

  const buttonCallback = async (message) => {
    const choice = await executeMenu(
        message.channel, message.author, 'menu text!', 10, 'choice1', 'choice2',
    );
    console.log(choice);
  };

  const buttonCommand = new Command(
      'button', 'You have joined \'Push the Button\'', buttonCallback,
  );

  const voteCallback = async (message) => {
    const choice = await executeMenu(
        message.channel, message.author, 'menu text!', 10, 'choice1', 'choice2',
    );
    console.log(choice);
  };

  const voteCommand = new Command(
      'vote', 'You have joined \'Push the Button\'', voteCallback,
  );

  const hackCallback = async (message) => {
    const choice = await executeMenu(
        message.channel, message.author, 'menu text!', 10, 'choice1', 'choice2',
    );
    console.log(choice);
  };

  const hackCommand = new Command(
      'hack', 'You have joined \'Push the Button\'', hackCallback,
  );

  
  bot.addCommand(startCommand);
  bot.addCommand(joinCommand);
  bot.addCommand(testCommand);
  bot.addCommand(buttonCommand);
  bot.addCommand(voteCommand);
  bot.addCommand(hackCommand);
  bot.login(token);

}

/**
 * Run the Push the Button bot!
 */
function run() {
  const bot = new Bot({prefix: '!ptb'}, new Client());
  start(bot, process.env.DISCORD_BOT_TOKEN);
}

module.exports = {
  start,
  run,
};
