/**
 * A thin wrapper around a Discord message JSON object.
 */
class Message {
  /**
   * @param {Object} messageJsonObject Discord JSON message object
   * @param {Client} client Instance of a Discord API client
   * @param {Channel} channel
   */
  constructor(messageJsonObject, client, channel) {}

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
