'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('promise-redis')();
var MySQL = require('mysql');
var redis = require('redis');
var Uri = require('./uri');
var Redis = require('node-redis-connection-pool');
var SingleProcessPool = require('./pool');
var debug = require('debug')('YMER');

var CachePen = function () {
  function CachePen() {
    (0, _classCallCheck3.default)(this, CachePen);

    this.stacks = {};
  }

  (0, _createClass3.default)(CachePen, [{
    key: 'set',
    value: function set(name) {
      var time = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var fn = arguments[2];

      if (typeof time === 'function') {
        fn = time;
        time = 0;
      }
      this.stacks[name] = {
        time: time, fn: fn
      };
    }
  }, {
    key: 'get',
    value: function get(name) {
      return this.stacks[name];
    }
  }, {
    key: 'del',
    value: function del(name) {
      delete this.stacks[name];
    }
  }]);
  return CachePen;
}();

module.exports = function () {
  function Ymer() {
    var _this = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, Ymer);

    this.cache = new CachePen();
    this.uri = new Uri();
    this.redisPool = new Redis(options.redis);
    this.mysqlPool = MySQL.createPool(options.mysql);
    this.stacks = [];
    process.on('SIGINT', function () {
      _this.destroy();
      process.exit(0);
    });
  }

  (0, _createClass3.default)(Ymer, [{
    key: 'createPool',
    value: function createPool() {
      var single = new SingleProcessPool(this);
      this.stacks.push(single);
      debug('--------------------------------------');
      debug('Create a new process for current user.');
      return single;
    }
  }, {
    key: 'destroyPool',
    value: function destroyPool(pool) {
      var index = this.stacks.indexOf(pool);
      if (~index) {
        this.stacks[index].release();
        this.stacks.splice(index, 1);
        debug('Destroy the process for user');
      }
    }
  }, {
    key: 'connect',
    value: function connect(name, error) {
      var _this2 = this;

      if (typeof name === 'function') {
        error = name;
        name = null;
      }

      return function () {
        var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(ctx, next) {
          var yme;
          return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  yme = ctx[name || 'yme'] = _this2.createPool();
                  _context.prev = 1;

                  debug('Url: %s', ctx.request.url);
                  debug('Start middleware go next()');
                  _context.next = 6;
                  return next();

                case 6:
                  _context.next = 8;
                  return yme.commit();

                case 8:
                  debug('Try middleware success');
                  _context.next = 17;
                  break;

                case 11:
                  _context.prev = 11;
                  _context.t0 = _context['catch'](1);
                  _context.next = 15;
                  return yme.rollback();

                case 15:
                  if (typeof error === 'function') {
                    error(ctx, _context.t0);
                  }
                  debug('Catch middleware runtime error', _context.t0);

                case 17:
                  _context.prev = 17;

                  _this2.destroyPool(yme);
                  debug('Finally runtime close');
                  return _context.finish(17);

                case 21:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, _this2, [[1, 11, 17, 21]]);
        }));

        return function (_x3, _x4) {
          return _ref.apply(this, arguments);
        };
      }();
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.mysqlPool.end();
      this.redisPool.drain();
      debug('Gloabl process exit');
    }
  }, {
    key: 'length',
    get: function get() {
      return this.stacks.length;
    }
  }]);
  return Ymer;
}();