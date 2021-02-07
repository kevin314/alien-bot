const {Client} = require('eminem');
const {eminemMessageReceivedHandler, getInput, getMultipleChoiceInput, parseMessage, AlreadyWaitingForInputError} = require('./index');

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
          console.log('message is : ' + message);
          const ptb = new PushTheButton(message.channel);
          gameInstances['ptb'].push(ptb);
          ptb.startCallback(message);
          if (ptb.hasStarted === false) {
            delete ptb;
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
