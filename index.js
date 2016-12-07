const http = require('http');
const loader = require('./modules/dataLoader.js');
const logCoder = require('./modules/logCoder');
const Router = require('./modules/router.js')
const ecstatic =  require('ecstatic');
const templateHandler = require('./modules/templateHandler.js');
const Habit = require('./modules/habit.js');

var router = new Router();
var fileServer = ecstatic({root: __dirname + '/public'});

/* Compile and serve the HTML for the home page, a list of all habits
 * in the system */
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

/* Return a list of all habits in JSON for any client to consume */
router.add('GET', /^\/all-habits$/, (request, response) => {
  loader.allHabits((err, results) => {
    if (err) {
      response.statusCode = 404;
      response.end(JSON.stringify(err));
    } else {
      response.end(JSON.stringify(results));
    }
  });
});

router.add('GET', /^\/habit\/(\w+)/, (request, response, docId) => {
  loader.getHabit(docId, (err, doc) => {
    if (err) {
      response.statusCode = 404;
      response.end(JSON.stringify(err));
    } else
      response.end(JSON.stringify(doc));
  });
});

router.add('POST', /^\/complete-habit\/(\w+)/, (request, response, docId) => {
  loader.getHabit(docId, (err, doc) => {
    if (err) {
      response.statusCode = 404;
      response.end(JSON.stringify(err));
    } else {
      /* Assuming the client doesn't send anything to the server -- the server
       * must figure out the time to complete this */
      var habit = new Habit(doc.name, doc.reward, logCoder.decodeLog(doc.log));
      habit.complete();
      loader.updateHabit(Object.assign(doc, habit.toDoc()), (err, result) => {
        if (err) {
          response.statusCode = 400;
          response.end(JSON.stringify(err));
        }
        else response.end(JSON.stringify(result));
      });
    }
  });
});

/* Update basic info about a habit -- but not the log -- never trust the client
 * Ignores everything in the request body except for the name and reward */
router.add('POST', /^\/info-habit\/(\w+)/, (request, response, docId) => {
  loader.getHabit(docId, (err, doc) => {
    if (err) {
      response.statusCode = 404;
      response.end(JSON.stringify(err));
    } else {
      /* TODO: Coerce the types of the body arguments to check for potential
       * errors there; also check if the arguments exist */
      /* TODO: Maybe just always pass these arguments to the Habit constructor
       * so that the Habit prototype can handle santization of the data */
      const updatedDoc = Object.assign(doc, {
        name: String(request.body.name),
        reward: Number(request.body.reward)
      });
      loader.updateHabit(updatedDoc, (err, result) => {
        if (err) {
          response.statusCode = 400;
          response.end(JSON.stringify(err));
        }
        else response.end(JSON.stringify(result));
      });
    }
  });
});

router.add('PUT', /^\/habit$/, (request, response) => {
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
