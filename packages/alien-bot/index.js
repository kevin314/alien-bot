const process = require('process');
const Client = require('../eminem/Client');
const {Bot, Command, executeMenu, executeReactMenu} = require('../hal-9000');

/**
 * Register command handlers and start the Bot instance.
 * @param {Bot} bot
 * @param {String} token
 */
function start(bot, token) {
  const state = {};
  
  async function playGame(channel) {
    channel.send('Push the Button now starting...');

    let playerIDs = Object.keys(state[channel.id].players);
    let alienSet = state[channel.id].alienIDs;

    playerIDs.sort();

    switch(playerIDs.length) {
      case 10:
      case 9:
      case 8:
        alienSet.add(playerIDs[2]);
      case 7:
      case 6:
      case 5:
        alienSet.add(playerIds[1]);
      case 4:
        alienSet.add(playerIds[0]);
    }
    
    for (let i = playerIDs.length; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [playerIDs[i], playerIDs[j]] = [playerIDs[j], playerIDs[i]];
    }
    state[channel.id].captains = playerIDs;

    /* Ask captain which examination to use. */
    const choice = await executeMenu(
      channel, currentCaptainFigureThisOutKevin, 'menu text!',
    );

    /* Ask captain which players to examine. */
    const choiceUsers = await executeReactMenu(
      channel, currentCaptainFigureThisOutKevin, 'menu text!', 
    )
    
    let validChoice = false;
    do {
      switch(choice) {
        case '1':
          validChoice = true;
          opinionHold(channel);
          break;
        default:
          message.reply('Valid options are 1 through 3')
      }
    }
    while (validChoice === false);
  }

  function opinionHold(channel) {
    const prompt = 'test prompt';

    channel.send(`\
**Opinion Hold**
All players selected for testing in this room will receive a prompt from the\
bot privately. The human players will receive the same prompt. The alien\
players will receive a slightly different prompt from the\
humans, but they will share that prompt with the rest of the aliens if\
multiple aliens are being tested.`
    );

    const opinionText = `\
    ${prompt}
    1. Strongly disagree
    2. Slightly disagree
    3. Slightly agree
    4. Strongly agree
    React with “1” to choose the first option, and so on. You have 30 seconds.`;
    const emojis = ['1️⃣', '🔟'];
    
    const examineeChoices = [];
    switch(playerIDs.length) {
      case 10:
      case 9:
        examineeChoices[3] = await executeReactMenu(examinees[3], opinionText, 30, emojis, 1, 1, true);
      case 8:
        examinee3choice = await executeReactMenu(examinees[2], opinionText, 30, emojis, 1, 1, true);
      case 7:
      case 6:
      case 5:
        const examinee2choice = await executeReactMenu(examinees[1], opinionText, 30, emojis, 1, 1, true);
        const examinee1choice = await executeReactMenu(examinees[0], opinionText, 30, emojis, 1, 1, true);
    }
    const choice = await executeReactMenu(examinees[0], opinionText, 30, emojis, 1, 1, true);
    
    channel.send(`\
The prompt was
> ${prompt}

<@${examinee1id}> chose ${examinee1choice}
<@${examinee2id}> chose ${examinee2choice}`
    );
    /* EXAMPLE
      The prompt was 
      > hot dogs are better than hamburgers

      <@84975904837> chose Strongly disagree.
      <@97684q23982> chose Stringly agree.
     */
  }

  /**
   * @param {Message} message
   */
  const startCallback = async (message) => {
    message.reply(message.author.username + `is looking to start a game of 
    Push the Button! Type \'!ptb join\' to play!`);

    const channelID = message.channel.id;
    state[channelID] = {
      hasStarted: false,
      players: {},
      alienIDs: new Set(),
    };
    state[channelID].players[message.author.id] = message.author;

    state[channelID].startTimeout = setTimeout(async function() {
      if (state[channelID].numPlayers < 4) {
        message.reply('Game aborted due to lack of players. At least four were needed.');
        state[channelID] = undefined;
        return;
      }
      await playGame(message.channel);
    }, 60000);
  };

  const startCommand = new Command(
      'start', 'Start a new game of \'Push the Button\'', startCallback,
  );

  const joinCallback = async (message) => {
    const channelID = message.channel.id;
    if (state[channelID] && state[channelID].hasStarted === false) {
      message.reply(message.author.username + ' joined the game');
      state[channelID].players[message.author.id] = message.author;
      if (Object.keys(state[channelID].players).length === 10) {
        clearTimeout(startTimeout);
        await playGame(message.channel);
      }
    }
  };

  const joinCommand = new Command(
      'join', 'Join a game of \'Push the Button\'', joinCallback,
  );

  const testCallback = async (message) => {
    const choice = await executeMenu(
        message.channel, message.author, 'menu text!', ,
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
