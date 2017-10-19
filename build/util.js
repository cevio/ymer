'use strict';

var toString = Object.prototype.toString;

exports.isDef = isDef;
exports.isUnDef = isUnDef;
exports.encode = encode;
exports.decode = decode;
exports.type = valueType;
exports.parse = de_parse;
exports.formatCacheKey = formatCacheKey;

function isDef(result) {
  return result !== undefined && result !== null;
}

function isUnDef(result) {
  return result === undefined || result === null;
}

function valueType(value) {
  return toString.call(value).replace(/\[object\s([^\]]+)\]/, '$1').toLowerCase();
}

function encode(value, cb) {
  var res = {};
  for (var i in value) {
    res[i] = en_parse(value[i]);
  }
  return res;
}

function decode(res) {
  var _res = {};
  for (var i in res) {
    var value = res[i];
    var ret = de_format(value);
    if (ret) {
      _res[i] = de_parse(ret.type, ret.value);
    }
  }
  return _res;
}

function en_parse(value) {
  var type = valueType(value);
  switch (type) {
    case 'date':
      value = type + ':' + new Date(value).getTime();break;
    case 'object':
    case 'array':
      value = type + ':' + JSON.stringify(value);break;
    default:
      value = type + ':' + value;
  }
  return value;
}

function de_parse(type, _value) {
  var value = void 0;
  switch (type) {
    case 'number':
      value = Number(_value);break;
    case 'boolean':
      value = _value === 'true' ? true : false;break;
    case 'date':
      value = new Date(Number(_value));break;
    case 'object':
    case 'array':
      value = JSON.parse(_value);break;
    case 'null':
      value = null;break;
    case 'undefined':
      value = undefined;break;
    default:
      value = _value;
  }
  return value;
}

function de_format(value) {
  var index = value.indexOf(':');
  if (~index) {
    var type = value.substring(0, index);
    var _value = value.substring(index + 1);
    return {
      type: type, value: _value
    };
  }
}

function formatCacheKey(name) {
  var items = name.split(':');
  var domain = items[0];
  return {
    domain: items[0],
    pathname: items.slice(1)
  };
}