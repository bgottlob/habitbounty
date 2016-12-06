const http = require('http');
const loader = require('./modules/dataLoader.js');
const Router = require('./modules/router.js')
const ecstatic =  require('ecstatic');
const templateHandler = require('./modules/templateHandler.js');
const Habit = require('./modules/habit.js');

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

router.add('POST', /^\/habit$/, (request, response) => {
  /* TODO: Catch potential issue -- name and reward must be present in
   * request -- maybe even find spurious attributes in JSON */
  var err = null;
  missing = [];
  if (!request.body.name)
    missing.push("name");
  if (!request.body.reward)
    missing.push("reward");

  if (missing.length > 0) {
    response.statusCode = 400;
    response.end(JSON.stringify({
      message: 'missing attribute(s) ' + missing.join(',')
    }));
  } else if (isNaN(request.body.reward)) {
    response.statusCode = 400;
    response.end(JSON.stringify({
      message: 'reward is not a number'
    }));
  } else {
    const habit = new Habit(request.body.name, request.body.reward);
    loader.createHabit(habit, (err, result) => {
      if (err) {
        response.statusCode = 400;
        response.end(JSON.stringify(err));
      } else {
        response.statusCode = 200;
        /* TODO: Make the result a JSON string */
        response.end(JSON.stringify(result));
      }
    });
  }
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
      body = Buffer.concat(body).toString();
      /* TODO: Catch error - server dies if JSON doesn't parse */
      request.body = JSON.parse(body);
    }
    /* Hand request off to the router */
    if (!router.resolve(request, response)) {
      fileServer(request, response);
    }
  });
}).listen(8080);
