/**
 * A thin wrapper around a Generic bot's command object.
 */
class Command {
  /**
   * @param {String} name Discord JSON channel object
   * @param {String} helptext Instance of a Discord API client
   * @param {Function} callback If command is used with no subcommands
   */
  constructor(name, helptext, callback) {}

  /**
   * Call Discord's Channel Create Message endpoint.
   * @param {String} text Message to be sent
   * @param {String} filepath Path to a local file
   */
  send(text, filepath) {}
}

module.exports = Command;
