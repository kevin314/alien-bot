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
  const commandCallback = async (message) => {
    const choice = await executeMenu(
        message.channel, message.author, 'menu text!', 10, 'choice1', 'choice2',
    );
    console.log(choice);
  };
  const command = new Command(
      'command-name', 'command help text', commandCallback,
  );
  bot.addCommand(command);
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
