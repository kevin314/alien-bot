const process = require('process');
const {Client} = require('eminem');
const {eminemMessageReceivedHandler, getInput, getMultipleChoiceInput, parseMessage, AlreadyWaitingForInputError} = require('hal-9000');

/**
 * Register command handlers and start the Bot instance.
 * @param {Bot} bot
 * @param {String} token
 */
class PushTheButton {
  constructor(channel) {
    this.channel = channel,
    console.log(this.channel);
    this.hasStarted = false,
    this.players = {};
    this.round = 0;
  }

  async playGame() {
    /* if (this.hasStarted === true) {
      return;
    } */
    this.hasStarted = true;
    this.channel.send('Push the Button now starting...');

    const playerIDs = Object.keys(this.players);

    if (playerIDs.length === 2) {
      this.numAliens = 1;
    } else if (playerIDs.length >= 5 && playerIDs.length < 8) {
      this.numAliens = 2;
    } else {
      this.numAliens = 3;
    }

    let unpicked = playerIDs;
    this.alienIDs = new Set();
    for (let i = 0; i < this.numAliens; i++) {
      const chosenAlienPlayer = unpicked[unpicked.length * Math.random() << 0];
      this.alienIDs.add(chosenAlienPlayer);
      unpicked = unpicked.filter((value) => value != chosenAlienPlayer);
    }

    this.humanIDs = new Set(unpicked);

    for (let i = playerIDs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerIDs[i], playerIDs[j]] = [playerIDs[j], playerIDs[i]];
    }
    this.captainIDs = playerIDs;

    if (playerIDs.length >= 2 && playerIDs.length < 6) {
      this.maxTestees = 2;
    } else if (playerIDs.length >= 6 && playerIDs.length < 9) {
      this.maxTestees = 3;
    } else {
      this.maxTestees = 4;
    }

    while (this.hasStarted) {
      let skipCaptain = false;
      const captain = this.players[this.captainIDs[this.round % this.captainIDs.length]].user;
      await this.channel.send(`Round ${this.round + 1} has started! ${captain.username} will be the captain for this round.`);
      /* Ask captain which examination to use. */
      const choice = await getMultipleChoiceInput(
          this.channel, captain,
          `Captain, choose a test:
        1. Opinion Hold
        2. Deliberation Deck
        3. Writing Pod
        4. Bioscanner`,
          ['1', '2', '3', '4'], 15000,
      );

      if (choice == undefined) {
        await this.channel.send(`Looks like our captain couldn't make a decision in time! A new captain will be now be selected`);
        continue;
      } else {
        const roomsEnums = {'1': 'Opinion Hold', '2': 'Deliberation Deck', '3': 'Writing Pod', '4': 'Bioscanner'};
        let playerSelectionPrompt = '';
        unpicked = playerIDs;
        unpicked = unpicked.filter((value) => value != captain.id);
        const playerEnums = {};

        for (let i = 0; i < unpicked.length; i++) {
          playerEnums[i+1] = unpicked[i];
          playerSelectionPrompt += `${i+1}. ${this.players[unpicked[i]].user.username}`;
        }
        await this.channel.send(`${roomsEnums.choice} selected for this round`);

        const selectedPlayers = [];
        playerSelectionPrompt = '';
        for (let i = 0; i < this.maxTestees; i++) {
          /* Ask captain which players to examine. */
          if (i == 2) {
            if (choice == '4') {
              break;
            }
          }
          const choiceUsers = await getMultipleChoiceInput(
              this.channel, captain, `Captain, choose a player to be tested for the ${roomsEnums.choice}. (${i}/2)
              ${playerSelectionPrompt}`, 15000,
          );
          if (choiceUsers == undefined) {
            skipCaptain = true;
            break;
          }
          selectedPlayer = this.players[playerEnums.choiceUsers].user;
          await this.channel.send(`${selectedPlayer.username} was selected.`);
          unpicked = unpicked.filter((value) => value != playerEnums.choiceUsers);
          for (let i = 0; i < unpicked.length; i++) {
            if (unpicked[i] == undefined) {
              continue;
            }
            playerEnums[i+1] = unpicked[i];
            playerSelectionPrompt += `${i+1}. ${this.players[unpicked[i]].user.username}`;
          }
        }
        if (skipCaptain == true) {
          continue;
        }
        selectedPlayers.push(selectedPlayer);
      }

      /* let validChoice = false;
      do {
        switch (choice) {
          case '1':
            validChoice = true;
            opinionHold(channel);
            break;
          default:
            message.reply('Valid options are 1 through 3');
        }
      }
      while (validChoice === false); */
      this.round++;
    }
  }

  async opinionHold(channel) {
    const prompt = 'test prompt';

    channel.send(`\
      **Opinion Hold**
      All players selected for testing in this room will receive a prompt from the\
      bot privately. The human players will receive the same prompt. The alien\
      players will receive a slightly different prompt from the\
      humans, but they will share that prompt with the rest of the aliens if\
      multiple aliens are being tested.`,
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
    switch (playerIDs.length) {
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

    this.channel.send(`\
      The prompt was
      > ${prompt}

      <@${examinee1id}> chose ${examinee1choice}
      <@${examinee2id}> chose ${examinee2choice}`,
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
  async startCallback(message) {
    this.channel.send(message.user.username +
      ` is looking to start a game of Push the Button!
      Type \'!ptb join\' to play!`);

    const channelID = message.channel.id;

    this.players[message.user.id] = {
      user: message.user,
    };

    await new Promise((resolve, reject) => {
      this.startTimeout = setTimeout(async () => {
        if (Object.keys(this.players).length < 2) {
          message.channel.send('Game aborted due to lack of players. At least four were needed.');
          resolve();
          return;
        }
        await this.playGame(message.channel);
        resolve();
      }, 10000);
    });
  };

  async joinCallback(message) {
    if (this.players[message.user.id]) {
      return;
    }
    this.channel.send(message.user.username + ' joined the game');

    this.players[message.user.id] = {
      user: message.user,
    };

    if (Object.keys(this.players).length === 10) {
      clearTimeout(this.startTimeout);
      await this.playGame(this.channel);
    }
  };

  async testCallback(message) {
    const choice = await getMultipleChoiceInput(
        message.channel, message.author, `${message.user.username}, choose a test!`, 10, 'choice1', 'choice2',
    );
    console.log(choice);
  };

  async buttonCallback(message) {
    const choice = await executeMenu(
        message.channel, message.author, 'menu text!', 10, 'choice1', 'choice2',
    );
    console.log(choice);
  };

  async voteCallback(message) {
    const choice = await executeMenu(
        message.channel, message.author, 'menu text!', 10, 'choice1', 'choice2',
    );
    console.log(choice);
  };

  async hackCallback(message) {
    const choice = await executeMenu(
        message.channel, message.author, 'menu text!', 10, 'choice1', 'choice2',
    );
    console.log(choice);
  };

  /**
   * Run the Push the Button bot!
   */
  run() {
    const bot = new Bot({prefix: '!ptb'}, new Client());
    start(bot, process.env.DISCORD_BOT_TOKEN);
  }
}


const gameInstances = {};

const commands = {
  ptb: {
    subs: {
      start: {
        subs: {},
        callback: async (message) => {
          if (gameInstances[message.channel.id]) {
            await message.channel.send('An instance of PTB has already started!');
            return;
          }
          const ptb = new PushTheButton(message.channel);
          gameInstances[message.channel.id] = ptb;
          await ptb.startCallback(message);
          if (ptb.hasStarted === false) {
            delete gameInstances[message.channel.id];
          }
        },
      },
      join: {
        subs: {},
        callback: async (message) => {
          if (gameInstances[message.channel.id]) {
            const ptb = gameInstances[message.channel.id];
            if (ptb.hasStarted == false) {
              ptb.joinCallback(message);
            }
          }
        },
      },
      help: {
        subs: {},
        callback: async (message) => {
          await message.send('Type \'!ptb start\' to start a new game of Push the Button!');
        },
      },
    },
    callback: function(message, textArgs) {
      message.channel.send('ptb' + textArgs.join(' '));
    },
  },
};

const client = new Client();
const botToken = 'Njk2NTE5NTkzMzg0MjE0NTI4.Xop6aw.pdmiSQ65BvMptKQiwWmmCILjXE4';

client.on('message', (message) => {
  const obj = parseMessage(message.content, commands);
  if (obj) {
    const {command, textArgs} = obj;
    if (command && typeof command['callback'] === 'function') {
      command['callback'](message, textArgs);
    }
  }
});


client.on('message', eminemMessageReceivedHandler);

const options = ['1', '2', '3', '4'];

client.login(botToken);


// setTimeout(bot.logout.bind(bot), 15000);

module.exports = {};
