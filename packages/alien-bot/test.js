const {start} = require('./index');
const {Command} = require('../hal-9000');
const Message = require('../eminem/Message');
const User = require('../eminem/User');
const Channel = require('../eminem/Channel');
const sleep = require('util').promisify(setTimeout);

jest.mock('../hal-9000');
jest.mock('../eminem/User');
jest.mock('../eminem/Channel');
jest.mock('../eminem/Message');

const sentMessages = [];
const mockSend = (text) => {
  const ret = new Message();
  ret.content = text;
  sentMessages.push(ret);
  return ret;
};
Channel.mockImplementation(() => {
  return {
    send: jest.fn().mockImplementation(mockSend),
  };
});
Message.mockImplementation(() => {
  return {
    edit: jest.fn(),
    delete: jest.fn(),
    reply: jest.fn().mockImplementation(mockSend),
  };
});

test('4 player game no errors', async () => {
  const commandIdxs = {};
  const bot = {
    login: jest.fn(),
    addCommand: jest.fn((command) => {
      const idx = Command.mock.instances.indexOf(command);
      const name = Command.mock.calls[idx][0];
      expect(name).toBeDefined();
      expect(commandIdxs[name]).toBeUndefined();
      commandIdxs[name] = idx;
    }),
    logout: jest.fn(),
  };

  const token = 'testtokenstring';
  start(bot, token);
  expect(bot.login).toHaveBeenCalledWith(token);
  expect(commandIdxs['start']).toBeDefined();
  expect(commandIdxs['join']).toBeDefined();
  expect(commandIdxs['test']).toBeDefined();
  expect(commandIdxs['button']).toBeDefined();
  expect(commandIdxs['vote']).toBeDefined();
  expect(commandIdxs['hack']).toBeDefined();

  const gameChannel = new Channel();
  gameChannel.id = 'gamechannelid';

  const players = {};

  const startCallback = Command.mock.calls[commandIdxs['start']][2];
  const joinCallback = Command.mock.calls[commandIdxs['join']][2];
  const testCallback = Command.mock.calls[commandIdxs['test']][2];

  /* PTB START */
  // Setup message
  const player0 = new User();
  player0.id = 'player0id';
  player0.username = 'player0';
  players[player0.id] = player0;
  const startMessage = new Message();
  startMessage.author = player0;
  startMessage.content = '!testPrefix start';
  startMessage.channel = gameChannel;

  // "Receive" command
  await startCallback(startMessage);

  // Verify behavior
  expect(
      startMessage.channel.send.mock.calls.length ||
      startMessage.reply.mock.calls.length,
  ).toBeTruthy();

  gameChannel.send.mockClear();
  await sleep(1000);

  /* PTB JOIN 1 */
  const player1 = new User();
  player1.id = 'player1id';
  player1.username = 'player1';
  players[player1.id] = player1;
  const joinMessage1 = new Message();
  joinMessage1.author = player1;
  joinMessage1.content = '!testPrefix join';
  joinMessage1.channel = gameChannel;

  await joinCallback(joinMessage1);

  expect(
      joinMessage1.channel.send.mock.calls.length ||
      joinMessage1.reply.mock.calls.length,
  ).toBeTruthy();

  gameChannel.send.mockClear();
  await sleep(1000);

  /* PTB JOIN 2 */
  const player2 = new User();
  player2.id = 'player2id';
  player2.username = 'player2';
  players[player2.id] = player2;
  const joinMessage2 = new Message();
  joinMessage2.author = player2;
  joinMessage2.content = '!testPrefix join';
  joinMessage2.channel = gameChannel;

  await joinCallback(joinMessage2);

  expect(
      joinMessage2.channel.send.mock.calls.length ||
      joinMessage2.reply.mock.calls.length,
  ).toBeTruthy();

  gameChannel.send.mockClear();
  await sleep(1000);

  /* PTB JOIN 3 */
  const player3 = new User();
  player3.id = 'player3id';
  player3.username = 'player3';
  players[player3.id] = player3;
  const joinMessage3 = new Message();
  joinMessage3.author = player3;
  joinMessage3.content = '!testPrefix join';
  joinMessage3.channel = gameChannel;

  await joinCallback(joinMessage3);

  expect(
      joinMessage3.channel.send.mock.calls.length ||
      joinMessage3.reply.mock.calls.length,
  ).toBeTruthy();

  gameChannel.send.mockClear();
  await sleep(27000);

  /* ROUND 1 */
  await (async () => {
    // The game start message should have been sent in the last 27 seconds and
    // no earlier.
    expect(gameChannel.send.mock.calls.length).toBeGreaterThan(2);
    const captainMessage = sentMessages[1];
    const roundStartMessage = sentMessages[2];
    const timerMessage = sentMessages[sentMessages.length - 1];

    const match = captainMessage.content.match(/<@[!0-9]?[0-9]+>/);
    const captainId = match[0].match(/[0-9]+/);
    console.log(captainId);

    // Check that timers are being updated
    await sleep(1000);
    expect(roundStartMessage.edit).toHaveBeenCalled();
    expect(timerMessage.edit).toHaveBeenCalled();

    // Make captain's test selection message
    const captain = players[captainId];
    if (!captain) {
      throw new Error('Unexpected captain id');
    }
    const testablePlayers = valuesExceptKey(players, captainId);
    const testSelectMessage = new Message();
    testSelectMessage.author = captain;
    testSelectMessage.content = `!testPrefix test o <@${testablePlayers[0].id}> <@${testablePlayers[1].id}>`; // eslint-disable-line max-len
    testSelectMessage.channel = gameChannel;

    // "Receive" captain's test selection message
    await testCallback(testSelectMessage);

    // Verify test selected behavior
    expect(testablePlayers[0].send).toHaveBeenCalled();
    expect(testablePlayers[1].send).toHaveBeenCalled();

    // Reset
    gameChannel.send.mockClear();

    // Make testablePlayers[0]'s test response message

    // "Receive" testablePlayers[0]'s test response message

    // Make testablePlayers[1]'s test response message

    // "Receive" testablePlayers[0]'s test response message

    // Verify test complete behavior
    expect(gameChannel.send).toHaveBeenCalled();

    // Reset for next round
    sentMessages.length = 0; // clear sentMessages
    gameChannel.send.mockClear();
    timerMessage.edit.mockClear();
  })();

  await sleep(45000);

  /* ROUND 2 */
  await (async () => {
    expect(gameChannel.send.mock.calls.length).toBeGreaterThan(1);
    const captainMessage = sentMessages[0];
    const roundStartMessage = sentMessages[1];
    const timerMessage = sentMessages[sentMessages.length - 1];

    const match = captainMessage.content.match(/<@[!0-9]?[0-9]+>/);
    const captainId = match[0].match(/[0-9]+/);
    console.log(captainId);

    await sleep(1000);
    expect(roundStartMessage.edit).toHaveBeenCalled();
    expect(timerMessage.edit).toHaveBeenCalled();

    const captain = players[captainId];
    if (!captain) {
      throw new Error('Unexpected captain id');
    }

    sentMessages.length = 0; // clear sentMessages
    gameChannel.send.mockClear();
    timerMessage.edit.mockClear();
  })();
});

/**
 * @param {*} obj
 * @param {*} ignoredKey
 * @return {Array} Array of values in the object whose key is not equal to
 * ignoredKey.
 */
function valuesExceptKey(obj, ignoredKey) {
  const keys = Object.keys(obj);
  const ret = [];
  for (const key of keys) {
    if (key !== ignoredKey) {
      ret.push(obj[key]);
    }
  }
  return ret;
}
