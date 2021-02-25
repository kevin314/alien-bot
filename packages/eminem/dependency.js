const User = require('./User');

function createUser(authorJSON, client) {
  return new User(authorJSON, client);
}

module.exports = {createUser};
