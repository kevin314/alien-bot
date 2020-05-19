/**
 * A thin wrapper around a Generic bot's command object.
 */
class Bot {
  /**
   * @param {Object} config
   * @param {Client} [client] Instance of a Discord API client
   */
  constructor(config, client) {}

  /**
   * Call Discord's Channel Create Message endpoint.
   * @param {Command} command
   */
  addCommand(command) {}
}

module.exports = Bot;
