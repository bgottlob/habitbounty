const Balance = require('./modules/sharedLibs/balance.js');
const loader = require('./modules/dataLoader.js');
loader.pushDesignDoc();
loader.createBalance(new Balance()).catch(function (err) {
  console.log('create balance failed');
  console.log(err);
});
