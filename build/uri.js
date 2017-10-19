'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');
var pathToRegExp = require('path-to-regexp');
var querystring = require('querystring');

var compress = function () {
  function compress(obj, domain, _compress) {
    (0, _classCallCheck3.default)(this, compress);

    this.obj = obj;
    this.domain = domain;
    this.compress = _compress;
  }

  (0, _createClass3.default)(compress, [{
    key: 'toString',
    value: function toString() {
      var args = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var querys = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var pathname = this.compress(args);
      var watcher = this.obj.getWatcher(this.domain);
      if (watcher) {
        pathname = watcher(pathname);
      }
      var domain = this.obj.getDomain(this.domain);
      var value = domain + pathname;
      var query = querystring.encode(querys);
      if (query) {
        return value + '?' + query;
      }
      return value;
    }
  }]);
  return compress;
}();

module.exports = function () {
  function URI() {
    (0, _classCallCheck3.default)(this, URI);

    this._domains = {};
    this._pathes = {};
    this._watchers = {};
  }

  (0, _createClass3.default)(URI, [{
    key: 'setDomain',
    value: function setDomain(key, value) {
      var that = this;
      this._domains[key] = value.replace(/\/$/, '');
      return {
        watch: function watch(cb) {
          that.setWatcher(key, cb);
        }
      };
    }
  }, {
    key: 'getDomain',
    value: function getDomain(key) {
      return this._domains[key];
    }
  }, {
    key: 'setPath',
    value: function setPath(key, value) {
      this._pathes[key] = /^\//.test(value) ? value : '/' + value;
    }
  }, {
    key: 'getPath',
    value: function getPath() {
      var _this = this;

      for (var _len = arguments.length, key = Array(_len), _key = 0; _key < _len; _key++) {
        key[_key] = arguments[_key];
      }

      key = key.map(function (k) {
        if (!_this._pathes[k]) {
          throw new Error('miss pathname: ' + k);
        }
        return '.' + _this._pathes[k];
      });
      return path.resolve.apply(path, ['/'].concat((0, _toConsumableArray3.default)(key)));
    }
  }, {
    key: 'setWatcher',
    value: function setWatcher(domain, cb) {
      this._watchers[domain] = cb;
    }
  }, {
    key: 'getWatcher',
    value: function getWatcher(domain) {
      return this._watchers[domain];
    }
  }, {
    key: 'select',
    value: function select(domain) {
      for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      var dist = this.getPath.apply(this, args);
      return new compress(this, domain, pathToRegExp.compile(dist));
    }
  }]);
  return URI;
}();