const nock = require('nock');
const Message = require('./Message');
const User = require('./User');
const {
  EditNotOwnMessageError,
  EditDeletedMessageError,
  EditBlankMessageError,
} = require('./errors');

jest.mock('./User');

test('Message constructor', () => {
  const user = {};
  User.mockReturnValue(user);

  const jsonString = `
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
  "embeds": [],
  "mentions": [],
  "mention_roles": [],
  "pinned": false,
  "mention_everyone": false,
  "tts": false,
  "timestamp": "2020-04-13T02:01:35.660000+00:00",
  "edited_timestamp": null,
  "flags": 0,
  "nonce": null
}
  `;
  const messageJSONObject = JSON.parse(jsonString);
  const client = {};
  const channel = {};
  const msg = new Message(messageJSONObject, client, channel);
  expect(msg.client).toBe(client);
  expect(msg.id).toBe('699076792958320725');
  expect(msg.type).toBe(0);
  expect(msg.content).toBe('Hello, World!');
  expect(msg.channel).toBe(channel);
  expect(msg.author).toBe(user);
  expect(msg.attachments).toEqual([]); // TODO
  expect(msg.embeds).toEqual([]); // TODO
  expect(msg.mentions).toEqual([]); // TODO
  expect(msg.mentionRoles).toEqual([]); // TODO
  expect(msg.pinned).toBe(false);
  expect(msg.mentionEveryone).toBe(false);
  expect(msg.tts).toBe(false);
  expect(msg.timestamp).toBe(Date.parse('2020-04-13T02:01:35.660000+00:00'));
  expect(msg.editedTimestamp).toBeNull();
  expect(msg.flags).toBe(0);
  expect(msg.nonce).toBeNull();
  expect(User.mock.instances.length).toBe(1);
  expect(User.mock.calls.length).toBe(1);
  expect(User.mock.calls[0].length).toBe(1);
  expect(User.mock.calls[0][0]).toEqual(messageJSONObject.author);
});

test('Message.edit non-empty text, no embed', async () => {
  const replyString = `
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
  const scope = nock('https://discordapp.com/api', {
    reqheaders: {
      authorization: /Bot \S+$/,
    },
  })
      .patch('/channels/696525324451577939/messages/699076792958320725')
      .reply(200, JSON.parse(replyString), {
        'content-type': 'application/json',
        'date': 'Mon, 13 Apr 2020 02:04:41 GMT',
        'x-ratelimit-bucket': '80c17d2f203122d936070c88c8d10f33',
        'x-ratelimit-limit': 5,
        'x-ratelimit-remaining': 4,
        'x-ratelimit-reset': 1586743487,
      });

  const jsonString = `
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
  "embeds": [],
  "mentions": [],
  "mention_roles": [],
  "pinned": false,
  "mention_everyone": false,
  "tts": false,
  "timestamp": "2020-04-13T02:01:35.660000+00:00",
  "edited_timestamp": null,
  "flags": 0,
  "nonce": null
}
  `;
  const messageJSONObject = JSON.parse(jsonString);
  const client = {me: {id: '696519593384214528'}};
  const msg = new Message(messageJSONObject, client, {});
  await msg.edit('Edited message');
  expect(msg.content).toBe('Edited message');
  expect(scope.isDone()).toBe(true);
});

test('Message.edit empty text, no embed', async () => {
  // No API request expected
  const scope = nock('https://discordapp.com'); // eslint-disable-line no-unused-vars

  const jsonString = `
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
  "embeds": [],
  "mentions": [],
  "mention_roles": [],
  "pinned": false,
  "mention_everyone": false,
  "tts": false,
  "timestamp": "2020-04-13T02:01:35.660000+00:00",
  "edited_timestamp": null,
  "flags": 0,
  "nonce": null
}
  `;
  const messageJSONObject = JSON.parse(jsonString);
  const client = {me: {id: '696519593384214528'}};
  const msg = new Message(messageJSONObject, client, {});
  await expect(msg.edit('')).rejects.toThrow(EditBlankMessageError);
  expect(msg.content).toBe('Hello, World!');
});

test('Message.edit only whitespaces/newlines, no embed', async () => {
  // No API request expected
  const scope = nock('https://discordapp.com'); // eslint-disable-line no-unused-vars

  const jsonString = `
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
  "embeds": [],
  "mentions": [],
  "mention_roles": [],
  "pinned": false,
  "mention_everyone": false,
  "tts": false,
  "timestamp": "2020-04-13T02:01:35.660000+00:00",
  "edited_timestamp": null,
  "flags": 0,
  "nonce": null
}
  `;
  const messageJSONObject = JSON.parse(jsonString);
  const client = {me: {id: '696519593384214528'}};
  const msg = new Message(messageJSONObject, client, {});
  await expect(msg.edit(' \n\t')).rejects.toThrow(EditBlankMessageError);
  expect(msg.content).toBe('Hello, World!');
});

test('Message.edit deleted message, no embed', async () => {
  // No API request expected
  const scope = nock('https://discordapp.com'); // eslint-disable-line no-unused-vars

  const jsonString = `
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
  "embeds": [],
  "mentions": [],
  "mention_roles": [],
  "pinned": false,
  "mention_everyone": false,
  "tts": false,
  "timestamp": "2020-04-13T02:01:35.660000+00:00",
  "edited_timestamp": null,
  "flags": 0,
  "nonce": null
}
  `;
  const messageJSONObject = JSON.parse(jsonString);
  const client = {me: {id: '696519593384214528'}};
  const msg = new Message(messageJSONObject, client, {});
  msg.deleted = true;
  await expect(msg.edit('Edited message')).rejects
      .toThrow(EditDeletedMessageError);
  expect(msg.content).toBe('Hello, World!');
});

test('Message.edit non-empty text, no embed, not author', async () => {
  // No API request expected
  const scope = nock('https://discordapp.com'); // eslint-disable-line no-unused-vars

  const jsonString = `
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
  const messageJSONObject = JSON.parse(jsonString);
  const client = {me: {id: '696519593384214528'}};
  const msg = new Message(messageJSONObject, client, {});
  await expect(msg.edit('Edited message')).rejects
      .toThrow(EditNotOwnMessageError);
  expect(msg.content).toBe('sugoi');
});
