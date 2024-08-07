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
    if (authorJSON['bot']) {
      this.bot = true;
    } else {
      this.bot = false;
    }
    this.username = authorJSON['username'];
    this.client = client;
  }

  /**
   * Create a DM channel and call the channel's send method.
   * @param {String} message Message to be sent
   * @param {String} filepath Path to a local file
   */
  async send(message, filepath, embed) {
    return this.client.sendDM(this, message, filepath, embed);
  }

  /**
   * Create a DM channel with this user
   */
  createDM() {}
}

module.exports = User;
