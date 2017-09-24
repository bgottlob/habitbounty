const Router = require('../modules/router');
const loader = require('../modules/dataLoader');

const helpers = require('../modules/routeHelpers');
const simpleGET = helpers.simpleGET;
const respondBadReq = helpers.respondBadReq;
const validateRequest = helpers.validateRequest;

const Habit = require('lib/habit');

let router = module.exports = new Router();

/* Return a list of all habits in JSON for any client to consume */
router.add('GET', /^\/all-habits$/, function (request, response) {
  simpleGET(loader.allHabits(), response);
});

/* Return a list of active habits in JSON for any client to consume */
router.add('GET', /^\/active-habits$/, function (request, response) {
  simpleGET(loader.activeHabits(), response);
});

/* Return a list of active habits in JSON for any client to consume */
router.add('GET', /^\/archived-habits$/, function (request, response) {
  simpleGET(loader.archivedHabits(), response);
});

router.add('GET', /^\/habits-left\/(\d{4}-\d{2}-\d{2})$/,
  (request, response, dateStr) => {
    /* TODO: Verify the date string */
    simpleGET(loader.habitsLeft(dateStr), response);
  }
);

/* Get the info for a single habit given the habit's document id */
router.add('GET', /^\/habit\/(\w+)$/, function (request, response, id) {
  if (!id) respondBadReq(response, 'request must contain habit ID in path');
  else simpleGET(loader.getHabit(id), response);
});

/* Completes a habit: Adds the provided date array to the habit's log and
 * changes the balance appropriately */
router.add('POST', /^\/complete-habit$/, function (request, response) {
  const body = request.body;
  const invalidMsg = validateRequest(body, ['id', 'rev', 'date', 'set']);
  if (invalidMsg) {
    respondBadReq(response, invalidMsg);
  } else {
    loader.updateDoc(body.id, body.rev, (origDoc) => {
      let habit = Habit.fromDoc(origDoc);
      if (body.set) habit.complete(body.date);
      else habit.uncomplete(body.date);
      return Object.assign(origDoc, habit.toDoc());
    }).then(function (result) {
      /* Get latest updates to the habit doc and balance */
      return Promise.all([loader.getHabit(body.id), loader.balance()]);
    }).then(function (docs) {
      return response.end(JSON.stringify({
        habit: docs[0],
        balance: docs[1].balance
      }));
    }).catch(function (err) {
      console.log(err);
      response.statusCode = 400;
      return response.end(JSON.stringify(err));
    });
  }
});

router.add('POST', /^\/archive-habit$/, function (request, response) {
  const body = request.body;
  const invalidMsg = validateRequest(body, ['id', 'rev', 'archived']);
  if (invalidMsg) {
    respondBadReq(response, invalidMsg);
  } else {
    loader.updateDoc(body.id, body.rev, (origDoc) => {
      return Object.assign(origDoc, { archived: body.archived });
    }).then(function (result) {
      return loader.getHabit(body.id);
    }).then(function (result) {
      response.end(JSON.stringify(result));
    }).catch(function (err) {
      response.statusCode = 400;
      response.end(JSON.stringify(err));
    });
  }
});

/* TODO: DRY out these create routes */
/* Creates a new habit */
router.add('PUT', /^\/habit$/, function (request, response) {
  const body = request.body;
  const invalidMsg = validateRequest(body, ['name', 'amount']);
  if (invalidMsg) {
    respondBadReq(response, invalidMsg);
  } else {
    const habit = new Habit(body.name, body.amount);
    loader.createHabit(habit).then(function(result) {
      return loader.getHabit(result.id);
    }).then(function (result) {
      response.statusCode = 200;
      response.end(JSON.stringify(result));
    }).catch(function (err) {
      response.statusCode = 400;
      response.end(JSON.stringify(err));
    });
  }
});

/* Update basic info about a habit -- but not the log -- never trust the client
 * Ignores everything in the request body except for the name and amount */
router.add('POST', /^\/edit-habit$/, function (request, response) {
  const body = request.body;
  const invalidMsg = validateRequest(body, ['id', 'rev'], ['name', 'amount'],
    (b) => {
      if (typeof(b.name) === 'undefined' && typeof(b.amount) === 'undefined')
        return 'either name, amount, or both must be provided';
    }
  );
  if (invalidMsg) {
    respondBadReq(response, invalidMsg);
  } else {
    loader.updateDoc(body.id, body.rev, (origDoc) => {
      let habit = Habit.fromDoc(origDoc);
      if (body.name) habit.name = body.name;
      if (body.amount) habit.amount = body.amount;
      return Object.assign(origDoc, habit.toDoc());
    }).then(function (result) {
      return loader.getHabit(body.id);
    }).then(function (doc) {
      response.end(JSON.stringify(doc));
    }).catch(function (err) {
      console.log(err);
      response.statusCode = 400;
      response.end(JSON.stringify(err));
    });
  }
});
