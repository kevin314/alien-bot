const https = require('https');
/**
 * A thin wrapper around a Discord message JSON object.
 */
class Message {
  /**
   * @param {Object} JSONObject Discord JSON message object
   * @param {Channel} channel
   * @param {User} user Instance of a Discord API client
   */
  constructor(JSONObject, channel, user, client) {
    this.id = JSONObject['id'];
    this.content = JSONObject['content'];
    this.channel = channel;
    this.user = user;
    this.client = client;
  }

  /**
   * Edit the content of a message.
   * @param {String} content New message text
   */
  async edit(content, embed) {
    let messageJSON;
    if (embed) {
      messageJSON = embed;
    } else if (content) {
      messageJSON = {
        'content': content,
      };
    }
    const postData = JSON.stringify(messageJSON);

    const scope = {
      method: 'PATCH',
      host: 'discord.com',
      port: '443',
      path: `/api/v8/channels/${this.channel.id}/messages/${this.id}`,
      headers: {
        'Authorization': `Bot ${this.client.botToken}`,
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
      },
    };

    const messageJSONObject = await new Promise((resolve, reject) => {
      const request = https.request(scope, (res) => {
        //console.log(`statusCode: ${res.statusCode}`);
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

    this.content = messageJSONObject['content'];
  }

  /**
   * Delete the message from Discord.
   */
  delete() {}

  /**
   * @see {@link Channel.prototype.send}
   */
  async reply(...args) {}
}

module.exports = Message;
