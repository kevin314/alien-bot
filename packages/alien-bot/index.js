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
    // console.log(this.channel);
    this.hasStarted = false,
    this.players = {};
    this.round = 0;
    this.ended = false;
  }

  timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async playGame() {
    /* if (this.hasStarted === true) {
      return;
    } */
    this.hasStarted = true;
    this.channel.send('Push the Button now starting...');

    const playerIDs = Object.keys(this.players);

    if (playerIDs.length === 4) {
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
      await this.channel.send(`${this.players[chosenAlienPlayer].user.username} is an alien`);
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
      if (this.ended === true) {
        this.channel.send('Game has ended.');
        break;
      }
      let skipCaptain = false;
      //  const captain = this.players[this.captainIDs[this.round % this.captainIDs.length]].user;
      const captain = this.players['808288156667346954'].user;
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
        await this.channel.send(`Looks like our captain couldn't make a decision in time! A new captain will be selected shortly.`);
        await this.timeout(5000);
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
        selectedPlayers.push(selectedPlayer);
      }
      if (skipCaptain == true) {
        await this.channel.send(`Looks like our captain couldn't make a decision in time! A new captain will be now be selected`);
        this.round++;
        break;
      }

      switch (gameChoice) {
        case '1':
          await this.opinionHold(selectedPlayers);
          break;
        case '2':
          await this.deliberationDeck(selectedPlayers);
          break;
        case '3':
          await this.writingPod(selectedPlayers);
          break;
      }

      this.round++;
    }
  }

  async opinionHold(selectedPlayers) {
    const prompt = '';

    await this.channel.send(`\
      **Opinion Hold**
      All players selected for testing in this room will receive a prompt from the` +
      ` bot privately. The human players will receive the same prompt. The alien` +
      ` players will receive a slightly different prompt from the humans, but` +
      ` they will share that prompt with the rest of the aliens if multiple` +
      ` aliens are being tested.`,
    );

    const opinionText = `\
    ${prompt}
    1. Strongly disagree
    2. Slightly disagree
    3. Slightly agree
    4. Strongly agree
    Reply with 1 to choose the first option, and so on. You have 20 seconds.`;

    const humanPrompts = [
      'Yui is bae.',
      'League of Legends players are toxic.',
      'I need more primogems.',
      'Life is pain.',
      'I am a crack-head.',
    ];

    await this.timeout(5000);
    const randomPrompt = humanPrompts[Math.floor(Math.random() * humanPrompts.length)];

    const promises = selectedPlayers.map((selectedPlayer) => (async () => {
      if (selectedPlayer.username === 'Parell' || selectedPlayer.username === 'Keane') {
        const DMchannel = await selectedPlayer.send(randomPrompt);
        return getMultipleChoiceInput(DMchannel, selectedPlayer, opinionText, ['1', '2', '3', '4'], 15000);
      }
    })());

    const playerResponses = await Promise.allSettled(promises);

    await this.channel.send(`Here was the prompt sent to the humans:\n*${randomPrompt}*`);
    await this.timeout(3500);

    const agreeEnums = {'1': 'Strong disagree', '2': 'Slightly disagree', '3': 'Slightly agree', '4': 'Strongly agree', '-1': 'No response given'};

    let playerResponsesText = '';
    for (let i = 0; i < playerResponses.length; i++) {
      playerResponsesText += `\n**${selectedPlayers[i].username}**: *${agreeEnums[playerResponses[i].value]}*`;
    };

    await this.channel.send('And here is how they responded:' + playerResponsesText);
    await this.timeout(3500);
    await this.channel.send('Spend 30 seconds to deliberate which answers you think are suspicious. A new round will begin after.');
    await this.timeout(6000);
  }

  async deliberationDeck(selectedPlayers) {
    await this.channel.send(`
    Humans will receive a fictional scenario with three possible decisions` +
    ` and must pick the decision they would most likely make.` +
    ` Aliens do not see the scenario and must choose from the decisions blindly.`);

    const scenarios = {
      1: {
        prompt: 'You accidentally drop your phone. What do you do next?',
        options: ['1. Pick it up', '2. Leave it', '3. Give it to someone'],
      },
      2: {
        prompt: 'You see some dog poop on the sidewalk. What do you do next?',
        options: ['1. Pick it up', '2. Leave it', '3. Eat it'],
      },
      3: {
        prompt: 'You are on the verge of death by starvation when you come across a coconut. What do you do next?',
        options: ['Smash it and eat it', 'Toss it into the sea', 'Leave it alone'],
      },
      4: {
        prompt: 'You come home to find it in flames. What do you do next?',
        options: ['Go to bed', 'Call your mom', '911'],
      },
      5: {
        prompt: 'You see a rabid monkey outside your house. What do you do next?',
        options: ['Let them in', 'Scream', 'Stare'],
      },
      6: {
        prompt: 'Your friends just showed up for your birthday party. What do you do next?',
        options: ['Let them in', 'Go to bed', 'Ignore them'],
      },
      7: {
        prompt: 'You need to be up for work at 6 am and it is already midnight. What do you do next?',
        options: ['Go to bed', 'Warm-up excercises', 'Leave for work'],
      },
    };

    const deliberationText = `
    Reply with 1 to choose the first option, and so on. You have 20 seconds.`;

    await this.timeout(5000);
    const keys = Object.keys(scenarios);
    const randomScenario = scenarios[keys[keys.length * Math.random() << 0]];
    let optionsText = '';

    for (let i = 0; i < 3; i++) {
      optionsText += `\t\t\t${i+1}. *${randomScenario['options'][i]}*\n`;
    }

    const promises = selectedPlayers.map((selectedPlayer) => (async () => {
      if (selectedPlayer.username === 'Parell' || selectedPlayer.username === 'Keane') {
        if (this.alienIDs.has(selectedPlayer.id)) {
          const DMchannel = await selectedPlayer.send(`Try your best to justify your answer once the humans' prompt is revealed.`);
          return getMultipleChoiceInput(DMchannel, selectedPlayer, optionsText + deliberationText, ['1', '2', '3'], 15000);
        } else {
          const DMchannel = await selectedPlayer.send(randomScenario['prompt']);
          return getMultipleChoiceInput(DMchannel, selectedPlayer, optionsText + deliberationText, ['1', '2', '3'], 15000);
        }
      }
    })());

    const playerResponses = await Promise.allSettled(promises);

    await this.channel.send(`Here was the prompt sent to the humans:\n*${randomScenario['prompt']}*`);
    await this.timeout(3500);

    let playerResponsesText = '';
    for (let i = 0; i < playerResponses.length; i++) {
      if (playerResponses[i].value === '-1') {
        playerResponsesText += `\n**${selectedPlayers[i].username}**: *No response given*`;
      } else {
        playerResponsesText += `\n**${selectedPlayers[i].username}**: *${randomScenario['options'][parseInt(playerResponses[i].value)-1]}*`;
      }
    };
    await this.channel.send('And here is how they responded:' + playerResponsesText);
    await this.timeout(3500);
    await this.channel.send('Spend 30 seconds to deliberate which answers you think are suspicious. A new round will begin after.');
    await this.timeout(6000);
  }

  async writingPod(selectedPlayers) {
    await this.channel.send(`
    Players will receive a prompt, usually a "fill-in-the-blank" or a question.
    Players must write an answer to the prompt, while aliens receive a prompt that is slightly different.`);
    const topics = {
      person: [
        '____ is my role model',
        'There is nothing to hate about ____.',
      ],
      adjective: [
        'Smoking cigarettes is a ____ thing to do.',
        'I think hurting people is ____.',
      ],
      noun: [
        '____ is an abomination',
        'There is nothing in the world I love more than ____.',
        'Why are there so many ____.',
      ],
      verb: [
        'I like to ____ during my free time.',
        'Why do people ____ so much.',
      ],
    };

    const writingPodText = `
    Reply with anything to fill in the blank. You have 20 seconds.`;

    await this.timeout(5000);
    const keys = Object.keys(topics);
    const chosenTopic = topics[keys[keys.length * Math.random() << 0]];
    const humanPrompt = chosenTopic[Math.floor(Math.random() * chosenTopic.length)];

    let unpicked = chosenTopic;
    unpicked = unpicked.filter((value) => value != humanPrompt);
    const alienPrompt = unpicked[Math.floor(Math.random() * unpicked.length)];

    const promises = selectedPlayers.map((selectedPlayer) => (async () => {
      if (selectedPlayer.username === 'Parell' || selectedPlayer.username === 'Keane') {
        if (this.alienIDs.has(selectedPlayer.id)) {
          const DMchannel = await selectedPlayer.send(alienPrompt);
          return getInput(DMchannel, selectedPlayer, writingPodText, 15000);
        } else {
          const DMchannel = await selectedPlayer.send(humanPrompt);
          return getInput(DMchannel, selectedPlayer, writingPodText, 15000);
        }
      }
      return '-1';
    })());

    const playerResponses = await Promise.allSettled(promises);

    await this.channel.send(`Here was the prompt sent to the humans:\n*${humanPrompt}*`);
    await this.timeout(3500);

    let playerResponsesText = '';
    for (let i = 0; i < playerResponses.length; i++) {
      if (playerResponses[i].value === '-1') {
        playerResponsesText += `\n**${selectedPlayers[i].username}**: *No response*`;
      } else {
        playerResponsesText += `\n**${selectedPlayers[i].username}**: ${playerResponses[i].value}`;
      }
    };

    await this.channel.send('And here is how they responded:' + playerResponsesText);
    await this.timeout(3500);
    await this.channel.send('Spend 30 seconds to deliberate which answers you think are suspicious. A new round will begin after.');
    await this.timeout(6000);
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
      end: {
        subs: {},
        callback: async (message) => {
          if (gameInstances[message.channel.id]) {
            gameInstances[message.channel.id].ended = true;
            delete gameInstances[message.channel.id];
            message.channel.send('Ending game...');
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
const bot1 = new Client('ODA4MjA1NjUwODAxOTgzNTE4.YCDKKg.TXcMPKmcyIAP4eBeZJTa5EXJ18s'); // Xiangling
const bot2 = new Client('ODA4MjA1NzMxODkwNzI0ODk0.YCDKPg.X-imxUG0-Hc4Gd54ija1VUkWGZ4'); // Mai
const bot3 = new Client('ODA4Mjg4MTU2NjY3MzQ2OTU0.YCEXAQ.rT1vaUnXFaG4YSyg5Zgab9MzTSE'); // Yui

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
  } else if (message.content.includes('mai')) {
    message.user.send('uwu');
  }
});

bot3.on('message', (message) => {
  if (message.content.includes('Type \'!ptb join\' to play!')) {
    message.channel.send('!ptb join');
  } else if (message.content.includes('1. Opinion Hold')) {
    message.channel.send('3');
  }
  if (message.content.includes('. Keane')) {
    message.channel.send(message.content[message.content.indexOf('Keane') - 3]);
  } else if (message.content.includes('. Parell')) {
    message.channel.send(message.content[message.content.indexOf('Parell') - 3]);
  } else if (message.content.includes('. Xiangling')) {
    message.channel.send(message.content[message.content.indexOf('Xiangling') - 3]);
  }
});

client.login();
bot1.login();
bot2.login();
bot3.login();


// setTimeout(bot.logout.bind(bot), 15000);

module.exports = {};
