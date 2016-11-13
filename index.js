const http = require('http');
const fs = require('fs');
const Handlebars = require('handlebars');
const loader = require('./modules/dataLoader.js');
const Router = require('./modules/router.js')
const ecstatic =  require('ecstatic');

var router = new Router();
var fileServer = ecstatic({root: './public'});

router.add('GET', /\//, (request, response) => {
  var path = 'views/index.html';
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
        loader.allHabits((resList) => {
          if (err)
            response.statusCode = 404;
          console.log('This is the res list in the callback');
          console.log(resList);
          var result = template(resList);
          response.end(result);
        });
      });
    }
  });
});

router.add('POST', /\/habit/, (request, response) => {
  console.log(request.body);
  loader.createHabit(request.body.title, request.body.reward);
});

http.createServer(function(request, response) {
  var body = [];
  request.on('data', (chunk) => {
    body.push(chunk);
  }).on('end', () => {
    if (body.length > 0) {
      console.log('tryna parse');
      body = Buffer.concat(body).toString();
      request.body = JSON.parse(body);
    }
    if (!router.resolve(request, response)) {
      fileServer(request, response);
    }
  });
}).listen(8080);
