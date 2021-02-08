const EventEmitter = require('events');
const WebSocket = require('ws');
const https = require('https');
const Message = require('./Message');
const Channel = require('./Channel');
const User = require('./User');
// const {list, getChannel} = require('./test');

/**
 * Discord API client
 */
class Client extends EventEmitter {
  constructor(botToken) {
    super();
    this.botToken = botToken;
  }
  /**
   * Connect to the Discord API. Must be called to receive/create messages.
   * @param {String} botToken Authorization token for the bot
   */
  async login() {
    const scope = {
      method: 'GET',
      host: 'discord.com',
      port: '443',
      path: '/api/v8/gateway/bot',
      headers: {
        'Authorization':
          `Bot ${this.botToken}`,
      },
    };

    const responseData = await new Promise((resolve, reject) => {
      const request = https.request(scope, (res) => {
        // console.log(`URL statusCode: ${res.statusCode}`);
        let response = '';
        res.on('data', (d) => {
          response += d.toString();
        });
        res.on('end', () => {
          resolve(JSON.parse(response));
        });
      });
      request.on('error', (error) => {
        reject(error);
      });
      request.end();
    });

    this.ws = new WebSocket(responseData['url']);

    const heartbeat = () => {
      this.ws.send(JSON.stringify({
        op: 1,
        d: null,
      }));
    };

    this.ws.on('open', () => {
      this.connected = true;
    });

    this.ws.on('message', async (data) => {
      const response = JSON.parse(data);
      const opcode = response['op'];

      if (opcode == 10) {
        const heartbeatInterval = response['d']['heartbeat_interval'];
        heartbeat();
        this.heart = setInterval(heartbeat, heartbeatInterval);

        this.ws.send(JSON.stringify({
          op: 2,
          d: {
            token: this.botToken,
            properties: {
              $os: 'windows',
              $browser: 'eminem',
              $device: 'eminem',
            },
            intents: 13825,
          }}));
      } else if (opcode == 11) {
        // console.log('Hearbeat ACK');
      } else if (opcode == 0) {
        // console.log('Dispatch');
        if (response['t'] == 'MESSAGE_CREATE') {
          // console.log('Message recieved');
          if (response['d']['author']['id'] !== this.id) {
            this.emit('message', new Message(response['d'], new Channel({'id': response['d']['channel_id']}, this.botToken),
                new User(response['d']['author'])));
          }
        } else if (response['t'] == 'READY') {
          this.id = response['d']['user']['id'];
        }
      }
    });
  }
  /**
   * Await a message reply from a specified user.
   * @param {User} user Wait on this user's response
   * @param {Channel} channel Look for user's response in this channel
   * @param {Number} timeout Seconds of no response until timeout
   */
  waitResponse(user, channel, timeout) {
  }

  /**
   * Disconnect from the Discord Gateway API.
   */
  disconnect() {
    clearInterval(this.heart);
    this.ws.close();
  }
}

module.exports = Client;
