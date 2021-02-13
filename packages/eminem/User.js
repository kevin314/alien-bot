/* eslint-disable valid-jsdoc */
const https = require('https');
const Channel = require('./Channel');

/**
 * A thin wrapper around a Discord user JSON object.
 */
class User {
  /**
   * @param {Object} authorJSON Discord JSON user object
   * @param {Client} client
   */
  constructor(authorJSON, client) {
    this.id = authorJSON['id'];
    this.username = authorJSON['username'];
    this.client = client;
  }

  /**
   * Create a DM channel and call the channel's send method.
   * @param {String} message Message to be sent
   * @param {String} filepath Path to a local file
   */
  async send(message, filepath) {
    // console.log(this.id);
    const getDMChannelJSON = {
      recipient_id: this.id,
    };
    const postData = JSON.stringify(getDMChannelJSON);
    // console.log(postData);
    const scope = {
      method: 'POST',
      host: 'discord.com',
      port: '443',
      path: '/api/v8/users/@me/channels',
      headers: {
        'Authorization': `Bot ${this.client.botToken}`,
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
      },
    };
    const channelJSONObject = await new Promise((resolve, reject) => {
      const request = https.request(scope, (res) => {
        // console.log(`getUser statusCode: ${res.statusCode}`);
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

    const DMchannel = new Channel(channelJSONObject, this.client);
    if (message) {
      await DMchannel.send(message, filepath);
    }
    return DMchannel;
  }

  /**
   * Create a DM channel with this user
   */
  createDM() {}
}

module.exports = User;
