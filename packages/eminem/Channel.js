/**
 * A thin wrapper around a Discord message JSON object.
 */
class Channel {
  /**
   * @param {*} jsonObject Discord JSON channel object
   */
  constructor(jsonObject) {}

  /**
   * Call Discord's Channel Create Message endpoint.
   * @param {String} text Message to be sent
   * @param {String} filepath Path to a local file
   */
  send(text, filepath) {}
}

module.exports = Channel;
