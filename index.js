const http = require('http');
const ecstatic =  require('ecstatic');
const loader = require('./modules/dataLoader.js');
const Router = require('./modules/router.js')
const templateHandler = require('./modules/templateHandler.js');
const Balance = require('./modules/sharedLibs/balance.js');
require('./modules/sharedLibs/sharedLib.js');

const helpers = require('./modules/routeHelpers');
const simpleGET = helpers.simpleGET;
const respondBadReq = helpers.respondBadReq;
const validateRequest = helpers.validateRequest;

let router = new Router();

let fileServer = ecstatic({root: __dirname + '/public'});

/* For serving files that come from node modules */
let nodeModServer = ecstatic({root: __dirname + '/node_modules'});

/* For serving files that are shared between server and client code */
let sharedLibServer = ecstatic({root: __dirname + '/modules/sharedLibs'});

/* Compile and serve the client for the home page, a list of all habits
 * in the system */
router.add('GET', /^\/$/, function (request, response) {
  request.url = '/index.html';
  fileServer(request, response);
});

router.add('GET', /^\/docs$/, function (request, response) {
  request.url = '/hb_swagger.json';
  /* Necesary headers for use with Swagger UI */
  response.setHeader('Access-Control-Allow-Methods',
    'DELETE, POST, GET, OPTIONS, PUT');
  response.setHeader('Access-Control-Allow-Origin', '*');
  fileServer(request, response);
});

/* Serve a file from an npm module to the client */
router.add('GET', /^\/lib\/(.+)$/, function (request, response, filename) {
  /* Mapping of file names to their path relative to /node_modules */
  nodeModFiles = {
    'handlebars.min.js': '/handlebars/dist/handlebars.min.js',
    'milligram.min.css': '/milligram/dist/milligram.min.css',
    'normalize.css': '/normalize.css/normalize.css',
    'milligram.min.css.map': '/milligram/dist/milligram.min.css.map'
  };
  request.url = nodeModFiles[filename];
  if (!request.url) {
    response.statusCode = 404;
    response.end('File not found!');
  } else
    nodeModServer(request, response);
});

/* Serve a file that is shared by both client and server code filenames sent
 * to this route must be relative to /modules/sharedLibs */
router.add('GET', /^\/shared-lib\/(.+)$/, function (request, response, filename) {
  request.url = '/' + filename;
  sharedLibServer(request, response);
});

router.routes = router.routes.concat(
  require('./routes/habitRoutes').routes,
  require('./routes/expenseRoutes').routes,
  require('./routes/choreRoutes').routes,
  require('./routes/balanceRoutes').routes,
  require('./routes/taskRoutes').routes
);
http.createServer(function (request, response) {
  let body = [];
  request.on('data', function (chunk) {
    /* Build body of request based on incoming data chunks */
    body.push(chunk);
  }).on('end', function () {
    /* When there are no more data chunks, turn data into a string
     * and set to the request body property */
    if (body.length > 0) {
      body = Buffer.concat(body).toString();
      try {
        request.body = JSON.parse(body);
      } catch (e) {
        console.log('This body could not be parsed into JSON:\n' + body);
        request.body = {};
      }
    }
    /* Hand request off to the router */
    if (!router.resolve(request, response)) {
      fileServer(request, response);
    }
  });
}).listen(Number(process.argv[2]));
