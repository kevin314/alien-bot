function parseMessage(text, commands) {
  if (text[0] === '!') {
    const commandArr = text.slice(1).split(' ');

    if (!commands.hasOwnProperty(commandArr[0])) {
      return;
    }

    let currCommand = commands[commandArr[0]];
    let i = 1;
    for (; i < commandArr.length; i++) {
      if (currCommand.hasOwnProperty('subs') && currCommand['subs'].hasOwnProperty(commandArr[i])) {
        currCommand = currCommand['subs'][commandArr[i]];
      } else {
        break;
      }
    }
    return {
      command: currCommand,
      textArgs: commandArr.slice(i),
    };
  }
}

module.exports = {parseMessage};
