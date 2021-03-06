const EventEmitter = require('events');
const {Timer} = require('./timer');

const store = {};

class AlreadyWaitingForInputError extends Error {
  constructor(...args) {
    super(args);
    this.name = 'AlreadyWaitingForInputError';
  }
}

function eminemMessageReceivedHandler(message) {
  if (store[message.channel.id]) {
    //  clearInterval(store[message.channel.id]['interval']);
    store[message.channel.id]['resolve'](message.content);
  }
  if (store[`${message.channel.id},${message.user.id}`]) {
    //  clearInterval(store[`${message.channel.id},${message.user.id}`]['interval']);
    store[`${message.channel.id},${message.user.id}`]['resolve'](message.content);
  }
  /* store[message.channel.id] && store[message.channel.id](message.content);
  store[`${message.channel.id},${message.user.id}`] && store[`${message.channel.id},${message.user.id}`](message.content); */
}

async function getInput(channel, user, text, time, em) {
  if ((user && store[`${channel.id},${user.id}`]) || store[channel.id]) {
    throw new AlreadyWaitingForInputError('Can\'t overwrite resolve');
  }

  if (text) {
    await channel.send(text);
  }

  //const done = {'val': false};
  let interval;

  const cancel = new Promise((resolve, reject) => {
    if (em) {
      em.once('abort', () => {
        //  done['val'] = true;
        clearInterval(interval);
        resolve();
      });
    }
  });

  const timeout = new Promise(async (resolve, reject) => {
    if (time) {
      const timer = new Timer(() => {
        //  done['val'] = true;
        clearInterval(interval);
        resolve('-1');
      }, time);
      timer.resume();

      const timerMsg = await channel.send(`Time remaining: ${timer.getTimeLeft()/1000}s`);
      interval = setInterval(async () => {
        /* if (done['val'] === true) {
          clearInterval(interval);
        } else {
          await timerMsg.edit(`Time remaining: ${Math.floor(timer.getTimeLeft()/1000)}s`);
        } */
        await timerMsg.edit(`Time remaining: ${Math.floor(timer.getTimeLeft()/1000)}s`);
      }, 3000);
    }
  });

  const validResponse = new Promise((resolve, reject) => {
    if (user) {
      //store[`${channel.id},${user.id}`] = {'resolve': resolve, 'done': done};
      store[`${channel.id},${user.id}`] = {'resolve': resolve, 'interval': interval};
    } else {
      //store[channel.id] = {'resolve': resolve, 'done': done};
      store[channel.id]= {'resolve': resolve, 'interval': interval};
    }
  });

  const race = Promise.race([
    cancel,
    timeout,
    validResponse,
  ]);

  const ret = await race;

  /*  if (interval) {
    clearInterval(interval);
  } */
  if (user) {
    delete store[`${channel.id},${user.id}`];
  } else {
    delete store[channel.id];
  }
  return ret;
}


async function getMultipleChoiceInput(channel, user, text, options, time, em) {
  const timerEm = new EventEmitter();

  let interval;

  const timeout = new Promise(async (resolve, reject) => {
    const timer = new Timer(async () => {
      clearInterval(interval);
      resolve('-1');
      timerEm.emit('abort');
    }, time);
    timer.resume();

    const timerMsg = await channel.send(`Time remaining: ${Math.floor(timer.getTimeLeft()/1000)}s`);
    interval = setInterval(async () => {
      await timerMsg.edit(`Time remaining: ${Math.floor(timer.getTimeLeft()/1000)}s`);
    }, 3000);
  });

  const cancel = new Promise((resolve, reject) => {
    if (em) {
      em.once('abort', () => {
        clearInterval(interval);
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
    clearInterval(interval);
    return response;
  })();

  const race = Promise.race([
    cancel,
    timeout,
    validResponse,
  ]);

  return race;
}

module.exports = {getMultipleChoiceInput, getInput, eminemMessageReceivedHandler, AlreadyWaitingForInputError};
