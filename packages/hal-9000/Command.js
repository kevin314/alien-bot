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
   * Add a subcommand to this command. If the command passed in is already
   * a subcommand, nothing will happen.
   * @param {Command} command
   */
  addCommand(command) {}
}

module.exports = Command;
