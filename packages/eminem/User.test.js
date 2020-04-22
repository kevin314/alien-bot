const nock = require('nock');
const User = require('./User');

const {
  CreateBlankMessageError,
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

const embedObject = JSON.parse(`
{
  "type": "rich",
  "title": "Hello, Embed!",
  "description": "This is an embedded message."
}
`);

const userJSONObject = JSON.parse(`
{
  "id": "195389898784636928",
  "username": "Keane",
  "avatar": "f4e1049a56f1a48714ec87dbea0d9c13",
  "discriminator": "8251",
  "public_flags": 0
}
`);

const dmChannelJson = `\
{
  "id": "701352125321576478",
  "last_message_id": null,
  "type": 1,
  "recipients": [
    {
      "id": "195389898784636928",
      "username": "Keane",
      "avatar": "f4e1049a56f1a48714ec87dbea0d9c13",
      "discriminator": "8251",
      "public_flags": 0
    }
  ]
}
`;

afterAll(() => {
  nock.restore();
});

describe('User.prototype.send', () => {
  test('Non-empty text, include embed, include filepath', async () => {
    const scope = nock('https://discordapp.com/api', {
      reqheaders: {
        authorization: /Bot \S+$/,
      },
    })
        .post('/users/@me/channels', {recipientId: '195389898784636928'})
        .reply(200, dmChannelJson)
        .post('/channels/701352125321576478/messages')
        .reply(200, botOriginalMsg);

    const client = {me: {id: '696519593384214528'}};
    const user = new User(userJSONObject, client);
    const msg = await user.send('Hello World!', embedObject,
        'C:\Riot Games\League of Legends\Game\BugSplat.dll');
    expect(msg.content).toBe('Hello World!');
    expect(msg.embed).toEqual(embedObject);
    expect(scope.isDone()).toBe(true);
  });

  test('no content, empty embed', async () => {
    // Throws error if a request is made
    const scope = nock('https://discordapp.com'); // eslint-disable-line no-unused-vars

    const client = {me: {id: '696519593384214528'}};
    const user = new User(userJSONObject, client);
    await expect(user.send('', {})).rejects.toThrow(CreateBlankMessageError);
  });

  test('only whitespaces/newlines, empty embed', async () => {
    // Throws error if a request is made
    const scope = nock('https://discordapp.com'); // eslint-disable-line no-unused-vars

    const client = {me: {id: '696519593384214528'}};
    const user = new User(userJSONObject, client);
    await expect(user.send('\n\t \n', {})).rejects
        .toThrow(CreateBlankMessageError);
  });
});
