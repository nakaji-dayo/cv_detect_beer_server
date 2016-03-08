var cv = require('opencv');
var promisifyAll = require('bluebird').promisifyAll,
    promisify = require('bluebird').promisify;
var _ = require('lodash');

//module.exports = promisifyAll(cv);

exports.readImageAsync = promisify(cv.readImage);

cv.CascadeClassifier.prototype.detectMultiScaleAsync =
  function (im, args) {
    var extraArgs = Array.prototype.slice.call(arguments, 1);
    console.log(extraArgs);
    return new Promise(function (resolv, reject) {
      _.partial(this.detectMultiScale,im, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolv(res);
        }
      }).apply(this, extraArgs);
    }.bind(this));
  };
exports.CascadeClassifier = cv.CascadeClassifier;

