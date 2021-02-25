/* eslint-disable valid-jsdoc */

/**
 * A thin wrapper around a Discord message JSON object.
 */
class Channel {
  /**
   * @param {Object} channelJsonObject Discord JSON channel object
   * @param {User} client Instance of a Discord API client
   */
  constructor(channelJsonObject, client) {
    this.id = channelJsonObject['id'];
    this.client = client;
    this.channelJsonObject = channelJsonObject;
  }

  /**
   * Call Discord's Channel Create Message endpoint.
   * @param {String} content Message to be sent
   * @param {String} file Path to a local file
   * @param {String} embed
   * @return {Promise}
   */
  send(content, file, embed) {
    return this.client.sendChannel(this, content, file, embed);
  }
}

module.exports = Channel;
