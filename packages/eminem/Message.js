/**
 * A thin wrapper around a Discord message JSON object.
 */
class Message {
  /**
   * @param {Object} JSONObject Discord JSON message object
   * @param {Channel} channel
   * @param {User} user Instance of a Discord API client
   */
  constructor(JSONObject, channel, user) {
    this.content = JSONObject['content'];
    this.channel = channel;
    this.user = user;
  }

  /**
   * Edit the content of a message.
   * @param {String} message New message text
   */
  edit(message) {}

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
