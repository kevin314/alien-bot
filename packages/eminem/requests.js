const https = require('https');
async function getChannel(channelId, botToken) {
  console.log('Getting channel');
  const scope = {
    method: 'GET',
    host: 'discord.com',
    port: '443',
    path: `/api/v8/channels/${channelId}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bot ${botToken}`,
    },
  };

  return new Promise((resolve, reject) => {
    const request = https.request(scope, (res) => {
      console.log(`getChannel statusCode: ${res.statusCode}`);
      res.on('data', (d) => {
        console.log('Channel created');
        console.log(JSON.parse(d.toString()));
        resolve(JSON.parse(d.toString()));
      });
    });
    request.on('error', (err) => {
      reject(err);
    });
    request.end();
  });
}

async function getUser(userID) {
  console.log('Getting user');
  const scope = {
    method: 'GET',
    host: 'discord.com',
    port: '443',
    path: `/api/v8/users/${userID}`,
    headers: {
      'Authorization': `Bot ${botToken}`,
    },
  };

  return new Promise((resolve, reject) => {
    const request = https.request(scope, (res) => {
      console.log(`getUser statusCode: ${res.statusCode}`);
      res.on('data', (d) => {
        console.log('User created');
        console.log(JSON.parse(d.toString()));
        resolve(JSON.parse(d.toString()));
      });
    });
    request.on('error', (err) => {
      reject(err);
    });
    request.end();
  });
}


module.exports = {getChannel, getUser};
