/* Populates the chore data within the specified div */
function refreshChore(div, chore, rev) {
  div.dataset.rev = rev;

  div.querySelector('.nameLabel').textContent = chore.name;
  div.querySelector('.amountLabel').textContent = chore.amount;

  let form = div.querySelector('.editChoreForm');
  form.name.value = chore.name;
  form.amount.value = chore.amount;

  let cbox = div.querySelector('.completeChore');
  if (chore.isComplete(getDate()))
    check(cbox);
  else
    uncheck(cbox);
}

function createChoreCallback(event) {
  event.preventDefault();
  let form = event.currentTarget;
  let body = {
    name: String(form.name.value),
    amount: Number(form.amount.value)
  };
  httpPromise('chore', 'PUT', 'application/json', body)
    .then(function (result) {
      form.style.display = 'none';
      reloadPage();
    }).catch(function (err) {
      console.log(err);
    });
}

/* Callback for a submit event on a chore data edit form */
function editChoreCallback(event) {
  event.preventDefault();
  let form = event.currentTarget;
  let div = form.parentNode;
  let body = {
    name: String(form.name.value),
    amount: Number(form.amount.value),
    rev: String(div.dataset.rev),
    id: div.dataset.id
  };
  httpPromise('edit-chore', 'POST', 'application/json', body)
    .then(function (result) {
      form.style.display = 'none';
      result = JSON.parse(result);
      refreshChore(div, choreFromObject(result), result.rev);
    }).catch(function (err) {
      console.log(err);
      reloadPage();
    });
}

function completeChoreCallback(event) {
  let cbox = event.currentTarget;
  let div = cbox.parentNode;
  toggleCheckbox(cbox);

  let body = {
    id: div.dataset.id,
    rev: div.dataset.rev,
    set: isChecked(cbox),
    date: getDate()
  };

  /* Disable the checkbox once the chore is being changed */
  cbox.disabled = true;

  httpPromise('complete-chore', 'POST', 'application/json', body)
    .then((result) => {
      /* (Un)completion successful! The current state of the checkbox
       * reflects the truth of what is in the database */
      result = JSON.parse(result);
      document.getElementById('balance').textContent = result.balance;
      refreshChore(div, choreFromObject(result.chore), result.chore.rev);
      cbox.disabled = false;
      return choresLeftPromise(getDate());
    }).then((result) => {
      document.getElementById('choresLeft').textContent = result;
    }).catch((err) => {
      /* Set the checkbox to be the opposite of what it has now, the chore's
       * completion was not toggled -- change the checkbox back */
      console.log('Error occurred when trying to complete the chore');
      console.log(err);
      reloadPage();
    });
}

function archiveChoreCallback(event) {
  event.preventDefault();
  let form = event.currentTarget;
  if (confirm('Are you sure you want to archive this chore? It will be ' +
    'removed from your daily routine.')) {
      let div = form.parentNode;
      let body = {
        id: div.dataset.id,
        rev: String(div.dataset.rev),
        archived: true
      };
      httpPromise('archive-chore', 'POST', 'application/json', body)
        .then(function (result) {
          reloadPage();
        }).catch(function (err) {
          console.log(err);
          reloadPage();
        });
  }
}
