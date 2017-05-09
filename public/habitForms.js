/* Populates the habit data within the specified div */
function refreshHabit(div, habit, rev) {
  div.dataset.rev = rev;

  div.querySelector('.nameLabel').textContent = habit.name;
  div.querySelector('.amountLabel').textContent = habit.amount;

  let form = div.querySelector('.editHabitForm');
  form.name.value = habit.name;
  form.amount.value = habit.amount;

  let cbox = div.querySelector('.completeHabit');
  if (habit.isComplete(getDate()))
    check(cbox);
  else
    uncheck(cbox);
}

function createHabitCallback(event) {
  event.preventDefault();
  let form = event.currentTarget;
  let body = {
    name: String(form.name.value),
    amount: Number(form.amount.value)
  };
  httpPromise('habit', 'PUT', 'application/json', body)
    .then(function (result) {
      form.style.display = 'none';
      reloadPage();
    }).catch(function (err) {
      console.log(err);
    });
}

/* Callback for a submit event on a habit data edit form */
function editHabitCallback(event) {
  event.preventDefault();
  let form = event.currentTarget;
  let div = form.parentNode;
  let body = {
    name: String(form.name.value),
    amount: Number(form.amount.value),
    rev: String(div.dataset.rev),
    id: div.dataset.id
  };
  httpPromise('edit-habit', 'POST', 'application/json', body)
    .then(function (result) {
      form.style.display = 'none';
      result = JSON.parse(result);
      refreshHabit(div, habitFromObject(result), result.rev);
    }).catch(function (err) {
      console.log(err);
      reloadPage();
    });
}

function completeHabitCallback(event) {
  let cbox = event.currentTarget;
  let div = cbox.parentNode;
  toggleCheckbox(cbox);

  let body = {
    id: div.dataset.id,
    rev: div.dataset.rev,
    set: isChecked(cbox),
    date: getDate()
  };

  /* Disable the checkbox once the habit is being changed */
  cbox.disabled = true;

  httpPromise('complete-habit', 'POST', 'application/json', body)
    .then((result) => {
      /* (Un)completion successful! The current state of the checkbox
       * reflects the truth of what is in the database */
      result = JSON.parse(result);
      document.getElementById('balance').textContent = result.balance;
      refreshHabit(div, habitFromObject(result.habit), result.habit.rev);
      cbox.disabled = false;
      return habitsLeftPromise(getDate());
    }).then((result) => {
      document.getElementById('habitsLeft').textContent = result;
    }).catch((err) => {
      /* Set the checkbox to be the opposite of what it has now, the habit's
       * completion was not toggled -- change the checkbox back */
      console.log('Error occurred when trying to complete the habit');
      console.log(err);
      reloadPage();
    });
}

function archiveHabitCallback(event) {
  event.preventDefault();
  let form = event.currentTarget;
  if (confirm('Are you sure you want to archive this habit? It will be ' +
    'removed from your daily routine.')) {
      let div = form.parentNode;
      let body = {
        id: div.dataset.id,
        rev: String(div.dataset.rev),
        archived: true
      };
      httpPromise('archive-habit', 'POST', 'application/json', body)
        .then(function (result) {
          reloadPage();
        }).catch(function (err) {
          console.log(err);
          reloadPage();
        });
  }
}
