const http = require('http');
const loader = require('./modules/dataLoader.js');
const Router = require('./modules/router.js')
const ecstatic =  require('ecstatic');
const templateHandler = require('./modules/templateHandler.js');

var router = new Router();
var fileServer = ecstatic({root: __dirname + '/public'});

router.add('GET', /^\/$/, (request, response) => {
  var path = 'views/index.html';
  loader.allHabits((err, results) => {
    if (err) {
      console.log(err);
      const context = { error: 'Your habits could not be loaded :(' };
      templateHandler(path, context, (err, html) => {
        if (err) {
          response.statusCode = 404; /* Is this an appropriate code? */
          response.end('<h4>404 Error: Page not found</h4>');
        } else {
          response.end(html);
        }
      });
    } else {
      const context = { habits: results };
      templateHandler(path, context, (err, html) => {
        if (err) {
          response.statusCode = 404; /* Is this an appropriate code? */
          response.end('<h4>404 Error: Page not found</h4>');
        } else {
          response.end(html);
        }
      });
    }
  });
});

router.add('POST', /^\/habit/, (request, response) => {
  console.log(request.body);
  loader.createHabit(request.body.title, request.body.reward);
});

http.createServer(function(request, response) {
  var body = [];
  request.on('data', (chunk) => {
    /* Build body of request based on incoming data chunks */
    body.push(chunk);
  }).on('end', () => {
    /* When there are no more data chunks, turn data into a string
     * and set to the request body property */
    if (body.length > 0) {
      console.log('tryna parse');
      body = Buffer.concat(body).toString();
      request.body = JSON.parse(body);
    }
    /* Hand request off to the router */
    if (!router.resolve(request, response)) {
      fileServer(request, response);
    }
  });
}).listen(8080);
