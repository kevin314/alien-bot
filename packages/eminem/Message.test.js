const nock = require('nock');
const Message = require('./Message');
const {EditNotOwnMessageError} = require('./errors');

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
  const msg = new Message(messageJSONObject);
  await msg.edit('Edited message');

  // Verify that the object's fields reflect the JSON response
  expect(msg.id).toBe('699076792958320725');
  expect(msg.type).toBe(0);
  expect(msg.content).toBe('Edited message');
  // todo...
  expect(scope.isDone()).toBe(true);
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
  const msg = new Message(messageJSONObject);
  await expect(msg.edit('Edited message')).rejects
      .toThrow(EditNotOwnMessageError);

  // Verify that the object's fields have not changed
  expect(msg.id).toBe('699067552697155634');
  expect(msg.type).toBe(0);
  expect(msg.content).toBe('sugoi');
  // todo...
});
