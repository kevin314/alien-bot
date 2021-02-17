const Bottleneck = require('bottleneck');
const FormData = require('form-data');
const fs = require('fs');

const limiters = {};
/**
 * A thin wrapper around a Discord message JSON object.
 */
class Channel {
  /**
   * @param {Object} channelJsonObject Discord JSON channel object
   * @param {User} client Instance of a Discord API client
   */
  constructor(channelJsonObject, client) {
    this.id = channelJsonObject['id'];
    this.client = client;
  }

  /**
   * Call Discord's Channel Create Message endpoint.
   * @param {String} content Message to be sent
   * @param {String} file Path to a local file
   * @param {String} embed
   * @return {Promise}
   */
  send(content, file, embed) {
    const form = new FormData();
    if (content != undefined) {
      form.append('content', content);
    }
    if (embed != undefined) {
      form.append('embed', embed);
    }
    if (file != undefined) {
      if (typeof file === 'string') {
        form.append('file', fs.createReadStream(file));
      } else {
        form.append('file', file, {filename: 'image.png'});
      }
    }

    if (!limiters[this.id]) {
      const limiter = new Bottleneck({
        minTime: 1000,
      });
      let timeout;
      limiter.on('error', (error) => {
        console.log(error);
      });
      limiter.on('empty', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (limiter.empty()) {
            delete limiters[this.id];
          }
        }, 5000);
      });
      limiters[this.id] = limiter;
    }

    return new Promise((resolve, reject) => {
       limiters[this.id].submit(
          form.submit.bind(form),
          {
            protocol: 'https:',
            port: '443',
            host: 'discord.com',
            path: `/api/v8/channels/${this.id}/messages`,
            headers: {'Authorization': `Bot ${this.client.botToken}`},
          },
          function(err, res) {
            if (err) {
              console.log(err);
            }
            res.on('data', (d) => {
              if (!(200 <= res.statusCode && res.statusCode < 300)) {
                process.stdout.write(d);
              }
            });
            res.on('end', resolve);
          },
      );
    });
  }
}

module.exports = Channel;
