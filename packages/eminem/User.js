/* eslint-disable valid-jsdoc */

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
    return this.client.sendDM(this, message, filepath);
  }

  /**
   * Create a DM channel with this user
   */
  createDM() {}
}

module.exports = User;
