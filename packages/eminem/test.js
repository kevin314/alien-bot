const Client = require('./Client');
const {list} = require('./data');
const {getChannel} = require('./requests');

async function main() {
  const botToken = 'Njk2NTE5NTkzMzg0MjE0NTI4.Xop6aw.pdmiSQ65BvMptKQiwWmmCILjXE4';
  const client = new Client();
  await client.login(botToken);
  list.channels['696525324451577939'] = new Channel(await getChannel('696525324451577939', botToken));
  list.channels['696525324451577939'].send('venti come home beautiful');

  client.on('message', (message) => {
    const idx = message.content.indexOf('im ');
    if (idx !== -1) {
      message.channel.send(`hi ${message.content.slice(idx+3)}, im button`);
    }
    //  message.channel.send(`hi ${message.user.username}`);
  });
}

main();

module.exports = {getChannel};
