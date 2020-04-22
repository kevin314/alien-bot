/**
 * A thin wrapper around a Discord message JSON object.
 */
class Channel {
  /**
   * @param {Object} channelJsonObject Discord JSON channel object
   * @param {Client} client Instance of a Discord API client
   */
  constructor(jsonObject, client) {}

  /**
   * Call Discord's Channel Create Message endpoint.
   * @param {String} text Message to be sent
   * @param {String} filepath Path to a local file
   */
  send(text, filepath) {}
}

module.exports = Channel;
