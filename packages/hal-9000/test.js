const Client = require('../eminem/Client');
const Message = require('../eminem/Message');
const Bot = require('./Bot');
const Command = require('./Command');

describe('Single top-level command', () => {
  test('successful, event handlers', async () => {
    const client = new Client();
    client.login = jest.fn();
    const commandCallback = jest.fn();

    const bot = new Bot({prefix: '!testBot'}, client);
    bot.addCommand(new Command('top', 'top help text', commandCallback));

    // Make mocked client "receive" a message
    const message = new Message();
    message.content = '!testBot top';
    client.emit('MESSAGE_CREATE', message);

    expect(commandCallback.mock.calls.length).toBe(1);
    expect(commandCallback.mock.calls[0][0]).toBe(someContextObject); // TODO: define this
  });
});
