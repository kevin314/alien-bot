/**
 * A thin wrapper around a Discord message JSON object.
 */
class Message {
  /**
   * @param {Object} jsonObject Discord JSON message object
   * @param {Client} client
   * @param {Channel} channel
   */
  constructor(jsonObject, client, channel) {}

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
   * Send a message to the same channel of this message.
   * @param {String} message Message to be sent
   * @param {String} filepath Path to a local file
   */
  reply(message, filepath) {}
}

module.exports = Message;
