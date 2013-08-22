var __ = {};

__.normal = function(content){
  console.log(content);
}

__.emphasis = function(content){
  console.log(content.underline);
}

module.exports = __;
