const nock = require('nock');
const Message = require('./Message');
const {
  EditNotOwnMessageError,
  EditDeletedMessageError,
  EditBlankMessageError,
  DeleteDeletedMessageError,
} = require('./errors');

const botOriginalMsg = `
{
  "id": "699076792958320725",
  "type": 0,
  "content": "Hello, World!",
  "channel_id": "696525324451577939",
  "author": {
    "id": "696519593384214528",
    "username": "Button",
    "avatar": null,
    "discriminator": "8259",
    "public_flags": 0,
    "bot": true
  },
  "attachments": [],
  "embeds": [
    {
      "type": "rich",
      "title": "Hello, Embed!",
      "description": "This is an embedded message."
    }
  ],
  "mentions": [],
  "mention_roles": [],
  "pinned": false,
  "mention_everyone": false,
  "tts": false,
  "timestamp": "2020-04-13T02:01:35.660000+00:00",
  "edited_timestamp": null,
  "flags": 0,
  "nonce": null
}`;

const botEditedMsg = `
{
  "id": "699076792958320725",
  "type": 0,
  "content": "Edited message",
  "channel_id": "696525324451577939",
  "author": {
    "id": "696519593384214528",
    "username": "Button",
    "avatar": null,
    "discriminator": "8259",
    "public_flags": 0,
    "bot": true
  },
  "attachments": [],
  "embeds": [],
  "mentions": [],
  "mention_roles": [],
  "pinned": false,
  "mention_everyone": false,
  "tts": false,
  "timestamp": "2020-04-13T02:01:35.660000+00:00",
  "edited_timestamp": "2020-04-13T02:04:41.352315+00:00",
  "flags": 0,
  "nonce": null
}
`;

const otherUserMsg = `
{
  "id": "699067552697155634",
  "type": 0,
  "content": "sugoi",
  "channel_id": "696525324451577939",
  "author": {
    "id": "99284711607644160",
    "username": "Parell",
    "avatar": "c1b9ff8ec75f40813ff56f9e49306f58",
    "discriminator": "3824",
    "public_flags": 128
  },
  "attachments": [],
  "embeds": [],
  "mentions": [],
  "mention_roles": [],
  "pinned": false,
  "mention_everyone": false,
  "tts": false,
  "timestamp": "2020-04-13T01:24:52.610000+00:00",
  "edited_timestamp": null,
  "flags": 0
}
`;

afterAll(() => {
  nock.restore();
});

describe('Message.prototype.edit', () => {
  test('Message.edit non-empty text, include embed', async () => {
    const scope = nock('https://discordapp.com/api', {
      reqheaders: {
        authorization: /Bot \S+$/,
      },
    })
        .patch('/channels/696525324451577939/messages/699076792958320725')
        .reply(200, botEditedMsg, {
          'content-type': 'application/json',
          'date': 'Mon, 13 Apr 2020 02:04:41 GMT',
          'x-ratelimit-bucket': '80c17d2f203122d936070c88c8d10f33',
          'x-ratelimit-limit': 5,
          'x-ratelimit-remaining': 4,
          'x-ratelimit-reset': 1586743487,
        });

    const messageJSONObject = JSON.parse(botOriginalMsg);
    const client = {me: {id: '696519593384214528'}};
    const msg = new Message(messageJSONObject, client, {});
    await msg.edit('Edited message');
    expect(msg.content).toBe('Edited message');
    expect(scope.isDone()).toBe(true);
  });

  test('empty text, no embed', async () => {
    // Throws error if a request is made
    const scope = nock('https://discordapp.com'); // eslint-disable-line no-unused-vars

    const messageJSONObject = JSON.parse(botOriginalMsg);
    const client = {me: {id: '696519593384214528'}};
    const msg = new Message(messageJSONObject, client, {});
    await expect(msg.edit('')).rejects.toThrow(EditBlankMessageError);
    expect(msg.content).toBe('Hello, World!');
  });

  test('only whitespaces/newlines, no embed', async () => {
    // Throws error if a request is made
    const scope = nock('https://discordapp.com'); // eslint-disable-line no-unused-vars

    const messageJSONObject = JSON.parse(botOriginalMsg);
    const client = {me: {id: '696519593384214528'}};
    const msg = new Message(messageJSONObject, client, {});
    await expect(msg.edit(' \n\t')).rejects.toThrow(EditBlankMessageError);
    expect(msg.content).toBe('Hello, World!');
  });

  test('deleted message, no embed', async () => {
    // Throws error if a request is made
    const scope = nock('https://discordapp.com'); // eslint-disable-line no-unused-vars

    const messageJSONObject = JSON.parse(botOriginalMsg);
    const client = {me: {id: '696519593384214528'}};
    const msg = new Message(messageJSONObject, client, {});
    msg.deleted = true;
    await expect(msg.edit('Edited message')).rejects
        .toThrow(EditDeletedMessageError);
    expect(msg.content).toBe('Hello, World!');
  });

  test('non-empty text, no embed, not author', async () => {
    // Throws error if a request is made
    const scope = nock('https://discordapp.com'); // eslint-disable-line no-unused-vars

    const messageJSONObject = JSON.parse(otherUserMsg);
    const client = {me: {id: '696519593384214528'}};
    const msg = new Message(messageJSONObject, client, {});
    await expect(msg.edit('Edited message')).rejects
        .toThrow(EditNotOwnMessageError);
    expect(msg.content).toBe('sugoi');
  });
});

describe('Message.prototype.reply', () => {
  test('1 parameter', async () => {
    const messageJSONObject = JSON.parse(botOriginalMsg);
    const channel = {send: jest.fn()};
    const msg = new Message(messageJSONObject, {}, channel);
    msg.channel = channel;
    await msg.reply('Hello there');
    expect(channel.send.mock.calls.length).toBe(1);
    expect(channel.send.mock.calls[0].length).toBe(1);
    expect(channel.send.mock.calls[0][0]).toBe('Hello there');
  });

  test('2 parameters', async () => {
    const messageJSONObject = JSON.parse(botOriginalMsg);
    const channel = {send: jest.fn()};
    const msg = new Message(messageJSONObject, {}, channel);
    msg.channel = channel;
    await msg.reply(
        'Hello there',
        'C:\Riot Games\League of Legends\Game\BugSplat.dll',
    );
    expect(channel.send.mock.calls.length).toBe(1);
    expect(channel.send.mock.calls[0].length).toBe(2);
    expect(channel.send.mock.calls[0][0]).toBe('Hello there');
    expect(channel.send.mock.calls[0][1]).toBe(
        'C:\Riot Games\League of Legends\Game\BugSplat.dll',
    );
  });
});

describe('Message.prototype.delete', () => {
  test('Not deleted message', async () => {
    const scope = nock('https://discordapp.com/api', {
      reqheaders: {
        authorization: /Bot \S+$/,
      },
    })
        .delete('/channels/696525324451577939/messages/699076792958320725')
        .reply(204);
    const messageJSONObject = JSON.parse(botOriginalMsg);
    const client = {me: {id: '696519593384214528'}};
    const msg = new Message(messageJSONObject, client, {});
    await msg.delete;
    expect(msg.content).toBe('Hello World!');
    expect(msg.deleted).toBe(true);
    expect(scope.isDone()).toBe(true);
  });

  test('Deleted message', async () => {
    // Throws error if a request is made
    const scope = nock('https://discordapp.com'); // eslint-disable-line no-unused-vars

    const messageJSONObject = JSON.parse(botOriginalMsg);
    const client = {me: {id: '696519593384214528'}};
    const msg = new Message(messageJSONObject, client, {});
    msg.deleted = true;
    await expect(msg.delete).rejects
        .toThrow(DeleteDeletedMessageError);
    expect(msg.content).toBe('Hello World!');
  });
});
