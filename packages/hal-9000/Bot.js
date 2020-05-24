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
   * Connect the bot to Discord.
   * @param {String} botToken
   */
  login(botToken) {}

  /**
   * Add a top-level command.
   * @param {Command} command
   */
  addCommand(command) {}

  /**
   * Disconnect the bot from Discord.
   */
  logout() {}
}

module.exports = Bot;
