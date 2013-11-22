/**
 * https://github.com/justspamjustin/BrowserStig
 * BrowserStig v 0.1.1
 */

var BrowserStig =
(function () {
  'use strict';
  var frameStyles = [
    'width:100%',
    'height:100%',
    'border:none'
  ];
  var iframeTemplate = '<iframe id="stig-frame" name="stig-frame" src="<%= initialUrl %>" style="<%= frameStyles %>"/>';

  var defaultOptions = {
    waitForElementTimeout: 10000,
    initialUrl: '/',
    frameStyles: frameStyles
  };

  var breaker = {};

  var Util = {
    extend: function(obj) {
      this.each(Array.prototype.slice.call(arguments, 1), function(source) {
        if (source) {
          for (var prop in source) {
            obj[prop] = source[prop];
          }
        }
      });
      return obj;
    },
    each: function(obj, iterator, context) {
      if (obj == null) return;
      if (Array.prototype.forEach && obj.forEach === Array.prototype.forEach) {
        obj.forEach(iterator, context);
      } else if (obj.length === +obj.length) {
        for (var i = 0, length = obj.length; i < length; i++) {
          if (iterator.call(context, obj[i], i, obj) === breaker) return;
        }
      } else {
        var keys = this.keys(obj);
        for (var i = 0, length = keys.length; i < length; i++) {
          if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
        }
      }
    },
    keys: Object.keys || function(obj) {
      if (obj !== Object(obj)) throw new TypeError('Invalid object');
      var keys = [];
      for (var key in obj) if (obj.hasOwnProperty(key)) keys.push(key);
      return keys;
    },
    argsToArray: function (argumentsObject) {
      return Array.prototype.slice.call(argumentsObject, 0);
    }
  };

  var BrowserStig = function (options) {
    this.options = Util.extend({}, defaultOptions, options);
    document.body.innerHTML = iframeTemplate.replace('<%= initialUrl %>', this.options.initialUrl).replace('<%= frameStyles %>', this.options.frameStyles.join(';'));
    this.selectedElement = null;
    this.steps = [];
    this._buildImmediateActions();
    this._installJQueryInWindow();
    this._installJQueryOnFrameLoad();
  };

  BrowserStig.prototype = {

    open: function () {
      this._addStep('open', Util.argsToArray(arguments));
    },

    wait: function () {
      this._addStep('wait', Util.argsToArray(arguments));
    },

    setCookie: function () {
      this._addStep('setCookie', Util.argsToArray(arguments));
    },

    el: function (elementSelector) {
      this.selectedElement = elementSelector;
      return this.immediateActions;
    },

    run: function (done) {
      this._runSteps(done);
    },

    _runSteps: function (done) {
      var _this = this;
      if (this.steps.length > 0) {
        var step = this._popFrontStep();
        this._runStep(step, function () {
          _this._runSteps(done);
        });
      } else {
        done();
      }
    },

    _runStep: function (step, done) {
      step.args.push(done);
      this.actions[step.fn].apply(this, step.args);
    },

    actions: {
      open: function (className, url, done) {
        var _this = this;
        this._waitForJQueryAvailableInWindow(function () {
          var frame = _this.getFrame();
          frame.attr('src', url);
          frame.bind('load.open', function() {
            frame.unbind('load.open');
            done();
          });
        });
      },
      wait: function (cssSelector, millis, done) {
        setTimeout(function () {
          done();
        }, millis);
      },
      setCookie: function (cssSelector, cookieList, done) {
        var _this = this;
        this._waitForJQueryAvailableInWindow(function () {
          setTimeout(function () {
            var cookies = cookieList.split(';');
            Util.each(cookies, function (cookie) {
              _this.getFrame().get(0).contentDocument.cookie = cookie;
            });
            done();
          }, 200);
        });
      },
      click: function (cssSelector, done) {
        var _this = this;
        this._waitForElement(cssSelector, function () {
          cssSelector = escape(cssSelector);
          _this._execInFrame('jQuery(unescape("' + cssSelector + '")).click();');
          done();
        });
      },
      typeKey: function (cssSelector, keyCode, done) {
        var _this = this;
        this._waitForElement(cssSelector, function () {
          cssSelector = escape(cssSelector);
          _this._execInFrame('\
          var e = jQuery.Event("keydown");\
          e.which = ' + keyCode + ';\
          e.keyCode = ' + keyCode + ';\
          jQuery(unescape("' + cssSelector + '")).trigger(e);\
          e = jQuery.Event("keyup");\
          e.which = ' + keyCode + ';\
          e.keyCode = ' + keyCode + ';\
          jQuery(unescape("' + cssSelector + '")).trigger(e);\
        ');
          done();
        });
      },
      type: function (cssSelector, value, done) {
        var _this = this;
        this._waitForElement(cssSelector, function () {
          var $el = _this._getInFrame(cssSelector);
          cssSelector = escape(cssSelector);
          value = escape(value);
          _this._execInFrame('jQuery(unescape("' + cssSelector + '")).focus();');
          if ($el.attr('contenteditable') && $el.attr('contenteditable') !== 'false') {
            _this._execInFrame('jQuery(unescape("' + cssSelector + '")).text(unescape("' + value + '"));');
          } else {
            _this._execInFrame('jQuery(unescape("' + cssSelector + '")).val(unescape("' + value + '"));');
          }
          _this._execInFrame('jQuery(unescape("' + cssSelector + '")).keydown();');
          _this._execInFrame('jQuery(unescape("' + cssSelector + '")).keyup();');
          _this._execInFrame('jQuery(unescape("' + cssSelector + '")).blur();');
          _this._execInFrame('jQuery(unescape("' + cssSelector + '")).focusout();');
          done();
        });
      },
      value: function (cssSelector, value, done) {
        var _this = this;
        this._waitForElement(cssSelector, function () {
          cssSelector = escape(cssSelector);
          value = escape(value);
          _this._execInFrame('jQuery(unescape("' + cssSelector + '")).val("' + value + '");');
          done();
        });
      },
      hover: function (cssSelector, done) {
        var _this = this;
        this._waitForElement(cssSelector, function () {
          cssSelector = escape(cssSelector);
          _this._execInFrame('jQuery(unescape("' + cssSelector + '")).mouseover();');
          done();
        });
      },
      count: function (cssSelector, doneCallback, done) {
        this.actions.get.call(this, cssSelector, function (el) {
          doneCallback(el.length);
        }, done);
      },
      get: function (cssSelector, doneCallback, done) {
        var _this = this;
        this._waitForElement(cssSelector, function () {
          doneCallback(_this._getInFrame(cssSelector));
          done();
        });
      },
      text: function (cssSelector, doneCallback, done) {
        var _this = this;
        this._waitForElement(cssSelector, function () {
          doneCallback(_this._getInFrame(cssSelector).text());
          done();
        });
      }
    },

    _buildImmediateActions: function () {
      var immediateActions = {};
      var _this = this;
      Util.each(Util.keys(this.actions), function (key) {
        immediateActions[key] = function () {
          return _this._addStep(key, Util.argsToArray(arguments));
        };
      });

      this.immediateActions = immediateActions;
    },

    // Util

    getFrame: function () {
      return jQuery('#stig-frame');
    },

    _execInFrame: function (scriptStr) {
      var script = this.getFrame().get(0).contentDocument.createElement('script');
      script.innerHTML = '(function () {' + scriptStr + '})()';
      this.getFrame().get(0).contentDocument.body.appendChild(script);
    },

    _getInFrame: function (cssSelector) {
      return this.getFrame().contents().find(cssSelector);
    },

    _addStep: function (fnName, argArray) {
      argArray.unshift(this.selectedElement);
      this.steps.push({
        fn: fnName,
        args: argArray
      });
      return this.immediateActions;
    },

    _popFrontStep: function () {
      return this.steps.splice(0, 1)[0];
    },

    _getElementCount: function (cssSelector) {
      return this._getInFrame(cssSelector).length;
    },

    _doesElementExist: function (cssSelector) {
      return this._getElementCount(cssSelector) > 0;
    },

    _waitForElement: function (cssSelector, done) {
      var _this = this;
      this._waitForJQueryAvailable(function () {
        _this._waitForCondition(function () {
          return _this._doesElementExist(cssSelector);
        }, 'Timeout while waiting for element: ' + cssSelector,  done);
      });

    },

    _installJQueryInWindow: function () {
      var script = document.createElement('script');
      script.src = '//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js';
      document.body.appendChild(script);
    },

    _installJQueryInFrame: function () {
      var frameDocument = this.getFrame().get(0).contentDocument;
      var script = frameDocument.createElement('script');
      script.src = '//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js';
      frameDocument.body.appendChild(script);
    },

    _waitForJQueryAvailable: function (done) {
      var _this = this;
      this._waitForJQueryAvailableInWindow(function () {
        _this._waitForJQueryAvailableInFrame(done);
      });
    },

    _waitForJQueryAvailableInWindow: function (done) {
      this._waitForCondition(function () {
        return window.hasOwnProperty('jQuery');
      }, 'Timeout waiting for Window JQuery', done);
    },

    _waitForJQueryAvailableInFrame: function (done) {
      var _this = this;
      this._waitForCondition(function () {
        return _this.getFrame().get(0).contentWindow.hasOwnProperty('jQuery');
      }, 'Timeout while waiting for Frame Jquery', done);
    },

    _waitForCondition: function (conditionFn, timeoutMessage, done) {
      this._waitForConditionRecursive(conditionFn, timeoutMessage, this.options.waitForElementTimeout, done);
    },

    _waitForConditionRecursive: function (conditionFn, timeoutMessage, timeLeft, done) {
      if (timeLeft > 0) {
        if (conditionFn()) {
          done();
        } else {
          var intervalTime = 50;
          timeLeft -= intervalTime;
          var _this = this;
          setTimeout(function () {
            _this._waitForConditionRecursive(conditionFn, timeoutMessage, timeLeft, done);
          }, intervalTime);
        }
      } else {
        throw new Error(timeoutMessage);
      }
    },

    _installJQueryOnFrameLoad: function () {
      var _this = this;
      this._waitForJQueryAvailableInWindow(function () {
        var frame = _this.getFrame();
        frame.bind('load', function () {
          _this._installJQueryInFrame();
        });
      });
    }
  };

  BrowserStig.keyCodes = { NUMBER_0: 48, NUMBER_1: 49, NUMBER_2: 50, NUMBER_3: 51, NUMBER_4: 52, NUMBER_5: 53, NUMBER_6: 54, NUMBER_7: 55, NUMBER_8: 56, NUMBER_9: 57, BACKSPACE: 8, TAB: 9, ENTER: 13, SHIFT: 16, CTRL: 17, ALT: 18, PAUSE_BREAK: 19, CAPS_LOCK: 20, ESCAPE: 27, PAGE_UP: 33, SPACE: 32, PAGE_DOWN: 34, END: 35, HOME: 36, ARROW_LEFT: 37, ARROW_UP: 38, ARROW_RIGHT: 39, ARROW_DOWN: 40, PRINT_SCREEN: 44, INSERT: 45, DELETE: 46, A: 65, B: 66, C: 67, D: 68, E: 69, F: 70, G: 71, H: 72, I: 73, J: 74, K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84, U: 85, V: 86, W: 87, X: 88, Y: 89, Z: 90, LEFT_WINDOW_KEY: 91, RIGHT_WINDOW_KEY: 92, SELECT_KEY: 93, NUMPAD_0: 96, NUMPAD_1: 97, NUMPAD_2: 98, NUMPAD_3: 99, NUMPAD_4: 100, NUMPAD_5: 101, NUMPAD_6: 102, NUMPAD_7: 103, NUMPAD_8: 104, NUMPAD_9: 105, MULTIPLY: 106, ADD: 107, SUBTRACT: 109, DECIMAL_POINT: 110, DIVIDE: 111, F1: 112, F2: 113, F3: 114, F4: 115, F5: 116, F6: 117, F7: 118, F8: 119, F9: 120, F10: 121, F11: 122, F12: 123, NUM_LOCK: 144, SCROLL_LOCK: 145, MY_COMPUTER: 182, MY_CALCULATOR: 183, SEMI_COLON: 186, EQUAL_SIGN: 107, COMMA: 188, DASH: 189, PERIOD: 190, FORWARD_SLASH: 191, OPEN_BRACKET: 219, BACK_SLASH: 220, CLOSE_BRACKET: 221, SINGLE_QUOTE: 222 };

  return BrowserStig;
})();

