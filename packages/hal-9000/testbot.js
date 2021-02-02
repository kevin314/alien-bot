const {Client} = require('eminem');
const {eminemMessageReceivedHandler, getInput, getMultipleChoiceInput, parseMessage, AlreadyWaitingForInputError} = require('./index');

const commands = {
  ptb: {
    subs: {
      start: {
        subs: {},
        callback: async function(message, textArgs) {
          const response = await getInput(message.channel, message.user, undefined, 10000);
          message.channel.send('ptb start' + textArgs.join(' '));
        },
      },
      join: {
        subs: {},
      },
      help: {
        subs: {},
        callback: async (message) => {
          try {
            const response = await getMultipleChoiceInput(message.channel, message.user, `im waiting for response to ${message.content}`, options, 5000);
            if (response) {
              await message.channel.send(`done waiting for response to ${message.content} ${response}`);
            } else {
              await message.channel.send(`timed out waiting for response to ${message.content} ${response}`);
            }
          // await message.channel.send(message.channel.id);
          } catch (err) {
            if (!err instanceof AlreadyWaitingForInputError) {
              throw err;
            }
          }
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
