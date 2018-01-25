const toString = Object.prototype.toString;

exports.type = valueType;
exports.isUnDef = isUnDef;
exports.parse = de_parse;

function isUnDef(result) {
  return result === undefined || result === null;
}

function valueType(value) {
  return toString.call(value).replace(/\[object\s([^\]]+)\]/, '$1').toLowerCase();
}

function de_parse(type, _value) {
  _value = JSON.parse(_value);
  switch (type) {
    case 'number': _value = Number(_value); break;
    case 'date': _value = new Date(_value); break;
  }
  return _value;
}