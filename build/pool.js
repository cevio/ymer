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

var MySQL = require('./mysql');
var Redis = require('./redis');
var Cache = require('./cache');
var debug = require('debug')('POOL');

module.exports = function () {
  function SingleProcessPool(pool) {
    (0, _classCallCheck3.default)(this, SingleProcessPool);

    this.pool = pool;
    this.uri = pool.uri;
    this._mysql = null;
    this._redis = null;
    this.cache = new Cache(this);
    this.stacks = [];
  }

  (0, _createClass3.default)(SingleProcessPool, [{
    key: 'catch',
    value: function _catch(obj) {
      this.stacks.push(obj);
      debug('Push an stack to this.stacks');
    }
  }, {
    key: 'release',
    value: function release() {
      if (this._mysql) {
        this._mysql.release();
        debug('Release mysql object to mysql pool');
      }
      if (this._redis) {
        this.pool.redisPool.release(this._redis.object);
        debug('Release redis object to redis pool');
      }
    }
  }, {
    key: 'mysql',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
        var _this = this;

        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this._mysql) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt('return', this._mysql);

              case 2:
                _context.next = 4;
                return new Promise(function (resolve, reject) {
                  _this.pool.mysqlPool.getConnection(function (err, conn) {
                    if (err) return reject(err);
                    debug('Get single mysql object from mysql pool');
                    resolve(MySQL(conn));
                  });
                });

              case 4:
                return _context.abrupt('return', this._mysql = _context.sent);

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function mysql() {
        return _ref.apply(this, arguments);
      }

      return mysql;
    }()
  }, {
    key: 'redis',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
        var _pool$redisPool;

        var _args2 = arguments;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!this._redis) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt('return', this._redis);

              case 2:
                debug('Get single redis object from redis pool');
                _context2.t0 = Redis;
                _context2.next = 6;
                return (_pool$redisPool = this.pool.redisPool).acquire.apply(_pool$redisPool, _args2);

              case 6:
                _context2.t1 = _context2.sent;
                return _context2.abrupt('return', this._redis = (0, _context2.t0)(_context2.t1));

              case 8:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function redis() {
        return _ref2.apply(this, arguments);
      }

      return redis;
    }()
  }, {
    key: 'commit',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!this._redis) {
                  _context3.next = 4;
                  break;
                }

                _context3.next = 3;
                return this._redis.commit();

              case 3:
                debug('Commit redis data');

              case 4:
                if (!this._mysql) {
                  _context3.next = 8;
                  break;
                }

                _context3.next = 7;
                return this._mysql.commit();

              case 7:
                debug('Commit mysql data');

              case 8:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function commit() {
        return _ref3.apply(this, arguments);
      }

      return commit;
    }()
  }, {
    key: 'rollback',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
        var i;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                i = 0;

              case 1:
                if (!(i < this.stacks.length)) {
                  _context4.next = 8;
                  break;
                }

                _context4.next = 4;
                return this.stacks[i]();

              case 4:
                debug('Rollback stacks data');

              case 5:
                i++;
                _context4.next = 1;
                break;

              case 8:
                if (!this._mysql) {
                  _context4.next = 12;
                  break;
                }

                _context4.next = 11;
                return this._mysql.rollback();

              case 11:
                debug('Rollback mysql data');

              case 12:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function rollback() {
        return _ref4.apply(this, arguments);
      }

      return rollback;
    }()
  }]);
  return SingleProcessPool;
}();