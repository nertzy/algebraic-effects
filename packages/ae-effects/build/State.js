"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _core = require("@algebraic-effects/core");

var State = (0, _core.createEffect)('State', {
  get: (0, _core.func)([], 'a'),
  set: (0, _core.func)(['a']),
  update: (0, _core.func)(['a -> a'], 'a')
});

State.of = function (initState) {
  var CustomState = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : State;
  var current = initState;
  return CustomState.handler({
    get: function get(_ref) {
      var resume = _ref.resume;
      return function () {
        return resume(current);
      };
    },
    set: function set(_ref2) {
      var resume = _ref2.resume;
      return function (x) {
        return resume(current = x);
      };
    },
    update: function update(_ref3) {
      var resume = _ref3.resume;
      return function (fn) {
        return resume(current = fn(current));
      };
    }
  });
};

var _default = State;
exports.default = _default;