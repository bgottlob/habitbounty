/* Client side code for index.html view */
/* TODO: Get rid of all window calls */

/* ****** Setup for the three requests needed to initialize page ********
 * Error handling for parsing bad Handlebars template or JSON handled in
 * code that invokes these promises, no need to do it at this level */
function templatePromise() {
  return httpPromise('index.handlebars', 'GET', 'text/plain')
    .then(function (result) {
      return Promise.resolve(Handlebars.compile(result));
    });
}

function habitPromise() {
  return httpPromise('active-habits', 'GET', 'application/json')
    .then(function (result) {
      return Promise.resolve(JSON.parse(result).map((entry) => {
        return {
          id: entry.id,
          rev: entry.rev,
          habit: new Habit(entry.name, entry.amount, entry.log)
        };
      }));
    });
}

function chorePromise() {
  return httpPromise('all-chores', 'GET', 'application/json')
    .then(function (result) {
      return Promise.resolve(JSON.parse(result).map((entry) => {
        return {
          id: entry.id,
          rev: entry.rev,
          chore: new Chore(entry.name, entry.amount, entry.log)
        };
      }));
    });
}

function balancePromise() {
  return httpPromise('balance', 'GET', 'application/json')
    .then(function (result) {
      return Promise.resolve(JSON.parse(result));
    });
}

function expensePromise() {
  return httpPromise('all-expenses', 'GET', 'application/json')
    .then(function (result) {
      return Promise.resolve(JSON.parse(result).map((entry) => {
        return {
          id: entry.id,
          rev: entry.rev,
          expense: new Expense(entry.name, entry.amount, entry.dateCharged)
        };
      }));
    });
}

function habitsLeftPromise(dateStr) {
  return httpPromise('habits-left/' + dateStr, 'GET', 'application/json')
    .then((result) => {return Promise.resolve(JSON.parse(result));});
}
/****** End of setup for the three requests needed to initialize page ********/

/* Checks whether habit is complete; if so, check off its checkbox */
Handlebars.registerHelper('isComplete', function(habit) {
  if (habit.isComplete(getDate()))
    return 'checked';
});
/* Checks whether expense has been charged */
Handlebars.registerHelper('isCharged', function(expense) {
  if (expense.charged())
    return 'checked';
});

/* Using getters and setters for the date as an abstraction layer, since
 * using window.date may change */
/* Retrieves the ISO 8601 string of the selected date value */
function getDate() {
  /* return document.getElementById('date').value; */
  return window.date;
}

function setDate(date) {
  window.date = date;
}

/* Could turn this into a closure that uses a local variable, so that window
 * does not need to be used. It's potentially unsafe because it can be edited
 * elsewhere in the code */
function getExpenseTemplate() {
  return window.expenseTemplate;
}
function getHabitTemplate() {
  return window.habitTemplate;
}
function getChoreTemplate() {
  return window.choreTemplate;
}

function buildDatePicker() {
  function createOption(dateStr, selected) {
    let opt = document.createElement('option');
    opt.value = dateStr;
    /* TODO: Format this string nicely */
    opt.innerHTML = dateStr;
    if (selected) opt.setAttribute('selected', 'selected');
    return opt;
  }

  /* Set array of dates in dropdown */
  let dateSelect = document.getElementById('date');
  let today = new Date();
  today.setHours(0,0,0,0);
  for (let i = 0; i < 10; i++) {
    let currDate = new Date();
    currDate.setHours(0,0,0,0);
    currDate.setDate(today.getDate() - i);
    let currDateStr = currDate.toISOString().split('T')[0];
    dateSelect.appendChild(
      createOption(currDateStr, getDate() === currDateStr)
    );
  }

  /* Listener for date change */
  dateSelect.addEventListener('change', function(event) {
    setDate(event.currentTarget.value);
    reloadPage();
  });
}

/* Invoke the request promises needed to load the page */
function loadPage() {
  let today = new Date();
  /* Work with local date without time */
  today.setHours(0,0,0,0);
  if (!getDate())
    setDate(today.toISOString().split('T')[0]);

  /* Fire off promises to the server to get the page, habit form, and expense
   * form templates along with habit, balance, and expense info */
  let promises = [
    templatePromise(), habitPromise(), balancePromise(), expensePromise(),
    httpPromise('habit/habitForm.handlebars', 'GET', 'text/plain'),
    httpPromise('expense/expenseForm.handlebars', 'GET', 'text/plain'),
    habitsLeftPromise(getDate()), chorePromise(),
    httpPromise('chore/choreForm.handlebars', 'GET', 'text/plain'),
  ];

  Promise.all(promises).then(function (values) {
    /* Build the HTML using the compiled Handlebars template with the habit
     * and balance data */
    let content = {
      habits: values[1],
      balance: values[2].balance,
      expenses: values[3],
      date: getDate(),
      habitsLeft: values[6],
      chores: values[7]
    };

    window.habitTemplate = Handlebars.compile(values[4]);
    window.expenseTemplate = Handlebars.compile(values[5]);
    window.choreTemplate = Handlebars.compile(values[8]);

    Handlebars.registerPartial('habitForm', values[4]);
    Handlebars.registerPartial('expenseForm', values[5]);
    Handlebars.registerPartial('choreForm', values[8]);

    let html = values[0](content);
    /* Create a div with the built HTML and append it to the HTML body */
    let div = document.createElement('div');
    div.innerHTML = html;
    document.getElementsByTagName('body')[0].appendChild(div);
    documentReady();
  }).catch(function (err) {
    /* Build error HTML and append to the body if any promise was rejected */
    let html = "<h2>Error</h2><p>Sorry, your content wan't found!</p>";
    let div = document.createElement('div');
    div.innerHTML = html;
    document.getElementsByTagName('body')[0].appendChild(div);
    console.log(err);
    console.log(err.stack);
  });
}

function reloadPage() {
  /* Deletes the div of generated content in the body, then reloads it all */
  let body = document.getElementsByTagName('body')[0]
  /* Find and remove all DIVs */
  for (let i = 0; i < body.childNodes.length; i++) {
    if (body.childNodes[i].nodeName === 'DIV') {
      body.removeChild(body.childNodes[i]);
    }
  }
  loadPage();
}

/* Load page initially */
loadPage();

/* Will only run once the handlebars template is filled out and the elements
 * have been loaded into the DOM */
function documentReady() {
  buildDatePicker();

  let habitDivs = document.getElementsByClassName('habit');
  for (let i = 0; i < habitDivs.length; i++)
    attachHabitListeners(habitDivs[i]);

  let expenseDivs = document.getElementsByClassName('expense');
  for (let i = 0; i < expenseDivs.length; i++)
    attachExpenseListeners(expenseDivs[i]);

  document.getElementById('createHabit').addEventListener('click',
    function(event) {
      event.preventDefault();
      document.getElementById('createHabitForm').style.display = '';
    });

  let createHabitForm = document.getElementById('createHabitForm');
  createHabitForm.addEventListener('submit', createHabitCallback);

  document.getElementById('createChore').addEventListener('click',
    function(event) {
      event.preventDefault();
      document.getElementById('createChoreForm').style.display = '';
    });

  let createChoreForm = document.getElementById('createChoreForm');
  createChoreForm.addEventListener('submit', createChoreCallback);

  document.getElementById('changeBalance').addEventListener('click',
    function(event) {
      event.preventDefault();
      document.getElementById('balanceForm').style.display = '';
    });

  let balanceForm = document.getElementById('balanceForm');
  balanceForm.addEventListener('submit', function(event) {
    event.preventDefault();
    let body = { amount: Number(balanceForm.delta.value) };
    httpPromise('change-balance', 'POST', 'application/json', body)
      .then(function (result) {
        balanceForm.style.display = 'none';
        return balancePromise();
      }).then(function (result) {
        document.getElementById('balance').textContent = result.balance;
      }).catch(function (err) {
        console.log(err);
        reloadPage();
      });
  });

  document.getElementById('createExpense').addEventListener('click',
    function(event) {
      event.preventDefault();
      document.getElementById('createExpenseForm').style.display = '';
    });

  let createExpenseForm = document.getElementById('createExpenseForm');
  createExpenseForm.addEventListener('submit', createExpenseCallback);

  let expCheckboxes = document.getElementsByClassName('chargeExpense');
  for (let i = 0; i < expCheckboxes.length; i++) {
    expCheckboxes[i].addEventListener("click", chargeExpenseCallback);
  }
}
