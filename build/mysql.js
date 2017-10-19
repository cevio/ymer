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
var flatten = require('flatten');

var MySQL = function () {
  function MySQL(conn) {
    (0, _classCallCheck3.default)(this, MySQL);

    this.conn = conn;
    this.transaction = false;
  }

  (0, _createClass3.default)(MySQL, [{
    key: 'exec',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(sql) {
        var _this = this;

        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                args = flatten(args);
                return _context.abrupt('return', new Promise(function (resolve, reject) {
                  _this.conn.query(sql, args, function (err, rows) {
                    if (err) return reject(err);
                    resolve(rows);
                  });
                }));

              case 2:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function exec(_x) {
        return _ref.apply(this, arguments);
      }

      return exec;
    }()
  }, {
    key: 'insert',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(table, data) {
        var isSingle, result, i;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                isSingle = false;
                result = [];


                if (!Array.isArray(data)) {
                  data = [data];
                  isSingle = true;
                }

                i = 0;

              case 4:
                if (!(i < data.length)) {
                  _context2.next = 13;
                  break;
                }

                _context2.t0 = result;
                _context2.next = 8;
                return this.exec('INSERT INTO ' + table + ' SET ?', data[i]);

              case 8:
                _context2.t1 = _context2.sent;

                _context2.t0.push.call(_context2.t0, _context2.t1);

              case 10:
                i++;
                _context2.next = 4;
                break;

              case 13:
                if (!isSingle) {
                  _context2.next = 15;
                  break;
                }

                return _context2.abrupt('return', result[0]);

              case 15:
                return _context2.abrupt('return', result);

              case 16:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function insert(_x2, _x3) {
        return _ref2.apply(this, arguments);
      }

      return insert;
    }()
  }, {
    key: 'update',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(table, value, where) {
        for (var _len2 = arguments.length, wheres = Array(_len2 > 3 ? _len2 - 3 : 0), _key2 = 3; _key2 < _len2; _key2++) {
          wheres[_key2 - 3] = arguments[_key2];
        }

        var fields, values, key, sql;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                fields = [], values = [];

                for (key in value) {
                  fields.push(key + '=?');
                  values.push(value[key]);
                }
                sql = 'UPDATE ' + table + ' SET ' + fields.join(',');

                if (where) {
                  sql += ' WHERE ' + where;
                  wheres = flatten(wheres ? wheres : []);
                  values = values.concat(wheres);
                }
                _context3.next = 6;
                return this.exec(sql, values);

              case 6:
                return _context3.abrupt('return', _context3.sent);

              case 7:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function update(_x4, _x5, _x6) {
        return _ref3.apply(this, arguments);
      }

      return update;
    }()
  }, {
    key: 'delete',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(table, where, wheres) {
        var sql, values;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                sql = 'DELETE FROM ' + table, values = [];

                if (where) {
                  sql += ' WHERE ' + where;
                  wheres = flatten(wheres ? wheres : []);
                  values = values.concat(wheres);
                }
                _context4.next = 4;
                return this.exec(sql, values);

              case 4:
                return _context4.abrupt('return', _context4.sent);

              case 5:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function _delete(_x7, _x8, _x9) {
        return _ref4.apply(this, arguments);
      }

      return _delete;
    }()
  }, {
    key: 'begin',
    value: function () {
      var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5() {
        var _this2 = this;

        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return new Promise(function (resolve, reject) {
                  _this2.conn.beginTransaction(function (err) {
                    if (err) return reject(err);
                    _this2.transaction = true;
                    debug('MySQL begin transaction');
                    resolve();
                  });
                });

              case 2:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function begin() {
        return _ref5.apply(this, arguments);
      }

      return begin;
    }()
  }, {
    key: 'commit',
    value: function () {
      var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6() {
        var _this3 = this;

        return _regenerator2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (this.transaction) {
                  _context6.next = 2;
                  break;
                }

                return _context6.abrupt('return');

              case 2:
                _context6.next = 4;
                return new Promise(function (resolve, reject) {
                  _this3.conn.commit(function (err) {
                    if (err) return reject(err);
                    resolve();
                  });
                });

              case 4:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function commit() {
        return _ref6.apply(this, arguments);
      }

      return commit;
    }()
  }, {
    key: 'rollback',
    value: function () {
      var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7() {
        var _this4 = this;

        return _regenerator2.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                if (this.transaction) {
                  _context7.next = 2;
                  break;
                }

                return _context7.abrupt('return');

              case 2:
                _context7.next = 4;
                return new Promise(function (resolve, reject) {
                  _this4.conn.rollback(function (err) {
                    if (err) return reject(err);
                    resolve();
                  });
                });

              case 4:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function rollback() {
        return _ref7.apply(this, arguments);
      }

      return rollback;
    }()
  }]);
  return MySQL;
}();

module.exports = function MySQLProxy(conn) {
  var mysql = new MySQL(conn);
  return ObjectProxy(mysql);
};