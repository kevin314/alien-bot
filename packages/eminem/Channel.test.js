const nock = require('nock');
const Channel = require('./Channel');
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
const channelJSONObject = JSON.parse(`
{
  "id": "696525324451577939",
  "last_message_id": "701244061142745151",
  "type": 0,
  "name": "wow",
  "position": 0,
  "parent_id": "696525324451577937",
  "topic": "cool channel",
  "guild_id": "696525324451577936",
  "permission_overwrites": [],
  "nsfw": false,
  "rate_limit_per_user": 0
}
`);
afterAll(() => {
  nock.restore();
});

describe('Channel.prototype.send', () => {
  test('Non-empty text, include embed, include filepath', async () => {
    const scope = nock('https://discordapp.com/api', {
      reqheaders: {
        authorization: /Bot \S+$/,
      },
    })
        .post('/channels/696525324451577939/messages')
        .reply(200, botOriginalMsg);

    const client = {me: {id: '696519593384214528'}};
    const channel = new Channel(channelJSONObject, client, {});
    const msg = await channel.send('Hello World!', embedObject,
        'C:\Riot Games\League of Legends\Game\BugSplat.dll');
    expect(msg.content).toBe('Hello World!');
    expect(scope.isDone()).toBe(true);
  });

  test('only whitespaces/newlines, empty embed, no filepath', async () => {
    // Throws error if a request is made
    const scope = nock('https://discordapp.com'); // eslint-disable-line no-unused-vars

    const client = {me: {id: '696519593384214528'}};
    const channel = new Channel(channelJSONObject, client, {});
    await expect(channel.send('', {})).rejects
        .toThrow(CreateBlankMessageError);
  });
});
