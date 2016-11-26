const moment = require('moment');

/* Encodes moments into arrays of UTC timestamps */
module.exports.encodeLog = function(log) {
  return log.map((mDate) => {
    /* Set flag on the moment to use UTC in the following calls */
    mDate.utc();
    return [mDate.year(), mDate.month(), mDate.date(), mDate.hour(),
            mDate.minute()];
  });
};

/* Decodes arrays of UTC timestamps into moments */
module.exports.decodeLog = function (log) {
  return log.map((utcArr) => {
    return moment.utc(utcArr).local();
  });
};
