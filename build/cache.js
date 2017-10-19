'use strict';

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var util = require('./util');

module.exports = function () {
  function Cache(yme) {
    (0, _classCallCheck3.default)(this, Cache);

    this.yme = yme;
    this.cachePen = yme.pool.cache;
    this.urlPen = yme.pool.uri;
  }

  (0, _createClass3.default)(Cache, [{
    key: 'expire',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(name, time) {
        var redis;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!time) {
                  _context.next = 6;
                  break;
                }

                _context.next = 3;
                return this.yme.redis();

              case 3:
                redis = _context.sent;
                _context.next = 6;
                return redis.expire(name, time / 1000);

              case 6:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function expire(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return expire;
    }()
  }, {
    key: 'remove',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(key, args) {
        var _urlPen;

        var _util$formatCacheKey, domain, pathname, name, redis, exists;

        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _util$formatCacheKey = util.formatCacheKey(key), domain = _util$formatCacheKey.domain, pathname = _util$formatCacheKey.pathname;
                name = (_urlPen = this.urlPen).select.apply(_urlPen, [domain].concat((0, _toConsumableArray3.default)(pathname))).toString(args);
                _context2.next = 4;
                return this.yme.redis();

              case 4:
                redis = _context2.sent;
                _context2.next = 7;
                return redis.exists(name);

              case 7:
                exists = _context2.sent;

                if (!exists) {
                  _context2.next = 11;
                  break;
                }

                _context2.next = 11;
                return redis.del(name);

              case 11:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function remove(_x3, _x4) {
        return _ref2.apply(this, arguments);
      }

      return remove;
    }()
  }, {
    key: 'build',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(key, args, resource) {
        var _urlPen2;

        var _util$formatCacheKey2, domain, pathname, name, ret, redis, result;

        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _util$formatCacheKey2 = util.formatCacheKey(key), domain = _util$formatCacheKey2.domain, pathname = _util$formatCacheKey2.pathname;
                name = (_urlPen2 = this.urlPen).select.apply(_urlPen2, [domain].concat((0, _toConsumableArray3.default)(pathname))).toString(args);
                ret = this.cachePen.get(key);

                if (!ret) {
                  _context3.next = 37;
                  break;
                }

                _context3.next = 6;
                return this.yme.redis();

              case 6:
                redis = _context3.sent;
                _context3.next = 9;
                return ret.fn(this.yme, args, resource);

              case 9:
                result = _context3.sent;

                if (!util.isDef(result)) {
                  _context3.next = 37;
                  break;
                }

                if (!(!result.__Stringify__ && !result.__ArrayStringify__)) {
                  _context3.next = 36;
                  break;
                }

                if (!((typeof result === 'undefined' ? 'undefined' : (0, _typeof3.default)(result)) === 'object')) {
                  _context3.next = 32;
                  break;
                }

                if (!Array.isArray(result)) {
                  _context3.next = 21;
                  break;
                }

                if (!result.length) {
                  _context3.next = 19;
                  break;
                }

                _context3.next = 17;
                return redis.hmset(name, {
                  __ArrayStringify__: true,
                  value: JSON.stringify(result)
                });

              case 17:
                _context3.next = 19;
                return this.expire(name, ret.time);

              case 19:
                _context3.next = 30;
                break;

              case 21:
                if (!Object.keys(result).length) {
                  _context3.next = 26;
                  break;
                }

                _context3.next = 24;
                return redis.hmset(name, util.encode(result));

              case 24:
                _context3.next = 28;
                break;

              case 26:
                _context3.next = 28;
                return redis.hmset(name, {});

              case 28:
                _context3.next = 30;
                return this.expire(name, ret.time);

              case 30:
                _context3.next = 36;
                break;

              case 32:
                _context3.next = 34;
                return redis.hmset(name, {
                  __Stringify__: util.type(result),
                  value: result
                });

              case 34:
                _context3.next = 36;
                return this.expire(name, ret.time);

              case 36:
                return _context3.abrupt('return', result);

              case 37:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function build(_x5, _x6, _x7) {
        return _ref3.apply(this, arguments);
      }

      return build;
    }()
  }, {
    key: 'load',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(key, args) {
        var _urlPen3;

        var _util$formatCacheKey3, domain, pathname, name, redis, exists, values;

        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _util$formatCacheKey3 = util.formatCacheKey(key), domain = _util$formatCacheKey3.domain, pathname = _util$formatCacheKey3.pathname;
                name = (_urlPen3 = this.urlPen).select.apply(_urlPen3, [domain].concat((0, _toConsumableArray3.default)(pathname))).toString(args);
                _context4.next = 4;
                return this.yme.redis();

              case 4:
                redis = _context4.sent;
                _context4.next = 7;
                return redis.exists(name);

              case 7:
                exists = _context4.sent;

                if (!exists) {
                  _context4.next = 23;
                  break;
                }

                _context4.next = 11;
                return redis.hgetall(name);

              case 11:
                values = _context4.sent;

                if (!values.__Stringify__) {
                  _context4.next = 16;
                  break;
                }

                return _context4.abrupt('return', util.parse(values.__Stringify__, values.value));

              case 16:
                if (!values.__ArrayStringify__) {
                  _context4.next = 20;
                  break;
                }

                return _context4.abrupt('return', JSON.parse(values.value));

              case 20:
                return _context4.abrupt('return', util.decode(values));

              case 21:
                _context4.next = 26;
                break;

              case 23:
                _context4.next = 25;
                return this.build(key, args);

              case 25:
                return _context4.abrupt('return', _context4.sent);

              case 26:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function load(_x8, _x9) {
        return _ref4.apply(this, arguments);
      }

      return load;
    }()
  }]);
  return Cache;
}();