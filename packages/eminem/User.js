/**
 * A thin wrapper around a Discord user JSON object.
 */
class User {
  /**
   * @param {Object} userJsonObject Discord JSON user object
   * @param {Client} client Instance of a Discord API client
   */
  constructor(userJsonObject, client) {}

  /**
   * Create a DM channel and call the channel's send method.
   * @param {String} message Message to be sent
   * @param {String} filepath Path to a local file
   */
  send(message, filepath) {}

  /**
   * Create a DM channel with this user
   */
  createDM() {}
}

module.exports = User;
