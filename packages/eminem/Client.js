const EventEmitter = require('events');

/**
 * Discord API client
 */
class Client extends EventEmitter {
  /**
   * Connect to the Discord API. Must be called to receive/create messages.
   * @param {String} botToken Authorization token for the bot
   */
  login(botToken) {}

  /**
   * Await a message reply from a specified user.
   * @param {User} user Wait on this user's response
   * @param {Channel} channel Look for user's response in this channel
   * @param {Number} timeout Seconds of no response until timeout
   */
  waitResponse(user, channel, timeout) {}

  /**
   * Disconnect from the Discord Gateway API.
   */
  disconnect() {}
}

module.exports = Client;
