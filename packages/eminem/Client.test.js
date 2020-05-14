const nock = require('nock');
const WebSocketMocked = require('ws');
const WebSocket = jest.requireActual('ws');
const Client = require('./Client');
const Message = require('./Message');
const Channel = require('./Channel');

jest.mock('ws');
WebSocketMocked.mockImplementation((url, ...args) => {
  return new WebSocket('ws://localhost:8080', ...args);
});

const getGatewayResponse = `\
{
  "url": "wss://gateway.discord.gg",
  "shards": 1,
  "session_start_limit": {
    "total": 1000,
    "remaining": 990,
    "reset_after": 55998843
  }
}
`;

const getUserResponse = `\
`;

const getChannelResponse = `\
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
`;

const getMessageResponse = `\
`;

const messageCreateGateway = `\
{
  "t": "MESSAGE_CREATE",
  "s": 3,
  "op": 0,
  "d": {
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
    "nonce": null,
    "guild_id":"696525324451577936",
    "member": {
      "roles":[],
      "mute":false,
      "joined_at": "2020-04-06T01:03:07.384000+00:00",
      "hoisted_role": null,
      "deaf": false
    }
  }
}
`;

const messageUpdateGateway = `\
{
  "t": "MESSAGE_UPDATE",
  "s": 4,
  "op":0,
  "d": {
    "id": "699076792958320725",
    "type": 0,
    "content": "Edited!",
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
    "edited_timestamp": "2020-04-19T09:15:05.247030+00:00",
    "flags": 0,
    "nonce": null,
    "guild_id":"696525324451577936",
    "member": {
      "roles":[],
      "mute":false,
      "joined_at": "2020-04-06T01:03:07.384000+00:00",
      "hoisted_role": null,
      "deaf": false
    }
  }
}
`;

const messageDeleteGateway = `\
{
  "t": "MESSAGE_DELETE",
  "s": 5,
  "op": 0,
  "d": {
    "id": "699076792958320725",
    "channel_id": "696525324451577939",
    "guild_id": "696525324451577936"
  }
}
`;

const messageDeleteBulkGateway = `\
`;

const messageReactionAddGateway = `\
`;

const messageReactionRemoveGateway = `\
`;

const messageReactionRemoveAllGateway = `\
`;

const messageReactionRemoveEmojiGateway = `\
`;

// Mock Discord Gateway API
const wss = new WebSocket.Server({port: 8080});
wss.mock = {};
wss.on('connection', (ws) => {
  wss.mock.connected = true;
  wss.mock.ws = ws;
  ws.on('message', (message) => {
    const json = JSON.parse(message);
    if (json.op === 2) {
      wss.mock.identifyMessage = json;
    }
  });
  ws.send(`\
{
  "op": 10,
  "d": {
    "heartbeat_interval": 45000
  }
}
`,
  );
});

afterAll(() => {
  nock.restore();
  wss.close();
});

describe('Client.prototype.login', () => {
  test('successful, event handlers', async () => {
    // Mock Get Gateway HTTP endpoint
    const scope = nock('https://discordapp.com/api', {
      reqheaders: {
        authorization: /Bot \S+$/,
      },
    })
        .persist()
        .get('/gateway/bot')
        .reply(200, getGatewayResponse, {
          'content-type': 'application/json',
        })
        .get('/channels/696525324451577939')
        .reply(200, getChannelResponse, {
          'content-type': 'application/json',
        });

    const events = [
      'messageCreate',
      'messageUpdate',
      'messageDelete',
      'messageDeleteBulk',
      'messageReactionAdd',
      'messageReactionRemove',
      'messageReactionRemoveAll',
      'messageReactionRemoveEmoji',
    ];
    const spies = {};
    for (const event of events) {
      spies[event] = jest.fn();
    }

    const client = new Client();
    for (const event of events) {
      client.on(event, spies[event]);
    }

    const token = '9F*#hfh8.acIm#(j';
    await client.login(token);
    expect(wss.mock.connected).toBe(true);
    expect(wss.mock.identifyMessage.d.token).toBe(token);
    expect(wss.mock.identifyMessage.d.properties).toBeTruthy();
    expect(wss.mock.identifyMessage.d.properties['$os']).toBeTruthy();
    expect(wss.mock.identifyMessage.d.properties['$browser']).toBeTruthy();
    expect(wss.mock.identifyMessage.d.properties['$device']).toBeTruthy();

    // Message Create
    wss.mock.ws.send(messageCreateGateway);
    expect(spies.messageCreate.mock.calls.length).toBe(1);
    expect(spies.messageCreate.mock.calls[0].length).toBe(1);
    expect(spies.messageCreate.mock.calls[0][0] instanceof Message).toBe(true);
    const message = JSON.parse(messageCreateGateway).d;
    expect(spies.messageCreate.mock.calls[0][0]).toEqual(new Message(message));

    // Message Update
    wss.mock.ws.send(messageUpdateGateway);
    expect(spies.messageUpdate.mock.calls.length).toBe(1);
    expect(spies.messageUpdate.mock.calls[0].length).toBe(1);
    expect(spies.messageUpdate.mock.calls[0][0] instanceof Message).toBe(true);
    const message1 = JSON.parse(messageUpdateGateway).d;
    expect(spies.messageCreate.mock.calls[0][0]).toEqual(new Message(message1));

    // Message Delete
    wss.mock.ws.send(messageDeleteGateway);
    expect(spies.messageDelete.mock.calls.length).toBe(1);
    expect(spies.messageDelete.mock.calls[0].length).toBe(1);
    const message2 = JSON.parse(messageDeleteGateway).d;
    expect(spies.messageDelete.mock.calls[0][0]).toMatchObject({
      id: message2.id,
      channel: new Channel(JSON.parse(getChannelResponse)),
    });

    // Message Delete Bulk
    spies.messageDelete.mockClear();
    wss.mock.ws.send(messageDeleteBulkGateway);
    const message3 = JSON.parse(messageDeleteBulkGateway).d;
    expect(spies.messageDelete.mock.calls.length).toBe(message3.ids.length);
    for (let i = 0; i < spies.messageDelete.mock.calls.length; i++) {
      const call = spies.messageDelete.mock.calls[i];
      expect(call.length).toBe(1);
      expect(call[0]).toMatchObject({
        id: message3.ids[i],
        channel: new Channel(JSON.parse(getChannelResponse)),
      });
    }

    // Message Reaction Add
    wss.mock.ws.send(messageReactionAddGateway);
    expect(spies.messageReactionAdd.mock.calls.length).toBe(1);
    expect(spies.messageReactionAdd.mock.calls[0].length).toBe(1);
    const message4 = JSON.parse(messageReactionAddGateway).d;
    expect(spies.messageReactionAdd.mock.calls[0][0]).toMatchObject({
      user: new User(JSON.parse(getUserResponse)),
      message: new Message(JSON.parse(getMessageResponse)),
      emoji: {
        id: message4.emoji.id,
        name: message4.emoji.name,
      },
    });

    // Message Reaction Remove
    wss.mock.ws.send(messageReactionRemoveGateway);
    expect(spies.messageReactionRemove.mock.calls.length).toBe(1);
    expect(spies.messageReactionRemove.mock.calls[0].length).toBe(1);
    const message5 = JSON.parse(messageReactionRemoveGateway).d;
    expect(spies.messageReactionRemove.mock.calls[0][0]).toMatchObject({
      user: new User(JSON.parse(getUserResponse)),
      message: new Message(JSON.parse(getMessageResponse)),
      emoji: {
        id: message5.emoji.id,
        name: message5.emoji.name,
      },
    });

    // Message Reaction Remove All
    wss.mock.ws.send(messageReactionRemoveAllGateway);
    expect(spies.messageReactionRemoveAll.mock.calls.length).toBe(1);
    expect(spies.messageReactionRemoveAll.mock.calls[0].length).toBe(1);
    expect(spies.messageReactionRemoveAll.mock.calls[0][0]).toMatchObject({
      message: new Message(JSON.parse(getMessageResponse)),
    });

    // Message Reaction Remove Emoji
    wss.mock.ws.send(messageReactionRemoveEmojiGateway);
    expect(spies.messageReactionRemoveEmoji.mock.calls.length).toBe(1);
    expect(spies.messageReactionRemoveEmoji.mock.calls[0].length).toBe(1);
    const message7 = JSON.parse(messageReactionRemoveEmojiGateway).d;
    expect(spies.messageReactionRemoveEmoji.mock.calls[0][0]).toMatchObject({
      message: new Message(JSON.parse(getMessageResponse)),
      emoji: {
        id: message7.emoji.id,
        name: message7.emoji.name,
      },
    });

    expect(scope.isDone()).toBe(true);
  });

  test('bad token', async () => {
  });

  test('heartbeat response', async () => {
  });

  test('connection interruption', async () => {
  });
});
