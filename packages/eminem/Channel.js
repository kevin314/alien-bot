const Bottleneck = require('bottleneck');
const FormData = require('form-data');

const limiters = {};
/**
 * A thin wrapper around a Discord message JSON object.
 */
class Channel {
  /**
   * @param {Object} channelJsonObject Discord JSON channel object
   * @param {User} user Instance of a Discord API client
   */
  constructor(channelJsonObject, botToken) {
    this.id = channelJsonObject['id'];
    this.botToken = botToken;
  }

  /**
   * Call Discord's Channel Create Message endpoint.
   * @param {String} content Message to be sent
   * @param {String} embed
   * @param {String} filepath Path to a local file
   */
  send(content, embed, filepath) {
    const form = new FormData();
    if (content != undefined) {
      form.append('content', content);
    }
    if (embed != undefined) {
      form.append('embed', embed);
    }
    if (filepath != undefined) {
      form.append('file', file);
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

    limiters[this.id].submit(
        form.submit.bind(form),
        {
          protocol: 'https:',
          port: '443',
          host: 'discord.com',
          path: `/api/v8/channels/${this.id}/messages`,
          headers: {'Authorization': `Bot ${this.botToken}`},
        },
        function(err, res) {
          if (err) {
            console.log(`statusCode: ${res.statusCode}`);
            console.log(err);
          }
          res.on('data', (d) => {
            if (!(200 <= res.statusCode && res.statusCode < 300)) {
              process.stdout.write(d);
            }
          });
        },
    );
  }
}

module.exports = Channel;
