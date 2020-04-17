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

class DeleteDeletedMessageError extends Error {
  constructor() {
    super();
    this.name = 'DeleteDeletedMessageError';
    this.message = 'You cannot delete a message that has already been deleted.';
  }
}

module.exports = {
  EditDeletedMessageError,
  EditNotOwnMessageError,
  EditBlankMessageError,
  DeleteDeletedMessageError,
};
