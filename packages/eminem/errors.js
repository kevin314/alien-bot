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

class EditBlankMessageError extends Error {
  constructor() {
    super();
    this.name = 'EditBlankMessageError';
    this.message = 'You cannot edit a message to be blank.';
  }
}

module.exports = {
  EditDeletedMessageError,
  EditNotOwnMessageError,
  EditBlankMessageError,
};
