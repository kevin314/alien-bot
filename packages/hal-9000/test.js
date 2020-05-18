const Client = require('../eminem/Client');
const User = require('../eminem/User');
const Message = require('../eminem/Message');
const Bot = require('./Bot');
const Command = require('./Command');
const {
  executeMenu, executeReactMenu, executeCheckBoxReactMenu,
} = require('./index');

describe('event handlers', () => {
  let client;

  beforeEach(() => {
    client = new Client();
    client.login = jest.fn();
  });

  describe('single top-level command', () => {
    let commandCallback;

    beforeEach(() => {
      commandCallback = jest.fn();

      const bot = new Bot({prefix: '!testBot'}, client);
      bot.addCommand(new Command('top', 'top help text', commandCallback));
    });

    test('match command', () => {
      const message = receiveMessage('!testBot top');
      expect(commandCallback.mock.calls.length).toBe(1);
      expect(commandCallback.mock.calls[0].length).toBe(1);
      expect(commandCallback.mock.calls[0][0]).toEqual(message);
    });

    test('matching prefix but not command', () => {
      receiveMessage('!testBot pot');
      expect(commandCallback.mock.calls.length).toBe(0);
    });

    test('not matching prefix', () => {
      receiveMessage('!else top');
      expect(commandCallback.mock.calls.length).toBe(0);
    });

    test('random message', () => {
      receiveMessage('hello there');
      expect(commandCallback.mock.calls.length).toBe(0);
    });

    test('bot help', () => {
      const message = new Message();
      message.content = '!testBot help';
      message.channel = {send: jest.fn()};
      client.emit('MESSAGE_CREATE', message);
      expect(message.channel.send).toHaveBeenCalled();
    });

    test('command help', () => {
      const message = new Message();
      message.content = '!testBot top help';
      message.channel = {send: jest.fn()};
      client.emit('MESSAGE_CREATE', message);
      expect(message.channel.send).toHaveBeenCalled();
    });
  });

  describe('two top-level commands', () => {
    let commandCallback1;
    let commandCallback2;

    beforeEach(() => {
      commandCallback1 = jest.fn();
      commandCallback2 = jest.fn();

      const bot = new Bot({prefix: '!testBot'}, client);
      bot.addCommand(new Command('top1', 'top1 help text', commandCallback1));
      bot.addCommand(new Command('top2', 'top2 help text', commandCallback2));
    });

    test('match command1', () => {
      const message = receiveMessage('!testBot top1');
      expect(commandCallback1.mock.calls.length).toBe(1);
      expect(commandCallback1.mock.calls[0].length).toBe(1);
      expect(commandCallback1.mock.calls[0][0]).toEqual(message);
    });

    test('match command2', () => {
      const message = receiveMessage('!testBot top2');
      expect(commandCallback2.mock.calls.length).toBe(1);
      expect(commandCallback2.mock.calls[0].length).toBe(1);
      expect(commandCallback2.mock.calls[0][0]).toEqual(message);
    });

    test('random message', () => {
      receiveMessage('hello there');
      expect(commandCallback.mock.calls.length).toBe(0);
    });
  });

  describe('nested commands', () => {
    test('match only nested command', () => {
      const commandCallback = jest.fn();
      const nestedCommand = new Command(
          'nested', 'nested help text', commandCallback,
      );
      const topCommand = new Command('top', 'top help text', () => {});
      topCommand.addCommand(nestedCommand);
      const bot = new Bot({prefix: '!testBot'}, client);
      bot.addCommand(topCommand);

      const message = receiveMessage('!testBot top nested');
      expect(commandCallback.mock.calls.length).toBe(1);
      expect(commandCallback.mock.calls[0].length).toBe(1);
      expect(commandCallback.mock.calls[0][0]).toEqual(message);
    });

    test('match one of multiple nested commands', () => {
      const commandCallback = jest.fn();
      const nestedCommand = new Command(
          'nested', 'nested help text', () => {},
      );
      const nestedTargetCommand = new Command(
          'nestedTarget', 'nestedTarget help text', commandCallback,
      );
      const topCommand = new Command('top', 'top help text', () => {});
      topCommand.addCommand(nestedCommand);
      topCommand.addCommand(nestedTargetCommand);
      const bot = new Bot({prefix: '!testBot'}, client);
      bot.addCommand(topCommand);

      const message = receiveMessage('!testBot top nestedTarget');
      expect(commandCallback.mock.calls.length).toBe(1);
      expect(commandCallback.mock.calls[0].length).toBe(1);
      expect(commandCallback.mock.calls[0][0]).toEqual(message);
    });
  });

  /**
   * Emit a message from the client.
   * @param {String} content content of the Message to be emitted.
   * @return {Message} the Message instance that was emitted.
   */
  function receiveMessage(content) {
    const message = new Message();
    message.content = content;
    client.emit('MESSAGE_CREATE', message);
    return message;
  }
});

test('login', () => {
  const client = new Client();
  client.login = jest.fn();
  const bot = new Bot({}, client);
  const token = 'awil35j89afjia3jkl';
  bot.login(token);
  expect(client.login).toHaveBeenCalledWith(token);
});

describe('executeMenu', () => {
  test('valid response', (done) => {
    const channel = {send: jest.fn()};

    const user = new User();
    user.id = 'somesnowflakeid';

    const menuText = 'menu text';
    const timeout = 10;
    const choices = ['1', '2', '3', '4'];
    const promise = executeMenu(channel, user, {menuText, timeout, choices});

    setTimeout(() => {
      expect(channel.send).toHaveBeenCalled();
      const message = new Message();
      message.author = user;
      message.content = '3';
      client.emit('MESSAGE_CREATE', message);
      expect(promise).resolves.toBe('3');
      done();
    }, 1000);
  });

  test('no response timeout', async () => {
    const channel = {send: jest.fn()};

    const user = new User();
    user.id = 'somesnowflakeid';

    const menuText = 'menu text';
    const timeout = 10;
    const choices = ['1', '2', '3', '4'];
    const choice = await executeMenu(
        channel, user, {menuText, timeout, choices},
    );

    expect(channel.send).toHaveBeenCalled();
    expect(choice).toBeUndefined();
  });

  test('invalid response', (done) => {
    const channel = {send: jest.fn()};

    const user = new User();
    user.id = 'somesnowflakeid';

    const menuText = 'menu text';
    const timeout = 10;
    const choices = ['1', '2', '3', '4'];
    const promise = executeMenu(channel, user, {menuText, timeout, choices});

    setTimeout(() => {
      expect(channel.send).toHaveBeenCalled();
      const message = new Message();
      message.author = user;
      message.content = '5';
      client.emit('MESSAGE_CREATE', message);

      channel.send.mockClear();
      expect(channel.send).toHaveBeenCalled();

      const message1 = new Message();
      message1.author = user;
      message1.content = '4';
      client.emit('MESSAGE_CREATE', message1);

      expect(promise).resolves.toBe('4');
      done();
    }, 1000);
  });
});

test('executeReactMenu', (done) => {
  const message = new Message();
  message.id = 'somesnowflakeid';

  const channel = {send: jest.fn()};
  channel.send.mockResolvedValue(message);

  const user = new User();
  const menuText = 'menu text';
  const timeout = 10;
  const choices = ['🤨', '🥺', '😳', '😭'];

  const promise = executeReactMenu(channel, user, {menuText, timeout, choices});

  setTimeout(() => {
    expect(channel.send).toHaveBeenCalled();
    const messageClone = Object.assign({}, message);
    client.emit('MESSAGE_REACTION_ADD', {
      user: user,
      message: messageClone,
      emoji: {
        id: null,
        name: '🥺',
      },
    });
    expect(promise).resolves.toBe('🥺');
    done();
  }, 1000);
});

test('executeCheckBoxReactMenu', (done) => {
  const message = new Message();
  message.id = 'somesnowflakeid';

  const channel = {send: jest.fn()};
  channel.send.mockResolvedValue(message);

  const user = new User();
  const menuText = 'menu text';
  const timeout = 10;
  const choices = ['🤨', '🥺', '😳', '😭'];

  const promise = executeCheckBoxReactMenu(
      channel, user, {menuText, timeout, choices},
  );

  setTimeout(() => {
    expect(channel.send).toHaveBeenCalled();
    const messageClone = Object.assign({}, message);
    client.emit('MESSAGE_REACTION_ADD', {
      user: user,
      message: messageClone,
      emoji: {
        id: null,
        name: '🥺',
      },
    });
    setTimeout(() => {
      client.emit('MESSAGE_REACTION_ADD', {
        user: user,
        message: messageClone,
        emoji: {
          id: null,
          name: '😭',
        },
      });
      setTimeout(() => {
        expect(promise).resolves.toEqual(['🥺', '😭']);
        done();
      }, 8000);
    }, 1000);
  }, 1000);
});
