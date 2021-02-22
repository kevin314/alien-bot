const {Client} = require('eminem');
const {eminemMessageReceivedHandler, getInput, getMultipleChoiceInput, parseMessage, timeout, AlreadyWaitingForInputError} = require('hal-9000');
const Message = require('eminem/Message');
const Channel = require('eminem/Channel');
const fs = require('fs');
const mergeImages = require('merge-images');
const {Canvas, Image} = require('canvas');

const bioimagesFilepath = '/Users/kevsa/Documents/alien/alien-bot/packages/alien-bot/images/';
const imagesFilepath = '/Users/kevsa/Documents/alien/alien-bot/packages/alien-bot/nonbioimages/';
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
    this.hasButtoned = [];
    this.buttonedState = false;
    this.buttonable = false;
    this.wasButtoned = false;
  }

  cancelWrapper(fn, ...args) {
    if (this.buttonedState === true) {
      throw (new Error('cancel'));
    } else {
      return fn(...args);
    }
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

    let unpicked = playerIDs.slice();
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
      this.buttonable = true;
      let wasButtoned = false;
      if (this.ended === true) {
        this.channel.send('Game has ended.');
        break;
      }
      let skipCaptain = false;
      //  const captain = this.players[this.captainIDs[this.round % this.captainIDs.length]].user;
      const captain = this.players['808288156667346954'].user;
      await this.channel.send(`Round ${this.round + 1} has started! ${captain.username} will be the captain for this round.`);
      /* Ask captain which examination to use. */
      let gameChoice;
      try {
        gameChoice = await this.cancelWrapper(getMultipleChoiceInput, this.channel, captain,
            `Captain, choose a test:
          **1. Opinion Hold**
          **2. Deliberation Deck**
          **3. Writing Pod**
          **4. Bioscanner**`,
            ['1', '2', '3', '4'], 15000);
      } catch (err) {
        console.log(err);
        await this.extractionRoom(this.hasButtoned[0]);
        this.buttonedState = false;
        this.round++;
        continue;
      }

      if (gameChoice === '-1') {
        await this.channel.send(`Looks like our captain couldn't make a decision in time! A new captain will be selected shortly.`);

        try {
          await this.cancelWrapper(timeout, 5000);
        } catch (err) {
          console.log(err);
          await this.extractionRoom(this.hasButtoned[0]);
          this.buttonedState = false;
        }
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
        let choiceUsers;
        try {
          choiceUsers = await this.cancelWrapper(getMultipleChoiceInput,
              this.channel, captain, `Captain, choose a player to be tested for the ${roomsEnums[gameChoice]}. (${i+1}/${numTestees})` +
              playerSelectionPrompt, playerOptions, 5000);
        } catch (err) {
          console.log(err);
          await this.extractionRoom(this.hasButtoned[0]);
          this.buttonedState = false;
          skipCaptain = true;
          wasButtoned = true;
          break;
        }
        if (choiceUsers == '-1') {
          skipCaptain = true;
          break;
        }
        selectedPlayer = this.players[playerEnums[choiceUsers]].user;
        await this.channel.send(`${selectedPlayer.username} was selected.`);
        unpicked = unpicked.filter((value) => value !== playerEnums[choiceUsers]);
        selectedPlayers.push(selectedPlayer);
      }
      if (skipCaptain === true) {
        if (wasButtoned === false) {
          await this.channel.send(`Looks like our captain couldn't make a decision in time! A new captain will be now be selected`);
        }
        this.round++;
        continue;
      }

      try {
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
          case '4':
            await this.bioScanner(selectedPlayers, captain);
        }
      } catch (err) {
        console.log(err);
        await this.extractionRoom(this.hasButtoned[0]);
        this.buttonedState = false;
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

    await this.cancelWrapper(timeout, 5000);
    const randomPrompt = humanPrompts[Math.floor(Math.random() * humanPrompts.length)];

    const promises = selectedPlayers.map((selectedPlayer) => (async () => {
      if (selectedPlayer.username === 'Parell' || selectedPlayer.username === 'Keane') {
        const DMchannel = await selectedPlayer.send(randomPrompt);
        return this.cancelWrapper(getMultipleChoiceInput, DMchannel, selectedPlayer, opinionText, ['1', '2', '3', '4'], 15000);
      }
    })());

    const playerResponses = await Promise.allSettled(promises);

    await this.channel.send(`Here was the prompt sent to the humans:\n*${randomPrompt}*`);
    await this.cancelWrapper(timeout, 3500);

    const agreeEnums = {'1': 'Strong disagree', '2': 'Slightly disagree', '3': 'Slightly agree', '4': 'Strongly agree', '-1': 'No response given'};

    let playerResponsesText = '';
    for (let i = 0; i < playerResponses.length; i++) {
      playerResponsesText += `\n**${selectedPlayers[i].username}**: *${agreeEnums[playerResponses[i].value]}*`;
    };

    await this.channel.send('And here is how they responded:' + playerResponsesText);
    await this.cancelWrapper(timeout, 3500);
    await this.channel.send('Spend 30 seconds to deliberate which answers you think are suspicious. A new round will begin after.');
    await this.cancelWrapper(timeout, 6000);
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

    await this.cancelWrapper(timeout, 5000);
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
          return this.cancelWrapper(getMultipleChoiceInput, DMchannel, selectedPlayer, optionsText + deliberationText, ['1', '2', '3'], 15000);
        } else {
          const DMchannel = await selectedPlayer.send(randomScenario['prompt']);
          return this.cancelWrapper(getMultipleChoiceInput, DMchannel, selectedPlayer, optionsText + deliberationText, ['1', '2', '3'], 15000);
        }
      }
    })());

    const playerResponses = await Promise.allSettled(promises);

    await this.channel.send(`Here was the prompt sent to the humans:\n*${randomScenario['prompt']}*`);
    await this.cancelWrapper(timeout, 3500);

    let playerResponsesText = '';
    for (let i = 0; i < playerResponses.length; i++) {
      if (playerResponses[i].value === '-1') {
        playerResponsesText += `\n**${selectedPlayers[i].username}**: *No response given*`;
      } else {
        playerResponsesText += `\n**${selectedPlayers[i].username}**: *${randomScenario['options'][parseInt(playerResponses[i].value)-1]}*`;
      }
    };
    await this.channel.send('And here is how they responded:' + playerResponsesText);
    await this.cancelWrapper(timeout, 3500);
    await this.channel.send('Spend 30 seconds to deliberate which answers you think are suspicious. A new round will begin after.');
    await this.cancelWrapper(timeout, 6000);
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

    await this.cancelWrapper(timeout, 5000);
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
          return this.cancelWrapper(getInput, DMchannel, selectedPlayer, writingPodText, 15000);
        } else {
          const DMchannel = await selectedPlayer.send(humanPrompt);
          return this.cancelWrapper(getInput, DMchannel, selectedPlayer, writingPodText, 15000);
        }
      }
      return '-1';
    })());

    const playerResponses = await Promise.allSettled(promises);

    await this.channel.send(`Here was the prompt sent to the humans:\n*${humanPrompt}*`);
    await this.cancelWrapper(timeout, 3500);

    let playerResponsesText = '';
    for (let i = 0; i < playerResponses.length; i++) {
      if (playerResponses[i].value === '-1') {
        playerResponsesText += `\n**${selectedPlayers[i].username}**: *No response*`;
      } else {
        playerResponsesText += `\n**${selectedPlayers[i].username}**: ${playerResponses[i].value}`;
      }
    };

    await this.channel.send('And here is how they responded:' + playerResponsesText);
    await this.cancelWrapper(timeout, 3500);
    await this.channel.send('Spend 30 seconds to deliberate which answers you think are suspicious. A new round will begin after.');
    await this.cancelWrapper(timeout, 6000);
  }

  async bioScanner(selectedPlayers, captain) {
    await this.channel.send(
        'Two players that are chosen by the captain see a screen with ten glyphs. ' +
        'The captain receives three of those glyphs and must describe them to the two players. ' +
        'The two players must select the glyphs on their device that match the captain\'s description. ' +
        'If both players choose correctly, then the captain may choose any player to "scan". ' +
        'Scanning a player will reveal the player\'s identity, ' +
        'but only the captain will receive this information. The Bioscanner is only activated further ' +
        ' into the game and can be chosen regardless of the other testing rooms. ' +
        'The Bioscanner has a five-minute cooldown. The Alien(s) can also hack and give different glyphs ' +
        'to the hacked player.',
    );

    const bioscannerText = `
    Reply with a number to choose a glyph. You have 25 seconds.`;

    const allImages = await new Promise((resolve, reject) => {
      const images = {};
      fs.readdir(bioimagesFilepath, (err, files) => {
        files.forEach((file) => {
          const category = file.substr(0, file.indexOf('_'));
          if (file !== 'canvas.PNG' && file !== 'none.png' && file !== 'canvas2.png') {
            if (!(images.hasOwnProperty(category))) {
              images[category] = [];
            }
            images[category].push(file);
          }
        });
        resolve(images);
      });
    });

    const chosenImageSets = [];
    let keys = Object.keys(allImages);
    const unpicked = allImages;
    const captainImages = [];

    for (let i = 0; i < 3; i++) {
      const randomKey = keys[keys.length * Math.random() << 0];
      keys = keys.filter((key) => key != randomKey);
      const randomImageSet = unpicked[randomKey];
      chosenImageSets.push(randomImageSet);
      delete unpicked[randomKey];

      captainImages.push(randomImageSet[Math.floor(Math.random() * randomImageSet.length)]);
    }

    console.log('captain Images:');
    console.log(captainImages);
    const selectedUnhackedImages = captainImages.slice();
    for (let i = 0; i < 3; i++) {
      let unpickedUnhackedImages = chosenImageSets[i].filter((image) => image !== captainImages[i]);
      for (let j = 0; j < 3; j++) {
        const unhackedImage = unpickedUnhackedImages[Math.floor(Math.random() * unpickedUnhackedImages.length)];
        unpickedUnhackedImages = unpickedUnhackedImages.filter((image) => image !== unhackedImage);
        selectedUnhackedImages.push(unhackedImage);
      }
    }

    for (let i = selectedUnhackedImages.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selectedUnhackedImages[i], selectedUnhackedImages[j]] = [selectedUnhackedImages[j], selectedUnhackedImages[i]];
    }

    const optionsb64 = await mergeImages([
      {src: bioimagesFilepath + 'canvas.png', x: 0, y: 0},
      {src: bioimagesFilepath + selectedUnhackedImages[0], x: 0, y: 0},
      {src: bioimagesFilepath + selectedUnhackedImages[1], x: 175, y: 0},
      {src: bioimagesFilepath + selectedUnhackedImages[2], x: 350, y: 0},
      {src: bioimagesFilepath + selectedUnhackedImages[3], x: 0, y: 175},
      {src: bioimagesFilepath + selectedUnhackedImages[4], x: 175, y: 175},
      {src: bioimagesFilepath + selectedUnhackedImages[5], x: 350, y: 175},
      {src: bioimagesFilepath + selectedUnhackedImages[6], x: 0, y: 350},
      {src: bioimagesFilepath + selectedUnhackedImages[7], x: 175, y: 350},
      {src: bioimagesFilepath + selectedUnhackedImages[8], x: 350, y: 350},
      {src: bioimagesFilepath + selectedUnhackedImages[9], x: 0, y: 525},
      {src: bioimagesFilepath + selectedUnhackedImages[10], x: 175, y: 525},
      {src: bioimagesFilepath + selectedUnhackedImages[11], x: 350, y: 525},
    ], {Canvas: Canvas, Image: Image});

    const optionsBuffer = Buffer.from(optionsb64.replace(/^data:image\/png;base64,/, ''), 'base64');

    await this.cancelWrapper(timeout, 5000);

    const responseEnums = {};
    responseEnums[-1] = 'none.png';
    for (let i = 0; i < 12; i++) {
      responseEnums[i+1] = selectedUnhackedImages[i];
    }
    const totalResponses = [[], []];

    let optionsP1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    let optionsP2 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

    for (let i = 0; i < 3; i++) {
      const promises = selectedPlayers.map((selectedPlayer) => (async () => {
        if (selectedPlayer.username === 'Parell' || selectedPlayer.username === 'Keane') {
          let DMchannel;
          if (i === 0) {
            DMchannel = await selectedPlayer.send('The captain will now describe 3 glyphs-- ' +
              'you have have 25 seconds for each glyph. If both players being tested correctly ' +
              'select all 3, the bioscan will proceed', optionsBuffer);
          } else {
            DMchannel = await selectedPlayer.send('The captain will now describe the next image...');
          }
          if (selectedPlayers[0] == selectedPlayer) {
            return this.cancelWrapper(getMultipleChoiceInput, DMchannel, selectedPlayer, bioscannerText, optionsP1, 25000);
          } else if (selectedPlayers[1] == selectedPlayer) {
            return this.cancelWrapper(getMultipleChoiceInput, DMchannel, selectedPlayer, bioscannerText, optionsP2, 25000);
          }
        } else {
          return '-1';
        }
      })());
      const playerResponses = await Promise.allSettled(promises);
      optionsP1 = optionsP1.filter((option) => option != playerResponses[0].value);
      optionsP2 = optionsP2.filter((option) => option != playerResponses[1].value);
      totalResponses[0].push(responseEnums[playerResponses[0].value]);
      totalResponses[1].push(responseEnums[playerResponses[1].value]);
    }

    console.log(captainImages);
    const captainb64 = await mergeImages([
      {src: bioimagesFilepath + 'canvas2.png', x: 0, y: 0},
      {src: bioimagesFilepath + captainImages[0], x: 0, y: 0},
      {src: bioimagesFilepath + captainImages[1], x: 175, y: 0},
      {src: bioimagesFilepath + captainImages[2], x: 350, y: 0},
    ], {Canvas: Canvas, Image: Image});

    const captainBuffer = Buffer.from(captainb64.replace(/^data:image\/png;base64,/, ''), 'base64');

    const passed = [true, true];
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 3; j++) {
        if (!captainImages.includes(totalResponses[i][j])) {
          passed[i] = false;
        }
      }
    }

    if (passed[0] && passed[1]) {
      await this.bioScan(selectedPlayers, captain);
    } else {
      await this.channel.send(`Here were the glyphs the captain received:`, captainBuffer);
      await this.cancelWrapper(timeout, 3500);

      await this.channel.send(`And here were the players' chosen glyphs:`);

      console.log(totalResponses);
      for (let i = 0; i < 2; i++) {
        const responseb64 = await mergeImages([
          {src: bioimagesFilepath + 'canvas2.png', x: 0, y: 0},
          {src: bioimagesFilepath + totalResponses[i][0], x: 0, y: 0},
          {src: bioimagesFilepath + totalResponses[i][1], x: 175, y: 0},
          {src: bioimagesFilepath + totalResponses[i][2], x: 350, y: 0},
        ], {Canvas: Canvas, Image: Image});
        const responseBuffer = Buffer.from(responseb64.replace(/^data:image\/png;base64,/, ''), 'base64');
        this.channel.send(`**${selectedPlayers[i].username}**:`, responseBuffer);
      }
      await this.cancelWrapper(timeout, 3500);
      await this.channel.send('Spend 30 seconds to deliberate which answers you think are suspicious. A new round will begin after.');
      await this.cancelWrapper(timeout, 30000);
    }
  }

  async bioScan(selectedPlayers, captain) {
    await this.channel.send('The test has passed! The bioscanner will now proceed to scan a player\'s true identity.');
    const response = await this.cancelWrapper(getMultipleChoiceInput, this.channel, captain,
        'Captain, choose a player to be scanned. The results will be shown to only your eyes, ' +
        'but feel free to share them with the rest of the players.' +
        `\n\t\t1. **${selectedPlayers[0].username}**\n\t\t2. **${selectedPlayers[1].username}**`,
        [1, 2], 15000);

    if (response == '-1') {
      await this.channel.send('The testees escape scanning this time, as the captain couldn\'t make a decision in time!');
    } else {
      const selectedScanee = selectedPlayers[parseInt(response)];
      if (this.alienIDs.has(selectedScanee.id)) {
        await captain.send(`${selectedScanee.username} is an alien.`);
      } else {
        await captain.send(`${selectedScanee.username} is a human.`);
      }
    }

    await this.channel.send('The next round will begin shortly!');
    await this.cancelWrapper(timeout, 5000);
  }

  async extractionRoom(pusher) {
    let unpicked = Object.keys(this.players);
    unpicked = unpicked.filter((value) => value != pusher.id);

    await this.channel.send(undefined, imagesFilepath + 'buttonPushed.png');
    await timeout(2500);
    await this.channel.send(`${pusher.username} has pushed the button! The main game timer has been stopped and players will vote on `+
    `ejecting the ${this.numAliens} suspected aliens chosen by the button presser! The extraction will only proceed with an unanimous vote.`);

    const selectedPlayers = [];
    let selectedPlayer;
    let skipExtraction = false;
    for (let i = 0; i < this.numAliens; i++) {
      const playerEnums = {};
      /* Ask pusher which players to eject. */
      let playerSelectionPrompt = '';
      const playerOptions = [];

      for (let i = 0; i < unpicked.length; i++) {
        playerEnums[i+1] = unpicked[i];
        playerSelectionPrompt += `\n\t\t\t\t**${i+1}. ${this.players[unpicked[i]].user.username}**`;
        playerOptions.push('' + (i+1));
      }
      const choiceUsers = await getMultipleChoiceInput(
          this.channel, pusher, `${pusher.username}, choose a player to be ejected. (${i+1}/${this.numAliens})` +
            playerSelectionPrompt, playerOptions, 10000,
      );
      if (choiceUsers === '-1') {
        skipExtraction = true;
        break;
      }
      selectedPlayer = this.players[playerEnums[choiceUsers]].user;
      await this.channel.send(`${selectedPlayer.username} was selected.`);
      unpicked = unpicked.filter((value) => value !== playerEnums[choiceUsers]);
      selectedPlayers.push(selectedPlayer);
    }
    if (skipExtraction == false) {
      const voteResult = await this.buttonVote(selectedPlayers, unpicked);
      if (voteResult == true) {
        await this.channel.send(`The vote has passed! The extraction chamber ejects along with its contents...`);
        await timeout(2000);

        let ejectPrompt = '';
        let alienWin = false;
        selectedPlayers.forEach((selectedPlayer) => {
          if (this.alienIDs.has(selectedPlayer.id)) {
            ejectPrompt += `\n\t\t*${selectedPlayer.username}*: **ALIEN**`;
          } else {
            alienWin = true;
            ejectPrompt += `\n\t\t*${selectedPlayer.username}*: **HUMAN**`;
          }
        });

        await this.channel.send(`And the identities of those ejected are...`);
        await timeout(2000);
        await this.channel.send(`—————————————————————————————————————` + ejectPrompt);

        if (alienWin) {
          const remainingAliens = [];
          const selectedIDs = selectedPlayers.map((selectedPlayer) => selectedPlayer.id);
          this.alienIDs.forEach((alienID) => {
            if (selectedIDs.includes(alienID) === false) {
              remainingAliens.push(this.players[alienID].user);
            }
          });

          if (remainingAliens.length === 1) {
            await this.channel.send(`${remainingAliens[0].username}, the remaining alien, ` +
            `slurps the rest of the crew members on board.`);
          } else if (remainingAliens.length === 2) {
            await this.channel.send(`${remainingAliens[0]} and ${remainingAliens[1]}, the remaining aliens, enjoy their buffet of humans.`);
          } else {
            //  3 remaining aliens
            await this.channel.send(`As they eviscerated the crew members, ${remainingAliens[0]}, ` +
            `${remainingAliens[1]}, and ${remainingAliens[2]} wonder ` +
            `in disbelief how the humans didn't manage to catch a single one of them.`);
          }
        } else {
          await this.channel.send('The humans on board live to see another day.');
        }
        this.ended = true;
      }
    } else {
      await this.channel.send(`Looks like our button pusher couldn't make a decision in time! A new round will now begin`);
    }
  }

  async buttonVote(selectedPlayers, voterIDs) {
    const voters = voterIDs.map((voterID) => {
      return this.players[voterID].user;
    });

    let ejectPrompt = '';
    selectedPlayers.forEach((selectedPlayer) => {
      ejectPrompt += `\n\t\t**${selectedPlayer.username}**`;
    });
    const promises = voters.map((voter) => (async () => {
      if (voter.username === 'Parell' || voter.username === 'Keane') {
        const DMchannel = await voter.send(`Vote on whether to eject the following players:` + ejectPrompt);
        return getMultipleChoiceInput(DMchannel, voter, `Reply 1 for eject, 2 for do not eject.`, ['1', '2'], 15000);
      } else {
        return '1';
      }
    })());

    const playerResponses = await Promise.allSettled(promises);
    const voteResult = playerResponses.every((playerResponse) => {
      return playerResponse.value === '1';
    });

    return voteResult;
  }
  /**
   * @param {Message} message
   */
  async startCallback(message) {
    this.channel.send(message.user.username +
      ` is looking to start a game of Push the Button!
      Type \'!ptb join\' to play!`);

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
      button: {
        subs: {},
        callback: async (message) => {
          if (gameInstances[message.channel.id]) {
            const ptb = gameInstances[message.channel.id];
            if (ptb.buttonable === true) {
              if (ptb.buttonedState === false) {
                ptb.buttonedState = true;
                ptb.hasButtoned.unshift(message.user);
              }
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
const bot1 = new Client('ODA4MjA1NjUwODAxOTgzNTE4.YCDKKg.TXcMPKmcyIAP4eBeZJTa5EXJ18s'); // Xiangling
const bot2 = new Client('ODA4MjA1NzMxODkwNzI0ODk0.YCDKPg.X-imxUG0-Hc4Gd54ija1VUkWGZ4'); // Mai
const bot3 = new Client('ODA4Mjg4MTU2NjY3MzQ2OTU0.YCEXAQ.rT1vaUnXFaG4YSyg5Zgab9MzTSE'); // Yui

/* fs.readFile(bioimagesFilepath + 'yui1.png', (err, data) => {
  if (err) throw err;
  buffer = data;
  console.log(data);
}); */

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
  } else if (message.content.includes('mai!')) {
    message.user.send('uwu');
  } else if (message.content.includes('pls push button')) {
    message.channel.send('!ptb button');
  } else if (message.content.includes('to be ejected')) {
    message.channel.send('3');
  }
});

bot3.on('message', (message) => {
  if (message.content.includes('Type \'!ptb join\' to play!')) {
    message.channel.send('!ptb join');
  } else if (message.content.includes('1. Opinion Hold')) {
    message.channel.send('4');
  } else if (message.content.includes('yahallo!')) {
    // message.channel.send(undefined, bioimagesFilepath + 'yui1.PNG');
    message.channel.send(undefined, buffer);
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
