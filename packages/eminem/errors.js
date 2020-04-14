/* eslint-disable require-jsdoc */

class EditDeletedMessageError extends Error {
  constructor() {
    super();
    this.name = 'EditDeletedMessageError';
    this.message = 'You cannot edit a message that has been deleted.';
  }
}

class EditNotOwnMessageError extends Error {
  constructor() {
    super();
    this.name = 'EditNotOwnMessageError';
    this.message = 'You cannot edit a message that someone else authored.';
  }
}

module.exports = {
  EditDeletedMessageError,
  EditNotOwnMessageError,
};
