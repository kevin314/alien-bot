const https = require('https');
async function getChannel(channelId, botToken) {
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
      res.on('data', (d) => {
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
      res.on('data', (d) => {
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
