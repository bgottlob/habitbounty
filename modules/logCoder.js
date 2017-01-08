const moment = require('moment');

/* Encodes moments into arrays of local dates (without time) */
module.exports.encodeLog = function(log) {
  return log.map((mDate) => {
    return [mDate.year(), mDate.month(), mDate.date()];
  });
};

/* Decodes arrays representing dates into local moments */
module.exports.decodeLog = function (log) {
  return log.map((utcArr) => {
    return moment.local();
  });
};
