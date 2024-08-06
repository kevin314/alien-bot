const EventEmitter = require('events');
const WebSocket = require('ws');
const https = require('https');
const Bottleneck = require('bottleneck');
const FormData = require('form-data');
const fs = require('fs');
const Message = require('./Message');
const Channel = require('./Channel');
const User = require('./User');
// const {list, getChannel} = require('./test');

const limiters = {};
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
            this.emit('message', new Message(response['d'], new Channel({'id': response['d']['channel_id']}, this),
                new User(response['d']['author'], this), this));
          }
        } else if (response['t'] == 'READY') {
          this.id = response['d']['user']['id'];
        }
      }
    });
  }

  async sendDM(user, message, filepath, embed) {
    const getDMChannelJSON = {
      recipient_id: user.id,
    };
    const postData = JSON.stringify(getDMChannelJSON);
    const scope = {
      method: 'POST',
      host: 'discord.com',
      port: '443',
      path: '/api/v8/users/@me/channels',
      headers: {
        'Authorization': `Bot ${this.botToken}`,
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
      },
    };
    const channelJSONObject = await new Promise((resolve, reject) => {
      const request = https.request(scope, (res) => {
        let response = '';
        res.on('data', (d) => {
          response += d.toString();
        });
        res.on('end', () => {
          resolve(JSON.parse(response));
        });
      });
      request.on('error', (err) => {
        reject(err);
      });
      request.write(postData);
      request.end();
    });

    const DMchannel = new Channel(channelJSONObject, this);
    return await DMchannel.send(message, filepath, embed);
  }

  sendChannel(channel, content, file, embed) {
    const form = new FormData();
    if (content != undefined) {
      form.append('content', content);
    }
    if (embed != undefined) {
      form.append('payload_json', embed);
    }
    if (file != undefined) {
      if (typeof file === 'string') {
        form.append('file', fs.createReadStream(file));
      } else {
        form.append('file', file, {filename: 'image.png'});
      }
    }

    if (!limiters[channel.id]) {
      const limiter = new Bottleneck({
        minTime: 1000,
      });
      let timeout;
      limiter.on('error', (error) => {
        console.log(error);
      });
      limiter.on('empty', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (limiter.empty()) {
            delete limiters[channel.id];
          }
        }, 5000);
      });
      limiters[channel.id] = limiter;
    }

    return new Promise((resolve, reject) => {
      limiters[channel.id].submit(
          form.submit.bind(form),
          {
            protocol: 'https:',
            port: '443',
            host: 'discord.com',
            path: `/api/v8/channels/${channel.id}/messages`,
            headers: {'Authorization': `Bot ${this.botToken}`},
          },
          (err, res) => {
            if (err) {
              console.log(err);
            }
            let response = '';
            res.on('data', (d) => {
              if (!(200 <= res.statusCode && res.statusCode < 300)) {
                process.stdout.write(d);
              }
              response += d.toString();
            });

            res.on('end', () => {
              const parsedResponse = JSON.parse(response);
              resolve(new Message(parsedResponse, channel, new User(parsedResponse['author'], this), this));
            });
          },
      );
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
