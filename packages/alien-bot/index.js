const process = require('process');
const {Client} = require('eminem');
const {eminemMessageReceivedHandler, getInput, getMultipleChoiceInput, parseMessage, AlreadyWaitingForInputError} = require('hal-9000');
const Message = require('eminem/Message');
const Channel = require('eminem/Channel');

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
      unpicked = unpicked.filter((value) => value !== chosenAlienPlayer);
    }

    this.humanIDs = new Set(unpicked);

    for (let i = playerIDs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerIDs[i], playerIDs[j]] = [playerIDs[j], playerIDs[i]];
    }
    this.captainIDs = playerIDs;

    while (this.hasStarted) {
      let skipCaptain = false;
      //  const captain = this.players[this.captainIDs[this.round % this.captainIDs.length]].user;
      const captain = this.players['99284711607644160'].user;
      await this.channel.send(`Round ${this.round + 1} has started! ${captain.username} will be the captain for this round.`);
      /* Ask captain which examination to use. */
      const gameChoice = await getMultipleChoiceInput(
          this.channel, captain,
          `Captain, choose a test:
        **1. Opinion Hold**
        **2. Deliberation Deck**
        **3. Writing Pod**
        **4. Bioscanner**`,
          ['1', '2', '3', '4'], 15000,
      );

      if (gameChoice == undefined) {
        await this.channel.send(`Looks like our captain couldn't make a decision in time! A new captain will be now be selected`);
        this.round++;
        continue;
      }
      const roomsEnums = {'1': 'Opinion Hold', '2': 'Deliberation Deck', '3': 'Writing Pod', '4': 'Bioscanner'};
      unpicked = playerIDs;
      unpicked = unpicked.filter((value) => value != captain.id);

      await this.channel.send(`${roomsEnums[gameChoice]} selected for this round`);

      let maxTestees;
      let numTestees;
      if (playerIDs.length >= 4 && playerIDs.length < 6) {
        maxTestees = 2;
      } else if (playerIDs.length >= 6 && playerIDs.length < 9) {
        maxTestees = 3;
      } else {
        maxTestees = 4;
      }
      if (gameChoice === '4') {
        numTestees = 2;
      } else {
        numTestees = maxTestees;
      }

      const selectedPlayers = [];
      let selectedPlayer;
      for (let i = 0; i < numTestees; i++) {
        const playerEnums = {};
        /* Ask captain which players to examine. */
        //  Bioscanner only has two testees
        let playerSelectionPrompt = '';
        const playerOptions = [];

        for (let i = 0; i < unpicked.length; i++) {
          playerEnums[i+1] = unpicked[i];
          playerSelectionPrompt += `\n\t\t\t\t**${i+1}. ${this.players[unpicked[i]].user.username}**`;
          playerOptions.push('' + (i+1));
        }
        const choiceUsers = await getMultipleChoiceInput(
            this.channel, captain, `Captain, choose a player to be tested for the ${roomsEnums[gameChoice]}. (${i}/2)` +
            playerSelectionPrompt, playerOptions, 5000,
        );
        if (choiceUsers == undefined) {
          skipCaptain = true;
          break;
        }
        selectedPlayer = this.players[playerEnums[choiceUsers]].user;
        await this.channel.send(`${selectedPlayer.username} was selected.`);
        unpicked = unpicked.filter((value) => value !== playerEnums[choiceUsers]);
      }
      if (skipCaptain == true) {
        await this.channel.send(`Looks like our captain couldn't make a decision in time! A new captain will be now be selected`);
        this.round++;
        continue;
      }
      selectedPlayers.push(selectedPlayer);

      switch (gameChoice) {
        case '1':
          opinionHold();
          break;
      }

      this.round++;
    }
  }

  async opinionHold() {
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
        if (Object.keys(this.players).length < 4) {
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

const client = new Client('Njk2NTE5NTkzMzg0MjE0NTI4.Xop6aw.pdmiSQ65BvMptKQiwWmmCILjXE4');
const bot1 = new Client('ODA4MjA1NjUwODAxOTgzNTE4.YCDKKg.TXcMPKmcyIAP4eBeZJTa5EXJ18s');
const bot2 = new Client('ODA4MjA1NzMxODkwNzI0ODk0.YCDKPg.X-imxUG0-Hc4Gd54ija1VUkWGZ4');
const bot3 = new Client('ODA4Mjg4MTU2NjY3MzQ2OTU0.YCEXAQ.rT1vaUnXFaG4YSyg5Zgab9MzTSE');

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

bot1.on('message', (message) => {
  if (message.content.includes('Type \'!ptb join\' to play!')) {
    message.channel.send('!ptb join');
  }
});

bot2.on('message', (message) => {
  if (message.content.includes('Type \'!ptb join\' to play!')) {
    message.channel.send('!ptb join');
  }
});

bot3.on('message', (message) => {
  if (message.content.includes('Type \'!ptb join\' to play!')) {
    message.channel.send('!ptb join');
  }
});

client.login();
bot1.login();
bot2.login();
bot3.login();


// setTimeout(bot.logout.bind(bot), 15000);

module.exports = {};
