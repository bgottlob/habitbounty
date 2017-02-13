const Handlebars = require('handlebars');
const fs = require('fs');

module.exports = function(path, context, callback) {
  fs.stat(path, (err, stats) => {
    if (err) {
      callback(err)
    }
    else if (stats.isDirectory()) {
      callback('Requested template is a directory')
    }
    else {
      let fileStream = fs.createReadStream(path);
      let htmlString = '';
      fileStream.on('data', (chunk) => {
        htmlString += chunk;
      });
      fileStream.on('end', () => {
        let template = Handlebars.compile(htmlString);
        callback(null, template(context))
      });
    }
  });
};
