const Handlebars = require('handlebars');
const fs = require('fs');

module.exports = function(path, context, callback) {
  fs.stat(path, (err, stats) => {
    if (err) {
      /* TODO: Check what this error looks like */
      callback(err)
    }
    else if (stats.isDirectory()) {
      callback('Requested template is a directory')
    }
    else {
      var fileStream = fs.createReadStream(path);
      var htmlString = '';
      fileStream.on('data', (chunk) => {
        htmlString += chunk;
      });
      fileStream.on('end', () => {
        /* TODO: Do I have to catch errors in here? */
        var template = Handlebars.compile(htmlString);
        callback(null, template(context))
      });
    }
  });
};
