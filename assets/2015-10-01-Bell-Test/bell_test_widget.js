// Compiled from source code at https://github.com/Strilanc/Bell-Tester
(function(global) {
  'use strict';
  if (global.$traceurRuntime) {
    return;
  }
  var $Object = Object;
  var $TypeError = TypeError;
  var $create = $Object.create;
  var $defineProperties = $Object.defineProperties;
  var $defineProperty = $Object.defineProperty;
  var $freeze = $Object.freeze;
  var $getOwnPropertyDescriptor = $Object.getOwnPropertyDescriptor;
  var $getOwnPropertyNames = $Object.getOwnPropertyNames;
  var $keys = $Object.keys;
  var $hasOwnProperty = $Object.prototype.hasOwnProperty;
  var $toString = $Object.prototype.toString;
  var $preventExtensions = Object.preventExtensions;
  var $seal = Object.seal;
  var $isExtensible = Object.isExtensible;
  var $apply = Function.prototype.call.bind(Function.prototype.apply);
  function $bind(operand, thisArg, args) {
    var argArray = [thisArg];
    for (var i = 0; i < args.length; i++) {
      argArray[i + 1] = args[i];
    }
    var func = $apply(Function.prototype.bind, operand, argArray);
    return func;
  }
  function $construct(func, argArray) {
    var object = new ($bind(func, null, argArray));
    return object;
  }
  var counter = 0;
  function newUniqueString() {
    return '__$' + Math.floor(Math.random() * 1e9) + '$' + ++counter + '$__';
  }
  var privateNames = $create(null);
  function isPrivateName(s) {
    return privateNames[s];
  }
  function createPrivateName() {
    var s = newUniqueString();
    privateNames[s] = true;
    return s;
  }
  var CONTINUATION_TYPE = Object.create(null);
  function createContinuation(operand, thisArg, argsArray) {
    return [CONTINUATION_TYPE, operand, thisArg, argsArray];
  }
  function isContinuation(object) {
    return object && object[0] === CONTINUATION_TYPE;
  }
  var isTailRecursiveName = null;
  function setupProperTailCalls() {
    isTailRecursiveName = createPrivateName();
    Function.prototype.call = initTailRecursiveFunction(function call(thisArg) {
      var result = tailCall(function(thisArg) {
        var argArray = [];
        for (var i = 1; i < arguments.length; ++i) {
          argArray[i - 1] = arguments[i];
        }
        var continuation = createContinuation(this, thisArg, argArray);
        return continuation;
      }, this, arguments);
      return result;
    });
    Function.prototype.apply = initTailRecursiveFunction(function apply(thisArg, argArray) {
      var result = tailCall(function(thisArg, argArray) {
        var continuation = createContinuation(this, thisArg, argArray);
        return continuation;
      }, this, arguments);
      return result;
    });
  }
  function initTailRecursiveFunction(func) {
    if (isTailRecursiveName === null) {
      setupProperTailCalls();
    }
    func[isTailRecursiveName] = true;
    return func;
  }
  function isTailRecursive(func) {
    return !!func[isTailRecursiveName];
  }
  function tailCall(func, thisArg, argArray) {
    var continuation = argArray[0];
    if (isContinuation(continuation)) {
      continuation = $apply(func, thisArg, continuation[3]);
      return continuation;
    }
    continuation = createContinuation(func, thisArg, argArray);
    while (true) {
      if (isTailRecursive(func)) {
        continuation = $apply(func, continuation[2], [continuation]);
      } else {
        continuation = $apply(func, continuation[2], continuation[3]);
      }
      if (!isContinuation(continuation)) {
        return continuation;
      }
      func = continuation[1];
    }
  }
  function construct() {
    var object;
    if (isTailRecursive(this)) {
      object = $construct(this, [createContinuation(null, null, arguments)]);
    } else {
      object = $construct(this, arguments);
    }
    return object;
  }
  var $traceurRuntime = {
    initTailRecursiveFunction: initTailRecursiveFunction,
    call: tailCall,
    continuation: createContinuation,
    construct: construct
  };
  (function() {
    function nonEnum(value) {
      return {
        configurable: true,
        enumerable: false,
        value: value,
        writable: true
      };
    }
    var method = nonEnum;
    var symbolInternalProperty = newUniqueString();
    var symbolDescriptionProperty = newUniqueString();
    var symbolDataProperty = newUniqueString();
    var symbolValues = $create(null);
    function isShimSymbol(symbol) {
      return typeof symbol === 'object' && symbol instanceof SymbolValue;
    }
    function typeOf(v) {
      if (isShimSymbol(v))
        return 'symbol';
      return typeof v;
    }
    function Symbol(description) {
      var value = new SymbolValue(description);
      if (!(this instanceof Symbol))
        return value;
      throw new TypeError('Symbol cannot be new\'ed');
    }
    $defineProperty(Symbol.prototype, 'constructor', nonEnum(Symbol));
    $defineProperty(Symbol.prototype, 'toString', method(function() {
      var symbolValue = this[symbolDataProperty];
      return symbolValue[symbolInternalProperty];
    }));
    $defineProperty(Symbol.prototype, 'valueOf', method(function() {
      var symbolValue = this[symbolDataProperty];
      if (!symbolValue)
        throw TypeError('Conversion from symbol to string');
      if (!getOption('symbols'))
        return symbolValue[symbolInternalProperty];
      return symbolValue;
    }));
    function SymbolValue(description) {
      var key = newUniqueString();
      $defineProperty(this, symbolDataProperty, {value: this});
      $defineProperty(this, symbolInternalProperty, {value: key});
      $defineProperty(this, symbolDescriptionProperty, {value: description});
      freeze(this);
      symbolValues[key] = this;
    }
    $defineProperty(SymbolValue.prototype, 'constructor', nonEnum(Symbol));
    $defineProperty(SymbolValue.prototype, 'toString', {
      value: Symbol.prototype.toString,
      enumerable: false
    });
    $defineProperty(SymbolValue.prototype, 'valueOf', {
      value: Symbol.prototype.valueOf,
      enumerable: false
    });
    var hashProperty = createPrivateName();
    var hashPropertyDescriptor = {value: undefined};
    var hashObjectProperties = {
      hash: {value: undefined},
      self: {value: undefined}
    };
    var hashCounter = 0;
    function getOwnHashObject(object) {
      var hashObject = object[hashProperty];
      if (hashObject && hashObject.self === object)
        return hashObject;
      if ($isExtensible(object)) {
        hashObjectProperties.hash.value = hashCounter++;
        hashObjectProperties.self.value = object;
        hashPropertyDescriptor.value = $create(null, hashObjectProperties);
        $defineProperty(object, hashProperty, hashPropertyDescriptor);
        return hashPropertyDescriptor.value;
      }
      return undefined;
    }
    function freeze(object) {
      getOwnHashObject(object);
      return $freeze.apply(this, arguments);
    }
    function preventExtensions(object) {
      getOwnHashObject(object);
      return $preventExtensions.apply(this, arguments);
    }
    function seal(object) {
      getOwnHashObject(object);
      return $seal.apply(this, arguments);
    }
    freeze(SymbolValue.prototype);
    function isSymbolString(s) {
      return symbolValues[s] || privateNames[s];
    }
    function toProperty(name) {
      if (isShimSymbol(name))
        return name[symbolInternalProperty];
      return name;
    }
    function removeSymbolKeys(array) {
      var rv = [];
      for (var i = 0; i < array.length; i++) {
        if (!isSymbolString(array[i])) {
          rv.push(array[i]);
        }
      }
      return rv;
    }
    function getOwnPropertyNames(object) {
      return removeSymbolKeys($getOwnPropertyNames(object));
    }
    function keys(object) {
      return removeSymbolKeys($keys(object));
    }
    function getOwnPropertySymbols(object) {
      var rv = [];
      var names = $getOwnPropertyNames(object);
      for (var i = 0; i < names.length; i++) {
        var symbol = symbolValues[names[i]];
        if (symbol) {
          rv.push(symbol);
        }
      }
      return rv;
    }
    function getOwnPropertyDescriptor(object, name) {
      return $getOwnPropertyDescriptor(object, toProperty(name));
    }
    function hasOwnProperty(name) {
      return $hasOwnProperty.call(this, toProperty(name));
    }
    function getOption(name) {
      return global.$traceurRuntime.options[name];
    }
    function defineProperty(object, name, descriptor) {
      if (isShimSymbol(name)) {
        name = name[symbolInternalProperty];
      }
      $defineProperty(object, name, descriptor);
      return object;
    }
    function polyfillObject(Object) {
      $defineProperty(Object, 'defineProperty', {value: defineProperty});
      $defineProperty(Object, 'getOwnPropertyNames', {value: getOwnPropertyNames});
      $defineProperty(Object, 'getOwnPropertyDescriptor', {value: getOwnPropertyDescriptor});
      $defineProperty(Object.prototype, 'hasOwnProperty', {value: hasOwnProperty});
      $defineProperty(Object, 'freeze', {value: freeze});
      $defineProperty(Object, 'preventExtensions', {value: preventExtensions});
      $defineProperty(Object, 'seal', {value: seal});
      $defineProperty(Object, 'keys', {value: keys});
    }
    function exportStar(object) {
      for (var i = 1; i < arguments.length; i++) {
        var names = $getOwnPropertyNames(arguments[i]);
        for (var j = 0; j < names.length; j++) {
          var name = names[j];
          if (name === '__esModule' || name === 'default' || isSymbolString(name))
            continue;
          (function(mod, name) {
            $defineProperty(object, name, {
              get: function() {
                return mod[name];
              },
              enumerable: true
            });
          })(arguments[i], names[j]);
        }
      }
      return object;
    }
    function isObject(x) {
      return x != null && (typeof x === 'object' || typeof x === 'function');
    }
    function toObject(x) {
      if (x == null)
        throw $TypeError();
      return $Object(x);
    }
    function checkObjectCoercible(argument) {
      if (argument == null) {
        throw new TypeError('Value cannot be converted to an Object');
      }
      return argument;
    }
    var hasNativeSymbol;
    function polyfillSymbol(global, Symbol) {
      if (!global.Symbol) {
        global.Symbol = Symbol;
        Object.getOwnPropertySymbols = getOwnPropertySymbols;
        hasNativeSymbol = false;
      } else {
        hasNativeSymbol = true;
      }
      if (!global.Symbol.iterator) {
        global.Symbol.iterator = Symbol('Symbol.iterator');
      }
      if (!global.Symbol.observer) {
        global.Symbol.observer = Symbol('Symbol.observer');
      }
    }
    function hasNativeSymbolFunc() {
      return hasNativeSymbol;
    }
    function setupGlobals(global) {
      polyfillSymbol(global, Symbol);
      global.Reflect = global.Reflect || {};
      global.Reflect.global = global.Reflect.global || global;
      polyfillObject(global.Object);
    }
    setupGlobals(global);
    global.$traceurRuntime = {
      call: tailCall,
      checkObjectCoercible: checkObjectCoercible,
      construct: construct,
      continuation: createContinuation,
      createPrivateName: createPrivateName,
      defineProperties: $defineProperties,
      defineProperty: $defineProperty,
      exportStar: exportStar,
      getOwnHashObject: getOwnHashObject,
      getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
      getOwnPropertyNames: $getOwnPropertyNames,
      hasNativeSymbol: hasNativeSymbolFunc,
      initTailRecursiveFunction: initTailRecursiveFunction,
      isObject: isObject,
      isPrivateName: isPrivateName,
      isSymbolString: isSymbolString,
      keys: $keys,
      options: {},
      setupGlobals: setupGlobals,
      toObject: toObject,
      toProperty: toProperty,
      typeof: typeOf
    };
  })();
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);
(function() {
  function buildFromEncodedParts(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_queryData, opt_fragment) {
    var out = [];
    if (opt_scheme) {
      out.push(opt_scheme, ':');
    }
    if (opt_domain) {
      out.push('//');
      if (opt_userInfo) {
        out.push(opt_userInfo, '@');
      }
      out.push(opt_domain);
      if (opt_port) {
        out.push(':', opt_port);
      }
    }
    if (opt_path) {
      out.push(opt_path);
    }
    if (opt_queryData) {
      out.push('?', opt_queryData);
    }
    if (opt_fragment) {
      out.push('#', opt_fragment);
    }
    return out.join('');
  }
  var splitRe = new RegExp('^' + '(?:' + '([^:/?#.]+)' + ':)?' + '(?://' + '(?:([^/?#]*)@)?' + '([\\w\\d\\-\\u0100-\\uffff.%]*)' + '(?::([0-9]+))?' + ')?' + '([^?#]+)?' + '(?:\\?([^#]*))?' + '(?:#(.*))?' + '$');
  var ComponentIndex = {
    SCHEME: 1,
    USER_INFO: 2,
    DOMAIN: 3,
    PORT: 4,
    PATH: 5,
    QUERY_DATA: 6,
    FRAGMENT: 7
  };
  function split(uri) {
    return (uri.match(splitRe));
  }
  function removeDotSegments(path) {
    if (path === '/')
      return '/';
    var leadingSlash = path[0] === '/' ? '/' : '';
    var trailingSlash = path.slice(-1) === '/' ? '/' : '';
    var segments = path.split('/');
    var out = [];
    var up = 0;
    for (var pos = 0; pos < segments.length; pos++) {
      var segment = segments[pos];
      switch (segment) {
        case '':
        case '.':
          break;
        case '..':
          if (out.length)
            out.pop();
          else
            up++;
          break;
        default:
          out.push(segment);
      }
    }
    if (!leadingSlash) {
      while (up-- > 0) {
        out.unshift('..');
      }
      if (out.length === 0)
        out.push('.');
    }
    return leadingSlash + out.join('/') + trailingSlash;
  }
  function joinAndCanonicalizePath(parts) {
    var path = parts[ComponentIndex.PATH] || '';
    path = removeDotSegments(path);
    parts[ComponentIndex.PATH] = path;
    return buildFromEncodedParts(parts[ComponentIndex.SCHEME], parts[ComponentIndex.USER_INFO], parts[ComponentIndex.DOMAIN], parts[ComponentIndex.PORT], parts[ComponentIndex.PATH], parts[ComponentIndex.QUERY_DATA], parts[ComponentIndex.FRAGMENT]);
  }
  function canonicalizeUrl(url) {
    var parts = split(url);
    return joinAndCanonicalizePath(parts);
  }
  function resolveUrl(base, url) {
    var parts = split(url);
    var baseParts = split(base);
    if (parts[ComponentIndex.SCHEME]) {
      return joinAndCanonicalizePath(parts);
    } else {
      parts[ComponentIndex.SCHEME] = baseParts[ComponentIndex.SCHEME];
    }
    for (var i = ComponentIndex.SCHEME; i <= ComponentIndex.PORT; i++) {
      if (!parts[i]) {
        parts[i] = baseParts[i];
      }
    }
    if (parts[ComponentIndex.PATH][0] == '/') {
      return joinAndCanonicalizePath(parts);
    }
    var path = baseParts[ComponentIndex.PATH];
    var index = path.lastIndexOf('/');
    path = path.slice(0, index + 1) + parts[ComponentIndex.PATH];
    parts[ComponentIndex.PATH] = path;
    return joinAndCanonicalizePath(parts);
  }
  function isAbsolute(name) {
    if (!name)
      return false;
    if (name[0] === '/')
      return true;
    var parts = split(name);
    if (parts[ComponentIndex.SCHEME])
      return true;
    return false;
  }
  $traceurRuntime.canonicalizeUrl = canonicalizeUrl;
  $traceurRuntime.isAbsolute = isAbsolute;
  $traceurRuntime.removeDotSegments = removeDotSegments;
  $traceurRuntime.resolveUrl = resolveUrl;
})();
(function(global) {
  'use strict';
  var $__3 = $traceurRuntime,
      canonicalizeUrl = $__3.canonicalizeUrl,
      resolveUrl = $__3.resolveUrl,
      isAbsolute = $__3.isAbsolute;
  var moduleInstantiators = Object.create(null);
  var baseURL;
  if (global.location && global.location.href)
    baseURL = resolveUrl(global.location.href, './');
  else
    baseURL = '';
  function UncoatedModuleEntry(url, uncoatedModule) {
    this.url = url;
    this.value_ = uncoatedModule;
  }
  function ModuleEvaluationError(erroneousModuleName, cause) {
    this.message = this.constructor.name + ': ' + this.stripCause(cause) + ' in ' + erroneousModuleName;
    if (!(cause instanceof ModuleEvaluationError) && cause.stack)
      this.stack = this.stripStack(cause.stack);
    else
      this.stack = '';
  }
  ModuleEvaluationError.prototype = Object.create(Error.prototype);
  ModuleEvaluationError.prototype.constructor = ModuleEvaluationError;
  ModuleEvaluationError.prototype.stripError = function(message) {
    return message.replace(/.*Error:/, this.constructor.name + ':');
  };
  ModuleEvaluationError.prototype.stripCause = function(cause) {
    if (!cause)
      return '';
    if (!cause.message)
      return cause + '';
    return this.stripError(cause.message);
  };
  ModuleEvaluationError.prototype.loadedBy = function(moduleName) {
    this.stack += '\n loaded by ' + moduleName;
  };
  ModuleEvaluationError.prototype.stripStack = function(causeStack) {
    var stack = [];
    causeStack.split('\n').some(function(frame) {
      if (/UncoatedModuleInstantiator/.test(frame))
        return true;
      stack.push(frame);
    });
    stack[0] = this.stripError(stack[0]);
    return stack.join('\n');
  };
  function beforeLines(lines, number) {
    var result = [];
    var first = number - 3;
    if (first < 0)
      first = 0;
    for (var i = first; i < number; i++) {
      result.push(lines[i]);
    }
    return result;
  }
  function afterLines(lines, number) {
    var last = number + 1;
    if (last > lines.length - 1)
      last = lines.length - 1;
    var result = [];
    for (var i = number; i <= last; i++) {
      result.push(lines[i]);
    }
    return result;
  }
  function columnSpacing(columns) {
    var result = '';
    for (var i = 0; i < columns - 1; i++) {
      result += '-';
    }
    return result;
  }
  function UncoatedModuleInstantiator(url, func) {
    UncoatedModuleEntry.call(this, url, null);
    this.func = func;
  }
  UncoatedModuleInstantiator.prototype = Object.create(UncoatedModuleEntry.prototype);
  UncoatedModuleInstantiator.prototype.getUncoatedModule = function() {
    var $__2 = this;
    if (this.value_)
      return this.value_;
    try {
      var relativeRequire;
      if (typeof $traceurRuntime !== undefined && $traceurRuntime.require) {
        relativeRequire = $traceurRuntime.require.bind(null, this.url);
      }
      return this.value_ = this.func.call(global, relativeRequire);
    } catch (ex) {
      if (ex instanceof ModuleEvaluationError) {
        ex.loadedBy(this.url);
        throw ex;
      }
      if (ex.stack) {
        var lines = this.func.toString().split('\n');
        var evaled = [];
        ex.stack.split('\n').some(function(frame, index) {
          if (frame.indexOf('UncoatedModuleInstantiator.getUncoatedModule') > 0)
            return true;
          var m = /(at\s[^\s]*\s).*>:(\d*):(\d*)\)/.exec(frame);
          if (m) {
            var line = parseInt(m[2], 10);
            evaled = evaled.concat(beforeLines(lines, line));
            if (index === 1) {
              evaled.push(columnSpacing(m[3]) + '^ ' + $__2.url);
            } else {
              evaled.push(columnSpacing(m[3]) + '^');
            }
            evaled = evaled.concat(afterLines(lines, line));
            evaled.push('= = = = = = = = =');
          } else {
            evaled.push(frame);
          }
        });
        ex.stack = evaled.join('\n');
      }
      throw new ModuleEvaluationError(this.url, ex);
    }
  };
  function getUncoatedModuleInstantiator(name) {
    if (!name)
      return;
    var url = ModuleStore.normalize(name);
    return moduleInstantiators[url];
  }
  ;
  var moduleInstances = Object.create(null);
  var liveModuleSentinel = {};
  function Module(uncoatedModule) {
    var isLive = arguments[1];
    var coatedModule = Object.create(null);
    Object.getOwnPropertyNames(uncoatedModule).forEach(function(name) {
      var getter,
          value;
      if (isLive === liveModuleSentinel) {
        var descr = Object.getOwnPropertyDescriptor(uncoatedModule, name);
        if (descr.get)
          getter = descr.get;
      }
      if (!getter) {
        value = uncoatedModule[name];
        getter = function() {
          return value;
        };
      }
      Object.defineProperty(coatedModule, name, {
        get: getter,
        enumerable: true
      });
    });
    Object.preventExtensions(coatedModule);
    return coatedModule;
  }
  var ModuleStore = {
    normalize: function(name, refererName, refererAddress) {
      if (typeof name !== 'string')
        throw new TypeError('module name must be a string, not ' + typeof name);
      if (isAbsolute(name))
        return canonicalizeUrl(name);
      if (/[^\.]\/\.\.\//.test(name)) {
        throw new Error('module name embeds /../: ' + name);
      }
      if (name[0] === '.' && refererName)
        return resolveUrl(refererName, name);
      return canonicalizeUrl(name);
    },
    get: function(normalizedName) {
      var m = getUncoatedModuleInstantiator(normalizedName);
      if (!m)
        return undefined;
      var moduleInstance = moduleInstances[m.url];
      if (moduleInstance)
        return moduleInstance;
      moduleInstance = Module(m.getUncoatedModule(), liveModuleSentinel);
      return moduleInstances[m.url] = moduleInstance;
    },
    set: function(normalizedName, module) {
      normalizedName = String(normalizedName);
      moduleInstantiators[normalizedName] = new UncoatedModuleInstantiator(normalizedName, function() {
        return module;
      });
      moduleInstances[normalizedName] = module;
    },
    get baseURL() {
      return baseURL;
    },
    set baseURL(v) {
      baseURL = String(v);
    },
    registerModule: function(name, deps, func) {
      var normalizedName = ModuleStore.normalize(name);
      if (moduleInstantiators[normalizedName])
        throw new Error('duplicate module named ' + normalizedName);
      moduleInstantiators[normalizedName] = new UncoatedModuleInstantiator(normalizedName, func);
    },
    bundleStore: Object.create(null),
    register: function(name, deps, func) {
      if (!deps || !deps.length && !func.length) {
        this.registerModule(name, deps, func);
      } else {
        this.bundleStore[name] = {
          deps: deps,
          execute: function() {
            var $__2 = arguments;
            var depMap = {};
            deps.forEach(function(dep, index) {
              return depMap[dep] = $__2[index];
            });
            var registryEntry = func.call(this, depMap);
            registryEntry.execute.call(this);
            return registryEntry.exports;
          }
        };
      }
    },
    getAnonymousModule: function(func) {
      return new Module(func.call(global), liveModuleSentinel);
    }
  };
  var moduleStoreModule = new Module({ModuleStore: ModuleStore});
  ModuleStore.set('@traceur/src/runtime/ModuleStore.js', moduleStoreModule);
  var setupGlobals = $traceurRuntime.setupGlobals;
  $traceurRuntime.setupGlobals = function(global) {
    setupGlobals(global);
  };
  $traceurRuntime.ModuleStore = ModuleStore;
  global.System = {
    register: ModuleStore.register.bind(ModuleStore),
    registerModule: ModuleStore.registerModule.bind(ModuleStore),
    get: ModuleStore.get,
    set: ModuleStore.set,
    normalize: ModuleStore.normalize
  };
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);
System.registerModule("traceur-runtime@0.0.91/src/runtime/async.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/async.js";
  if (typeof $traceurRuntime !== 'object') {
    throw new Error('traceur runtime not found.');
  }
  var $createPrivateName = $traceurRuntime.createPrivateName;
  var $defineProperty = $traceurRuntime.defineProperty;
  var $defineProperties = $traceurRuntime.defineProperties;
  var $create = Object.create;
  var thisName = $createPrivateName();
  var argsName = $createPrivateName();
  var observeName = $createPrivateName();
  function AsyncGeneratorFunction() {}
  function AsyncGeneratorFunctionPrototype() {}
  AsyncGeneratorFunction.prototype = AsyncGeneratorFunctionPrototype;
  AsyncGeneratorFunctionPrototype.constructor = AsyncGeneratorFunction;
  $defineProperty(AsyncGeneratorFunctionPrototype, 'constructor', {enumerable: false});
  var AsyncGeneratorContext = function() {
    function AsyncGeneratorContext(observer) {
      var $__2 = this;
      this.decoratedObserver = $traceurRuntime.createDecoratedGenerator(observer, function() {
        $__2.done = true;
      });
      this.done = false;
      this.inReturn = false;
    }
    return ($traceurRuntime.createClass)(AsyncGeneratorContext, {
      throw: function(error) {
        if (!this.inReturn) {
          throw error;
        }
      },
      yield: function(value) {
        if (this.done) {
          this.inReturn = true;
          throw undefined;
        }
        var result;
        try {
          result = this.decoratedObserver.next(value);
        } catch (e) {
          this.done = true;
          throw e;
        }
        if (result === undefined) {
          return;
        }
        if (result.done) {
          this.done = true;
          this.inReturn = true;
          throw undefined;
        }
        return result.value;
      },
      yieldFor: function(observable) {
        var ctx = this;
        return $traceurRuntime.observeForEach(observable[$traceurRuntime.toProperty(Symbol.observer)].bind(observable), function(value) {
          if (ctx.done) {
            this.return();
            return;
          }
          var result;
          try {
            result = ctx.decoratedObserver.next(value);
          } catch (e) {
            ctx.done = true;
            throw e;
          }
          if (result === undefined) {
            return;
          }
          if (result.done) {
            ctx.done = true;
          }
          return result;
        });
      }
    }, {});
  }();
  AsyncGeneratorFunctionPrototype.prototype[Symbol.observer] = function(observer) {
    var observe = this[observeName];
    var ctx = new AsyncGeneratorContext(observer);
    $traceurRuntime.schedule(function() {
      return observe(ctx);
    }).then(function(value) {
      if (!ctx.done) {
        ctx.decoratedObserver.return(value);
      }
    }).catch(function(error) {
      if (!ctx.done) {
        ctx.decoratedObserver.throw(error);
      }
    });
    return ctx.decoratedObserver;
  };
  $defineProperty(AsyncGeneratorFunctionPrototype.prototype, Symbol.observer, {enumerable: false});
  function initAsyncGeneratorFunction(functionObject) {
    functionObject.prototype = $create(AsyncGeneratorFunctionPrototype.prototype);
    functionObject.__proto__ = AsyncGeneratorFunctionPrototype;
    return functionObject;
  }
  function createAsyncGeneratorInstance(observe, functionObject) {
    for (var args = [],
        $__10 = 2; $__10 < arguments.length; $__10++)
      args[$__10 - 2] = arguments[$__10];
    var object = $create(functionObject.prototype);
    object[thisName] = this;
    object[argsName] = args;
    object[observeName] = observe;
    return object;
  }
  function observeForEach(observe, next) {
    return new Promise(function(resolve, reject) {
      var generator = observe({
        next: function(value) {
          return next.call(generator, value);
        },
        throw: function(error) {
          reject(error);
        },
        return: function(value) {
          resolve(value);
        }
      });
    });
  }
  function schedule(asyncF) {
    return Promise.resolve().then(asyncF);
  }
  var generator = Symbol();
  var onDone = Symbol();
  var DecoratedGenerator = function() {
    function DecoratedGenerator(_generator, _onDone) {
      this[generator] = _generator;
      this[onDone] = _onDone;
    }
    return ($traceurRuntime.createClass)(DecoratedGenerator, {
      next: function(value) {
        var result = this[generator].next(value);
        if (result !== undefined && result.done) {
          this[onDone].call(this);
        }
        return result;
      },
      throw: function(error) {
        this[onDone].call(this);
        return this[generator].throw(error);
      },
      return: function(value) {
        this[onDone].call(this);
        return this[generator].return(value);
      }
    }, {});
  }();
  function createDecoratedGenerator(generator, onDone) {
    return new DecoratedGenerator(generator, onDone);
  }
  Array.prototype[$traceurRuntime.toProperty(Symbol.observer)] = function(observer) {
    var done = false;
    var decoratedObserver = createDecoratedGenerator(observer, function() {
      return done = true;
    });
    var $__6 = true;
    var $__7 = false;
    var $__8 = undefined;
    try {
      for (var $__4 = void 0,
          $__3 = (this)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__6 = ($__4 = $__3.next()).done); $__6 = true) {
        var value = $__4.value;
        {
          decoratedObserver.next(value);
          if (done) {
            return;
          }
        }
      }
    } catch ($__9) {
      $__7 = true;
      $__8 = $__9;
    } finally {
      try {
        if (!$__6 && $__3.return != null) {
          $__3.return();
        }
      } finally {
        if ($__7) {
          throw $__8;
        }
      }
    }
    decoratedObserver.return();
    return decoratedObserver;
  };
  $defineProperty(Array.prototype, $traceurRuntime.toProperty(Symbol.observer), {enumerable: false});
  $traceurRuntime.initAsyncGeneratorFunction = initAsyncGeneratorFunction;
  $traceurRuntime.createAsyncGeneratorInstance = createAsyncGeneratorInstance;
  $traceurRuntime.observeForEach = observeForEach;
  $traceurRuntime.schedule = schedule;
  $traceurRuntime.createDecoratedGenerator = createDecoratedGenerator;
  return {};
});
System.registerModule("traceur-runtime@0.0.91/src/runtime/classes.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/classes.js";
  var $Object = Object;
  var $TypeError = TypeError;
  var $create = $Object.create;
  var $defineProperties = $traceurRuntime.defineProperties;
  var $defineProperty = $traceurRuntime.defineProperty;
  var $getOwnPropertyDescriptor = $traceurRuntime.getOwnPropertyDescriptor;
  var $getOwnPropertyNames = $traceurRuntime.getOwnPropertyNames;
  var $getPrototypeOf = Object.getPrototypeOf;
  var $__1 = Object,
      getOwnPropertyNames = $__1.getOwnPropertyNames,
      getOwnPropertySymbols = $__1.getOwnPropertySymbols;
  function superDescriptor(homeObject, name) {
    var proto = $getPrototypeOf(homeObject);
    do {
      var result = $getOwnPropertyDescriptor(proto, name);
      if (result)
        return result;
      proto = $getPrototypeOf(proto);
    } while (proto);
    return undefined;
  }
  function superConstructor(ctor) {
    return ctor.__proto__;
  }
  function superGet(self, homeObject, name) {
    var descriptor = superDescriptor(homeObject, name);
    if (descriptor) {
      var value = descriptor.value;
      if (value)
        return value;
      if (!descriptor.get)
        return value;
      return descriptor.get.call(self);
    }
    return undefined;
  }
  function superSet(self, homeObject, name, value) {
    var descriptor = superDescriptor(homeObject, name);
    if (descriptor && descriptor.set) {
      descriptor.set.call(self, value);
      return value;
    }
    throw $TypeError(("super has no setter '" + name + "'."));
  }
  function forEachPropertyKey(object, f) {
    getOwnPropertyNames(object).forEach(f);
    getOwnPropertySymbols(object).forEach(f);
  }
  function getDescriptors(object) {
    var descriptors = {};
    forEachPropertyKey(object, function(key) {
      descriptors[key] = $getOwnPropertyDescriptor(object, key);
      descriptors[key].enumerable = false;
    });
    return descriptors;
  }
  var nonEnum = {enumerable: false};
  function makePropertiesNonEnumerable(object) {
    forEachPropertyKey(object, function(key) {
      $defineProperty(object, key, nonEnum);
    });
  }
  function createClass(ctor, object, staticObject, superClass) {
    $defineProperty(object, 'constructor', {
      value: ctor,
      configurable: true,
      enumerable: false,
      writable: true
    });
    if (arguments.length > 3) {
      if (typeof superClass === 'function')
        ctor.__proto__ = superClass;
      ctor.prototype = $create(getProtoParent(superClass), getDescriptors(object));
    } else {
      makePropertiesNonEnumerable(object);
      ctor.prototype = object;
    }
    $defineProperty(ctor, 'prototype', {
      configurable: false,
      writable: false
    });
    return $defineProperties(ctor, getDescriptors(staticObject));
  }
  function getProtoParent(superClass) {
    if (typeof superClass === 'function') {
      var prototype = superClass.prototype;
      if ($Object(prototype) === prototype || prototype === null)
        return superClass.prototype;
      throw new $TypeError('super prototype must be an Object or null');
    }
    if (superClass === null)
      return null;
    throw new $TypeError(("Super expression must either be null or a function, not " + typeof superClass + "."));
  }
  $traceurRuntime.createClass = createClass;
  $traceurRuntime.superConstructor = superConstructor;
  $traceurRuntime.superGet = superGet;
  $traceurRuntime.superSet = superSet;
  return {};
});
System.registerModule("traceur-runtime@0.0.91/src/runtime/destructuring.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/destructuring.js";
  function iteratorToArray(iter) {
    var rv = [];
    var i = 0;
    var tmp;
    while (!(tmp = iter.next()).done) {
      rv[i++] = tmp.value;
    }
    return rv;
  }
  $traceurRuntime.iteratorToArray = iteratorToArray;
  return {};
});
System.registerModule("traceur-runtime@0.0.91/src/runtime/generators.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/generators.js";
  if (typeof $traceurRuntime !== 'object') {
    throw new Error('traceur runtime not found.');
  }
  var createPrivateName = $traceurRuntime.createPrivateName;
  var $defineProperties = $traceurRuntime.defineProperties;
  var $defineProperty = $traceurRuntime.defineProperty;
  var $create = Object.create;
  var $TypeError = TypeError;
  function nonEnum(value) {
    return {
      configurable: true,
      enumerable: false,
      value: value,
      writable: true
    };
  }
  var ST_NEWBORN = 0;
  var ST_EXECUTING = 1;
  var ST_SUSPENDED = 2;
  var ST_CLOSED = 3;
  var END_STATE = -2;
  var RETHROW_STATE = -3;
  function getInternalError(state) {
    return new Error('Traceur compiler bug: invalid state in state machine: ' + state);
  }
  var RETURN_SENTINEL = {};
  function GeneratorContext() {
    this.state = 0;
    this.GState = ST_NEWBORN;
    this.storedException = undefined;
    this.finallyFallThrough = undefined;
    this.sent_ = undefined;
    this.returnValue = undefined;
    this.oldReturnValue = undefined;
    this.tryStack_ = [];
  }
  GeneratorContext.prototype = {
    pushTry: function(catchState, finallyState) {
      if (finallyState !== null) {
        var finallyFallThrough = null;
        for (var i = this.tryStack_.length - 1; i >= 0; i--) {
          if (this.tryStack_[i].catch !== undefined) {
            finallyFallThrough = this.tryStack_[i].catch;
            break;
          }
        }
        if (finallyFallThrough === null)
          finallyFallThrough = RETHROW_STATE;
        this.tryStack_.push({
          finally: finallyState,
          finallyFallThrough: finallyFallThrough
        });
      }
      if (catchState !== null) {
        this.tryStack_.push({catch: catchState});
      }
    },
    popTry: function() {
      this.tryStack_.pop();
    },
    maybeUncatchable: function() {
      if (this.storedException === RETURN_SENTINEL) {
        throw RETURN_SENTINEL;
      }
    },
    get sent() {
      this.maybeThrow();
      return this.sent_;
    },
    set sent(v) {
      this.sent_ = v;
    },
    get sentIgnoreThrow() {
      return this.sent_;
    },
    maybeThrow: function() {
      if (this.action === 'throw') {
        this.action = 'next';
        throw this.sent_;
      }
    },
    end: function() {
      switch (this.state) {
        case END_STATE:
          return this;
        case RETHROW_STATE:
          throw this.storedException;
        default:
          throw getInternalError(this.state);
      }
    },
    handleException: function(ex) {
      this.GState = ST_CLOSED;
      this.state = END_STATE;
      throw ex;
    },
    wrapYieldStar: function(iterator) {
      var ctx = this;
      return {
        next: function(v) {
          return iterator.next(v);
        },
        throw: function(e) {
          var result;
          if (e === RETURN_SENTINEL) {
            if (iterator.return) {
              result = iterator.return(ctx.returnValue);
              if (!result.done) {
                ctx.returnValue = ctx.oldReturnValue;
                return result;
              }
              ctx.returnValue = result.value;
            }
            throw e;
          }
          if (iterator.throw) {
            return iterator.throw(e);
          }
          iterator.return && iterator.return();
          throw $TypeError('Inner iterator does not have a throw method');
        }
      };
    }
  };
  function nextOrThrow(ctx, moveNext, action, x) {
    switch (ctx.GState) {
      case ST_EXECUTING:
        throw new Error(("\"" + action + "\" on executing generator"));
      case ST_CLOSED:
        if (action == 'next') {
          return {
            value: undefined,
            done: true
          };
        }
        if (x === RETURN_SENTINEL) {
          return {
            value: ctx.returnValue,
            done: true
          };
        }
        throw x;
      case ST_NEWBORN:
        if (action === 'throw') {
          ctx.GState = ST_CLOSED;
          if (x === RETURN_SENTINEL) {
            return {
              value: ctx.returnValue,
              done: true
            };
          }
          throw x;
        }
        if (x !== undefined)
          throw $TypeError('Sent value to newborn generator');
      case ST_SUSPENDED:
        ctx.GState = ST_EXECUTING;
        ctx.action = action;
        ctx.sent = x;
        var value;
        try {
          value = moveNext(ctx);
        } catch (ex) {
          if (ex === RETURN_SENTINEL) {
            value = ctx;
          } else {
            throw ex;
          }
        }
        var done = value === ctx;
        if (done)
          value = ctx.returnValue;
        ctx.GState = done ? ST_CLOSED : ST_SUSPENDED;
        return {
          value: value,
          done: done
        };
    }
  }
  var ctxName = createPrivateName();
  var moveNextName = createPrivateName();
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}
  GeneratorFunction.prototype = GeneratorFunctionPrototype;
  $defineProperty(GeneratorFunctionPrototype, 'constructor', nonEnum(GeneratorFunction));
  GeneratorFunctionPrototype.prototype = {
    constructor: GeneratorFunctionPrototype,
    next: function(v) {
      return nextOrThrow(this[ctxName], this[moveNextName], 'next', v);
    },
    throw: function(v) {
      return nextOrThrow(this[ctxName], this[moveNextName], 'throw', v);
    },
    return: function(v) {
      this[ctxName].oldReturnValue = this[ctxName].returnValue;
      this[ctxName].returnValue = v;
      return nextOrThrow(this[ctxName], this[moveNextName], 'throw', RETURN_SENTINEL);
    }
  };
  $defineProperties(GeneratorFunctionPrototype.prototype, {
    constructor: {enumerable: false},
    next: {enumerable: false},
    throw: {enumerable: false},
    return: {enumerable: false}
  });
  Object.defineProperty(GeneratorFunctionPrototype.prototype, Symbol.iterator, nonEnum(function() {
    return this;
  }));
  function createGeneratorInstance(innerFunction, functionObject, self) {
    var moveNext = getMoveNext(innerFunction, self);
    var ctx = new GeneratorContext();
    var object = $create(functionObject.prototype);
    object[ctxName] = ctx;
    object[moveNextName] = moveNext;
    return object;
  }
  function initGeneratorFunction(functionObject) {
    functionObject.prototype = $create(GeneratorFunctionPrototype.prototype);
    functionObject.__proto__ = GeneratorFunctionPrototype;
    return functionObject;
  }
  function AsyncFunctionContext() {
    GeneratorContext.call(this);
    this.err = undefined;
    var ctx = this;
    ctx.result = new Promise(function(resolve, reject) {
      ctx.resolve = resolve;
      ctx.reject = reject;
    });
  }
  AsyncFunctionContext.prototype = $create(GeneratorContext.prototype);
  AsyncFunctionContext.prototype.end = function() {
    switch (this.state) {
      case END_STATE:
        this.resolve(this.returnValue);
        break;
      case RETHROW_STATE:
        this.reject(this.storedException);
        break;
      default:
        this.reject(getInternalError(this.state));
    }
  };
  AsyncFunctionContext.prototype.handleException = function() {
    this.state = RETHROW_STATE;
  };
  function asyncWrap(innerFunction, self) {
    var moveNext = getMoveNext(innerFunction, self);
    var ctx = new AsyncFunctionContext();
    ctx.createCallback = function(newState) {
      return function(value) {
        ctx.state = newState;
        ctx.value = value;
        moveNext(ctx);
      };
    };
    ctx.errback = function(err) {
      handleCatch(ctx, err);
      moveNext(ctx);
    };
    moveNext(ctx);
    return ctx.result;
  }
  function getMoveNext(innerFunction, self) {
    return function(ctx) {
      while (true) {
        try {
          return innerFunction.call(self, ctx);
        } catch (ex) {
          handleCatch(ctx, ex);
        }
      }
    };
  }
  function handleCatch(ctx, ex) {
    ctx.storedException = ex;
    var last = ctx.tryStack_[ctx.tryStack_.length - 1];
    if (!last) {
      ctx.handleException(ex);
      return;
    }
    ctx.state = last.catch !== undefined ? last.catch : last.finally;
    if (last.finallyFallThrough !== undefined)
      ctx.finallyFallThrough = last.finallyFallThrough;
  }
  $traceurRuntime.asyncWrap = asyncWrap;
  $traceurRuntime.initGeneratorFunction = initGeneratorFunction;
  $traceurRuntime.createGeneratorInstance = createGeneratorInstance;
  return {};
});
System.registerModule("traceur-runtime@0.0.91/src/runtime/relativeRequire.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/relativeRequire.js";
  var path;
  function relativeRequire(callerPath, requiredPath) {
    path = path || typeof require !== 'undefined' && require('path');
    function isDirectory(path) {
      return path.slice(-1) === '/';
    }
    function isAbsolute(path) {
      return path[0] === '/';
    }
    function isRelative(path) {
      return path[0] === '.';
    }
    if (isDirectory(requiredPath) || isAbsolute(requiredPath))
      return;
    return isRelative(requiredPath) ? require(path.resolve(path.dirname(callerPath), requiredPath)) : require(requiredPath);
  }
  $traceurRuntime.require = relativeRequire;
  return {};
});
System.registerModule("traceur-runtime@0.0.91/src/runtime/spread.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/spread.js";
  function spread() {
    var rv = [],
        j = 0,
        iterResult;
    for (var i = 0; i < arguments.length; i++) {
      var valueToSpread = $traceurRuntime.checkObjectCoercible(arguments[i]);
      if (typeof valueToSpread[$traceurRuntime.toProperty(Symbol.iterator)] !== 'function') {
        throw new TypeError('Cannot spread non-iterable object.');
      }
      var iter = valueToSpread[$traceurRuntime.toProperty(Symbol.iterator)]();
      while (!(iterResult = iter.next()).done) {
        rv[j++] = iterResult.value;
      }
    }
    return rv;
  }
  $traceurRuntime.spread = spread;
  return {};
});
System.registerModule("traceur-runtime@0.0.91/src/runtime/template.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/template.js";
  var $__1 = Object,
      defineProperty = $__1.defineProperty,
      freeze = $__1.freeze;
  var slice = Array.prototype.slice;
  var map = Object.create(null);
  function getTemplateObject(raw) {
    var cooked = arguments[1];
    var key = raw.join('${}');
    var templateObject = map[key];
    if (templateObject)
      return templateObject;
    if (!cooked) {
      cooked = slice.call(raw);
    }
    return map[key] = freeze(defineProperty(cooked, 'raw', {value: freeze(raw)}));
  }
  $traceurRuntime.getTemplateObject = getTemplateObject;
  return {};
});
System.registerModule("traceur-runtime@0.0.91/src/runtime/type-assertions.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/type-assertions.js";
  var types = {
    any: {name: 'any'},
    boolean: {name: 'boolean'},
    number: {name: 'number'},
    string: {name: 'string'},
    symbol: {name: 'symbol'},
    void: {name: 'void'}
  };
  var GenericType = function() {
    function GenericType(type, argumentTypes) {
      this.type = type;
      this.argumentTypes = argumentTypes;
    }
    return ($traceurRuntime.createClass)(GenericType, {}, {});
  }();
  var typeRegister = Object.create(null);
  function genericType(type) {
    for (var argumentTypes = [],
        $__2 = 1; $__2 < arguments.length; $__2++)
      argumentTypes[$__2 - 1] = arguments[$__2];
    var typeMap = typeRegister;
    var key = $traceurRuntime.getOwnHashObject(type).hash;
    if (!typeMap[key]) {
      typeMap[key] = Object.create(null);
    }
    typeMap = typeMap[key];
    for (var i = 0; i < argumentTypes.length - 1; i++) {
      key = $traceurRuntime.getOwnHashObject(argumentTypes[i]).hash;
      if (!typeMap[key]) {
        typeMap[key] = Object.create(null);
      }
      typeMap = typeMap[key];
    }
    var tail = argumentTypes[argumentTypes.length - 1];
    key = $traceurRuntime.getOwnHashObject(tail).hash;
    if (!typeMap[key]) {
      typeMap[key] = new GenericType(type, argumentTypes);
    }
    return typeMap[key];
  }
  $traceurRuntime.GenericType = GenericType;
  $traceurRuntime.genericType = genericType;
  $traceurRuntime.type = types;
  return {};
});
System.registerModule("traceur-runtime@0.0.91/src/runtime/runtime-modules.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/runtime-modules.js";
  System.get("traceur-runtime@0.0.91/src/runtime/relativeRequire.js");
  System.get("traceur-runtime@0.0.91/src/runtime/spread.js");
  System.get("traceur-runtime@0.0.91/src/runtime/destructuring.js");
  System.get("traceur-runtime@0.0.91/src/runtime/classes.js");
  System.get("traceur-runtime@0.0.91/src/runtime/async.js");
  System.get("traceur-runtime@0.0.91/src/runtime/generators.js");
  System.get("traceur-runtime@0.0.91/src/runtime/template.js");
  System.get("traceur-runtime@0.0.91/src/runtime/type-assertions.js");
  return {};
});
System.get("traceur-runtime@0.0.91/src/runtime/runtime-modules.js" + '');
System.registerModule("traceur-runtime@0.0.91/src/runtime/polyfills/utils.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/polyfills/utils.js";
  var $ceil = Math.ceil;
  var $floor = Math.floor;
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var $pow = Math.pow;
  var $min = Math.min;
  var toObject = $traceurRuntime.toObject;
  function toUint32(x) {
    return x >>> 0;
  }
  function isObject(x) {
    return x && (typeof x === 'object' || typeof x === 'function');
  }
  function isCallable(x) {
    return typeof x === 'function';
  }
  function isNumber(x) {
    return typeof x === 'number';
  }
  function toInteger(x) {
    x = +x;
    if ($isNaN(x))
      return 0;
    if (x === 0 || !$isFinite(x))
      return x;
    return x > 0 ? $floor(x) : $ceil(x);
  }
  var MAX_SAFE_LENGTH = $pow(2, 53) - 1;
  function toLength(x) {
    var len = toInteger(x);
    return len < 0 ? 0 : $min(len, MAX_SAFE_LENGTH);
  }
  function checkIterable(x) {
    return !isObject(x) ? undefined : x[Symbol.iterator];
  }
  function isConstructor(x) {
    return isCallable(x);
  }
  function createIteratorResultObject(value, done) {
    return {
      value: value,
      done: done
    };
  }
  function maybeDefine(object, name, descr) {
    if (!(name in object)) {
      Object.defineProperty(object, name, descr);
    }
  }
  function maybeDefineMethod(object, name, value) {
    maybeDefine(object, name, {
      value: value,
      configurable: true,
      enumerable: false,
      writable: true
    });
  }
  function maybeDefineConst(object, name, value) {
    maybeDefine(object, name, {
      value: value,
      configurable: false,
      enumerable: false,
      writable: false
    });
  }
  function maybeAddFunctions(object, functions) {
    for (var i = 0; i < functions.length; i += 2) {
      var name = functions[i];
      var value = functions[i + 1];
      maybeDefineMethod(object, name, value);
    }
  }
  function maybeAddConsts(object, consts) {
    for (var i = 0; i < consts.length; i += 2) {
      var name = consts[i];
      var value = consts[i + 1];
      maybeDefineConst(object, name, value);
    }
  }
  function maybeAddIterator(object, func, Symbol) {
    if (!Symbol || !Symbol.iterator || object[Symbol.iterator])
      return;
    if (object['@@iterator'])
      func = object['@@iterator'];
    Object.defineProperty(object, Symbol.iterator, {
      value: func,
      configurable: true,
      enumerable: false,
      writable: true
    });
  }
  var polyfills = [];
  function registerPolyfill(func) {
    polyfills.push(func);
  }
  function polyfillAll(global) {
    polyfills.forEach(function(f) {
      return f(global);
    });
  }
  return {
    get toObject() {
      return toObject;
    },
    get toUint32() {
      return toUint32;
    },
    get isObject() {
      return isObject;
    },
    get isCallable() {
      return isCallable;
    },
    get isNumber() {
      return isNumber;
    },
    get toInteger() {
      return toInteger;
    },
    get toLength() {
      return toLength;
    },
    get checkIterable() {
      return checkIterable;
    },
    get isConstructor() {
      return isConstructor;
    },
    get createIteratorResultObject() {
      return createIteratorResultObject;
    },
    get maybeDefine() {
      return maybeDefine;
    },
    get maybeDefineMethod() {
      return maybeDefineMethod;
    },
    get maybeDefineConst() {
      return maybeDefineConst;
    },
    get maybeAddFunctions() {
      return maybeAddFunctions;
    },
    get maybeAddConsts() {
      return maybeAddConsts;
    },
    get maybeAddIterator() {
      return maybeAddIterator;
    },
    get registerPolyfill() {
      return registerPolyfill;
    },
    get polyfillAll() {
      return polyfillAll;
    }
  };
});
System.registerModule("traceur-runtime@0.0.91/src/runtime/polyfills/Map.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/polyfills/Map.js";
  var $__0 = System.get("traceur-runtime@0.0.91/src/runtime/polyfills/utils.js"),
      isObject = $__0.isObject,
      registerPolyfill = $__0.registerPolyfill;
  var $__10 = $traceurRuntime,
      getOwnHashObject = $__10.getOwnHashObject,
      hasNativeSymbol = $__10.hasNativeSymbol;
  var $hasOwnProperty = Object.prototype.hasOwnProperty;
  var deletedSentinel = {};
  function lookupIndex(map, key) {
    if (isObject(key)) {
      var hashObject = getOwnHashObject(key);
      return hashObject && map.objectIndex_[hashObject.hash];
    }
    if (typeof key === 'string')
      return map.stringIndex_[key];
    return map.primitiveIndex_[key];
  }
  function initMap(map) {
    map.entries_ = [];
    map.objectIndex_ = Object.create(null);
    map.stringIndex_ = Object.create(null);
    map.primitiveIndex_ = Object.create(null);
    map.deletedCount_ = 0;
  }
  var Map = function() {
    function Map() {
      var $__12,
          $__13;
      var iterable = arguments[0];
      if (!isObject(this))
        throw new TypeError('Map called on incompatible type');
      if ($hasOwnProperty.call(this, 'entries_')) {
        throw new TypeError('Map can not be reentrantly initialised');
      }
      initMap(this);
      if (iterable !== null && iterable !== undefined) {
        var $__6 = true;
        var $__7 = false;
        var $__8 = undefined;
        try {
          for (var $__4 = void 0,
              $__3 = (iterable)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__6 = ($__4 = $__3.next()).done); $__6 = true) {
            var $__11 = $__4.value,
                key = ($__12 = $__11[$traceurRuntime.toProperty(Symbol.iterator)](), ($__13 = $__12.next()).done ? void 0 : $__13.value),
                value = ($__13 = $__12.next()).done ? void 0 : $__13.value;
            {
              this.set(key, value);
            }
          }
        } catch ($__9) {
          $__7 = true;
          $__8 = $__9;
        } finally {
          try {
            if (!$__6 && $__3.return != null) {
              $__3.return();
            }
          } finally {
            if ($__7) {
              throw $__8;
            }
          }
        }
      }
    }
    return ($traceurRuntime.createClass)(Map, {
      get size() {
        return this.entries_.length / 2 - this.deletedCount_;
      },
      get: function(key) {
        var index = lookupIndex(this, key);
        if (index !== undefined)
          return this.entries_[index + 1];
      },
      set: function(key, value) {
        var objectMode = isObject(key);
        var stringMode = typeof key === 'string';
        var index = lookupIndex(this, key);
        if (index !== undefined) {
          this.entries_[index + 1] = value;
        } else {
          index = this.entries_.length;
          this.entries_[index] = key;
          this.entries_[index + 1] = value;
          if (objectMode) {
            var hashObject = getOwnHashObject(key);
            var hash = hashObject.hash;
            this.objectIndex_[hash] = index;
          } else if (stringMode) {
            this.stringIndex_[key] = index;
          } else {
            this.primitiveIndex_[key] = index;
          }
        }
        return this;
      },
      has: function(key) {
        return lookupIndex(this, key) !== undefined;
      },
      delete: function(key) {
        var objectMode = isObject(key);
        var stringMode = typeof key === 'string';
        var index;
        var hash;
        if (objectMode) {
          var hashObject = getOwnHashObject(key);
          if (hashObject) {
            index = this.objectIndex_[hash = hashObject.hash];
            delete this.objectIndex_[hash];
          }
        } else if (stringMode) {
          index = this.stringIndex_[key];
          delete this.stringIndex_[key];
        } else {
          index = this.primitiveIndex_[key];
          delete this.primitiveIndex_[key];
        }
        if (index !== undefined) {
          this.entries_[index] = deletedSentinel;
          this.entries_[index + 1] = undefined;
          this.deletedCount_++;
          return true;
        }
        return false;
      },
      clear: function() {
        initMap(this);
      },
      forEach: function(callbackFn) {
        var thisArg = arguments[1];
        for (var i = 0; i < this.entries_.length; i += 2) {
          var key = this.entries_[i];
          var value = this.entries_[i + 1];
          if (key === deletedSentinel)
            continue;
          callbackFn.call(thisArg, value, key, this);
        }
      },
      entries: $traceurRuntime.initGeneratorFunction(function $__14() {
        var i,
            key,
            value;
        return $traceurRuntime.createGeneratorInstance(function($ctx) {
          while (true)
            switch ($ctx.state) {
              case 0:
                i = 0;
                $ctx.state = 12;
                break;
              case 12:
                $ctx.state = (i < this.entries_.length) ? 8 : -2;
                break;
              case 4:
                i += 2;
                $ctx.state = 12;
                break;
              case 8:
                key = this.entries_[i];
                value = this.entries_[i + 1];
                $ctx.state = 9;
                break;
              case 9:
                $ctx.state = (key === deletedSentinel) ? 4 : 6;
                break;
              case 6:
                $ctx.state = 2;
                return [key, value];
              case 2:
                $ctx.maybeThrow();
                $ctx.state = 4;
                break;
              default:
                return $ctx.end();
            }
        }, $__14, this);
      }),
      keys: $traceurRuntime.initGeneratorFunction(function $__15() {
        var i,
            key,
            value;
        return $traceurRuntime.createGeneratorInstance(function($ctx) {
          while (true)
            switch ($ctx.state) {
              case 0:
                i = 0;
                $ctx.state = 12;
                break;
              case 12:
                $ctx.state = (i < this.entries_.length) ? 8 : -2;
                break;
              case 4:
                i += 2;
                $ctx.state = 12;
                break;
              case 8:
                key = this.entries_[i];
                value = this.entries_[i + 1];
                $ctx.state = 9;
                break;
              case 9:
                $ctx.state = (key === deletedSentinel) ? 4 : 6;
                break;
              case 6:
                $ctx.state = 2;
                return key;
              case 2:
                $ctx.maybeThrow();
                $ctx.state = 4;
                break;
              default:
                return $ctx.end();
            }
        }, $__15, this);
      }),
      values: $traceurRuntime.initGeneratorFunction(function $__16() {
        var i,
            key,
            value;
        return $traceurRuntime.createGeneratorInstance(function($ctx) {
          while (true)
            switch ($ctx.state) {
              case 0:
                i = 0;
                $ctx.state = 12;
                break;
              case 12:
                $ctx.state = (i < this.entries_.length) ? 8 : -2;
                break;
              case 4:
                i += 2;
                $ctx.state = 12;
                break;
              case 8:
                key = this.entries_[i];
                value = this.entries_[i + 1];
                $ctx.state = 9;
                break;
              case 9:
                $ctx.state = (key === deletedSentinel) ? 4 : 6;
                break;
              case 6:
                $ctx.state = 2;
                return value;
              case 2:
                $ctx.maybeThrow();
                $ctx.state = 4;
                break;
              default:
                return $ctx.end();
            }
        }, $__16, this);
      })
    }, {});
  }();
  Object.defineProperty(Map.prototype, Symbol.iterator, {
    configurable: true,
    writable: true,
    value: Map.prototype.entries
  });
  function needsPolyfill(global) {
    var $__11 = global,
        Map = $__11.Map,
        Symbol = $__11.Symbol;
    if (!Map || !$traceurRuntime.hasNativeSymbol() || !Map.prototype[Symbol.iterator] || !Map.prototype.entries) {
      return true;
    }
    try {
      return new Map([[]]).size !== 1;
    } catch (e) {
      return false;
    }
  }
  function polyfillMap(global) {
    if (needsPolyfill(global)) {
      global.Map = Map;
    }
  }
  registerPolyfill(polyfillMap);
  return {
    get Map() {
      return Map;
    },
    get polyfillMap() {
      return polyfillMap;
    }
  };
});
System.get("traceur-runtime@0.0.91/src/runtime/polyfills/Map.js" + '');
System.registerModule("traceur-runtime@0.0.91/src/runtime/polyfills/Set.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/polyfills/Set.js";
  var $__0 = System.get("traceur-runtime@0.0.91/src/runtime/polyfills/utils.js"),
      isObject = $__0.isObject,
      registerPolyfill = $__0.registerPolyfill;
  var Map = System.get("traceur-runtime@0.0.91/src/runtime/polyfills/Map.js").Map;
  var getOwnHashObject = $traceurRuntime.getOwnHashObject;
  var $hasOwnProperty = Object.prototype.hasOwnProperty;
  function initSet(set) {
    set.map_ = new Map();
  }
  var Set = function() {
    function Set() {
      var iterable = arguments[0];
      if (!isObject(this))
        throw new TypeError('Set called on incompatible type');
      if ($hasOwnProperty.call(this, 'map_')) {
        throw new TypeError('Set can not be reentrantly initialised');
      }
      initSet(this);
      if (iterable !== null && iterable !== undefined) {
        var $__8 = true;
        var $__9 = false;
        var $__10 = undefined;
        try {
          for (var $__6 = void 0,
              $__5 = (iterable)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__8 = ($__6 = $__5.next()).done); $__8 = true) {
            var item = $__6.value;
            {
              this.add(item);
            }
          }
        } catch ($__11) {
          $__9 = true;
          $__10 = $__11;
        } finally {
          try {
            if (!$__8 && $__5.return != null) {
              $__5.return();
            }
          } finally {
            if ($__9) {
              throw $__10;
            }
          }
        }
      }
    }
    return ($traceurRuntime.createClass)(Set, {
      get size() {
        return this.map_.size;
      },
      has: function(key) {
        return this.map_.has(key);
      },
      add: function(key) {
        this.map_.set(key, key);
        return this;
      },
      delete: function(key) {
        return this.map_.delete(key);
      },
      clear: function() {
        return this.map_.clear();
      },
      forEach: function(callbackFn) {
        var thisArg = arguments[1];
        var $__4 = this;
        return this.map_.forEach(function(value, key) {
          callbackFn.call(thisArg, key, key, $__4);
        });
      },
      values: $traceurRuntime.initGeneratorFunction(function $__13() {
        var $__14,
            $__15;
        return $traceurRuntime.createGeneratorInstance(function($ctx) {
          while (true)
            switch ($ctx.state) {
              case 0:
                $__14 = $ctx.wrapYieldStar(this.map_.keys()[Symbol.iterator]());
                $ctx.sent = void 0;
                $ctx.action = 'next';
                $ctx.state = 12;
                break;
              case 12:
                $__15 = $__14[$ctx.action]($ctx.sentIgnoreThrow);
                $ctx.state = 9;
                break;
              case 9:
                $ctx.state = ($__15.done) ? 3 : 2;
                break;
              case 3:
                $ctx.sent = $__15.value;
                $ctx.state = -2;
                break;
              case 2:
                $ctx.state = 12;
                return $__15.value;
              default:
                return $ctx.end();
            }
        }, $__13, this);
      }),
      entries: $traceurRuntime.initGeneratorFunction(function $__16() {
        var $__17,
            $__18;
        return $traceurRuntime.createGeneratorInstance(function($ctx) {
          while (true)
            switch ($ctx.state) {
              case 0:
                $__17 = $ctx.wrapYieldStar(this.map_.entries()[Symbol.iterator]());
                $ctx.sent = void 0;
                $ctx.action = 'next';
                $ctx.state = 12;
                break;
              case 12:
                $__18 = $__17[$ctx.action]($ctx.sentIgnoreThrow);
                $ctx.state = 9;
                break;
              case 9:
                $ctx.state = ($__18.done) ? 3 : 2;
                break;
              case 3:
                $ctx.sent = $__18.value;
                $ctx.state = -2;
                break;
              case 2:
                $ctx.state = 12;
                return $__18.value;
              default:
                return $ctx.end();
            }
        }, $__16, this);
      })
    }, {});
  }();
  Object.defineProperty(Set.prototype, Symbol.iterator, {
    configurable: true,
    writable: true,
    value: Set.prototype.values
  });
  Object.defineProperty(Set.prototype, 'keys', {
    configurable: true,
    writable: true,
    value: Set.prototype.values
  });
  function needsPolyfill(global) {
    var $__12 = global,
        Set = $__12.Set,
        Symbol = $__12.Symbol;
    if (!Set || !$traceurRuntime.hasNativeSymbol() || !Set.prototype[Symbol.iterator] || !Set.prototype.values) {
      return true;
    }
    try {
      return new Set([1]).size !== 1;
    } catch (e) {
      return false;
    }
  }
  function polyfillSet(global) {
    if (needsPolyfill(global)) {
      global.Set = Set;
    }
  }
  registerPolyfill(polyfillSet);
  return {
    get Set() {
      return Set;
    },
    get polyfillSet() {
      return polyfillSet;
    }
  };
});
System.get("traceur-runtime@0.0.91/src/runtime/polyfills/Set.js" + '');
System.registerModule("traceur-runtime@0.0.91/node_modules/rsvp/lib/rsvp/asap.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/node_modules/rsvp/lib/rsvp/asap.js";
  var len = 0;
  var toString = {}.toString;
  var vertxNext;
  function asap(callback, arg) {
    queue[len] = callback;
    queue[len + 1] = arg;
    len += 2;
    if (len === 2) {
      scheduleFlush();
    }
  }
  var $__default = asap;
  var browserWindow = (typeof window !== 'undefined') ? window : undefined;
  var browserGlobal = browserWindow || {};
  var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
  var isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';
  var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';
  function useNextTick() {
    var nextTick = process.nextTick;
    var version = process.versions.node.match(/^(?:(\d+)\.)?(?:(\d+)\.)?(\*|\d+)$/);
    if (Array.isArray(version) && version[1] === '0' && version[2] === '10') {
      nextTick = setImmediate;
    }
    return function() {
      nextTick(flush);
    };
  }
  function useVertxTimer() {
    return function() {
      vertxNext(flush);
    };
  }
  function useMutationObserver() {
    var iterations = 0;
    var observer = new BrowserMutationObserver(flush);
    var node = document.createTextNode('');
    observer.observe(node, {characterData: true});
    return function() {
      node.data = (iterations = ++iterations % 2);
    };
  }
  function useMessageChannel() {
    var channel = new MessageChannel();
    channel.port1.onmessage = flush;
    return function() {
      channel.port2.postMessage(0);
    };
  }
  function useSetTimeout() {
    return function() {
      setTimeout(flush, 1);
    };
  }
  var queue = new Array(1000);
  function flush() {
    for (var i = 0; i < len; i += 2) {
      var callback = queue[i];
      var arg = queue[i + 1];
      callback(arg);
      queue[i] = undefined;
      queue[i + 1] = undefined;
    }
    len = 0;
  }
  function attemptVertex() {
    try {
      var r = require;
      var vertx = r('vertx');
      vertxNext = vertx.runOnLoop || vertx.runOnContext;
      return useVertxTimer();
    } catch (e) {
      return useSetTimeout();
    }
  }
  var scheduleFlush;
  if (isNode) {
    scheduleFlush = useNextTick();
  } else if (BrowserMutationObserver) {
    scheduleFlush = useMutationObserver();
  } else if (isWorker) {
    scheduleFlush = useMessageChannel();
  } else if (browserWindow === undefined && typeof require === 'function') {
    scheduleFlush = attemptVertex();
  } else {
    scheduleFlush = useSetTimeout();
  }
  return {get default() {
      return $__default;
    }};
});
System.registerModule("traceur-runtime@0.0.91/src/runtime/polyfills/Promise.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/polyfills/Promise.js";
  var async = System.get("traceur-runtime@0.0.91/node_modules/rsvp/lib/rsvp/asap.js").default;
  var registerPolyfill = System.get("traceur-runtime@0.0.91/src/runtime/polyfills/utils.js").registerPolyfill;
  var promiseRaw = {};
  function isPromise(x) {
    return x && typeof x === 'object' && x.status_ !== undefined;
  }
  function idResolveHandler(x) {
    return x;
  }
  function idRejectHandler(x) {
    throw x;
  }
  function chain(promise) {
    var onResolve = arguments[1] !== (void 0) ? arguments[1] : idResolveHandler;
    var onReject = arguments[2] !== (void 0) ? arguments[2] : idRejectHandler;
    var deferred = getDeferred(promise.constructor);
    switch (promise.status_) {
      case undefined:
        throw TypeError;
      case 0:
        promise.onResolve_.push(onResolve, deferred);
        promise.onReject_.push(onReject, deferred);
        break;
      case +1:
        promiseEnqueue(promise.value_, [onResolve, deferred]);
        break;
      case -1:
        promiseEnqueue(promise.value_, [onReject, deferred]);
        break;
    }
    return deferred.promise;
  }
  function getDeferred(C) {
    if (this === $Promise) {
      var promise = promiseInit(new $Promise(promiseRaw));
      return {
        promise: promise,
        resolve: function(x) {
          promiseResolve(promise, x);
        },
        reject: function(r) {
          promiseReject(promise, r);
        }
      };
    } else {
      var result = {};
      result.promise = new C(function(resolve, reject) {
        result.resolve = resolve;
        result.reject = reject;
      });
      return result;
    }
  }
  function promiseSet(promise, status, value, onResolve, onReject) {
    promise.status_ = status;
    promise.value_ = value;
    promise.onResolve_ = onResolve;
    promise.onReject_ = onReject;
    return promise;
  }
  function promiseInit(promise) {
    return promiseSet(promise, 0, undefined, [], []);
  }
  var Promise = function() {
    function Promise(resolver) {
      if (resolver === promiseRaw)
        return;
      if (typeof resolver !== 'function')
        throw new TypeError;
      var promise = promiseInit(this);
      try {
        resolver(function(x) {
          promiseResolve(promise, x);
        }, function(r) {
          promiseReject(promise, r);
        });
      } catch (e) {
        promiseReject(promise, e);
      }
    }
    return ($traceurRuntime.createClass)(Promise, {
      catch: function(onReject) {
        return this.then(undefined, onReject);
      },
      then: function(onResolve, onReject) {
        if (typeof onResolve !== 'function')
          onResolve = idResolveHandler;
        if (typeof onReject !== 'function')
          onReject = idRejectHandler;
        var that = this;
        var constructor = this.constructor;
        return chain(this, function(x) {
          x = promiseCoerce(constructor, x);
          return x === that ? onReject(new TypeError) : isPromise(x) ? x.then(onResolve, onReject) : onResolve(x);
        }, onReject);
      }
    }, {
      resolve: function(x) {
        if (this === $Promise) {
          if (isPromise(x)) {
            return x;
          }
          return promiseSet(new $Promise(promiseRaw), +1, x);
        } else {
          return new this(function(resolve, reject) {
            resolve(x);
          });
        }
      },
      reject: function(r) {
        if (this === $Promise) {
          return promiseSet(new $Promise(promiseRaw), -1, r);
        } else {
          return new this(function(resolve, reject) {
            reject(r);
          });
        }
      },
      all: function(values) {
        var deferred = getDeferred(this);
        var resolutions = [];
        try {
          var makeCountdownFunction = function(i) {
            return function(x) {
              resolutions[i] = x;
              if (--count === 0)
                deferred.resolve(resolutions);
            };
          };
          var count = 0;
          var i = 0;
          var $__6 = true;
          var $__7 = false;
          var $__8 = undefined;
          try {
            for (var $__4 = void 0,
                $__3 = (values)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__6 = ($__4 = $__3.next()).done); $__6 = true) {
              var value = $__4.value;
              {
                var countdownFunction = makeCountdownFunction(i);
                this.resolve(value).then(countdownFunction, function(r) {
                  deferred.reject(r);
                });
                ++i;
                ++count;
              }
            }
          } catch ($__9) {
            $__7 = true;
            $__8 = $__9;
          } finally {
            try {
              if (!$__6 && $__3.return != null) {
                $__3.return();
              }
            } finally {
              if ($__7) {
                throw $__8;
              }
            }
          }
          if (count === 0) {
            deferred.resolve(resolutions);
          }
        } catch (e) {
          deferred.reject(e);
        }
        return deferred.promise;
      },
      race: function(values) {
        var deferred = getDeferred(this);
        try {
          for (var i = 0; i < values.length; i++) {
            this.resolve(values[i]).then(function(x) {
              deferred.resolve(x);
            }, function(r) {
              deferred.reject(r);
            });
          }
        } catch (e) {
          deferred.reject(e);
        }
        return deferred.promise;
      }
    });
  }();
  var $Promise = Promise;
  var $PromiseReject = $Promise.reject;
  function promiseResolve(promise, x) {
    promiseDone(promise, +1, x, promise.onResolve_);
  }
  function promiseReject(promise, r) {
    promiseDone(promise, -1, r, promise.onReject_);
  }
  function promiseDone(promise, status, value, reactions) {
    if (promise.status_ !== 0)
      return;
    promiseEnqueue(value, reactions);
    promiseSet(promise, status, value);
  }
  function promiseEnqueue(value, tasks) {
    async(function() {
      for (var i = 0; i < tasks.length; i += 2) {
        promiseHandle(value, tasks[i], tasks[i + 1]);
      }
    });
  }
  function promiseHandle(value, handler, deferred) {
    try {
      var result = handler(value);
      if (result === deferred.promise)
        throw new TypeError;
      else if (isPromise(result))
        chain(result, deferred.resolve, deferred.reject);
      else
        deferred.resolve(result);
    } catch (e) {
      try {
        deferred.reject(e);
      } catch (e) {}
    }
  }
  var thenableSymbol = '@@thenable';
  function isObject(x) {
    return x && (typeof x === 'object' || typeof x === 'function');
  }
  function promiseCoerce(constructor, x) {
    if (!isPromise(x) && isObject(x)) {
      var then;
      try {
        then = x.then;
      } catch (r) {
        var promise = $PromiseReject.call(constructor, r);
        x[thenableSymbol] = promise;
        return promise;
      }
      if (typeof then === 'function') {
        var p = x[thenableSymbol];
        if (p) {
          return p;
        } else {
          var deferred = getDeferred(constructor);
          x[thenableSymbol] = deferred.promise;
          try {
            then.call(x, deferred.resolve, deferred.reject);
          } catch (r) {
            deferred.reject(r);
          }
          return deferred.promise;
        }
      }
    }
    return x;
  }
  function polyfillPromise(global) {
    if (!global.Promise)
      global.Promise = Promise;
  }
  registerPolyfill(polyfillPromise);
  return {
    get Promise() {
      return Promise;
    },
    get polyfillPromise() {
      return polyfillPromise;
    }
  };
});
System.get("traceur-runtime@0.0.91/src/runtime/polyfills/Promise.js" + '');
System.registerModule("traceur-runtime@0.0.91/src/runtime/polyfills/StringIterator.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/polyfills/StringIterator.js";
  var $__0 = System.get("traceur-runtime@0.0.91/src/runtime/polyfills/utils.js"),
      createIteratorResultObject = $__0.createIteratorResultObject,
      isObject = $__0.isObject;
  var toProperty = $traceurRuntime.toProperty;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var iteratedString = Symbol('iteratedString');
  var stringIteratorNextIndex = Symbol('stringIteratorNextIndex');
  var StringIterator = function() {
    var $__3;
    function StringIterator() {}
    return ($traceurRuntime.createClass)(StringIterator, ($__3 = {}, Object.defineProperty($__3, "next", {
      value: function() {
        var o = this;
        if (!isObject(o) || !hasOwnProperty.call(o, iteratedString)) {
          throw new TypeError('this must be a StringIterator object');
        }
        var s = o[toProperty(iteratedString)];
        if (s === undefined) {
          return createIteratorResultObject(undefined, true);
        }
        var position = o[toProperty(stringIteratorNextIndex)];
        var len = s.length;
        if (position >= len) {
          o[toProperty(iteratedString)] = undefined;
          return createIteratorResultObject(undefined, true);
        }
        var first = s.charCodeAt(position);
        var resultString;
        if (first < 0xD800 || first > 0xDBFF || position + 1 === len) {
          resultString = String.fromCharCode(first);
        } else {
          var second = s.charCodeAt(position + 1);
          if (second < 0xDC00 || second > 0xDFFF) {
            resultString = String.fromCharCode(first);
          } else {
            resultString = String.fromCharCode(first) + String.fromCharCode(second);
          }
        }
        o[toProperty(stringIteratorNextIndex)] = position + resultString.length;
        return createIteratorResultObject(resultString, false);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, Symbol.iterator, {
      value: function() {
        return this;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), $__3), {});
  }();
  function createStringIterator(string) {
    var s = String(string);
    var iterator = Object.create(StringIterator.prototype);
    iterator[toProperty(iteratedString)] = s;
    iterator[toProperty(stringIteratorNextIndex)] = 0;
    return iterator;
  }
  return {get createStringIterator() {
      return createStringIterator;
    }};
});
System.registerModule("traceur-runtime@0.0.91/src/runtime/polyfills/String.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/polyfills/String.js";
  var createStringIterator = System.get("traceur-runtime@0.0.91/src/runtime/polyfills/StringIterator.js").createStringIterator;
  var $__1 = System.get("traceur-runtime@0.0.91/src/runtime/polyfills/utils.js"),
      maybeAddFunctions = $__1.maybeAddFunctions,
      maybeAddIterator = $__1.maybeAddIterator,
      registerPolyfill = $__1.registerPolyfill;
  var $toString = Object.prototype.toString;
  var $indexOf = String.prototype.indexOf;
  var $lastIndexOf = String.prototype.lastIndexOf;
  function startsWith(search) {
    var string = String(this);
    if (this == null || $toString.call(search) == '[object RegExp]') {
      throw TypeError();
    }
    var stringLength = string.length;
    var searchString = String(search);
    var searchLength = searchString.length;
    var position = arguments.length > 1 ? arguments[1] : undefined;
    var pos = position ? Number(position) : 0;
    if (isNaN(pos)) {
      pos = 0;
    }
    var start = Math.min(Math.max(pos, 0), stringLength);
    return $indexOf.call(string, searchString, pos) == start;
  }
  function endsWith(search) {
    var string = String(this);
    if (this == null || $toString.call(search) == '[object RegExp]') {
      throw TypeError();
    }
    var stringLength = string.length;
    var searchString = String(search);
    var searchLength = searchString.length;
    var pos = stringLength;
    if (arguments.length > 1) {
      var position = arguments[1];
      if (position !== undefined) {
        pos = position ? Number(position) : 0;
        if (isNaN(pos)) {
          pos = 0;
        }
      }
    }
    var end = Math.min(Math.max(pos, 0), stringLength);
    var start = end - searchLength;
    if (start < 0) {
      return false;
    }
    return $lastIndexOf.call(string, searchString, start) == start;
  }
  function includes(search) {
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    if (search && $toString.call(search) == '[object RegExp]') {
      throw TypeError();
    }
    var stringLength = string.length;
    var searchString = String(search);
    var searchLength = searchString.length;
    var position = arguments.length > 1 ? arguments[1] : undefined;
    var pos = position ? Number(position) : 0;
    if (pos != pos) {
      pos = 0;
    }
    var start = Math.min(Math.max(pos, 0), stringLength);
    if (searchLength + start > stringLength) {
      return false;
    }
    return $indexOf.call(string, searchString, pos) != -1;
  }
  function repeat(count) {
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    var n = count ? Number(count) : 0;
    if (isNaN(n)) {
      n = 0;
    }
    if (n < 0 || n == Infinity) {
      throw RangeError();
    }
    if (n == 0) {
      return '';
    }
    var result = '';
    while (n--) {
      result += string;
    }
    return result;
  }
  function codePointAt(position) {
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    var size = string.length;
    var index = position ? Number(position) : 0;
    if (isNaN(index)) {
      index = 0;
    }
    if (index < 0 || index >= size) {
      return undefined;
    }
    var first = string.charCodeAt(index);
    var second;
    if (first >= 0xD800 && first <= 0xDBFF && size > index + 1) {
      second = string.charCodeAt(index + 1);
      if (second >= 0xDC00 && second <= 0xDFFF) {
        return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
      }
    }
    return first;
  }
  function raw(callsite) {
    var raw = callsite.raw;
    var len = raw.length >>> 0;
    if (len === 0)
      return '';
    var s = '';
    var i = 0;
    while (true) {
      s += raw[i];
      if (i + 1 === len)
        return s;
      s += arguments[++i];
    }
  }
  function fromCodePoint(_) {
    var codeUnits = [];
    var floor = Math.floor;
    var highSurrogate;
    var lowSurrogate;
    var index = -1;
    var length = arguments.length;
    if (!length) {
      return '';
    }
    while (++index < length) {
      var codePoint = Number(arguments[index]);
      if (!isFinite(codePoint) || codePoint < 0 || codePoint > 0x10FFFF || floor(codePoint) != codePoint) {
        throw RangeError('Invalid code point: ' + codePoint);
      }
      if (codePoint <= 0xFFFF) {
        codeUnits.push(codePoint);
      } else {
        codePoint -= 0x10000;
        highSurrogate = (codePoint >> 10) + 0xD800;
        lowSurrogate = (codePoint % 0x400) + 0xDC00;
        codeUnits.push(highSurrogate, lowSurrogate);
      }
    }
    return String.fromCharCode.apply(null, codeUnits);
  }
  function stringPrototypeIterator() {
    var o = $traceurRuntime.checkObjectCoercible(this);
    var s = String(o);
    return createStringIterator(s);
  }
  function polyfillString(global) {
    var String = global.String;
    maybeAddFunctions(String.prototype, ['codePointAt', codePointAt, 'endsWith', endsWith, 'includes', includes, 'repeat', repeat, 'startsWith', startsWith]);
    maybeAddFunctions(String, ['fromCodePoint', fromCodePoint, 'raw', raw]);
    maybeAddIterator(String.prototype, stringPrototypeIterator, Symbol);
  }
  registerPolyfill(polyfillString);
  return {
    get startsWith() {
      return startsWith;
    },
    get endsWith() {
      return endsWith;
    },
    get includes() {
      return includes;
    },
    get repeat() {
      return repeat;
    },
    get codePointAt() {
      return codePointAt;
    },
    get raw() {
      return raw;
    },
    get fromCodePoint() {
      return fromCodePoint;
    },
    get stringPrototypeIterator() {
      return stringPrototypeIterator;
    },
    get polyfillString() {
      return polyfillString;
    }
  };
});
System.get("traceur-runtime@0.0.91/src/runtime/polyfills/String.js" + '');
System.registerModule("traceur-runtime@0.0.91/src/runtime/polyfills/ArrayIterator.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/polyfills/ArrayIterator.js";
  var $__0 = System.get("traceur-runtime@0.0.91/src/runtime/polyfills/utils.js"),
      toObject = $__0.toObject,
      toUint32 = $__0.toUint32,
      createIteratorResultObject = $__0.createIteratorResultObject;
  var ARRAY_ITERATOR_KIND_KEYS = 1;
  var ARRAY_ITERATOR_KIND_VALUES = 2;
  var ARRAY_ITERATOR_KIND_ENTRIES = 3;
  var ArrayIterator = function() {
    var $__3;
    function ArrayIterator() {}
    return ($traceurRuntime.createClass)(ArrayIterator, ($__3 = {}, Object.defineProperty($__3, "next", {
      value: function() {
        var iterator = toObject(this);
        var array = iterator.iteratorObject_;
        if (!array) {
          throw new TypeError('Object is not an ArrayIterator');
        }
        var index = iterator.arrayIteratorNextIndex_;
        var itemKind = iterator.arrayIterationKind_;
        var length = toUint32(array.length);
        if (index >= length) {
          iterator.arrayIteratorNextIndex_ = Infinity;
          return createIteratorResultObject(undefined, true);
        }
        iterator.arrayIteratorNextIndex_ = index + 1;
        if (itemKind == ARRAY_ITERATOR_KIND_VALUES)
          return createIteratorResultObject(array[index], false);
        if (itemKind == ARRAY_ITERATOR_KIND_ENTRIES)
          return createIteratorResultObject([index, array[index]], false);
        return createIteratorResultObject(index, false);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, Symbol.iterator, {
      value: function() {
        return this;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), $__3), {});
  }();
  function createArrayIterator(array, kind) {
    var object = toObject(array);
    var iterator = new ArrayIterator;
    iterator.iteratorObject_ = object;
    iterator.arrayIteratorNextIndex_ = 0;
    iterator.arrayIterationKind_ = kind;
    return iterator;
  }
  function entries() {
    return createArrayIterator(this, ARRAY_ITERATOR_KIND_ENTRIES);
  }
  function keys() {
    return createArrayIterator(this, ARRAY_ITERATOR_KIND_KEYS);
  }
  function values() {
    return createArrayIterator(this, ARRAY_ITERATOR_KIND_VALUES);
  }
  return {
    get entries() {
      return entries;
    },
    get keys() {
      return keys;
    },
    get values() {
      return values;
    }
  };
});
System.registerModule("traceur-runtime@0.0.91/src/runtime/polyfills/Array.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/polyfills/Array.js";
  var $__0 = System.get("traceur-runtime@0.0.91/src/runtime/polyfills/ArrayIterator.js"),
      entries = $__0.entries,
      keys = $__0.keys,
      jsValues = $__0.values;
  var $__1 = System.get("traceur-runtime@0.0.91/src/runtime/polyfills/utils.js"),
      checkIterable = $__1.checkIterable,
      isCallable = $__1.isCallable,
      isConstructor = $__1.isConstructor,
      maybeAddFunctions = $__1.maybeAddFunctions,
      maybeAddIterator = $__1.maybeAddIterator,
      registerPolyfill = $__1.registerPolyfill,
      toInteger = $__1.toInteger,
      toLength = $__1.toLength,
      toObject = $__1.toObject;
  function from(arrLike) {
    var mapFn = arguments[1];
    var thisArg = arguments[2];
    var C = this;
    var items = toObject(arrLike);
    var mapping = mapFn !== undefined;
    var k = 0;
    var arr,
        len;
    if (mapping && !isCallable(mapFn)) {
      throw TypeError();
    }
    if (checkIterable(items)) {
      arr = isConstructor(C) ? new C() : [];
      var $__6 = true;
      var $__7 = false;
      var $__8 = undefined;
      try {
        for (var $__4 = void 0,
            $__3 = (items)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__6 = ($__4 = $__3.next()).done); $__6 = true) {
          var item = $__4.value;
          {
            if (mapping) {
              arr[k] = mapFn.call(thisArg, item, k);
            } else {
              arr[k] = item;
            }
            k++;
          }
        }
      } catch ($__9) {
        $__7 = true;
        $__8 = $__9;
      } finally {
        try {
          if (!$__6 && $__3.return != null) {
            $__3.return();
          }
        } finally {
          if ($__7) {
            throw $__8;
          }
        }
      }
      arr.length = k;
      return arr;
    }
    len = toLength(items.length);
    arr = isConstructor(C) ? new C(len) : new Array(len);
    for (; k < len; k++) {
      if (mapping) {
        arr[k] = typeof thisArg === 'undefined' ? mapFn(items[k], k) : mapFn.call(thisArg, items[k], k);
      } else {
        arr[k] = items[k];
      }
    }
    arr.length = len;
    return arr;
  }
  function of() {
    for (var items = [],
        $__10 = 0; $__10 < arguments.length; $__10++)
      items[$__10] = arguments[$__10];
    var C = this;
    var len = items.length;
    var arr = isConstructor(C) ? new C(len) : new Array(len);
    for (var k = 0; k < len; k++) {
      arr[k] = items[k];
    }
    arr.length = len;
    return arr;
  }
  function fill(value) {
    var start = arguments[1] !== (void 0) ? arguments[1] : 0;
    var end = arguments[2];
    var object = toObject(this);
    var len = toLength(object.length);
    var fillStart = toInteger(start);
    var fillEnd = end !== undefined ? toInteger(end) : len;
    fillStart = fillStart < 0 ? Math.max(len + fillStart, 0) : Math.min(fillStart, len);
    fillEnd = fillEnd < 0 ? Math.max(len + fillEnd, 0) : Math.min(fillEnd, len);
    while (fillStart < fillEnd) {
      object[fillStart] = value;
      fillStart++;
    }
    return object;
  }
  function find(predicate) {
    var thisArg = arguments[1];
    return findHelper(this, predicate, thisArg);
  }
  function findIndex(predicate) {
    var thisArg = arguments[1];
    return findHelper(this, predicate, thisArg, true);
  }
  function findHelper(self, predicate) {
    var thisArg = arguments[2];
    var returnIndex = arguments[3] !== (void 0) ? arguments[3] : false;
    var object = toObject(self);
    var len = toLength(object.length);
    if (!isCallable(predicate)) {
      throw TypeError();
    }
    for (var i = 0; i < len; i++) {
      var value = object[i];
      if (predicate.call(thisArg, value, i, object)) {
        return returnIndex ? i : value;
      }
    }
    return returnIndex ? -1 : undefined;
  }
  function polyfillArray(global) {
    var $__11 = global,
        Array = $__11.Array,
        Object = $__11.Object,
        Symbol = $__11.Symbol;
    var values = jsValues;
    if (Symbol && Symbol.iterator && Array.prototype[Symbol.iterator]) {
      values = Array.prototype[Symbol.iterator];
    }
    maybeAddFunctions(Array.prototype, ['entries', entries, 'keys', keys, 'values', values, 'fill', fill, 'find', find, 'findIndex', findIndex]);
    maybeAddFunctions(Array, ['from', from, 'of', of]);
    maybeAddIterator(Array.prototype, values, Symbol);
    maybeAddIterator(Object.getPrototypeOf([].values()), function() {
      return this;
    }, Symbol);
  }
  registerPolyfill(polyfillArray);
  return {
    get from() {
      return from;
    },
    get of() {
      return of;
    },
    get fill() {
      return fill;
    },
    get find() {
      return find;
    },
    get findIndex() {
      return findIndex;
    },
    get polyfillArray() {
      return polyfillArray;
    }
  };
});
System.get("traceur-runtime@0.0.91/src/runtime/polyfills/Array.js" + '');
System.registerModule("traceur-runtime@0.0.91/src/runtime/polyfills/Object.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/polyfills/Object.js";
  var $__0 = System.get("traceur-runtime@0.0.91/src/runtime/polyfills/utils.js"),
      maybeAddFunctions = $__0.maybeAddFunctions,
      registerPolyfill = $__0.registerPolyfill;
  var $__2 = $traceurRuntime,
      defineProperty = $__2.defineProperty,
      getOwnPropertyDescriptor = $__2.getOwnPropertyDescriptor,
      getOwnPropertyNames = $__2.getOwnPropertyNames,
      isPrivateName = $__2.isPrivateName,
      keys = $__2.keys;
  function is(left, right) {
    if (left === right)
      return left !== 0 || 1 / left === 1 / right;
    return left !== left && right !== right;
  }
  function assign(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      var props = source == null ? [] : keys(source);
      var p = void 0,
          length = props.length;
      for (p = 0; p < length; p++) {
        var name = props[p];
        if (isPrivateName(name))
          continue;
        target[name] = source[name];
      }
    }
    return target;
  }
  function mixin(target, source) {
    var props = getOwnPropertyNames(source);
    var p,
        descriptor,
        length = props.length;
    for (p = 0; p < length; p++) {
      var name = props[p];
      if (isPrivateName(name))
        continue;
      descriptor = getOwnPropertyDescriptor(source, props[p]);
      defineProperty(target, props[p], descriptor);
    }
    return target;
  }
  function polyfillObject(global) {
    var Object = global.Object;
    maybeAddFunctions(Object, ['assign', assign, 'is', is, 'mixin', mixin]);
  }
  registerPolyfill(polyfillObject);
  return {
    get is() {
      return is;
    },
    get assign() {
      return assign;
    },
    get mixin() {
      return mixin;
    },
    get polyfillObject() {
      return polyfillObject;
    }
  };
});
System.get("traceur-runtime@0.0.91/src/runtime/polyfills/Object.js" + '');
System.registerModule("traceur-runtime@0.0.91/src/runtime/polyfills/Number.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/polyfills/Number.js";
  var $__0 = System.get("traceur-runtime@0.0.91/src/runtime/polyfills/utils.js"),
      isNumber = $__0.isNumber,
      maybeAddConsts = $__0.maybeAddConsts,
      maybeAddFunctions = $__0.maybeAddFunctions,
      registerPolyfill = $__0.registerPolyfill,
      toInteger = $__0.toInteger;
  var $abs = Math.abs;
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
  var MIN_SAFE_INTEGER = -Math.pow(2, 53) + 1;
  var EPSILON = Math.pow(2, -52);
  function NumberIsFinite(number) {
    return isNumber(number) && $isFinite(number);
  }
  function isInteger(number) {
    return NumberIsFinite(number) && toInteger(number) === number;
  }
  function NumberIsNaN(number) {
    return isNumber(number) && $isNaN(number);
  }
  function isSafeInteger(number) {
    if (NumberIsFinite(number)) {
      var integral = toInteger(number);
      if (integral === number)
        return $abs(integral) <= MAX_SAFE_INTEGER;
    }
    return false;
  }
  function polyfillNumber(global) {
    var Number = global.Number;
    maybeAddConsts(Number, ['MAX_SAFE_INTEGER', MAX_SAFE_INTEGER, 'MIN_SAFE_INTEGER', MIN_SAFE_INTEGER, 'EPSILON', EPSILON]);
    maybeAddFunctions(Number, ['isFinite', NumberIsFinite, 'isInteger', isInteger, 'isNaN', NumberIsNaN, 'isSafeInteger', isSafeInteger]);
  }
  registerPolyfill(polyfillNumber);
  return {
    get MAX_SAFE_INTEGER() {
      return MAX_SAFE_INTEGER;
    },
    get MIN_SAFE_INTEGER() {
      return MIN_SAFE_INTEGER;
    },
    get EPSILON() {
      return EPSILON;
    },
    get isFinite() {
      return NumberIsFinite;
    },
    get isInteger() {
      return isInteger;
    },
    get isNaN() {
      return NumberIsNaN;
    },
    get isSafeInteger() {
      return isSafeInteger;
    },
    get polyfillNumber() {
      return polyfillNumber;
    }
  };
});
System.get("traceur-runtime@0.0.91/src/runtime/polyfills/Number.js" + '');
System.registerModule("traceur-runtime@0.0.91/src/runtime/polyfills/fround.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/polyfills/fround.js";
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var $__1 = Math,
      LN2 = $__1.LN2,
      abs = $__1.abs,
      floor = $__1.floor,
      log = $__1.log,
      min = $__1.min,
      pow = $__1.pow;
  function packIEEE754(v, ebits, fbits) {
    var bias = (1 << (ebits - 1)) - 1,
        s,
        e,
        f,
        ln,
        i,
        bits,
        str,
        bytes;
    function roundToEven(n) {
      var w = floor(n),
          f = n - w;
      if (f < 0.5)
        return w;
      if (f > 0.5)
        return w + 1;
      return w % 2 ? w + 1 : w;
    }
    if (v !== v) {
      e = (1 << ebits) - 1;
      f = pow(2, fbits - 1);
      s = 0;
    } else if (v === Infinity || v === -Infinity) {
      e = (1 << ebits) - 1;
      f = 0;
      s = (v < 0) ? 1 : 0;
    } else if (v === 0) {
      e = 0;
      f = 0;
      s = (1 / v === -Infinity) ? 1 : 0;
    } else {
      s = v < 0;
      v = abs(v);
      if (v >= pow(2, 1 - bias)) {
        e = min(floor(log(v) / LN2), 1023);
        f = roundToEven(v / pow(2, e) * pow(2, fbits));
        if (f / pow(2, fbits) >= 2) {
          e = e + 1;
          f = 1;
        }
        if (e > bias) {
          e = (1 << ebits) - 1;
          f = 0;
        } else {
          e = e + bias;
          f = f - pow(2, fbits);
        }
      } else {
        e = 0;
        f = roundToEven(v / pow(2, 1 - bias - fbits));
      }
    }
    bits = [];
    for (i = fbits; i; i -= 1) {
      bits.push(f % 2 ? 1 : 0);
      f = floor(f / 2);
    }
    for (i = ebits; i; i -= 1) {
      bits.push(e % 2 ? 1 : 0);
      e = floor(e / 2);
    }
    bits.push(s ? 1 : 0);
    bits.reverse();
    str = bits.join('');
    bytes = [];
    while (str.length) {
      bytes.push(parseInt(str.substring(0, 8), 2));
      str = str.substring(8);
    }
    return bytes;
  }
  function unpackIEEE754(bytes, ebits, fbits) {
    var bits = [],
        i,
        j,
        b,
        str,
        bias,
        s,
        e,
        f;
    for (i = bytes.length; i; i -= 1) {
      b = bytes[i - 1];
      for (j = 8; j; j -= 1) {
        bits.push(b % 2 ? 1 : 0);
        b = b >> 1;
      }
    }
    bits.reverse();
    str = bits.join('');
    bias = (1 << (ebits - 1)) - 1;
    s = parseInt(str.substring(0, 1), 2) ? -1 : 1;
    e = parseInt(str.substring(1, 1 + ebits), 2);
    f = parseInt(str.substring(1 + ebits), 2);
    if (e === (1 << ebits) - 1) {
      return f !== 0 ? NaN : s * Infinity;
    } else if (e > 0) {
      return s * pow(2, e - bias) * (1 + f / pow(2, fbits));
    } else if (f !== 0) {
      return s * pow(2, -(bias - 1)) * (f / pow(2, fbits));
    } else {
      return s < 0 ? -0 : 0;
    }
  }
  function unpackF32(b) {
    return unpackIEEE754(b, 8, 23);
  }
  function packF32(v) {
    return packIEEE754(v, 8, 23);
  }
  function fround(x) {
    if (x === 0 || !$isFinite(x) || $isNaN(x)) {
      return x;
    }
    return unpackF32(packF32(Number(x)));
  }
  return {get fround() {
      return fround;
    }};
});
System.registerModule("traceur-runtime@0.0.91/src/runtime/polyfills/Math.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/polyfills/Math.js";
  var jsFround = System.get("traceur-runtime@0.0.91/src/runtime/polyfills/fround.js").fround;
  var $__1 = System.get("traceur-runtime@0.0.91/src/runtime/polyfills/utils.js"),
      maybeAddFunctions = $__1.maybeAddFunctions,
      registerPolyfill = $__1.registerPolyfill,
      toUint32 = $__1.toUint32;
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var $__3 = Math,
      abs = $__3.abs,
      ceil = $__3.ceil,
      exp = $__3.exp,
      floor = $__3.floor,
      log = $__3.log,
      pow = $__3.pow,
      sqrt = $__3.sqrt;
  function clz32(x) {
    x = toUint32(+x);
    if (x == 0)
      return 32;
    var result = 0;
    if ((x & 0xFFFF0000) === 0) {
      x <<= 16;
      result += 16;
    }
    ;
    if ((x & 0xFF000000) === 0) {
      x <<= 8;
      result += 8;
    }
    ;
    if ((x & 0xF0000000) === 0) {
      x <<= 4;
      result += 4;
    }
    ;
    if ((x & 0xC0000000) === 0) {
      x <<= 2;
      result += 2;
    }
    ;
    if ((x & 0x80000000) === 0) {
      x <<= 1;
      result += 1;
    }
    ;
    return result;
  }
  function imul(x, y) {
    x = toUint32(+x);
    y = toUint32(+y);
    var xh = (x >>> 16) & 0xffff;
    var xl = x & 0xffff;
    var yh = (y >>> 16) & 0xffff;
    var yl = y & 0xffff;
    return xl * yl + (((xh * yl + xl * yh) << 16) >>> 0) | 0;
  }
  function sign(x) {
    x = +x;
    if (x > 0)
      return 1;
    if (x < 0)
      return -1;
    return x;
  }
  function log10(x) {
    return log(x) * 0.434294481903251828;
  }
  function log2(x) {
    return log(x) * 1.442695040888963407;
  }
  function log1p(x) {
    x = +x;
    if (x < -1 || $isNaN(x)) {
      return NaN;
    }
    if (x === 0 || x === Infinity) {
      return x;
    }
    if (x === -1) {
      return -Infinity;
    }
    var result = 0;
    var n = 50;
    if (x < 0 || x > 1) {
      return log(1 + x);
    }
    for (var i = 1; i < n; i++) {
      if ((i % 2) === 0) {
        result -= pow(x, i) / i;
      } else {
        result += pow(x, i) / i;
      }
    }
    return result;
  }
  function expm1(x) {
    x = +x;
    if (x === -Infinity) {
      return -1;
    }
    if (!$isFinite(x) || x === 0) {
      return x;
    }
    return exp(x) - 1;
  }
  function cosh(x) {
    x = +x;
    if (x === 0) {
      return 1;
    }
    if ($isNaN(x)) {
      return NaN;
    }
    if (!$isFinite(x)) {
      return Infinity;
    }
    if (x < 0) {
      x = -x;
    }
    if (x > 21) {
      return exp(x) / 2;
    }
    return (exp(x) + exp(-x)) / 2;
  }
  function sinh(x) {
    x = +x;
    if (!$isFinite(x) || x === 0) {
      return x;
    }
    return (exp(x) - exp(-x)) / 2;
  }
  function tanh(x) {
    x = +x;
    if (x === 0)
      return x;
    if (!$isFinite(x))
      return sign(x);
    var exp1 = exp(x);
    var exp2 = exp(-x);
    return (exp1 - exp2) / (exp1 + exp2);
  }
  function acosh(x) {
    x = +x;
    if (x < 1)
      return NaN;
    if (!$isFinite(x))
      return x;
    return log(x + sqrt(x + 1) * sqrt(x - 1));
  }
  function asinh(x) {
    x = +x;
    if (x === 0 || !$isFinite(x))
      return x;
    if (x > 0)
      return log(x + sqrt(x * x + 1));
    return -log(-x + sqrt(x * x + 1));
  }
  function atanh(x) {
    x = +x;
    if (x === -1) {
      return -Infinity;
    }
    if (x === 1) {
      return Infinity;
    }
    if (x === 0) {
      return x;
    }
    if ($isNaN(x) || x < -1 || x > 1) {
      return NaN;
    }
    return 0.5 * log((1 + x) / (1 - x));
  }
  function hypot(x, y) {
    var length = arguments.length;
    var args = new Array(length);
    var max = 0;
    for (var i = 0; i < length; i++) {
      var n = arguments[i];
      n = +n;
      if (n === Infinity || n === -Infinity)
        return Infinity;
      n = abs(n);
      if (n > max)
        max = n;
      args[i] = n;
    }
    if (max === 0)
      max = 1;
    var sum = 0;
    var compensation = 0;
    for (var i = 0; i < length; i++) {
      var n = args[i] / max;
      var summand = n * n - compensation;
      var preliminary = sum + summand;
      compensation = (preliminary - sum) - summand;
      sum = preliminary;
    }
    return sqrt(sum) * max;
  }
  function trunc(x) {
    x = +x;
    if (x > 0)
      return floor(x);
    if (x < 0)
      return ceil(x);
    return x;
  }
  var fround,
      f32;
  if (typeof Float32Array === 'function') {
    f32 = new Float32Array(1);
    fround = function(x) {
      f32[0] = Number(x);
      return f32[0];
    };
  } else {
    fround = jsFround;
  }
  function cbrt(x) {
    x = +x;
    if (x === 0)
      return x;
    var negate = x < 0;
    if (negate)
      x = -x;
    var result = pow(x, 1 / 3);
    return negate ? -result : result;
  }
  function polyfillMath(global) {
    var Math = global.Math;
    maybeAddFunctions(Math, ['acosh', acosh, 'asinh', asinh, 'atanh', atanh, 'cbrt', cbrt, 'clz32', clz32, 'cosh', cosh, 'expm1', expm1, 'fround', fround, 'hypot', hypot, 'imul', imul, 'log10', log10, 'log1p', log1p, 'log2', log2, 'sign', sign, 'sinh', sinh, 'tanh', tanh, 'trunc', trunc]);
  }
  registerPolyfill(polyfillMath);
  return {
    get clz32() {
      return clz32;
    },
    get imul() {
      return imul;
    },
    get sign() {
      return sign;
    },
    get log10() {
      return log10;
    },
    get log2() {
      return log2;
    },
    get log1p() {
      return log1p;
    },
    get expm1() {
      return expm1;
    },
    get cosh() {
      return cosh;
    },
    get sinh() {
      return sinh;
    },
    get tanh() {
      return tanh;
    },
    get acosh() {
      return acosh;
    },
    get asinh() {
      return asinh;
    },
    get atanh() {
      return atanh;
    },
    get hypot() {
      return hypot;
    },
    get trunc() {
      return trunc;
    },
    get fround() {
      return fround;
    },
    get cbrt() {
      return cbrt;
    },
    get polyfillMath() {
      return polyfillMath;
    }
  };
});
System.get("traceur-runtime@0.0.91/src/runtime/polyfills/Math.js" + '');
System.registerModule("traceur-runtime@0.0.91/src/runtime/polyfills/polyfills.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.91/src/runtime/polyfills/polyfills.js";
  var polyfillAll = System.get("traceur-runtime@0.0.91/src/runtime/polyfills/utils.js").polyfillAll;
  polyfillAll(Reflect.global);
  var setupGlobals = $traceurRuntime.setupGlobals;
  $traceurRuntime.setupGlobals = function(global) {
    setupGlobals(global);
    polyfillAll(global);
  };
  return {};
});
System.get("traceur-runtime@0.0.91/src/runtime/polyfills/polyfills.js" + '');
;System.registerModule("src/base/Seq.js", [], function() {
  "use strict";
  var __moduleName = "src/base/Seq.js";
  var THROW_IF_EMPTY = {if_same_instance_as_this_then_throw: true};
  var EMPTY_SYGIL = {not_a_normal_value: true};
  var GENERIC_ARRAY_TYPES = [Float32Array, Float64Array, Int8Array, Int16Array, Int32Array, Uint8Array, Uint16Array, Uint32Array, Uint8ClampedArray];
  var Seq = function() {
    var $__3;
    function Seq(iterable) {
      if (iterable[Symbol.iterator] === undefined) {
        throw new Error(("Not iterable: " + iterable));
      }
      this.iterable = iterable instanceof Seq ? iterable.iterable : iterable;
    }
    return ($traceurRuntime.createClass)(Seq, ($__3 = {}, Object.defineProperty($__3, Symbol.iterator, {
      value: function() {
        return this.iterable[Symbol.iterator]();
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "isEqualTo", {
      value: function(other) {
        var comparator = arguments[1] !== (void 0) ? arguments[1] : function(e1, e2) {
          return e1 === e2;
        };
        if (other === undefined || other === null || other[Symbol.iterator] === undefined) {
          return false;
        }
        if (other === this) {
          return true;
        }
        var iter2 = other[Symbol.iterator]();
        var $__8 = true;
        var $__9 = false;
        var $__10 = undefined;
        try {
          for (var $__6 = void 0,
              $__5 = (this)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__8 = ($__6 = $__5.next()).done); $__8 = true) {
            var e1 = $__6.value;
            {
              var e2 = iter2.next();
              if (e2.done || !comparator(e1, e2.value)) {
                return false;
              }
            }
          }
        } catch ($__11) {
          $__9 = true;
          $__10 = $__11;
        } finally {
          try {
            if (!$__8 && $__5.return != null) {
              $__5.return();
            }
          } finally {
            if ($__9) {
              throw $__10;
            }
          }
        }
        return iter2.next().done;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "toArray", {
      value: function() {
        return Array.from(this);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "toSet", {
      value: function() {
        return new Set(this.iterable);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "join", {
      value: function(joiner) {
        return this.toArray().join(joiner);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "toString", {
      value: function() {
        return ("Seq[" + this.join(", ") + "]");
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "solidify", {
      value: function() {
        var knownSolidTypes = [Float32Array, Float64Array, Int8Array, Int16Array, Int32Array, Uint8Array, Uint16Array, Uint32Array];
        if (Array.isArray(this.iterable)) {
          return this;
        }
        var $__8 = true;
        var $__9 = false;
        var $__10 = undefined;
        try {
          for (var $__6 = void 0,
              $__5 = (knownSolidTypes)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__8 = ($__6 = $__5.next()).done); $__8 = true) {
            var t = $__6.value;
            {
              if (this.iterable instanceof t) {
                return this;
              }
            }
          }
        } catch ($__11) {
          $__9 = true;
          $__10 = $__11;
        } finally {
          try {
            if (!$__8 && $__5.return != null) {
              $__5.return();
            }
          } finally {
            if ($__9) {
              throw $__10;
            }
          }
        }
        return new Seq(this.toArray());
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "map", {
      value: function(projection) {
        var seq = this.iterable;
        return Seq.fromGenerator($traceurRuntime.initGeneratorFunction(function $__12() {
          var $__8,
              $__9,
              $__10,
              $__6,
              $__5,
              e,
              $__11;
          return $traceurRuntime.createGeneratorInstance(function($ctx) {
            while (true)
              switch ($ctx.state) {
                case 0:
                  $__8 = true;
                  $__9 = false;
                  $__10 = undefined;
                  $ctx.state = 24;
                  break;
                case 24:
                  $ctx.pushTry(10, 11);
                  $ctx.state = 13;
                  break;
                case 13:
                  $__6 = void 0, $__5 = (seq)[$traceurRuntime.toProperty(Symbol.iterator)]();
                  $ctx.state = 9;
                  break;
                case 9:
                  $ctx.state = (!($__8 = ($__6 = $__5.next()).done)) ? 5 : 7;
                  break;
                case 4:
                  $__8 = true;
                  $ctx.state = 9;
                  break;
                case 5:
                  e = $__6.value;
                  $ctx.state = 6;
                  break;
                case 6:
                  $ctx.state = 2;
                  return projection(e);
                case 2:
                  $ctx.maybeThrow();
                  $ctx.state = 4;
                  break;
                case 7:
                  $ctx.popTry();
                  $ctx.state = 11;
                  $ctx.finallyFallThrough = -2;
                  break;
                case 10:
                  $ctx.popTry();
                  $ctx.maybeUncatchable();
                  $__11 = $ctx.storedException;
                  $ctx.state = 16;
                  break;
                case 16:
                  $__9 = true;
                  $__10 = $__11;
                  $ctx.state = 11;
                  $ctx.finallyFallThrough = -2;
                  break;
                case 11:
                  $ctx.popTry();
                  $ctx.state = 22;
                  break;
                case 22:
                  try {
                    if (!$__8 && $__5.return != null) {
                      $__5.return();
                    }
                  } finally {
                    if ($__9) {
                      throw $__10;
                    }
                  }
                  $ctx.state = 20;
                  break;
                case 20:
                  $ctx.state = $ctx.finallyFallThrough;
                  break;
                default:
                  return $ctx.end();
              }
          }, $__12, this);
        }));
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "flatMap", {
      value: function(sequenceProjection) {
        var seq = this.iterable;
        return Seq.fromGenerator($traceurRuntime.initGeneratorFunction(function $__12() {
          var $__8,
              $__9,
              $__10,
              $__6,
              $__5,
              e,
              $__13,
              $__14,
              $__11;
          return $traceurRuntime.createGeneratorInstance(function($ctx) {
            while (true)
              switch ($ctx.state) {
                case 0:
                  $__8 = true;
                  $__9 = false;
                  $__10 = undefined;
                  $ctx.state = 32;
                  break;
                case 32:
                  $ctx.pushTry(18, 19);
                  $ctx.state = 21;
                  break;
                case 21:
                  $__6 = void 0, $__5 = (seq)[$traceurRuntime.toProperty(Symbol.iterator)]();
                  $ctx.state = 17;
                  break;
                case 17:
                  $ctx.state = (!($__8 = ($__6 = $__5.next()).done)) ? 13 : 15;
                  break;
                case 10:
                  $__8 = true;
                  $ctx.state = 17;
                  break;
                case 13:
                  e = $__6.value;
                  $ctx.state = 14;
                  break;
                case 14:
                  $__13 = $ctx.wrapYieldStar(sequenceProjection(e)[Symbol.iterator]());
                  $ctx.sent = void 0;
                  $ctx.action = 'next';
                  $ctx.state = 12;
                  break;
                case 12:
                  $__14 = $__13[$ctx.action]($ctx.sentIgnoreThrow);
                  $ctx.state = 9;
                  break;
                case 9:
                  $ctx.state = ($__14.done) ? 3 : 2;
                  break;
                case 3:
                  $ctx.sent = $__14.value;
                  $ctx.state = 10;
                  break;
                case 2:
                  $ctx.state = 12;
                  return $__14.value;
                case 15:
                  $ctx.popTry();
                  $ctx.state = 19;
                  $ctx.finallyFallThrough = -2;
                  break;
                case 18:
                  $ctx.popTry();
                  $ctx.maybeUncatchable();
                  $__11 = $ctx.storedException;
                  $ctx.state = 24;
                  break;
                case 24:
                  $__9 = true;
                  $__10 = $__11;
                  $ctx.state = 19;
                  $ctx.finallyFallThrough = -2;
                  break;
                case 19:
                  $ctx.popTry();
                  $ctx.state = 30;
                  break;
                case 30:
                  try {
                    if (!$__8 && $__5.return != null) {
                      $__5.return();
                    }
                  } finally {
                    if ($__9) {
                      throw $__10;
                    }
                  }
                  $ctx.state = 28;
                  break;
                case 28:
                  $ctx.state = $ctx.finallyFallThrough;
                  break;
                default:
                  return $ctx.end();
              }
          }, $__12, this);
        }));
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "filter", {
      value: function(predicate) {
        var seq = this.iterable;
        return Seq.fromGenerator($traceurRuntime.initGeneratorFunction(function $__12() {
          var $__8,
              $__9,
              $__10,
              $__6,
              $__5,
              e,
              $__11;
          return $traceurRuntime.createGeneratorInstance(function($ctx) {
            while (true)
              switch ($ctx.state) {
                case 0:
                  $__8 = true;
                  $__9 = false;
                  $__10 = undefined;
                  $ctx.state = 25;
                  break;
                case 25:
                  $ctx.pushTry(11, 12);
                  $ctx.state = 14;
                  break;
                case 14:
                  $__6 = void 0, $__5 = (seq)[$traceurRuntime.toProperty(Symbol.iterator)]();
                  $ctx.state = 10;
                  break;
                case 10:
                  $ctx.state = (!($__8 = ($__6 = $__5.next()).done)) ? 6 : 8;
                  break;
                case 4:
                  $__8 = true;
                  $ctx.state = 10;
                  break;
                case 6:
                  e = $__6.value;
                  $ctx.state = 7;
                  break;
                case 7:
                  $ctx.state = (predicate(e)) ? 1 : 4;
                  break;
                case 1:
                  $ctx.state = 2;
                  return e;
                case 2:
                  $ctx.maybeThrow();
                  $ctx.state = 4;
                  break;
                case 8:
                  $ctx.popTry();
                  $ctx.state = 12;
                  $ctx.finallyFallThrough = -2;
                  break;
                case 11:
                  $ctx.popTry();
                  $ctx.maybeUncatchable();
                  $__11 = $ctx.storedException;
                  $ctx.state = 17;
                  break;
                case 17:
                  $__9 = true;
                  $__10 = $__11;
                  $ctx.state = 12;
                  $ctx.finallyFallThrough = -2;
                  break;
                case 12:
                  $ctx.popTry();
                  $ctx.state = 23;
                  break;
                case 23:
                  try {
                    if (!$__8 && $__5.return != null) {
                      $__5.return();
                    }
                  } finally {
                    if ($__9) {
                      throw $__10;
                    }
                  }
                  $ctx.state = 21;
                  break;
                case 21:
                  $ctx.state = $ctx.finallyFallThrough;
                  break;
                default:
                  return $ctx.end();
              }
          }, $__12, this);
        }));
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "fold", {
      value: function(combiner) {
        var emptyErrorAlternative = arguments[1] !== (void 0) ? arguments[1] : THROW_IF_EMPTY;
        var accumulator = EMPTY_SYGIL;
        var $__8 = true;
        var $__9 = false;
        var $__10 = undefined;
        try {
          for (var $__6 = void 0,
              $__5 = (this)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__8 = ($__6 = $__5.next()).done); $__8 = true) {
            var e = $__6.value;
            {
              accumulator = accumulator === EMPTY_SYGIL ? e : combiner(accumulator, e);
            }
          }
        } catch ($__11) {
          $__9 = true;
          $__10 = $__11;
        } finally {
          try {
            if (!$__8 && $__5.return != null) {
              $__5.return();
            }
          } finally {
            if ($__9) {
              throw $__10;
            }
          }
        }
        if (accumulator !== EMPTY_SYGIL) {
          return accumulator;
        }
        if (emptyErrorAlternative === THROW_IF_EMPTY) {
          throw new Error("Folded empty sequence without providing an alternative result.");
        }
        return emptyErrorAlternative;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "aggregate", {
      value: function(seed, aggregator) {
        var accumulator = seed;
        var $__8 = true;
        var $__9 = false;
        var $__10 = undefined;
        try {
          for (var $__6 = void 0,
              $__5 = (this)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__8 = ($__6 = $__5.next()).done); $__8 = true) {
            var e = $__6.value;
            {
              accumulator = aggregator(accumulator, e);
            }
          }
        } catch ($__11) {
          $__9 = true;
          $__10 = $__11;
        } finally {
          try {
            if (!$__8 && $__5.return != null) {
              $__5.return();
            }
          } finally {
            if ($__9) {
              throw $__10;
            }
          }
        }
        return accumulator;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "zip", {
      value: function(other, combiner) {
        var seq = this.iterable;
        return Seq.fromGenerator($traceurRuntime.initGeneratorFunction(function $__12() {
          var iter2,
              $__8,
              $__9,
              $__10,
              $__6,
              $__5,
              item1,
              item2,
              $__11;
          return $traceurRuntime.createGeneratorInstance(function($ctx) {
            while (true)
              switch ($ctx.state) {
                case 0:
                  iter2 = other[Symbol.iterator]();
                  $__8 = true;
                  $__9 = false;
                  $__10 = undefined;
                  $ctx.state = 29;
                  break;
                case 29:
                  $ctx.pushTry(15, 16);
                  $ctx.state = 18;
                  break;
                case 18:
                  $__6 = void 0, $__5 = (seq)[$traceurRuntime.toProperty(Symbol.iterator)]();
                  $ctx.state = 14;
                  break;
                case 14:
                  $ctx.state = (!($__8 = ($__6 = $__5.next()).done)) ? 10 : 12;
                  break;
                case 7:
                  $__8 = true;
                  $ctx.state = 14;
                  break;
                case 10:
                  item1 = $__6.value;
                  $ctx.state = 11;
                  break;
                case 11:
                  item2 = iter2.next();
                  $ctx.state = 9;
                  break;
                case 9:
                  $ctx.state = (item2.done) ? 12 : 2;
                  break;
                case 2:
                  $ctx.state = 5;
                  return combiner(item1, item2.value);
                case 5:
                  $ctx.maybeThrow();
                  $ctx.state = 7;
                  break;
                case 12:
                  $ctx.popTry();
                  $ctx.state = 16;
                  $ctx.finallyFallThrough = -2;
                  break;
                case 15:
                  $ctx.popTry();
                  $ctx.maybeUncatchable();
                  $__11 = $ctx.storedException;
                  $ctx.state = 21;
                  break;
                case 21:
                  $__9 = true;
                  $__10 = $__11;
                  $ctx.state = 16;
                  $ctx.finallyFallThrough = -2;
                  break;
                case 16:
                  $ctx.popTry();
                  $ctx.state = 27;
                  break;
                case 27:
                  try {
                    if (!$__8 && $__5.return != null) {
                      $__5.return();
                    }
                  } finally {
                    if ($__9) {
                      throw $__10;
                    }
                  }
                  $ctx.state = 25;
                  break;
                case 25:
                  $ctx.state = $ctx.finallyFallThrough;
                  break;
                default:
                  return $ctx.end();
              }
          }, $__12, this);
        }));
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "max", {
      value: function() {
        var emptyErrorAlternative = arguments[0] !== (void 0) ? arguments[0] : THROW_IF_EMPTY;
        return this.fold(function(e1, e2) {
          return e1 < e2 ? e2 : e1;
        }, emptyErrorAlternative);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "min", {
      value: function() {
        var emptyErrorAlternative = arguments[0] !== (void 0) ? arguments[0] : THROW_IF_EMPTY;
        return this.fold(function(e1, e2) {
          return e1 < e2 ? e1 : e2;
        }, emptyErrorAlternative);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "maxBy", {
      value: function(projection) {
        var emptyErrorAlternative = arguments[1] !== (void 0) ? arguments[1] : THROW_IF_EMPTY;
        var isALessThanBComparator = arguments[2] !== (void 0) ? arguments[2] : function(e1, e2) {
          return e1 < e2;
        };
        var curMaxItem = EMPTY_SYGIL;
        var curMaxScore = EMPTY_SYGIL;
        var $__8 = true;
        var $__9 = false;
        var $__10 = undefined;
        try {
          for (var $__6 = void 0,
              $__5 = (this)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__8 = ($__6 = $__5.next()).done); $__8 = true) {
            var item = $__6.value;
            {
              if (curMaxItem === EMPTY_SYGIL) {
                curMaxItem = item;
                continue;
              }
              if (curMaxScore === EMPTY_SYGIL) {
                curMaxScore = projection(curMaxItem);
              }
              var score = projection(item);
              if (isALessThanBComparator(curMaxScore, score)) {
                curMaxItem = item;
                curMaxScore = score;
              }
            }
          }
        } catch ($__11) {
          $__9 = true;
          $__10 = $__11;
        } finally {
          try {
            if (!$__8 && $__5.return != null) {
              $__5.return();
            }
          } finally {
            if ($__9) {
              throw $__10;
            }
          }
        }
        if (curMaxItem !== EMPTY_SYGIL) {
          return curMaxItem;
        }
        if (emptyErrorAlternative === THROW_IF_EMPTY) {
          throw new Error("Can't maxBy an empty sequence.");
        }
        return emptyErrorAlternative;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "minBy", {
      value: function(projection) {
        var emptyErrorAlternative = arguments[1] !== (void 0) ? arguments[1] : THROW_IF_EMPTY;
        var isALessThanBComparator = arguments[2] !== (void 0) ? arguments[2] : function(e1, e2) {
          return e1 < e2;
        };
        return this.maxBy(projection, emptyErrorAlternative, function(e1, e2) {
          return isALessThanBComparator(e2, e1);
        });
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "any", {
      value: function(predicate) {
        var $__8 = true;
        var $__9 = false;
        var $__10 = undefined;
        try {
          for (var $__6 = void 0,
              $__5 = (this)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__8 = ($__6 = $__5.next()).done); $__8 = true) {
            var e = $__6.value;
            {
              if (predicate(e)) {
                return true;
              }
            }
          }
        } catch ($__11) {
          $__9 = true;
          $__10 = $__11;
        } finally {
          try {
            if (!$__8 && $__5.return != null) {
              $__5.return();
            }
          } finally {
            if ($__9) {
              throw $__10;
            }
          }
        }
        return false;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "every", {
      value: function(predicate) {
        return !this.any(function(e) {
          return !predicate(e);
        });
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "contains", {
      value: function(value) {
        return this.any(function(e) {
          return e === value;
        });
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "sum", {
      value: function() {
        return this.fold(function(a, e) {
          return a + e;
        }, 0);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "product", {
      value: function() {
        return this.fold(function(a, e) {
          return a * e;
        }, 1);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "scan", {
      value: function(seed, aggregator) {
        var seq = this.iterable;
        return Seq.fromGenerator($traceurRuntime.initGeneratorFunction(function $__12() {
          var accumulator,
              $__8,
              $__9,
              $__10,
              $__6,
              $__5,
              e,
              $__11;
          return $traceurRuntime.createGeneratorInstance(function($ctx) {
            while (true)
              switch ($ctx.state) {
                case 0:
                  accumulator = seed;
                  $ctx.state = 30;
                  break;
                case 30:
                  $ctx.state = 2;
                  return accumulator;
                case 2:
                  $ctx.maybeThrow();
                  $ctx.state = 4;
                  break;
                case 4:
                  $__8 = true;
                  $__9 = false;
                  $__10 = undefined;
                  $ctx.state = 32;
                  break;
                case 32:
                  $ctx.pushTry(16, 17);
                  $ctx.state = 19;
                  break;
                case 19:
                  $__6 = void 0, $__5 = (seq)[$traceurRuntime.toProperty(Symbol.iterator)]();
                  $ctx.state = 15;
                  break;
                case 15:
                  $ctx.state = (!($__8 = ($__6 = $__5.next()).done)) ? 11 : 13;
                  break;
                case 8:
                  $__8 = true;
                  $ctx.state = 15;
                  break;
                case 11:
                  e = $__6.value;
                  $ctx.state = 12;
                  break;
                case 12:
                  accumulator = aggregator(accumulator, e);
                  $ctx.state = 10;
                  break;
                case 10:
                  $ctx.state = 6;
                  return accumulator;
                case 6:
                  $ctx.maybeThrow();
                  $ctx.state = 8;
                  break;
                case 13:
                  $ctx.popTry();
                  $ctx.state = 17;
                  $ctx.finallyFallThrough = -2;
                  break;
                case 16:
                  $ctx.popTry();
                  $ctx.maybeUncatchable();
                  $__11 = $ctx.storedException;
                  $ctx.state = 22;
                  break;
                case 22:
                  $__9 = true;
                  $__10 = $__11;
                  $ctx.state = 17;
                  $ctx.finallyFallThrough = -2;
                  break;
                case 17:
                  $ctx.popTry();
                  $ctx.state = 28;
                  break;
                case 28:
                  try {
                    if (!$__8 && $__5.return != null) {
                      $__5.return();
                    }
                  } finally {
                    if ($__9) {
                      throw $__10;
                    }
                  }
                  $ctx.state = 26;
                  break;
                case 26:
                  $ctx.state = $ctx.finallyFallThrough;
                  break;
                default:
                  return $ctx.end();
              }
          }, $__12, this);
        }));
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "reverse", {
      value: function() {
        return new Seq(this.toArray().reverse());
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "flatten", {
      value: function() {
        var seqSeq = this.iterable;
        return Seq.fromGenerator($traceurRuntime.initGeneratorFunction(function $__12() {
          var $__8,
              $__9,
              $__10,
              $__6,
              $__5,
              seq,
              $__15,
              $__16,
              $__11;
          return $traceurRuntime.createGeneratorInstance(function($ctx) {
            while (true)
              switch ($ctx.state) {
                case 0:
                  $__8 = true;
                  $__9 = false;
                  $__10 = undefined;
                  $ctx.state = 32;
                  break;
                case 32:
                  $ctx.pushTry(18, 19);
                  $ctx.state = 21;
                  break;
                case 21:
                  $__6 = void 0, $__5 = (seqSeq)[$traceurRuntime.toProperty(Symbol.iterator)]();
                  $ctx.state = 17;
                  break;
                case 17:
                  $ctx.state = (!($__8 = ($__6 = $__5.next()).done)) ? 13 : 15;
                  break;
                case 10:
                  $__8 = true;
                  $ctx.state = 17;
                  break;
                case 13:
                  seq = $__6.value;
                  $ctx.state = 14;
                  break;
                case 14:
                  $__15 = $ctx.wrapYieldStar(seq[Symbol.iterator]());
                  $ctx.sent = void 0;
                  $ctx.action = 'next';
                  $ctx.state = 12;
                  break;
                case 12:
                  $__16 = $__15[$ctx.action]($ctx.sentIgnoreThrow);
                  $ctx.state = 9;
                  break;
                case 9:
                  $ctx.state = ($__16.done) ? 3 : 2;
                  break;
                case 3:
                  $ctx.sent = $__16.value;
                  $ctx.state = 10;
                  break;
                case 2:
                  $ctx.state = 12;
                  return $__16.value;
                case 15:
                  $ctx.popTry();
                  $ctx.state = 19;
                  $ctx.finallyFallThrough = -2;
                  break;
                case 18:
                  $ctx.popTry();
                  $ctx.maybeUncatchable();
                  $__11 = $ctx.storedException;
                  $ctx.state = 24;
                  break;
                case 24:
                  $__9 = true;
                  $__10 = $__11;
                  $ctx.state = 19;
                  $ctx.finallyFallThrough = -2;
                  break;
                case 19:
                  $ctx.popTry();
                  $ctx.state = 30;
                  break;
                case 30:
                  try {
                    if (!$__8 && $__5.return != null) {
                      $__5.return();
                    }
                  } finally {
                    if ($__9) {
                      throw $__10;
                    }
                  }
                  $ctx.state = 28;
                  break;
                case 28:
                  $ctx.state = $ctx.finallyFallThrough;
                  break;
                default:
                  return $ctx.end();
              }
          }, $__12, this);
        }));
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "concat", {
      value: function(other) {
        var seq = this.iterable;
        return Seq.fromGenerator($traceurRuntime.initGeneratorFunction(function $__12() {
          var $__17,
              $__18,
              $__19,
              $__20;
          return $traceurRuntime.createGeneratorInstance(function($ctx) {
            while (true)
              switch ($ctx.state) {
                case 0:
                  $__17 = $ctx.wrapYieldStar(seq[Symbol.iterator]());
                  $ctx.sent = void 0;
                  $ctx.action = 'next';
                  $ctx.state = 12;
                  break;
                case 12:
                  $__18 = $__17[$ctx.action]($ctx.sentIgnoreThrow);
                  $ctx.state = 9;
                  break;
                case 9:
                  $ctx.state = ($__18.done) ? 3 : 2;
                  break;
                case 3:
                  $ctx.sent = $__18.value;
                  $ctx.state = 10;
                  break;
                case 2:
                  $ctx.state = 12;
                  return $__18.value;
                case 10:
                  $__19 = $ctx.wrapYieldStar(other[Symbol.iterator]());
                  $ctx.sent = void 0;
                  $ctx.action = 'next';
                  $ctx.state = 24;
                  break;
                case 24:
                  $__20 = $__19[$ctx.action]($ctx.sentIgnoreThrow);
                  $ctx.state = 21;
                  break;
                case 21:
                  $ctx.state = ($__20.done) ? 15 : 14;
                  break;
                case 15:
                  $ctx.sent = $__20.value;
                  $ctx.state = -2;
                  break;
                case 14:
                  $ctx.state = 24;
                  return $__20.value;
                default:
                  return $ctx.end();
              }
          }, $__12, this);
        }));
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "withOverlayedItem", {
      value: function(index, overlayedItem) {
        if (index < 0) {
          throw new Error("needed index >= 0");
        }
        var self = this;
        return Seq.fromGenerator($traceurRuntime.initGeneratorFunction(function $__12() {
          var i,
              $__8,
              $__9,
              $__10,
              $__6,
              $__5,
              e,
              $__11;
          return $traceurRuntime.createGeneratorInstance(function($ctx) {
            while (true)
              switch ($ctx.state) {
                case 0:
                  if (self.tryPeekCount() !== undefined && index >= self.tryPeekCount()) {
                    throw new Error("needed index <= count");
                  }
                  i = 0;
                  $__8 = true;
                  $__9 = false;
                  $__10 = undefined;
                  $ctx.state = 26;
                  break;
                case 26:
                  $ctx.pushTry(12, 13);
                  $ctx.state = 15;
                  break;
                case 15:
                  $__6 = void 0, $__5 = (self.iterable)[$traceurRuntime.toProperty(Symbol.iterator)]();
                  $ctx.state = 11;
                  break;
                case 11:
                  $ctx.state = (!($__8 = ($__6 = $__5.next()).done)) ? 7 : 9;
                  break;
                case 6:
                  $__8 = true;
                  $ctx.state = 11;
                  break;
                case 7:
                  e = $__6.value;
                  $ctx.state = 8;
                  break;
                case 8:
                  $ctx.state = 2;
                  return i === index ? overlayedItem : e;
                case 2:
                  $ctx.maybeThrow();
                  $ctx.state = 4;
                  break;
                case 4:
                  i++;
                  $ctx.state = 6;
                  break;
                case 9:
                  $ctx.popTry();
                  $ctx.state = 13;
                  $ctx.finallyFallThrough = 17;
                  break;
                case 12:
                  $ctx.popTry();
                  $ctx.maybeUncatchable();
                  $__11 = $ctx.storedException;
                  $ctx.state = 18;
                  break;
                case 18:
                  $__9 = true;
                  $__10 = $__11;
                  $ctx.state = 13;
                  $ctx.finallyFallThrough = 17;
                  break;
                case 13:
                  $ctx.popTry();
                  $ctx.state = 24;
                  break;
                case 24:
                  try {
                    if (!$__8 && $__5.return != null) {
                      $__5.return();
                    }
                  } finally {
                    if ($__9) {
                      throw $__10;
                    }
                  }
                  $ctx.state = 22;
                  break;
                case 17:
                  if (i <= index) {
                    throw new Error("sequence ended before overlay " + "[withOverlayedItem(${index}, ${overlayedItem})]");
                  }
                  $ctx.state = -2;
                  break;
                case 22:
                  $ctx.state = $ctx.finallyFallThrough;
                  break;
                default:
                  return $ctx.end();
              }
          }, $__12, this);
        }));
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "withTransformedItem", {
      value: function(index, itemTransformation) {
        if (index < 0) {
          throw new Error("needed index >= 0");
        }
        var self = this;
        return Seq.fromGenerator($traceurRuntime.initGeneratorFunction(function $__12() {
          var i,
              $__8,
              $__9,
              $__10,
              $__6,
              $__5,
              e,
              $__11;
          return $traceurRuntime.createGeneratorInstance(function($ctx) {
            while (true)
              switch ($ctx.state) {
                case 0:
                  if (self.tryPeekCount() !== undefined && index >= self.tryPeekCount()) {
                    throw new Error("needed index <= count");
                  }
                  i = 0;
                  $__8 = true;
                  $__9 = false;
                  $__10 = undefined;
                  $ctx.state = 26;
                  break;
                case 26:
                  $ctx.pushTry(12, 13);
                  $ctx.state = 15;
                  break;
                case 15:
                  $__6 = void 0, $__5 = (self.iterable)[$traceurRuntime.toProperty(Symbol.iterator)]();
                  $ctx.state = 11;
                  break;
                case 11:
                  $ctx.state = (!($__8 = ($__6 = $__5.next()).done)) ? 7 : 9;
                  break;
                case 6:
                  $__8 = true;
                  $ctx.state = 11;
                  break;
                case 7:
                  e = $__6.value;
                  $ctx.state = 8;
                  break;
                case 8:
                  $ctx.state = 2;
                  return i === index ? itemTransformation(e) : e;
                case 2:
                  $ctx.maybeThrow();
                  $ctx.state = 4;
                  break;
                case 4:
                  i++;
                  $ctx.state = 6;
                  break;
                case 9:
                  $ctx.popTry();
                  $ctx.state = 13;
                  $ctx.finallyFallThrough = 17;
                  break;
                case 12:
                  $ctx.popTry();
                  $ctx.maybeUncatchable();
                  $__11 = $ctx.storedException;
                  $ctx.state = 18;
                  break;
                case 18:
                  $__9 = true;
                  $__10 = $__11;
                  $ctx.state = 13;
                  $ctx.finallyFallThrough = 17;
                  break;
                case 13:
                  $ctx.popTry();
                  $ctx.state = 24;
                  break;
                case 24:
                  try {
                    if (!$__8 && $__5.return != null) {
                      $__5.return();
                    }
                  } finally {
                    if ($__9) {
                      throw $__10;
                    }
                  }
                  $ctx.state = 22;
                  break;
                case 17:
                  if (i <= index) {
                    throw new Error("sequence ended before transformation " + "[withTransformedItem(${index}, ${itemTransformation})]");
                  }
                  $ctx.state = -2;
                  break;
                case 22:
                  $ctx.state = $ctx.finallyFallThrough;
                  break;
                default:
                  return $ctx.end();
              }
          }, $__12, this);
        }));
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "withInsertedItem", {
      value: function(index, item) {
        if (index < 0) {
          throw new Error("needed index >= 0");
        }
        var self = this;
        return Seq.fromGenerator($traceurRuntime.initGeneratorFunction(function $__12() {
          var i,
              $__8,
              $__9,
              $__10,
              $__6,
              $__5,
              e,
              $__11;
          return $traceurRuntime.createGeneratorInstance(function($ctx) {
            while (true)
              switch ($ctx.state) {
                case 0:
                  if (self.tryPeekCount() !== undefined && index > self.tryPeekCount()) {
                    throw new Error("needed index <= count");
                  }
                  i = 0;
                  $__8 = true;
                  $__9 = false;
                  $__10 = undefined;
                  $ctx.state = 36;
                  break;
                case 36:
                  $ctx.pushTry(17, 18);
                  $ctx.state = 20;
                  break;
                case 20:
                  $__6 = void 0, $__5 = (self.iterable)[$traceurRuntime.toProperty(Symbol.iterator)]();
                  $ctx.state = 16;
                  break;
                case 16:
                  $ctx.state = (!($__8 = ($__6 = $__5.next()).done)) ? 12 : 14;
                  break;
                case 9:
                  $__8 = true;
                  $ctx.state = 16;
                  break;
                case 12:
                  e = $__6.value;
                  $ctx.state = 13;
                  break;
                case 13:
                  $ctx.state = (i == index) ? 1 : 4;
                  break;
                case 1:
                  $ctx.state = 2;
                  return item;
                case 2:
                  $ctx.maybeThrow();
                  $ctx.state = 4;
                  break;
                case 4:
                  i++;
                  $ctx.state = 11;
                  break;
                case 11:
                  $ctx.state = 7;
                  return e;
                case 7:
                  $ctx.maybeThrow();
                  $ctx.state = 9;
                  break;
                case 14:
                  $ctx.popTry();
                  $ctx.state = 18;
                  $ctx.finallyFallThrough = 22;
                  break;
                case 17:
                  $ctx.popTry();
                  $ctx.maybeUncatchable();
                  $__11 = $ctx.storedException;
                  $ctx.state = 23;
                  break;
                case 23:
                  $__9 = true;
                  $__10 = $__11;
                  $ctx.state = 18;
                  $ctx.finallyFallThrough = 22;
                  break;
                case 18:
                  $ctx.popTry();
                  $ctx.state = 29;
                  break;
                case 29:
                  try {
                    if (!$__8 && $__5.return != null) {
                      $__5.return();
                    }
                  } finally {
                    if ($__9) {
                      throw $__10;
                    }
                  }
                  $ctx.state = 27;
                  break;
                case 22:
                  $ctx.state = (i == index) ? 30 : 33;
                  break;
                case 30:
                  $ctx.state = 31;
                  return item;
                case 31:
                  $ctx.maybeThrow();
                  $ctx.state = 33;
                  break;
                case 33:
                  if (i < index) {
                    throw new Error("sequence ended before insertion [withInsertedItem(${index}, ${item})]");
                  }
                  $ctx.state = -2;
                  break;
                case 27:
                  $ctx.state = $ctx.finallyFallThrough;
                  break;
                default:
                  return $ctx.end();
              }
          }, $__12, this);
        }));
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "takeWhile", {
      value: function(predicate) {
        var seq = this.iterable;
        return Seq.fromGenerator($traceurRuntime.initGeneratorFunction(function $__12() {
          var $__8,
              $__9,
              $__10,
              $__6,
              $__5,
              e,
              $__11;
          return $traceurRuntime.createGeneratorInstance(function($ctx) {
            while (true)
              switch ($ctx.state) {
                case 0:
                  $__8 = true;
                  $__9 = false;
                  $__10 = undefined;
                  $ctx.state = 27;
                  break;
                case 27:
                  $ctx.pushTry(13, 14);
                  $ctx.state = 16;
                  break;
                case 16:
                  $__6 = void 0, $__5 = (seq)[$traceurRuntime.toProperty(Symbol.iterator)]();
                  $ctx.state = 12;
                  break;
                case 12:
                  $ctx.state = (!($__8 = ($__6 = $__5.next()).done)) ? 8 : 10;
                  break;
                case 7:
                  $__8 = true;
                  $ctx.state = 12;
                  break;
                case 8:
                  e = $__6.value;
                  $ctx.state = 9;
                  break;
                case 9:
                  $ctx.state = (!predicate(e)) ? 10 : 2;
                  break;
                case 2:
                  $ctx.state = 5;
                  return e;
                case 5:
                  $ctx.maybeThrow();
                  $ctx.state = 7;
                  break;
                case 10:
                  $ctx.popTry();
                  $ctx.state = 14;
                  $ctx.finallyFallThrough = -2;
                  break;
                case 13:
                  $ctx.popTry();
                  $ctx.maybeUncatchable();
                  $__11 = $ctx.storedException;
                  $ctx.state = 19;
                  break;
                case 19:
                  $__9 = true;
                  $__10 = $__11;
                  $ctx.state = 14;
                  $ctx.finallyFallThrough = -2;
                  break;
                case 14:
                  $ctx.popTry();
                  $ctx.state = 25;
                  break;
                case 25:
                  try {
                    if (!$__8 && $__5.return != null) {
                      $__5.return();
                    }
                  } finally {
                    if ($__9) {
                      throw $__10;
                    }
                  }
                  $ctx.state = 23;
                  break;
                case 23:
                  $ctx.state = $ctx.finallyFallThrough;
                  break;
                default:
                  return $ctx.end();
              }
          }, $__12, this);
        }));
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "skipTailWhile", {
      value: function(predicate) {
        var seq = this.iterable;
        return Seq.fromGenerator($traceurRuntime.initGeneratorFunction(function $__12() {
          var tail,
              $__8,
              $__9,
              $__10,
              $__6,
              $__5,
              e,
              $__21,
              $__22,
              $__11;
          return $traceurRuntime.createGeneratorInstance(function($ctx) {
            while (true)
              switch ($ctx.state) {
                case 0:
                  tail = [];
                  $__8 = true;
                  $__9 = false;
                  $__10 = undefined;
                  $ctx.state = 41;
                  break;
                case 41:
                  $ctx.pushTry(27, 28);
                  $ctx.state = 30;
                  break;
                case 30:
                  $__6 = void 0, $__5 = (seq)[$traceurRuntime.toProperty(Symbol.iterator)]();
                  $ctx.state = 26;
                  break;
                case 26:
                  $ctx.state = (!($__8 = ($__6 = $__5.next()).done)) ? 22 : 24;
                  break;
                case 20:
                  $__8 = true;
                  $ctx.state = 26;
                  break;
                case 22:
                  e = $__6.value;
                  $ctx.state = 23;
                  break;
                case 23:
                  $ctx.state = (predicate(e)) ? 19 : 11;
                  break;
                case 19:
                  tail.push(e);
                  $ctx.state = 20;
                  break;
                case 11:
                  $__21 = $ctx.wrapYieldStar(tail[Symbol.iterator]());
                  $ctx.sent = void 0;
                  $ctx.action = 'next';
                  $ctx.state = 12;
                  break;
                case 12:
                  $__22 = $__21[$ctx.action]($ctx.sentIgnoreThrow);
                  $ctx.state = 9;
                  break;
                case 9:
                  $ctx.state = ($__22.done) ? 3 : 2;
                  break;
                case 3:
                  $ctx.sent = $__22.value;
                  $ctx.state = 10;
                  break;
                case 2:
                  $ctx.state = 12;
                  return $__22.value;
                case 10:
                  tail = [];
                  $ctx.state = 18;
                  break;
                case 18:
                  $ctx.state = 14;
                  return e;
                case 14:
                  $ctx.maybeThrow();
                  $ctx.state = 20;
                  break;
                case 24:
                  $ctx.popTry();
                  $ctx.state = 28;
                  $ctx.finallyFallThrough = -2;
                  break;
                case 27:
                  $ctx.popTry();
                  $ctx.maybeUncatchable();
                  $__11 = $ctx.storedException;
                  $ctx.state = 33;
                  break;
                case 33:
                  $__9 = true;
                  $__10 = $__11;
                  $ctx.state = 28;
                  $ctx.finallyFallThrough = -2;
                  break;
                case 28:
                  $ctx.popTry();
                  $ctx.state = 39;
                  break;
                case 39:
                  try {
                    if (!$__8 && $__5.return != null) {
                      $__5.return();
                    }
                  } finally {
                    if ($__9) {
                      throw $__10;
                    }
                  }
                  $ctx.state = 37;
                  break;
                case 37:
                  $ctx.state = $ctx.finallyFallThrough;
                  break;
                default:
                  return $ctx.end();
              }
          }, $__12, this);
        }));
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "take", {
      value: function(maxTakeCount) {
        if (maxTakeCount < 0) {
          throw new Error("needed maxTakeCount >= 0");
        }
        if (maxTakeCount === 0) {
          return new Seq([]);
        }
        var seq = this.iterable;
        return Seq.fromGenerator($traceurRuntime.initGeneratorFunction(function $__12() {
          var i,
              $__8,
              $__9,
              $__10,
              $__6,
              $__5,
              e,
              $__11;
          return $traceurRuntime.createGeneratorInstance(function($ctx) {
            while (true)
              switch ($ctx.state) {
                case 0:
                  i = 0;
                  $__8 = true;
                  $__9 = false;
                  $__10 = undefined;
                  $ctx.state = 29;
                  break;
                case 29:
                  $ctx.pushTry(15, 16);
                  $ctx.state = 18;
                  break;
                case 18:
                  $__6 = void 0, $__5 = (seq)[$traceurRuntime.toProperty(Symbol.iterator)]();
                  $ctx.state = 14;
                  break;
                case 14:
                  $ctx.state = (!($__8 = ($__6 = $__5.next()).done)) ? 10 : 12;
                  break;
                case 6:
                  $__8 = true;
                  $ctx.state = 14;
                  break;
                case 10:
                  e = $__6.value;
                  $ctx.state = 11;
                  break;
                case 11:
                  $ctx.state = 2;
                  return e;
                case 2:
                  $ctx.maybeThrow();
                  $ctx.state = 4;
                  break;
                case 4:
                  i++;
                  $ctx.state = 9;
                  break;
                case 9:
                  $ctx.state = (i >= maxTakeCount) ? 12 : 6;
                  break;
                case 12:
                  $ctx.popTry();
                  $ctx.state = 16;
                  $ctx.finallyFallThrough = -2;
                  break;
                case 15:
                  $ctx.popTry();
                  $ctx.maybeUncatchable();
                  $__11 = $ctx.storedException;
                  $ctx.state = 21;
                  break;
                case 21:
                  $__9 = true;
                  $__10 = $__11;
                  $ctx.state = 16;
                  $ctx.finallyFallThrough = -2;
                  break;
                case 16:
                  $ctx.popTry();
                  $ctx.state = 27;
                  break;
                case 27:
                  try {
                    if (!$__8 && $__5.return != null) {
                      $__5.return();
                    }
                  } finally {
                    if ($__9) {
                      throw $__10;
                    }
                  }
                  $ctx.state = 25;
                  break;
                case 25:
                  $ctx.state = $ctx.finallyFallThrough;
                  break;
                default:
                  return $ctx.end();
              }
          }, $__12, this);
        }));
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "skip", {
      value: function(maxSkipCount) {
        if (maxSkipCount < 0) {
          throw new Error("needed maxSkipCount >= 0");
        }
        if (maxSkipCount === 0) {
          return this;
        }
        var seq = this.iterable;
        return Seq.fromGenerator($traceurRuntime.initGeneratorFunction(function $__12() {
          var i,
              $__8,
              $__9,
              $__10,
              $__6,
              $__5,
              e,
              $__11;
          return $traceurRuntime.createGeneratorInstance(function($ctx) {
            while (true)
              switch ($ctx.state) {
                case 0:
                  i = 0;
                  $__8 = true;
                  $__9 = false;
                  $__10 = undefined;
                  $ctx.state = 27;
                  break;
                case 27:
                  $ctx.pushTry(13, 14);
                  $ctx.state = 16;
                  break;
                case 16:
                  $__6 = void 0, $__5 = (seq)[$traceurRuntime.toProperty(Symbol.iterator)]();
                  $ctx.state = 12;
                  break;
                case 12:
                  $ctx.state = (!($__8 = ($__6 = $__5.next()).done)) ? 8 : 10;
                  break;
                case 7:
                  $__8 = true;
                  $ctx.state = 12;
                  break;
                case 8:
                  e = $__6.value;
                  $ctx.state = 9;
                  break;
                case 9:
                  $ctx.state = (i >= maxSkipCount) ? 1 : 4;
                  break;
                case 1:
                  $ctx.state = 2;
                  return e;
                case 2:
                  $ctx.maybeThrow();
                  $ctx.state = 4;
                  break;
                case 4:
                  i++;
                  $ctx.state = 7;
                  break;
                case 10:
                  $ctx.popTry();
                  $ctx.state = 14;
                  $ctx.finallyFallThrough = -2;
                  break;
                case 13:
                  $ctx.popTry();
                  $ctx.maybeUncatchable();
                  $__11 = $ctx.storedException;
                  $ctx.state = 19;
                  break;
                case 19:
                  $__9 = true;
                  $__10 = $__11;
                  $ctx.state = 14;
                  $ctx.finallyFallThrough = -2;
                  break;
                case 14:
                  $ctx.popTry();
                  $ctx.state = 25;
                  break;
                case 25:
                  try {
                    if (!$__8 && $__5.return != null) {
                      $__5.return();
                    }
                  } finally {
                    if ($__9) {
                      throw $__10;
                    }
                  }
                  $ctx.state = 23;
                  break;
                case 23:
                  $ctx.state = $ctx.finallyFallThrough;
                  break;
                default:
                  return $ctx.end();
              }
          }, $__12, this);
        }));
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "distinctBy", {
      value: function(keySelector) {
        var seq = this;
        return Seq.fromGenerator(function() {
          var keySet = new Set();
          return seq.filter(function(e) {
            var key = keySelector(e);
            if (keySet.has(key)) {
              return false;
            }
            keySet.add(key);
            return true;
          })[Symbol.iterator]();
        });
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "distinct", {
      value: function() {
        return this.distinctBy(function(e) {
          return e;
        });
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "single", {
      value: function() {
        var emptyManyErrorAlternative = arguments[0] !== (void 0) ? arguments[0] : THROW_IF_EMPTY;
        var iter = this[Symbol.iterator]();
        var first = iter.next();
        if (!first.done && iter.next().done) {
          return first.value;
        }
        if (emptyManyErrorAlternative === THROW_IF_EMPTY) {
          if (first.done) {
            throw new Error("Empty sequence doesn't contain a single item.");
          } else {
            throw new Error("Sequence contains more than a single item.");
          }
        }
        return emptyManyErrorAlternative;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "first", {
      value: function() {
        var emptyErrorAlternative = arguments[0] !== (void 0) ? arguments[0] : THROW_IF_EMPTY;
        var iter = this[Symbol.iterator]();
        var first = iter.next();
        if (!first.done) {
          return first.value;
        }
        if (emptyErrorAlternative === THROW_IF_EMPTY) {
          throw new Error("Empty sequence has no first item.");
        }
        return emptyErrorAlternative;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "last", {
      value: function() {
        var emptyErrorAlternative = arguments[0] !== (void 0) ? arguments[0] : THROW_IF_EMPTY;
        var result = EMPTY_SYGIL;
        var $__8 = true;
        var $__9 = false;
        var $__10 = undefined;
        try {
          for (var $__6 = void 0,
              $__5 = (this)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__8 = ($__6 = $__5.next()).done); $__8 = true) {
            var e = $__6.value;
            {
              result = e;
            }
          }
        } catch ($__11) {
          $__9 = true;
          $__10 = $__11;
        } finally {
          try {
            if (!$__8 && $__5.return != null) {
              $__5.return();
            }
          } finally {
            if ($__9) {
              throw $__10;
            }
          }
        }
        if (result !== EMPTY_SYGIL) {
          return result;
        }
        if (emptyErrorAlternative === THROW_IF_EMPTY) {
          throw new Error("Empty sequence has no last item.");
        }
        return emptyErrorAlternative;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "tryPeekCount", {
      value: function() {
        var $__2 = this;
        if (Array.isArray(this.iterable) || !GENERIC_ARRAY_TYPES.every(function(t) {
          return !($__2.iterable instanceof t);
        })) {
          return this.iterable.length;
        }
        if (this.iterable instanceof Map || this.iterable instanceof Set) {
          return this.iterable.size;
        }
        return undefined;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "count", {
      value: function() {
        var known = this.tryPeekCount();
        if (known !== undefined) {
          return known;
        }
        var n = 0;
        var $__8 = true;
        var $__9 = false;
        var $__10 = undefined;
        try {
          for (var $__6 = void 0,
              $__5 = (this.iterable)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__8 = ($__6 = $__5.next()).done); $__8 = true) {
            var _ = $__6.value;
            {
              n++;
            }
          }
        } catch ($__11) {
          $__9 = true;
          $__10 = $__11;
        } finally {
          try {
            if (!$__8 && $__5.return != null) {
              $__5.return();
            }
          } finally {
            if ($__9) {
              throw $__10;
            }
          }
        }
        return n;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "countBy", {
      value: function(keySelector) {
        var map = new Map();
        var $__8 = true;
        var $__9 = false;
        var $__10 = undefined;
        try {
          for (var $__6 = void 0,
              $__5 = (this)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__8 = ($__6 = $__5.next()).done); $__8 = true) {
            var item = $__6.value;
            {
              var key = keySelector(item);
              if (!map.has(key)) {
                map.set(key, 0);
              }
              map.set(key, map.get(key) + 1);
            }
          }
        } catch ($__11) {
          $__9 = true;
          $__10 = $__11;
        } finally {
          try {
            if (!$__8 && $__5.return != null) {
              $__5.return();
            }
          } finally {
            if ($__9) {
              throw $__10;
            }
          }
        }
        return map;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "padded", {
      value: function(minCount) {
        var paddingItem = arguments[1];
        if (minCount < 0) {
          throw new Error("needed minCount >= 0");
        }
        var seq = this.iterable;
        return Seq.fromGenerator($traceurRuntime.initGeneratorFunction(function $__12() {
          var remaining,
              $__8,
              $__9,
              $__10,
              $__6,
              $__5,
              e,
              $__11;
          return $traceurRuntime.createGeneratorInstance(function($ctx) {
            while (true)
              switch ($ctx.state) {
                case 0:
                  remaining = minCount;
                  $__8 = true;
                  $__9 = false;
                  $__10 = undefined;
                  $ctx.state = 33;
                  break;
                case 33:
                  $ctx.pushTry(12, 13);
                  $ctx.state = 15;
                  break;
                case 15:
                  $__6 = void 0, $__5 = (seq)[$traceurRuntime.toProperty(Symbol.iterator)]();
                  $ctx.state = 11;
                  break;
                case 11:
                  $ctx.state = (!($__8 = ($__6 = $__5.next()).done)) ? 7 : 9;
                  break;
                case 6:
                  $__8 = true;
                  $ctx.state = 11;
                  break;
                case 7:
                  e = $__6.value;
                  $ctx.state = 8;
                  break;
                case 8:
                  $ctx.state = 2;
                  return e;
                case 2:
                  $ctx.maybeThrow();
                  $ctx.state = 4;
                  break;
                case 4:
                  remaining -= 1;
                  $ctx.state = 6;
                  break;
                case 9:
                  $ctx.popTry();
                  $ctx.state = 13;
                  $ctx.finallyFallThrough = 17;
                  break;
                case 12:
                  $ctx.popTry();
                  $ctx.maybeUncatchable();
                  $__11 = $ctx.storedException;
                  $ctx.state = 18;
                  break;
                case 18:
                  $__9 = true;
                  $__10 = $__11;
                  $ctx.state = 13;
                  $ctx.finallyFallThrough = 17;
                  break;
                case 13:
                  $ctx.popTry();
                  $ctx.state = 24;
                  break;
                case 24:
                  try {
                    if (!$__8 && $__5.return != null) {
                      $__5.return();
                    }
                  } finally {
                    if ($__9) {
                      throw $__10;
                    }
                  }
                  $ctx.state = 22;
                  break;
                case 17:
                  $ctx.state = (remaining > 0) ? 25 : -2;
                  break;
                case 25:
                  $ctx.state = 26;
                  return paddingItem;
                case 26:
                  $ctx.maybeThrow();
                  $ctx.state = 28;
                  break;
                case 28:
                  remaining -= 1;
                  $ctx.state = 17;
                  break;
                case 22:
                  $ctx.state = $ctx.finallyFallThrough;
                  break;
                default:
                  return $ctx.end();
              }
          }, $__12, this);
        }));
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "ifThen", {
      value: function(condition, sequenceTransformation) {
        return condition ? new Seq(sequenceTransformation(this)) : this;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "toMap", {
      value: function(keySelector, valueSelector) {
        var map = new Map();
        var $__8 = true;
        var $__9 = false;
        var $__10 = undefined;
        try {
          for (var $__6 = void 0,
              $__5 = (this)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__8 = ($__6 = $__5.next()).done); $__8 = true) {
            var item = $__6.value;
            {
              var key = keySelector(item);
              var val = valueSelector(item);
              if (map.has(key)) {
                throw new Error(("Duplicate key <" + key + ">. Came from item <" + item + ">."));
              }
              map.set(key, val);
            }
          }
        } catch ($__11) {
          $__9 = true;
          $__10 = $__11;
        } finally {
          try {
            if (!$__8 && $__5.return != null) {
              $__5.return();
            }
          } finally {
            if ($__9) {
              throw $__10;
            }
          }
        }
        return map;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "keyedBy", {
      value: function(keySelector) {
        return this.toMap(keySelector, function(e) {
          return e;
        });
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "groupBy", {
      value: function(keySelector) {
        var map = new Map();
        var $__8 = true;
        var $__9 = false;
        var $__10 = undefined;
        try {
          for (var $__6 = void 0,
              $__5 = (this)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__8 = ($__6 = $__5.next()).done); $__8 = true) {
            var item = $__6.value;
            {
              var key = keySelector(item);
              if (!map.has(key)) {
                map.set(key, []);
              }
              map.get(key).push(item);
            }
          }
        } catch ($__11) {
          $__9 = true;
          $__10 = $__11;
        } finally {
          try {
            if (!$__8 && $__5.return != null) {
              $__5.return();
            }
          } finally {
            if ($__9) {
              throw $__10;
            }
          }
        }
        return map;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "partitioned", {
      value: function(partitionSize) {
        if (partitionSize <= 0) {
          throw new Error("need partitionSize > 0");
        }
        var seq = this;
        return Seq.fromGenerator($traceurRuntime.initGeneratorFunction(function $__12() {
          var buffer,
              $__8,
              $__9,
              $__10,
              $__6,
              $__5,
              item,
              $__11;
          return $traceurRuntime.createGeneratorInstance(function($ctx) {
            while (true)
              switch ($ctx.state) {
                case 0:
                  buffer = [];
                  $__8 = true;
                  $__9 = false;
                  $__10 = undefined;
                  $ctx.state = 34;
                  break;
                case 34:
                  $ctx.pushTry(15, 16);
                  $ctx.state = 18;
                  break;
                case 18:
                  $__6 = void 0, $__5 = (seq)[$traceurRuntime.toProperty(Symbol.iterator)]();
                  $ctx.state = 14;
                  break;
                case 14:
                  $ctx.state = (!($__8 = ($__6 = $__5.next()).done)) ? 10 : 12;
                  break;
                case 6:
                  $__8 = true;
                  $ctx.state = 14;
                  break;
                case 10:
                  item = $__6.value;
                  $ctx.state = 11;
                  break;
                case 11:
                  buffer.push(item);
                  $ctx.state = 9;
                  break;
                case 9:
                  $ctx.state = (buffer.length >= partitionSize) ? 1 : 6;
                  break;
                case 1:
                  $ctx.state = 2;
                  return buffer;
                case 2:
                  $ctx.maybeThrow();
                  $ctx.state = 4;
                  break;
                case 4:
                  buffer = [];
                  $ctx.state = 6;
                  break;
                case 12:
                  $ctx.popTry();
                  $ctx.state = 16;
                  $ctx.finallyFallThrough = 20;
                  break;
                case 15:
                  $ctx.popTry();
                  $ctx.maybeUncatchable();
                  $__11 = $ctx.storedException;
                  $ctx.state = 21;
                  break;
                case 21:
                  $__9 = true;
                  $__10 = $__11;
                  $ctx.state = 16;
                  $ctx.finallyFallThrough = 20;
                  break;
                case 16:
                  $ctx.popTry();
                  $ctx.state = 27;
                  break;
                case 27:
                  try {
                    if (!$__8 && $__5.return != null) {
                      $__5.return();
                    }
                  } finally {
                    if ($__9) {
                      throw $__10;
                    }
                  }
                  $ctx.state = 25;
                  break;
                case 20:
                  $ctx.state = (buffer.length > 0) ? 28 : -2;
                  break;
                case 28:
                  $ctx.state = 29;
                  return buffer;
                case 29:
                  $ctx.maybeThrow();
                  $ctx.state = -2;
                  break;
                case 25:
                  $ctx.state = $ctx.finallyFallThrough;
                  break;
                default:
                  return $ctx.end();
              }
          }, $__12, this);
        }));
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "breadthFirstSearch", {
      value: function(neighborSelector) {
        var keySelector = arguments[1] !== (void 0) ? arguments[1] : function(e) {
          return e;
        };
        var seq = this;
        return Seq.fromGenerator($traceurRuntime.initGeneratorFunction(function $__12() {
          var visited,
              schedule,
              i,
              e,
              k,
              $__8,
              $__9,
              $__10,
              $__6,
              $__5,
              neighbor;
          return $traceurRuntime.createGeneratorInstance(function($ctx) {
            while (true)
              switch ($ctx.state) {
                case 0:
                  visited = new Set();
                  schedule = seq.toArray();
                  $ctx.state = 16;
                  break;
                case 16:
                  i = 0;
                  $ctx.state = 14;
                  break;
                case 14:
                  $ctx.state = (i < schedule.length) ? 8 : -2;
                  break;
                case 7:
                  i++;
                  $ctx.state = 14;
                  break;
                case 8:
                  e = schedule[i];
                  k = keySelector(e);
                  $ctx.state = 9;
                  break;
                case 9:
                  $ctx.state = (visited.has(k)) ? 7 : 2;
                  break;
                case 2:
                  visited.add(k);
                  $__8 = true;
                  $__9 = false;
                  $__10 = undefined;
                  try {
                    for ($__6 = void 0, $__5 = (neighborSelector(e))[$traceurRuntime.toProperty(Symbol.iterator)](); !($__8 = ($__6 = $__5.next()).done); $__8 = true) {
                      neighbor = $__6.value;
                      {
                        schedule.push(neighbor);
                      }
                    }
                  } catch ($__11) {
                    $__9 = true;
                    $__10 = $__11;
                  } finally {
                    try {
                      if (!$__8 && $__5.return != null) {
                        $__5.return();
                      }
                    } finally {
                      if ($__9) {
                        throw $__10;
                      }
                    }
                  }
                  $ctx.state = 11;
                  break;
                case 11:
                  $ctx.state = 5;
                  return e;
                case 5:
                  $ctx.maybeThrow();
                  $ctx.state = 7;
                  break;
                default:
                  return $ctx.end();
              }
          }, $__12, this);
        }));
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), $__3), {
      fromGenerator: function(generatorFunction) {
        var $__4;
        return new Seq(($__4 = {}, Object.defineProperty($__4, Symbol.iterator, {
          value: generatorFunction,
          configurable: true,
          enumerable: true,
          writable: true
        }), $__4));
      },
      range: function(count) {
        if (count < 0) {
          throw new Error("needed count >= 0");
        }
        return Seq.fromGenerator($traceurRuntime.initGeneratorFunction(function $__12() {
          var i;
          return $traceurRuntime.createGeneratorInstance(function($ctx) {
            while (true)
              switch ($ctx.state) {
                case 0:
                  i = 0;
                  $ctx.state = 7;
                  break;
                case 7:
                  $ctx.state = (i < count) ? 1 : -2;
                  break;
                case 4:
                  i++;
                  $ctx.state = 7;
                  break;
                case 1:
                  $ctx.state = 2;
                  return i;
                case 2:
                  $ctx.maybeThrow();
                  $ctx.state = 4;
                  break;
                default:
                  return $ctx.end();
              }
          }, $__12, this);
        }));
      },
      naturals: function() {
        return Seq.fromGenerator($traceurRuntime.initGeneratorFunction(function $__12() {
          var i;
          return $traceurRuntime.createGeneratorInstance(function($ctx) {
            while (true)
              switch ($ctx.state) {
                case 0:
                  i = 0;
                  $ctx.state = 9;
                  break;
                case 9:
                  $ctx.state = (true) ? 1 : -2;
                  break;
                case 1:
                  $ctx.state = 2;
                  return i;
                case 2:
                  $ctx.maybeThrow();
                  $ctx.state = 4;
                  break;
                case 4:
                  i++;
                  $ctx.state = 9;
                  break;
                default:
                  return $ctx.end();
              }
          }, $__12, this);
        }));
      },
      repeat: function(item, repeatCount) {
        if (repeatCount < 0) {
          throw new Error("needed repeatCount >= 0");
        }
        return Seq.fromGenerator($traceurRuntime.initGeneratorFunction(function $__12() {
          var i;
          return $traceurRuntime.createGeneratorInstance(function($ctx) {
            while (true)
              switch ($ctx.state) {
                case 0:
                  i = 0;
                  $ctx.state = 7;
                  break;
                case 7:
                  $ctx.state = (i < repeatCount) ? 1 : -2;
                  break;
                case 4:
                  i++;
                  $ctx.state = 7;
                  break;
                case 1:
                  $ctx.state = 2;
                  return item;
                case 2:
                  $ctx.maybeThrow();
                  $ctx.state = 4;
                  break;
                default:
                  return $ctx.end();
              }
          }, $__12, this);
        }));
      }
    });
  }();
  var $__default = Seq;
  return {
    get THROW_IF_EMPTY() {
      return THROW_IF_EMPTY;
    },
    get default() {
      return $__default;
    }
  };
});
//# sourceURL=src/base/Seq.js
;System.registerModule("src/engine/Async.js", [], function() {
  "use strict";
  var __moduleName = "src/engine/Async.js";
  function asyncEval(codeText) {
    var timeout = arguments[1] !== (void 0) ? arguments[1] : Infinity;
    var cancelTaker = arguments[2];
    return new Promise(function(resolve, reject) {
      var workerCode = ("postMessage(eval(" + JSON.stringify(codeText) + "));");
      var blob = new Blob([workerCode], {type: 'text/javascript'});
      var blobUrl = URL.createObjectURL(blob);
      var worker = new Worker(blobUrl);
      var timeoutIDResolver = undefined;
      var timeoutIDPromise = new Promise(function(res) {
        return timeoutIDResolver = res;
      });
      var cleanup = function() {
        worker.terminate();
        timeoutIDPromise.then(clearTimeout);
      };
      worker.addEventListener('message', cleanup);
      worker.addEventListener('error', cleanup);
      worker.addEventListener('message', function(e) {
        return resolve(e.data);
      });
      worker.addEventListener('error', function(e) {
        e.preventDefault();
        reject(e.message);
      });
      worker.postMessage('start');
      if (timeout !== Infinity) {
        timeoutIDResolver(setTimeout(function() {
          reject('Timeout');
          worker.terminate();
        }, timeout));
      }
      if (cancelTaker !== undefined) {
        cancelTaker(function() {
          reject('Cancelled');
          cleanup();
        });
      }
    });
  }
  var FunctionGroup = function() {
    function FunctionGroup() {
      this._funcs = [];
    }
    return ($traceurRuntime.createClass)(FunctionGroup, {
      add: function(func) {
        this._funcs.push(func);
      },
      runAndClear: function() {
        var t = this._funcs;
        this._funcs = [];
        var $__4 = true;
        var $__5 = false;
        var $__6 = undefined;
        try {
          for (var $__2 = void 0,
              $__1 = (t)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__4 = ($__2 = $__1.next()).done); $__4 = true) {
            var f = $__2.value;
            {
              f();
            }
          }
        } catch ($__7) {
          $__5 = true;
          $__6 = $__7;
        } finally {
          try {
            if (!$__4 && $__1.return != null) {
              $__1.return();
            }
          } finally {
            if ($__5) {
              throw $__6;
            }
          }
        }
      }
    }, {});
  }();
  function delayed(value, delayMillis) {
    var rejectInsteadOfResolving = arguments[2] !== (void 0) ? arguments[2] : false;
    return new Promise(function(resolve, reject) {
      return setTimeout(function() {
        return (rejectInsteadOfResolving ? reject : resolve)(value);
      }, delayMillis);
    });
  }
  function streamGeneratedPromiseResults(promiseFactory, valueConsumer, errorConsumer) {
    var count = arguments[3] !== (void 0) ? arguments[3] : Infinity;
    var concurrency = arguments[4] !== (void 0) ? arguments[4] : 1;
    var cancelTaker = arguments[5];
    var cancelled = false;
    var startedCount = 0;
    var add = function() {
      if (cancelled)
        return;
      if (startedCount >= count)
        return;
      startedCount += 1;
      var p = promiseFactory();
      p.then(function(e) {
        if (cancelled)
          return;
        valueConsumer(e);
        add();
      }, function(ex) {
        cancelled = true;
        errorConsumer(ex);
      });
    };
    for (var i = 0; i < concurrency && i < count; i++) {
      add();
    }
    if (cancelTaker !== undefined) {
      cancelTaker(function() {
        return cancelled = true;
      });
    }
  }
  function asyncifyProgressReporter(progressReporter) {
    var latestCompletedId = 0;
    var nextId = 1;
    return function(promise) {
      var id = nextId;
      nextId = (nextId + 1) & 0xFFFF;
      promise.then(function(e) {
        var isLate = ((latestCompletedId - id) & 0xFFFF) < 0x8FFF;
        if (isLate)
          return;
        latestCompletedId = id;
        progressReporter(e, true);
      }, function(ex) {
        var isNotLatestSet = ((id + 1) & 0xFFFF) !== nextId;
        if (isNotLatestSet)
          return;
        latestCompletedId = id;
        progressReporter(ex, false);
      });
    };
  }
  return {
    get asyncEval() {
      return asyncEval;
    },
    get FunctionGroup() {
      return FunctionGroup;
    },
    get delayed() {
      return delayed;
    },
    get streamGeneratedPromiseResults() {
      return streamGeneratedPromiseResults;
    },
    get asyncifyProgressReporter() {
      return asyncifyProgressReporter;
    }
  };
});
//# sourceURL=src/engine/Async.js
;System.registerModule("src/engine/ChSh.js", [], function() {
  "use strict";
  var __moduleName = "src/engine/ChSh.js";
  var asyncEval = System.get("src/engine/Async.js").asyncEval;
  var Seq = System.get("src/base/Seq.js").default;
  var $__2 = System.get("src/engine/Superposition.js"),
      ROTATE_FUNC_STRING = $__2.ROTATE_FUNC_STRING,
      MEASURE_FUNC_STRING = $__2.MEASURE_FUNC_STRING;
  var ChshGameOutcomeCounts = function() {
    function ChshGameOutcomeCounts() {
      this._counts = new Map();
    }
    return ($traceurRuntime.createClass)(ChshGameOutcomeCounts, {
      mergedWith: function(other) {
        var result = new ChshGameOutcomeCounts();
        for (var i = 0; i < 16; i++) {
          var t = (this._counts.has(i) ? this._counts.get(i) : 0) + (other._counts.has(i) ? other._counts.get(i) : 0);
          if (t > 0) {
            result._counts.set(i, t);
          }
        }
        return result;
      },
      countForCase: function(ref1, ref2, move1, move2) {
        var k = ChshGameOutcomeCounts.caseToKey(ref1, ref2, move1, move2);
        return this._counts.has(k) ? this._counts.get(k) : 0;
      },
      countWins: function() {
        var t = 0;
        var $__30 = true;
        var $__31 = false;
        var $__32 = undefined;
        try {
          for (var $__28 = void 0,
              $__27 = ([false, true])[$traceurRuntime.toProperty(Symbol.iterator)](); !($__30 = ($__28 = $__27.next()).done); $__30 = true) {
            var ref1 = $__28.value;
            {
              var $__23 = true;
              var $__24 = false;
              var $__25 = undefined;
              try {
                for (var $__21 = void 0,
                    $__20 = ([false, true])[$traceurRuntime.toProperty(Symbol.iterator)](); !($__23 = ($__21 = $__20.next()).done); $__23 = true) {
                  var ref2 = $__21.value;
                  {
                    var $__16 = true;
                    var $__17 = false;
                    var $__18 = undefined;
                    try {
                      for (var $__14 = void 0,
                          $__13 = ([false, true])[$traceurRuntime.toProperty(Symbol.iterator)](); !($__16 = ($__14 = $__13.next()).done); $__16 = true) {
                        var move1 = $__14.value;
                        {
                          var $__9 = true;
                          var $__10 = false;
                          var $__11 = undefined;
                          try {
                            for (var $__7 = void 0,
                                $__6 = ([false, true])[$traceurRuntime.toProperty(Symbol.iterator)](); !($__9 = ($__7 = $__6.next()).done); $__9 = true) {
                              var move2 = $__7.value;
                              {
                                if (ChshGameOutcomeCounts.caseToIsWin(ref1, ref2, move1, move2)) {
                                  t += this.countForCase(ref1, ref2, move1, move2);
                                }
                              }
                            }
                          } catch ($__12) {
                            $__10 = true;
                            $__11 = $__12;
                          } finally {
                            try {
                              if (!$__9 && $__6.return != null) {
                                $__6.return();
                              }
                            } finally {
                              if ($__10) {
                                throw $__11;
                              }
                            }
                          }
                        }
                      }
                    } catch ($__19) {
                      $__17 = true;
                      $__18 = $__19;
                    } finally {
                      try {
                        if (!$__16 && $__13.return != null) {
                          $__13.return();
                        }
                      } finally {
                        if ($__17) {
                          throw $__18;
                        }
                      }
                    }
                  }
                }
              } catch ($__26) {
                $__24 = true;
                $__25 = $__26;
              } finally {
                try {
                  if (!$__23 && $__20.return != null) {
                    $__20.return();
                  }
                } finally {
                  if ($__24) {
                    throw $__25;
                  }
                }
              }
            }
          }
        } catch ($__33) {
          $__31 = true;
          $__32 = $__33;
        } finally {
          try {
            if (!$__30 && $__27.return != null) {
              $__27.return();
            }
          } finally {
            if ($__31) {
              throw $__32;
            }
          }
        }
        return t;
      },
      countPlays: function() {
        var $__5 = this;
        return Seq.range(16).map(function(i) {
          return $__5._counts.has(i) ? $__5._counts.get(i) : 0;
        }).sum();
      },
      isEqualTo: function(other) {
        if (!(other instanceof ChshGameOutcomeCounts)) {
          return false;
        }
        for (var i = 0; i < 16; i++) {
          if (this._counts.get(i) !== other._counts.get(i)) {
            return false;
          }
        }
        return true;
      }
    }, {
      fromCountsByMap: function(map) {
        var result = new ChshGameOutcomeCounts();
        for (var i = 0; i < 16; i++) {
          if (map.has(i)) {
            result._counts.set(i, map.get(i));
          }
        }
        return result;
      },
      caseToKey: function(ref1, ref2, move1, move2) {
        return (ref1 ? 1 : 0) + (ref2 ? 2 : 0) + (move1 ? 4 : 0) + (move2 ? 8 : 0);
      },
      caseToIsWin: function(refA, refB, moveA, moveB) {
        return (moveA !== moveB) === (refA && refB);
      }
    });
  }();
  function asyncEvalClassicalChshGameRuns(code1, code2) {
    var count = arguments[2] !== (void 0) ? arguments[2] : 1;
    var timeoutMillis = arguments[3] !== (void 0) ? arguments[3] : Infinity;
    var sharedBitCount = arguments[4] !== (void 0) ? arguments[4] : 16;
    var cancelTaker = arguments[5];
    if (!(sharedBitCount > 0 && sharedBitCount < 53))
      throw RangeError("sharedBitCount");
    var dontTouchMyStuffSuffix = Seq.range(10).map(function() {
      return Math.floor(Math.random() * 16).toString(16);
    }).join('');
    var round = ("__i_" + dontTouchMyStuffSuffix);
    var allSharedBits = ("__shared_" + dontTouchMyStuffSuffix);
    var moves = ("__moves_" + dontTouchMyStuffSuffix);
    var allSharedBitsArrayText = JSON.stringify(Seq.range(count).map(function() {
      return Math.floor(Math.random() * (1 << sharedBitCount));
    }).toArray());
    var dontTouchMyStuffSuffix2 = Seq.range(10).map(function() {
      return Math.floor(Math.random() * 16).toString(16);
    }).join('');
    var CustomType = ("__custom_type__" + dontTouchMyStuffSuffix2);
    var wrapCode = function(code, refCoinMask) {
      return ("\n        function " + CustomType + "() {}\n        " + CustomType + ".prototype.invokeCode = function(refChoice, sharedBits) {\n            // Be forgiving.\n            var refchoice = refChoice;\n            var ref_choice = refChoice;\n            var sharedbits = sharedBits;\n            var shared_bits = sharedBits;\n            var True = true;\n            var False = false;\n\n            var move = undefined;\n\n            eval(" + JSON.stringify(code) + ");\n\n            // Loose equality is on purpose, so people entering 'x ^ y' don't get an error.\n            if (!(move == true) && !(move == false)) {\n                throw new Error(\"'move' variable ended up \" + move + \" instead of true or false\");\n            }\n            return move == true;\n        };\n        (function() {\n            var " + allSharedBits + " = " + allSharedBitsArrayText + ";\n            var " + moves + " = [];\n            for (var " + round + " = 0; " + round + " < " + count + "; " + round + "++) {\n                var sharedBits = [];\n                var i;\n                for (i = 0; i < " + sharedBitCount + "; i++) {\n                    sharedBits.push((" + allSharedBits + "[" + round + "] & (1 << i)) !== 0);\n                }\n                i = undefined;\n\n                var refChoice = Math.random() < 0.5;\n                " + moves + ".push(refChoice);\n                " + moves + ".push(new " + CustomType + "().invokeCode(refChoice, sharedBits));\n            };\n            return " + moves + ";\n        })()");
    };
    var wrapCode1 = wrapCode(code1, 1);
    var wrapCode2 = wrapCode(code2, 2);
    var results1 = asyncEval(wrapCode1, timeoutMillis, cancelTaker);
    var results2 = asyncEval(wrapCode2, timeoutMillis, cancelTaker);
    return Promise.all([results1, results2]).then(function(moves) {
      if (!Array.isArray(moves[0]) || !Array.isArray(moves[1]) || moves[0].length !== count * 2 || moves[1].length !== count * 2) {
        throw new RangeError("Corrupted moves.");
      }
      return ChshGameOutcomeCounts.fromCountsByMap(Seq.range(count).map(function(i) {
        var refCoin1 = moves[0][i * 2] === true;
        var refCoin2 = moves[1][i * 2] === true;
        var move1 = moves[0][i * 2 + 1] === true;
        var move2 = moves[1][i * 2 + 1] === true;
        return ChshGameOutcomeCounts.caseToKey(refCoin1, refCoin2, move1, move2);
      }).countBy(function(e) {
        return e;
      }));
    });
  }
  function asyncEvalQuantumChshGameRuns(code1, code2) {
    var count = arguments[2] !== (void 0) ? arguments[2] : 1;
    var timeoutMillis = arguments[3] !== (void 0) ? arguments[3] : Infinity;
    var cancelTaker = arguments[4];
    var dontTouchMyStuffSuffix = Seq.range(10).map(function() {
      return Math.floor(Math.random() * 16).toString(16);
    }).join('');
    var round = ("__i_" + dontTouchMyStuffSuffix);
    var moves = ("__moves_" + dontTouchMyStuffSuffix);
    var rotateFunc = ("__rotate_" + dontTouchMyStuffSuffix);
    var measureFunc = ("__measure_" + dontTouchMyStuffSuffix);
    var amplitudes = ("__amps_" + dontTouchMyStuffSuffix);
    var dontTouchMyStuffSuffix2 = Seq.range(10).map(function() {
      return Math.floor(Math.random() * 16).toString(16);
    }).join('');
    var CustomType = ("__custom_type__" + dontTouchMyStuffSuffix2);
    var createInvokeFunction = function(code, i) {
      return ("\n        " + CustomType + ".prototype.invokeCode" + i + " = function(refChoice) {\n            // Available rotation axies.\n            var X = [1, 0, 0];\n            var Y = [0, 1, 0];\n            var Z = [0, 0, 1];\n            var H = [Math.sqrt(0.5), 0, Math.sqrt(0.5)];\n\n            // Available actions.\n            var measure = function() {\n                return " + measureFunc + "(" + amplitudes + ", " + i + ");\n            };\n            var turn = function(axis, degs) {\n                if (axis.length !== 3) throw new Error(\"First arg to 'turn' should be a rotation axis (X/Y/Z/H).\");\n                return " + rotateFunc + "(" + amplitudes + ", " + i + ", axis, (degs === undefined ? 180 : degs)*Math.PI/180, []);\n            };\n\n            // Be forgiving.\n            var refchoice = refChoice;\n            var ref_choice = refChoice;\n            var True = true;\n            var False = false;\n\n            var move = undefined;\n\n            //Easter egg.\n            var sharedQubit = \"containing a spooky ghost of Eisteinian proportions\";\n\n            eval(" + JSON.stringify(code) + ");\n\n            // Loose equality is on purpose, so people entering 'x ^ y' don't get an error.\n            if (!(move == true) && !(move == false)) {\n                throw new Error(\"'move' variable ended up \" + move + \" instead of true or false\");\n            }\n            return move == true;\n        };");
    };
    var wrappedCode = ("\n        var " + amplitudes + "; // <-- weakpoint\n        var " + rotateFunc + " = " + ROTATE_FUNC_STRING + ";\n        var " + measureFunc + " = " + MEASURE_FUNC_STRING + ";\n        function " + CustomType + "() {}\n        " + createInvokeFunction(code1, 0) + ";\n        " + createInvokeFunction(code2, 1) + ";\n        (function() {\n            var " + round + " = 0;\n            var " + moves + " = [];\n            for (; " + round + " < " + count + "; " + round + "++) {\n                // Create pre-shared entangled 00+11 state.\n                " + amplitudes + " = new Float32Array(2 << 2);\n                " + amplitudes + "[0] = Math.sqrt(0.5);\n                " + amplitudes + "[6] = Math.sqrt(0.5);\n\n                // Note: order shouldn't matter.\n                // Also, because these are run in the same web worker, it's much easier for them to cheat..\n                var refChoice1 = Math.random() < 0.5;\n                var refChoice2 = Math.random() < 0.5;\n                " + moves + ".push(refChoice1);\n                " + moves + ".push(refChoice2);\n                " + moves + ".push(new " + CustomType + "().invokeCode0(refChoice1));\n                " + moves + ".push(new " + CustomType + "().invokeCode1(refChoice2));\n            };\n            return " + moves + ";\n        })();");
    var results = asyncEval(wrappedCode, timeoutMillis, cancelTaker);
    return results.then(function(moves) {
      if (!Array.isArray(moves) || moves.length !== 4 * count) {
        throw new RangeError("Corrupted moves.");
      }
      return ChshGameOutcomeCounts.fromCountsByMap(Seq.range(count).map(function(i) {
        var refCoin1 = moves[4 * i] === true;
        var refCoin2 = moves[4 * i + 1] === true;
        var move1 = moves[4 * i + 2] === true;
        var move2 = moves[4 * i + 3] === true;
        return ChshGameOutcomeCounts.caseToKey(refCoin1, refCoin2, move1, move2);
      }).countBy(function(e) {
        return e;
      }));
    });
  }
  return {
    get ChshGameOutcomeCounts() {
      return ChshGameOutcomeCounts;
    },
    get asyncEvalClassicalChshGameRuns() {
      return asyncEvalClassicalChshGameRuns;
    },
    get asyncEvalQuantumChshGameRuns() {
      return asyncEvalQuantumChshGameRuns;
    }
  };
});
//# sourceURL=src/engine/ChSh.js
;System.registerModule("src/engine/Draw.js", [], function() {
  "use strict";
  var __moduleName = "src/engine/Draw.js";
  var ChshGameOutcomeCounts = System.get("src/engine/ChSh.js").ChshGameOutcomeCounts;
  var $__1 = System.get("src/engine/Async.js"),
      FunctionGroup = $__1.FunctionGroup,
      asyncifyProgressReporter = $__1.asyncifyProgressReporter,
      streamGeneratedPromiseResults = $__1.streamGeneratedPromiseResults,
      delayed = $__1.delayed;
  var CELL_SPAN = 55;
  var TABLE_SPAN = CELL_SPAN * 4;
  var HEADER_UNIT = 10;
  var GAME_RUNS_PER_CHUNK = 1000;
  var RUN_CHUNK_COUNT = 100;
  var RUN_CONCURRENCY = 2;
  var SHOW_BUSY_GRACE_PERIOD = 250;
  var SHOW_ERR_GRACE_PERIOD = 500;
  function fillCenteredText(ctx, text, x, y) {
    var rotation = arguments[4] !== (void 0) ? arguments[4] : 0;
    var w = ctx.measureText(text).width;
    var h = 12;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillText(text, -w / 2, h / 2);
    ctx.restore();
  }
  function drawOutcomeStats(ctx, outcomes, labelSetter) {
    var playCount = outcomes.countPlays();
    var winCount = outcomes.countWins();
    var mean = winCount / playCount;
    var sampleMean = (winCount + 1) / (playCount + 2);
    var sampleStdDev = Math.sqrt(sampleMean * (1 - sampleMean) / (playCount + 1));
    var errorBars = 3 * sampleStdDev;
    var over = (Math.max(mean, 1 - mean) - 0.75) / sampleStdDev;
    var msg1 = ("~" + (100 * mean).toFixed(1) + "% (\u00B1" + (errorBars * 100).toFixed(1) + "%)");
    var msg2 = (winCount + " wins out of " + playCount + " plays");
    var msg3 = over <= 1 ? 'No' : over <= 3 ? 'Probably Not' : over <= 5 ? 'Maybe. Could be lucky? \u03C3>3' : 'Looks like it! \u03C3>5';
    labelSetter(msg1 + '\n' + msg2 + '\n' + msg3);
    var inset = HEADER_UNIT * 6;
    ctx.clearRect(0, 0, 16 * CELL_SPAN + 10, 16 * CELL_SPAN + 10);
    for (var i = 0; i < 16; i++) {
      var move2 = (i & 1) !== 0;
      var ref2 = (i & 2) !== 0;
      var move1 = (i & 4) !== 0;
      var ref1 = (i & 8) !== 0;
      var x = inset + (i & 3) * CELL_SPAN;
      var y = inset + ((i & 0xC) >> 2) * CELL_SPAN;
      var caseCount = outcomes.countForCase(ref1, ref2, move1, move2);
      var isGoodCase = ChshGameOutcomeCounts.caseToIsWin(ref1, ref2, move1, move2);
      var casePortion = caseCount / playCount;
      var h = casePortion * CELL_SPAN;
      ctx.fillStyle = isGoodCase ? '#CFF' : '#FCC';
      ctx.fillRect(x, y, CELL_SPAN, CELL_SPAN);
      ctx.fillStyle = isGoodCase ? '#0CC' : '#F66';
      ctx.fillRect(x, y + CELL_SPAN - h, CELL_SPAN, h);
      ctx.font = "10pt Helvetica";
      var caseText = caseCount === 0 ? '' : (isGoodCase ? '' : '-') + caseCount.toString();
      ctx.fillStyle = 'black';
      fillCenteredText(ctx, caseText, x + CELL_SPAN / 2, y + CELL_SPAN / 2);
    }
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    var $__6 = true;
    var $__7 = false;
    var $__8 = undefined;
    try {
      for (var $__4 = void 0,
          $__3 = ([0, 1])[$traceurRuntime.toProperty(Symbol.iterator)](); !($__6 = ($__4 = $__3.next()).done); $__6 = true) {
        var i$__17 = $__4.value;
        {
          var name = i$__17 == 0 ? "BOB" : "ALICE";
          var print = i$__17 == 0 ? function(t, x, y) {
            return fillCenteredText(ctx, t, inset + x, y);
          } : function(t, y, x) {
            return fillCenteredText(ctx, t, x, inset + y, -Math.PI / 2);
          };
          var line = i$__17 == 0 ? function(x, y, dx, dy) {
            ctx.beginPath();
            ctx.moveTo(inset + x, y);
            ctx.lineTo(inset + x + dx, y + dy);
            ctx.stroke();
          } : function(y, x, dy, dx) {
            ctx.beginPath();
            ctx.moveTo(x, inset + y);
            ctx.lineTo(x + dx, inset + y + dy);
            ctx.stroke();
          };
          ctx.lineWidth = 1.5;
          line(2 * CELL_SPAN, HEADER_UNIT * 2, 0, HEADER_UNIT * 4 + TABLE_SPAN);
          ctx.lineWidth = 0.5;
          line(0, HEADER_UNIT * 4, TABLE_SPAN, 0);
          line(0, HEADER_UNIT * 2, TABLE_SPAN, 0);
          line(0, HEADER_UNIT * 2, 0, HEADER_UNIT * 4 + TABLE_SPAN);
          line(CELL_SPAN, HEADER_UNIT * 4, 0, HEADER_UNIT * 2 + TABLE_SPAN);
          line(CELL_SPAN * 3, HEADER_UNIT * 4, 0, HEADER_UNIT * 2 + TABLE_SPAN);
          line(TABLE_SPAN, HEADER_UNIT * 2, 0, HEADER_UNIT * 4 + TABLE_SPAN);
          ctx.font = "12pt Helvetica";
          print(name, 2 * CELL_SPAN, HEADER_UNIT);
          ctx.font = "10pt Helvetica";
          print("refChoice: False", CELL_SPAN, HEADER_UNIT * 3);
          print("refChoice: True", CELL_SPAN * 3, HEADER_UNIT * 3);
          ctx.font = "8pt Helvetica";
          print("move:false", CELL_SPAN / 2, HEADER_UNIT * 5);
          print("move:true", CELL_SPAN + CELL_SPAN / 2, HEADER_UNIT * 5);
          print("move:false", CELL_SPAN * 2 + CELL_SPAN / 2, HEADER_UNIT * 5);
          print("move:true", CELL_SPAN * 3 + CELL_SPAN / 2, HEADER_UNIT * 5);
        }
      }
    } catch ($__9) {
      $__7 = true;
      $__8 = $__9;
    } finally {
      try {
        if (!$__6 && $__3.return != null) {
          $__3.return();
        }
      } finally {
        if ($__7) {
          throw $__8;
        }
      }
    }
  }
  function wireGame(codeTextArea1, codeTextArea2, rateLabel, countLabel, judgementLabel, errLabel, resultsDiv, canvas, initialCode1, initialCode2, precomputedInitialOutcome, asyncGameRunner) {
    codeTextArea1.value = initialCode1;
    codeTextArea2.value = initialCode2;
    var ctx = canvas.getContext('2d');
    var labelEventualSet = asyncifyProgressReporter(function(text, flag) {
      if (flag) {
        var lines = text.split('\n');
        rateLabel.textContent = lines[0];
        countLabel.textContent = lines[1];
        judgementLabel.textContent = lines[2];
        errLabel.textContent = '';
        resultsDiv.style.opacity = 1;
        codeTextArea1.style.backgroundColor = 'white';
        codeTextArea2.style.backgroundColor = 'white';
      } else {
        errLabel.textContent = text;
        resultsDiv.style.opacity = 0.25;
        codeTextArea1.style.backgroundColor = 'pink';
        codeTextArea2.style.backgroundColor = 'pink';
      }
    });
    var cancellor = new FunctionGroup();
    var cancellorAdd = function(canceller) {
      return cancellor.add(canceller);
    };
    var lastText1 = initialCode1;
    var lastText2 = initialCode2;
    var recompute = function() {
      var s1 = codeTextArea1.value;
      var s2 = codeTextArea2.value;
      if (lastText1 === s1 && lastText2 === s2) {
        return;
      }
      lastText1 = s1;
      lastText2 = s2;
      cancellor.runAndClear();
      var totalOutcomes = new ChshGameOutcomeCounts();
      streamGeneratedPromiseResults(function() {
        return asyncGameRunner(s1, s2, GAME_RUNS_PER_CHUNK, cancellorAdd);
      }, function(partialOutcomes) {
        totalOutcomes = totalOutcomes.mergedWith(partialOutcomes);
        drawOutcomeStats(ctx, totalOutcomes, function(e) {
          return labelEventualSet(Promise.resolve(e));
        });
      }, function(ex) {
        return labelEventualSet(delayed(ex, SHOW_ERR_GRACE_PERIOD, true));
      }, RUN_CHUNK_COUNT, RUN_CONCURRENCY, cancellorAdd);
    };
    var textAreaChangeEvents = ['change', 'keydown', 'keypress', 'paste', 'keyup'];
    var $__13 = true;
    var $__14 = false;
    var $__15 = undefined;
    try {
      for (var $__11 = void 0,
          $__10 = ([codeTextArea1, codeTextArea2])[$traceurRuntime.toProperty(Symbol.iterator)](); !($__13 = ($__11 = $__10.next()).done); $__13 = true) {
        var t = $__11.value;
        {
          var $__6 = true;
          var $__7 = false;
          var $__8 = undefined;
          try {
            for (var $__4 = void 0,
                $__3 = (textAreaChangeEvents)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__6 = ($__4 = $__3.next()).done); $__6 = true) {
              var e = $__4.value;
              {
                t.addEventListener(e, recompute);
              }
            }
          } catch ($__9) {
            $__7 = true;
            $__8 = $__9;
          } finally {
            try {
              if (!$__6 && $__3.return != null) {
                $__3.return();
              }
            } finally {
              if ($__7) {
                throw $__8;
              }
            }
          }
        }
      }
    } catch ($__16) {
      $__14 = true;
      $__15 = $__16;
    } finally {
      try {
        if (!$__13 && $__10.return != null) {
          $__10.return();
        }
      } finally {
        if ($__14) {
          throw $__15;
        }
      }
    }
    drawOutcomeStats(ctx, precomputedInitialOutcome, function(e) {
      return labelEventualSet(Promise.resolve(e));
    });
  }
  return {
    get drawOutcomeStats() {
      return drawOutcomeStats;
    },
    get wireGame() {
      return wireGame;
    }
  };
});
//# sourceURL=src/engine/Draw.js
;System.registerModule("src/engine/Superposition.js", [], function() {
  "use strict";
  var __moduleName = "src/engine/Superposition.js";
  var ROTATE_FUNC_STRING = "\n    (function(amps, target_bit_index, axis, theta, control_bit_indices) {\n        if (control_bit_indices === undefined) control_bit_indices = [];\n        var n = amps.length/2;\n        var x = axis[0];\n        var y = axis[1];\n        var z = axis[2];\n        // U = |z    x-iy|\n        //     |x+iy   -z|\n\n        // p = (-1)^t = cos(theta) + i sin(theta)\n        var pr = Math.cos(theta);\n        var pi = Math.sin(theta);\n\n        // M = U^t = ( (1+p)*I + (1-p)*U )/2 = | 1+p+(1-p)z    (1-p)(x-iy) |\n        //                                     | (1-p)(x+iy)    1+p-(1-p)z |\n        // Well, this ended up kind of complicated...\n        var ar = (1 + pr + z - pr*z)/2;\n        var ai = (pi - pi*z)/2;\n        var br = (x - pr*x - pi*y)/2;\n        var bi = (-y + pr*y - pi*x)/2;\n        var cr = (x - pr*x + pi*y)/2;\n        var ci = (y - pr*y - pi*x)/2;\n        var dr = (1 + pr - z + pr*z)/2;\n        var di = (pi + pi*z)/2;\n\n        for (var i = 0; i < n; i++) {\n            // Only process each amplitude pair once.\n            var skip = (i & (1 << target_bit_index)) !== 0;\n            // Skip parts of the superposition where control bits are off.\n            for (var k = 0; k < control_bit_indices.length; k++) {\n                skip |= (i & (1 << control_bit_indices[k])) === 0;\n            }\n            if (skip) continue;\n\n            var j1 = i*2;\n            var j2 = j1 + (2 << target_bit_index);\n\n            var ur = amps[j1];\n            var ui = amps[j1+1];\n            var vr = amps[j2];\n            var vi = amps[j2+1];\n\n            // | a b | |u| = |au+bv|\n            // | c d | |v|   |cu+dv|\n            var ur2 = ar*ur - ai*ui + br*vr - bi*vi;\n            var ui2 = ar*ui + ai*ur + br*vi + bi*vr;\n            var vr2 = cr*ur - ci*ui + dr*vr - di*vi;\n            var vi2 = cr*ui + ci*ur + dr*vi + di*vr;\n\n            amps[j1] = ur2;\n            amps[j1+1] = ui2;\n            amps[j2] = vr2;\n            amps[j2+1] = vi2;\n        }\n    })";
  var MEASURE_FUNC_STRING = "\n    (function(amps, target_bit_index) {\n        var n = amps.length / 2;\n        // Weigh.\n        var p = 0;\n        for (var i = 0; i < n; i++) {\n            if ((i & (1 << target_bit_index)) !== 0) {\n                var vr = amps[i*2];\n                var vi = amps[i*2+1];\n                p += vr*vr + vi*vi;\n            }\n        }\n\n        // Collapse.\n        var outcome = Math.random() < p;\n\n        // Renormalize.\n        var w = Math.sqrt(outcome ? p : 1-p);\n        for (var i = 0; i < n; i++) {\n            var b = (i & (1 << target_bit_index)) !== 0;\n            if (b === outcome) {\n                amps[i*2] /= w;\n                amps[i*2+1] /= w;\n            } else {\n                amps[i*2] = 0;\n                amps[i*2+1] = 0;\n            }\n        }\n\n        return outcome;\n    })";
  return {
    get ROTATE_FUNC_STRING() {
      return ROTATE_FUNC_STRING;
    },
    get MEASURE_FUNC_STRING() {
      return MEASURE_FUNC_STRING;
    }
  };
});
//# sourceURL=src/engine/Superposition.js
;System.registerModule("src/main.js", [], function() {
  "use strict";
  var __moduleName = "src/main.js";
  var Seq = System.get("src/base/Seq.js").default;
  var wireGame = System.get("src/engine/Draw.js").wireGame;
  var $__2 = System.get("src/engine/ChSh.js"),
      ChshGameOutcomeCounts = $__2.ChshGameOutcomeCounts,
      asyncEvalClassicalChshGameRuns = $__2.asyncEvalClassicalChshGameRuns,
      asyncEvalQuantumChshGameRuns = $__2.asyncEvalQuantumChshGameRuns;
  var SHARED_BIT_COUNT = 16;
  var ASYNC_EVAL_TIMEOUT = 2000;
  var classicalRecorded = [25186, 0, 12553, 12494, 0, 0, 0, 0, 24718, 0, 12468, 12581, 0, 0, 0, 0];
  var quantumRecorded = [10813, 1734, 10416, 1875, 1832, 10833, 1840, 10619, 10581, 1835, 1849, 10811, 1817, 10643, 10672, 1830];
  var precomputedClassicalOutcomeForDefaultStrategy = ChshGameOutcomeCounts.fromCountsByMap(Seq.range(16).toMap(function(i) {
    return ChshGameOutcomeCounts.caseToKey(i & 8, i & 2, i & 4, i & 1);
  }, function(i) {
    return classicalRecorded[i];
  }));
  var precomputedQuantumOutcomeForDefaultStrategy = ChshGameOutcomeCounts.fromCountsByMap(Seq.range(16).toMap(function(i) {
    return ChshGameOutcomeCounts.caseToKey(i & 8, i & 2, i & 4, i & 1);
  }, function(i) {
    return quantumRecorded[i];
  }));
  wireGame(document.getElementById('srcTextArea1_a'), document.getElementById('srcTextArea2_a'), document.getElementById('rateLabel_a'), document.getElementById('countLabel_a'), document.getElementById('judgementLabel_a'), document.getElementById('errorLabel_a'), document.getElementById('resultsTable_a'), document.getElementById('drawCanvas_a'), "// write any strategy you want!\nmove = false", "// write any strategy you want!\nmove = refChoice && sharedBits[0]", precomputedClassicalOutcomeForDefaultStrategy, function(code1, code2, runs, cancellor) {
    return asyncEvalClassicalChshGameRuns(code1, code2, runs, ASYNC_EVAL_TIMEOUT, SHARED_BIT_COUNT, cancellor);
  });
  wireGame(document.getElementById('srcTextArea1_b'), document.getElementById('srcTextArea2_b'), document.getElementById('rateLabel_b'), document.getElementById('countLabel_b'), document.getElementById('judgementLabel_b'), document.getElementById('errorLabel_b'), document.getElementById('resultsTable_b'), document.getElementById('drawCanvas_b'), "turn(X, -45) //rotate qubit -45\u00B0 around X axis\nif (refChoice) turn(X, 90)\nmove = measure()", "if (refChoice) turn(X, 90)\nmove = measure()", precomputedQuantumOutcomeForDefaultStrategy, function(code1, code2, runs, cancellor) {
    return asyncEvalQuantumChshGameRuns(code1, code2, runs, ASYNC_EVAL_TIMEOUT, cancellor);
  });
  return {};
});
//# sourceURL=src/main.js
;System.get("src/base/Seq.js");
System.get("src/engine/Async.js");
System.get("src/engine/ChSh.js");
System.get("src/engine/Draw.js");
System.get("src/engine/Superposition.js");
System.get("src/main.js");
