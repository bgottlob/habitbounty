/* Client side code for index.html view */

/* ****** Setup for the three requests needed to initialize page ********
 * Error handling for parsing bad Handlebars template or JSON handled in
 * code that invokes these promises, no need to do it at this level */
function templatePromise() {
  return httpPromise('index.handlebars', 'GET', 'text/plain')
    .then(function (result) {
      return new Promise(function (fulfill, reject) {
        fulfill(Handlebars.compile(result));
      });
    }).catch(function (err) {
      return Promise.reject(err);
    });
}

function habitPromise() {
  return httpPromise('all-habits', 'GET', 'application/json')
    .then(function (result) {
      return Promise.resolve(JSON.parse(result));
    }).catch(function (err) {
      return Promise.reject(err);
    });
}

function balancePromise() {
  return httpPromise('balance', 'GET', 'application/json')
    .then(function (result) {
      return Promise.resolve(JSON.parse(result));
    }).catch(function (err) {
      return Promise.reject(err);
    });
}

function expensePromise() {
  return httpPromise('all-expenses', 'GET', 'application/json')
    .then(function (result) {
      return Promise.resolve(JSON.parse(result));
    }).catch(function (err) {
      return Promise.reject(err);
    });
}
/****** End of setup for the three requests needed to initialize page ********/

/* Checks whether habit is complete; if so, check off its checkbox */
Handlebars.registerHelper('isComplete', function(obj, dateStr) {
  if (habitFromObject(obj).isComplete(dateStr))
    return 'checked';
});
/* Checks whether expense has been charged */
Handlebars.registerHelper('isCharged', function(obj) {
  if (expenseFromObject(obj).charged())
    return 'checked';
});

/* Invoke the request promises needed to load the page */
function loadPage(selectedDateStr) {
  let promises = [ templatePromise(), habitPromise(),
                   balancePromise(), expensePromise() ];
  Promise.all(promises).then(function (values) {
    /* Build the HTML using the compiled Handlebars template with the habit
     * and balance data */
    let content = {
      habits: values[1],
      balance: values[2].balance,
      expenses: values[3]
    };
    if (!selectedDateStr) {
      let today = new Date();
      /* Work with local date without time */
      today.setHours(0,0,0,0);
      selectedDateStr = today.toISOString().split('T')[0];
    }
    console.log('Selected date string: ' + selectedDateStr);
    content.date = selectedDateStr;
    let html = values[0](content);
    /* Create a div with the built HTML and append it to the HTML body */
    let div = document.createElement('div');
    div.innerHTML = html;
    document.getElementsByTagName('body')[0].appendChild(div);

    /* Set array of dates in dropdown */
    function createOption(dateStr, selected) {
      let opt = document.createElement('option');
      opt.value = dateStr;
      /* TODO: Format this string nicely */
      opt.innerHTML = dateStr;
      if (selected) opt.setAttribute('selected', 'selected');
      return opt;
    }
    let today = new Date();
    today.setHours(0,0,0,0);
    let dateSelect = document.getElementById('date');
    for (let i = 0; i < 10; i++) {
      let currDate = new Date();
      currDate.setHours(0,0,0,0);
      currDate.setDate(today.getDate() - i);
      let currDateStr = currDate.toISOString().split('T')[0];
      dateSelect.appendChild(createOption(currDateStr,
        selectedDateStr === currDateStr
      ));
    }

    documentReady(selectedDateStr);
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

function reloadPage(dateStr) {
  /* Deletes the div of generated content in the body, then reloads it all */
  let body = document.getElementsByTagName('body')[0]
  /* Find and remove all DIVs */
  for (let i = 0; i < body.childNodes.length; i++) {
    if (body.childNodes[i].nodeName === 'DIV') {
      body.removeChild(body.childNodes[i]);
    }
  }
  loadPage(dateStr);
}

/* Load page initially */
loadPage();

/* Will only run once the handlebars template is filled out and the elements
 * have been loaded into the DOM */
function documentReady(selectedDateStr) {
  /* Listener for date change */
  document.getElementById('date').addEventListener('change', function(event) {
    reloadPage(event.currentTarget.value);
  });

  /* Event listeners for checkboxes */
  let editButtons = document.getElementsByClassName('editHabit');
  for (let i = 0; i < editButtons.length; i++) {
    editButtons[i].addEventListener('click', function (event) {
      let form = event.currentTarget.parentNode.querySelector('.editHabitForm');
      if (form.style.display === '')
        form.style.display = 'none';
      else
        form.style.display = '';
    });
  }

  let cancelButtons = document.getElementsByClassName('cancel');
  for (let i = 0; i < cancelButtons.length; i++) {
    cancelButtons[i].addEventListener('click', function (event) {
      event.preventDefault(); /* Prevent button from reloading page */
      event.currentTarget.parentNode.parentNode.style.display = 'none';
    });
  }

  document.getElementById('createHabit').addEventListener('click',
    function(event) {
      event.preventDefault();
      document.getElementById('createHabitForm').style.display = '';
    });

  let createHabitForm = document.getElementById('createHabitForm');
  createHabitForm.addEventListener('submit', function (event) {
    event.preventDefault();
    let body = {
      name: String(createHabitForm.name.value),
      reward: Number(createHabitForm.reward.value)
    };
    httpPromise('habit', 'PUT', 'application/json', body)
      .then(function (result) {
        createHabitForm.style.display = 'none';
        reloadPage();
      }).catch(function (err) {
        console.log(err);
      });
  });

  document.getElementById('changeBalance').addEventListener('click',
    function(event) {
      event.preventDefault();
      document.getElementById('balanceForm').style.display = '';
    });

  let balanceForm = document.getElementById('balanceForm');
  balanceForm.addEventListener('submit', function(event) {
    event.preventDefault();
    let body = { changeAmt: Number(balanceForm.delta.value) };
    httpPromise('change-balance', 'POST', 'application/json', body)
      .then(function (result) {
        balanceForm.style.display = 'none';
        return balancePromise();
      }).then(function (result) {
        document.getElementById('balance').textContent = result.balance.toFixed(2);
      }).catch(function (err) {
        console.log(err);
        reloadPage();
      });
  });

  let editHabitForms = document.getElementsByClassName('editHabitForm');
  for (let i = 0; i < editHabitForms.length; i++) {
    editHabitForms[i].addEventListener('submit', function (event) {
      let form = event.currentTarget;
      let div = form.parentNode;
      event.preventDefault();
      let body = {
        name: String(form.name.value),
        reward: Number(form.reward.value),
        rev: String(div.dataset.rev)
      };
      httpPromise('edit-habit/' + div.dataset.id, 'POST', 'application/json', body)
        .then(function (result) {
          form.style.display = 'none';
          result = JSON.parse(result);
          refreshHabit(div, habitFromObject(result), result._rev);
        }).catch(function (err) {
          console.log(err);
          reloadPage();
        });
    });
  }

  function refreshHabit(div, habit, rev) {
    div.dataset.rev = rev;

    div.querySelector('.nameLabel').textContent = habit.name;
    div.querySelector('.rewardLabel').textContent = habit.reward;

    let form = div.querySelector('.editHabitForm');
    form.name.value = habit.name;
    form.reward.value = habit.reward;

    let cbox = div.querySelector('.completeHabit');
    if (habit.isComplete(selectedDateStr))
      check(cbox);
    else
      uncheck(cbox);
  }

  let deleteHabitButtons = document.getElementsByClassName('deleteHabit');
  for (let i = 0; i < deleteHabitButtons.length; i++) {
    deleteHabitButtons[i].addEventListener('click', function (event) {
      let button = event.currentTarget;
      let div = button.parentNode;
      if (confirm("Are you sure you want to delete the habit?")) {
        httpPromise('delete-habit/' + div.dataset.id, 'DELETE', 'text/plain', {}).then(
          function(result) {
            reloadPage();
          }).catch(function (err) {
            console.log(err);
            reloadPage();
          });
      }
    });
  }

  /* Helper functions for dealing with checkboxes */
  function uncheck(checkbox) {
    checkbox.removeAttribute('checked');
  }

  function check(checkbox) {
    checkbox.setAttribute('checked', '');
  }

  function isChecked(checkbox) {
    return checkbox.hasAttribute('checked');
  }

  function toggleCheckbox(checkbox) {
    if (isChecked(checkbox))
      uncheck(checkbox);
    else
      check(checkbox);
  }

  let checkboxes = document.getElementsByClassName('completeHabit');
  for (let i = 0; i < checkboxes.length; i++) {
    checkboxes[i].addEventListener("click", function(event) {
      let cbox = event.currentTarget;
      let div = cbox.parentNode;
      toggleCheckbox(cbox);

      let body = {
        id: div.dataset.id,
        rev: div.dataset.rev,
        set: isChecked(cbox),
        date: selectedDateStr
      };

      /* Disable the checkbox once the habit is being changed */
      cbox.disabled = true;

      httpPromise('complete-habit', 'POST', 'application/json', body)
        .then(function (result) {
          /* (Un)completion successful! The current state of the checkbox
           * reflects the truth of what is in the database */
          result = JSON.parse(result);
          document.getElementById('balance').textContent = result.balance.toFixed(2);
          refreshHabit(div, habitFromObject(result.habit), result.habit._rev);
          cbox.disabled = false;
        }).catch(function (err) {
          /* Set the checkbox to be the opposite of what it has now, the habit's
           * completion was not toggled -- change the checkbox back */
          console.log('Error occurred when trying to complete the habit');
          console.log(err);
          reloadPage();
        });
    });
  }

  function refreshExpense(div, expense, rev) {
    div.dataset.rev = rev;

    div.querySelector('.nameLabel').textContent = expense.name;
    div.querySelector('.amountLabel').textContent = expense.amount;

    let cbox = div.querySelector('.chargeExpense');
    if (expense.charged()) check(cbox);
    else uncheck(cbox);
  }

  document.getElementById('createExpense').addEventListener('click',
    function(event) {
      event.preventDefault();
      document.getElementById('createExpenseForm').style.display = '';
    });

  let createExpenseForm = document.getElementById('createExpenseForm');
  createExpenseForm.addEventListener('submit', function (event) {
    event.preventDefault();
    let body = {
      name: String(createExpenseForm.name.value),
      amount: Number(createExpenseForm.amount.value)
    };
    httpPromise('expense', 'PUT', 'application/json', body)
      .then(function (result) {
        createExpenseForm.style.display = 'none';
        reloadPage();
      }).catch(function (err) {
        console.log(err);
      });
  });

  let expCheckboxes = document.getElementsByClassName('chargeExpense');
  for (let i = 0; i < expCheckboxes.length; i++) {
    expCheckboxes[i].addEventListener("click", function(event) {
      let cbox = event.currentTarget;
      let div = cbox.parentNode;
      toggleCheckbox(cbox);


      let body = { id: div.dataset.id, rev: div.dataset.rev };
      if (isChecked(cbox)) body.date = selectedDateStr;

      /* Disable the checkbox once the habit is being changed */
      cbox.disabled = true;

      httpPromise('charge-expense', 'POST', 'application/json', body)
        .then(function (result) {
          /* (Un)completion successful! The current state of the checkbox
           * reflects the truth of what is in the database */
          result = JSON.parse(result);
          document.getElementById('balance').textContent = result.balance.toFixed(2);
          refreshExpense(div, expenseFromObject(result.expense), result.expense._rev);
          cbox.disabled = false;
        }).catch(function (err) {
          /* Set the checkbox to be the opposite of what it has now, the habit's
           * completion was not toggled -- change the checkbox back */
          console.log('Error occurred when trying to complete the habit');
          console.log(err);
          reloadPage();
        });
    });
  }
}
