const Client = require('../eminem/Client');
const Message = require('../eminem/Message');
const Bot = require('./Bot');
const Command = require('./Command');

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
