var app      = require('koa')(),
    koaBody   = require('koa-body');
var promisifyAll = require('bluebird').promisifyAll,
    promisify = require('bluebird').promisify;
var cv = require('./opencv-promise');

var MIN_OBJECT_SIZE = 120;

app.use(koaBody({formidable:{uploadDir: './uploads'}}));
app.use(function *(next) {
  console.log('requested');
  if (this.request.method == 'POST') {
    this.body = yield detect(this.request.body.image, this.request.body.name || 'tmp',
                             this.request.body.format);    
  }
  yield next;
});
app.listen(13131);
console.log('localhost:13131');

var cascade = new cv.CascadeClassifier("./rate.cascade.xml");
var detect = function *(b64Image, name, resFormat) {
  //read base64
  var buf = new Buffer(b64Image, 'base64');
  var image = yield cv.readImageAsync(buf);
  // detect main
  var detect_ = function *(neighbors, lastLabels) {
    var objs = yield cascade.detectMultiScaleAsync(image, 1.25, neighbors);
    var labels = objs.filter(x => x.height > MIN_OBJECT_SIZE);
    if (labels.length > 1) {
      var v =  yield detect_(neighbors+1, labels);
      return v;
    } else {
      var labels_ = labels.length > 0 ? labels : lastLabels;
      if (process.env.DEBUG) {
        debugDetect(image, labels_, name);
        console.log('recuesive count', neighbors-2);
      }
      if (resFormat == 'image') {
        if (labels_.length == 0) {
          return ({image: null});
        }
        var l = labels_[0];
        var crop = image.crop(l.x, l.y, l.width, l.height);
        return {image: crop.toBuffer().toString('base64')};
      } else {
        return labels_;
      }
      return null;
    }
  };
  // run detect
  var res = yield detect_(2, []);
  return res;
};

var debugDetect = (im_, labels, name) => {
  var im = im_.copy();
  var i = 0;
  labels.forEach((label) => {
    im.rectangle([label.x, label.y], [label.width, label.height], [i,i,255], 2);
    i+=80;
  });
  im.save('./tmp/' + name + '.jpg');
};
