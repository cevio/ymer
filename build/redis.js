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

var ObjectProxy = require('./proxy');
var debug = require('debug')('POOL:MySQL');

var Redis = function () {
  function Redis(conn) {
    (0, _classCallCheck3.default)(this, Redis);

    this.object = conn;
    this.conn = conn;
    this.transaction = false;
  }

  (0, _createClass3.default)(Redis, [{
    key: 'begin',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this.conn = this.object.multi();
                this.transaction = true;
                debug('Redis begin transaction');

              case 3:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function begin() {
        return _ref.apply(this, arguments);
      }

      return begin;
    }()
  }, {
    key: 'commit',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
        var _this = this;

        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (this.transaction) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt('return');

              case 2:
                _context2.next = 4;
                return new Promise(function (resolve, reject) {
                  _this.conn.exec(function (err, replies) {
                    if (err) return reject(err);
                    resolve(replies);
                  });
                });

              case 4:
                return _context2.abrupt('return', _context2.sent);

              case 5:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function commit() {
        return _ref2.apply(this, arguments);
      }

      return commit;
    }()
  }]);
  return Redis;
}();

module.exports = function MySQLProxy(conn) {
  var mysql = new Redis(conn);
  return ObjectProxy(mysql);
};