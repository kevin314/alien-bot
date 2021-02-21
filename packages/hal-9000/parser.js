const EventEmitter = require('events');

class AlreadyWaitingForInputError extends Error {
  constructor(...args) {
    super(args);
    this.name = 'AlreadyWaitingForInputError';
  }
}

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseMessage(text, commands) {
  if (text[0] === '!') {
    const commandArr = text.slice(1).split(' ');

    if (!commands.hasOwnProperty(commandArr[0])) {
      return;
    }

    let currCommand = commands[commandArr[0]];
    let i = 1;
    for (; i < commandArr.length; i++) {
      if (currCommand.hasOwnProperty('subs') && currCommand['subs'].hasOwnProperty(commandArr[i])) {
        currCommand = currCommand['subs'][commandArr[i]];
      } else {
        break;
      }
    }
    return {
      command: currCommand,
      textArgs: commandArr.slice(i),
    };
  }
}
const store = {};


async function getInput(channel, user, text, time, em) {
  if ((user && store[`${channel.id},${user.id}`]) || store[channel.id]) {
    throw new AlreadyWaitingForInputError('Can\'t overwrite resolve');
  }

  if (text) {
    await channel.send(text);
  }

  const cancel = new Promise((resolve, reject) => {
    if (em) {
      em.on('abort', resolve);
    }
  });

  const timeout = new Promise((resolve, reject) => {
    if (time) {
      setTimeout(() => {
        resolve('-1');
      }, time);
    }
  });

  const validResponse = new Promise((resolve, reject) => {
    if (user) {
      store[`${channel.id},${user.id}`] = resolve;
    } else {
      store[channel.id] = resolve;
    }
  });

  const race = Promise.race([
    cancel,
    timeout,
    validResponse,
  ]);

  const ret = await race;
  if (user) {
    delete store[`${channel.id},${user.id}`];
  } else {
    delete store[channel.id];
  }
  return ret;
}

function eminemMessageReceivedHandler(message) {
  store[message.channel.id] && store[message.channel.id](message.content);
  store[`${message.channel.id},${message.user.id}`] && store[`${message.channel.id},${message.user.id}`](message.content);
}

async function getMultipleChoiceInput(channel, user, text, options, time) {
  const em = new EventEmitter();
  const timeout = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('-1');
      em.emit('abort');
    }, time);
  });

  const validResponse = (async () => {
    let response = await getInput(channel, user, text, undefined, em);
    if (!response) {
      return;
    }
    const optionsSet = new Set(options);
    while (!optionsSet.has(response.trim())) {
      response = await getInput(channel, user, `${response} is an invalid response to\n> ${text}\nTry again, must be one of ` + JSON.stringify(options), undefined, em);
      if (!response) {
        return;
      }
    }

    return response;
  })();

  const race = Promise.race([
    timeout,
    validResponse,
  ]);

  return race;
}

module.exports = {timeout, parseMessage, getInput, getMultipleChoiceInput, eminemMessageReceivedHandler, AlreadyWaitingForInputError};
