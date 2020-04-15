/**
 * A thin wrapper around a Discord user JSON object.
 */
class User {
  /**
   * @param {*} jsonObject Discord JSON user object
   */
  constructor(jsonObject) {}

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
