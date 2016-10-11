const http = require('http');
const fs = require('fs');
const Handlebars = require('handlebars');
const loader = require('./modules/dataLoader.js');

http.createServer(function(request, response) {
  request.on('error', function(err) {
    console.error(err);
    response.statusCode = 400;
    response.end();
  });
  response.on('error', function(err) {
    console.error(err);
  });

  if (request.method === 'GET' && request.url === '/') {
    const path = './views/index.html';
    fs.stat(path, (err, stats) => {
      if (err)
        response.end('<h4>Sorry, I could not find your file</h4>');
      else {
        var fileStream = fs.createReadStream(path);
        var htmlString = '';
        fileStream.on('data', (chunk) => {
          htmlString += chunk;
        });
        fileStream.on('end', () => {
          var template = Handlebars.compile(htmlString);

          var resList = loader.all_habits((err, resList) => {
            if (err)
              response.statusCode = 404;
            var result = template(resList);
            response.end(result);
          });
        });
      }
    });
  } else {
    response.statusCode = 404;
    response.end();
  }
}).listen(8080);
