function refreshExpense(div, expense, rev) {
  div.dataset.rev = rev;

  div.querySelector('.nameLabel').textContent = expense.name;
  div.querySelector('.amountLabel').textContent = expense.amount;

  let cbox = div.querySelector('.chargeExpense');
  if (expense.charged()) check(cbox);
  else uncheck(cbox);
}

function createExpenseCallback(event) {
  event.preventDefault();
  let form = event.currentTarget;
  let body = {
    name: String(form.name.value),
    amount: Number(form.amount.value)
  };
  httpPromise('expense', 'PUT', 'application/json', body)
    .then(function (result) {
      form.style.display = 'none';
      reloadPage();
    }).catch(function (err) {
      console.log(err);
    });
}

function chargeExpenseCallback(event) {
  let cbox = event.currentTarget;
  let div = cbox.parentNode;
  toggleCheckbox(cbox);

  let body = { id: div.dataset.id, rev: div.dataset.rev };
  if (isChecked(cbox)) body.dateCharged = getDate();
  else body.dateCharged = null;

  /* Disable the checkbox once the habit is being changed */
  cbox.disabled = true;

  httpPromise('charge-expense', 'POST', 'application/json', body)
    .then(function (result) {
      /* (Un)completion successful! The current state of the checkbox
       * reflects the truth of what is in the database */
      result = JSON.parse(result);
      document.getElementById('balance').textContent = result.balance;
      refreshExpense(div, expenseFromObject(result.expense), result.expense.rev);
      cbox.disabled = false;
    }).catch(function (err) {
      /* Set the checkbox to be the opposite of what it has now, the habit's
       * completion was not toggled -- change the checkbox back */
      console.log('Error occurred when trying to complete the habit');
      console.log(err);
      reloadPage();
    });
}
