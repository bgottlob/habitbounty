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
