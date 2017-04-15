var __ = {};

__.normal = function(content) {
  console.log(content);
};

__.bold = function(content) {
  console.log(content.bold);
};

__.italic = function(content) {
  console.log(content.italic);
};

__.underline = function(content) {
  console.log(content.underline);
};
__.emphasis = __.underline; // Backwards compatibility

__.inverse = function(content) {
  console.log(content.inverse);
};

__.strikethrough = function(content) {
  console.log(content.strikethrough);
};

__.white = function(content) {
  console.log(content.white);
};

__.grey = function(content) {
  console.log(content.grey);
};
__.gray = __.grey;

__.black = function(content) {
  console.log(content.black);
};

__.blue = function(content) {
  console.log(content.blue);
};

__.cyan = function(content) {
  console.log(content.cyan);
};
__.sky = __.cyan;

__.green = function(content) {
  console.log(content.green);
};

__.magenta = function(content) {
  console.log(content.magenta);
};
__.purple = __.magenta;
__.pink = __.magenta;

__.red = function(content) {
  console.log(content.red);
};

__.yellow = function(content) {
  console.log(content.yellow);
};

__.whiteBG = function(content) {
  console.log(content.whiteBG);
};

__.greyBG = function(content) {
  console.log(content.greyBG);
};
__.grayBG = __.greyBG;

__.blackBG = function(content) {
  console.log(content.blackBG);
};

__.blueBG = function(content) {
  console.log(content.blueBG);
};

__.cyanBG = function(content) {
  console.log(content.cyanBG);
};

__.greenBG = function(content) {
  console.log(content.greenBG);
};

__.magentaBG = function(content) {
  console.log(content.magentaBG);
};

__.redBG = function(content) {
  console.log(content.redBG);
};

__.yellowBG = function(content) {
  console.log(content.yellowBG);
};

module.exports = __;
