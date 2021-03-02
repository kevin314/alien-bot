const EventEmitter = require('events');

class AlreadyWaitingForInputError extends Error {
  constructor(...args) {
    super(args);
    this.name = 'AlreadyWaitingForInputError';
  }
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

class Timer {
  constructor(callback, delay) {
    this.timerID;
    this.remaining = delay;
    this.start;
    this.running;
    this.callback = callback;

    this.pause = () => {
      this.running = false;
      clearTimeout(this.timerID);
      this.remaining -= new Date() - this.start;
    };

    this.resume = () => {
      this.running = true;
      this.start = new Date();
      this.timerID = setTimeout(this.callback, this.remaining);
    };

    this.getTimeLeft = () => {
      if (this.running === true) {
        return this.remaining - (new Date() - this.start);
      }
      return this.remaining;
    };
  }
}

async function getInput(channel, user, text, time, em) {
  if ((user && store[`${channel.id},${user.id}`]) || store[channel.id]) {
    throw new AlreadyWaitingForInputError('Can\'t overwrite resolve');
  }

  if (text) {
    await channel.send(text);
  }

  const cancel = new Promise((resolve, reject) => {
    if (em) {
      em.on('abort', () => {
        clearInterval(interval);
        resolve();
      });
    }
  });

  let interval;
  const timeout = new Promise(async (resolve, reject) => {
    if (time) {
      const timer = new Timer(() => {
        clearInterval(interval);
        resolve('-1');
      }, time);

      const timerMsg = await channel.send(`Time remaining: ${timer.getTimeLeft()/1000}s`);
      interval = setInterval(async () => {
        await timerMsg.edit(`Time remaining: ${Math.floor(timer.getTimeLeft()/1000)}s`);
      }, 3000);
      /* setTimeout(() => {
        resolve('-1');
      }, time); */
    }
  });

  const validResponse = new Promise((resolve, reject) => {
    clearInterval(interval);
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

  /*
  if (interval) {
    clearInterval(interval);
  } */
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

async function getMultipleChoiceInput(channel, user, text, options, time, em) {
  const timerEm = new EventEmitter();

  const timeout = new Promise(async (resolve, reject) => {
    const timer = new Timer(async () => {
      resolve('-1');
      timerEm.emit('abort');
    }, time);
    timer.resume();

    const timerMsg = await channel.send(`Time remaining: ${timer.getTimeLeft()/1000}s`);
    interval = setInterval(async () => {
      await timerMsg.edit(`Time remaining: ${timer.getTimeLeft()/1000}s`);
    }, 3000);
  });

  const cancel = new Promise((resolve, reject) => {
    if (em) {
      em.on('abort', () => {
        resolve();
        timerEm.emit('abort');
      });
    }
  });

  const validResponse = (async () => {
    let response = await getInput(channel, user, text, undefined, timerEm);
    if (!response) {
      return;
    }
    const optionsSet = new Set(options);
    while (!optionsSet.has(response.trim())) {
      response = await getInput(channel, user, `${response} is an invalid response to\n> ${text}\nTry again, must be one of ` + options.join(', '), undefined, em);
      if (!response) {
        return;
      }
    }
    return response;
  })();

  const race = Promise.race([
    cancel,
    timeout,
    validResponse,
  ]);

  const ret = await race;
  if (interval) {
    console.log('clearing interval');
    clearInterval(interval);
  }
  return ret;
}

module.exports = {parseMessage, Timer, getInput, getMultipleChoiceInput, eminemMessageReceivedHandler, AlreadyWaitingForInputError};
