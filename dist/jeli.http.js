/**
 * core extend Function
 */
function extend() {
    var extended = {},
        deep = (typeof arguments[0] === "boolean"),
        i = 0,
        length = arguments.length;

    if (deep) {
        i++;
        deep = arguments[0];
    }

    // check if source is Array or Object
    if (Object.prototype.toString.call(arguments[i]) === '[object Array]') {
        extended = Array(arguments[i].length);
    }

    var merger = function(source) {
        for (var name in source) {
            if (source.hasOwnProperty(name)) {
                if (deep && (source[name] && (typeof source[name] === 'object')) && !Object.keys(source[name]).length) {
                    extended[name] = extend(true, extended[name], source[name]);
                } else {
                    //set the value
                    extended[name] = source[name];
                }
            }
        }
    };

    // Loop through each object and conduct a merge
    for (; i < length; i++) {
        merger(arguments[i]);
    }

    return extended;
}

/**
 * 
 * @param {*} element 
 */
function isFunction(element) {
    return typeof element === 'function'
}

/**
 * 
 * @param {*} element 
 */
function isString(element) {
    return typeof element === 'string';
}

/**
 * 
 * @param {*} str 
 */
function hashCode(str) {
    var hash = 0;
    if (str.length == 0) {
        return hash;
    }

    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    return hash;
}

/**
 * 
 * @param {*} ip 
 */
function isValidIpv4Addr(ip) {
    return /^(?=\d+\.\d+\.\d+\.\d+$)(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\.?){4}$/.test(ip);
}

/**
 * CORE JHTTP_MOCK
 * {
 *     logger: {
 *          
 *     },
 *     lss: false
 * }
 */
function jHttp(definition) {
    /**
     * extend default definition
     */
    definition = extend(true, {
        logging: 2,
        logger: window.console,
        log: null,
        lss: false
    }, (definition || {}));

    var apiFactory = new JHTTPAPI();
    var _interceptor = new JHTTPINTERCEPTOR();
    /**
     * 
     * @param {*} url 
     * @param {*} options 
     * {
     *  url: String,
     *  body: Object,
     *  beforeSend: Function,
     *  method: String,
     *  headers: Object
     * }
     */
    function jHttpClientServer(url, options) {
        /**
         * check if url is an object and options is undefined
         */
        if (!options && typeof url === 'object') {
            options = url;
            url = undefined;
        } else {
            options = options || {};
            options.url = url;
        }
        // set the request method
        options.method = options.type = options.method || options.type || 'GET';

        /**
         * extend options with default options
         * {
         *    timeout: 30000
         * }
         */
        var options = extend(true, {
            timeout: 30000,
        }, options);

        var api = apiFactory.get(options);
        var promise = new _Promise(function(resolve, reject) {
            if (api) {
                var interceptor = _interceptor.resolve('request', options);
                interceptor.subscribe(function() {
                    var requestController = api.controller || jDefaultController,
                        request = new jClientXHR(requestController, options, api),
                        _timer = setTimeout(function() {
                            reject('Request timedout');
                        }, options.timeout);
                    /**
                     * trigger before send if defined
                     */
                    if (options.beforeSend) {
                        options.beforeSend(request);
                    }

                    /**
                     * register our onLoad Method
                     */
                    request.onLoad = function() {
                        if (request.readyState > 1) {
                            /**
                             * resolve registered interceptor
                             * for request response
                             */
                            _interceptor.resolve('response', request)
                                .subscribe(function() {
                                    if (options.callback) {
                                        options.callback(response, request);
                                    }

                                    if (request.status < 400) {
                                        resolve(request.responseText, request);
                                    } else {
                                        reject(request.responseText, request)
                                    }
                                });
                        }

                        // clear the timeout if resolved
                        clearTimeout(_timer);
                    };

                    /**
                     * send our request
                     */
                    request.send();
                });
            } else {
                logger.log(null, ['Request not found', options.url]);
                reject(new REQUEST_NOT_FOUND(options));
            }
        });

        return promise;
    }

    function REQUEST_NOT_FOUND(options) {
        this.url = options.url;
        this.status = 404;
        this.statusText = 'Not Found';
        this.method = options.type;
        this.timestamp = +new Date;
    }

    /**
     * 
     * @param {*} httpInstance 
     */
    function jDefaultController(httpInstance) {
        var responseText = httpInstance.req.getResponseText();
        httpInstance.res.status().responseText(responseText).exit();
    }

    /**
     * 
     * @param {*} requestController 
     * @param {*} request 
     * @param {*} _api 
     */
    function jClientXHR(requestController, request, _api) {
        /**
         * 
         * @param {*} _parent 
         */
        function RequestResponder(_parent) {
            /**
             * @return object
             */
            this.req = {
                getParam: function() {
                    var params = (request.body || request.data || {});
                    if (_api._.paramsMapping.length) {
                        _api._.regexp.exec(request.url.split("?")[0]).splice(1)
                            .forEach(function(val, prop) {
                                var isNumber = parseInt(val);
                                params[_api._.paramsMapping[prop]] = !isNaN(isNumber) ? isNumber : val;
                            });
                    }
                    /**
                     * get query from URL
                     */
                    var queryParam = request.url.split("?")[1];
                    if (queryParam) {
                        queryParam = queryParam.split(/[&]/);
                        queryParam.forEach(function(query) {
                            if (query) {
                                query = query.split("=");
                                var isNumber = parseInt(query[1]);
                                params[query[0]] = !isNaN(isNumber) ? isNumber : query[1];
                            }
                        });
                    }


                    return params;
                },
                getHeaders: function() {
                    return request.headers;
                },
                getResponseText: function() {
                    return _api.response.text;
                }
            };

            /**
             * Response Object
             */
            this.res = {
                status: function(status) {
                    _parent.status = status || 200;
                    return this;
                },
                headers: function(header, value) {
                    _api.response.headers[header] = value;
                },
                responseText: function(responseText) {
                    _parent.responseText = responseText;

                    return this;
                },
                exit: function() {
                    _parent.readyState = 4;
                    _parent.onLoad();
                }
            };
        };

        return {
            status: 0,
            statusText: 'OK',
            readyState: 1,
            open: function() {},
            send: function() {
                requestController.call(requestController, new RequestResponder(this));
            },
            abort: function() {
                clearTimeout(this.responseTimer);
            },
            onLoad: null,
            setRequestHeader: function(header, value) {
                request.headers[header] = value;
            },
            getResponseHeader: function(header) {
                // 'Last-modified', 'Etag'
                if (_api.response.headers && _api.response.headers[header]) {
                    // Return arbitrary headers
                    return _api.response.headers[header];
                } else if (header.toLowerCase() === 'last-modified') {
                    return _api.response.lastModified || (new Date()).toString();
                } else if (header.toLowerCase() === 'etag') {
                    return _api.response.etag || '';
                } else if (header.toLowerCase() === 'content-type') {
                    return _api.response.contentType || 'text/plain';
                }
            },
            getAllResponseHeaders: function() {
                var headers = '';
                if (_api.response.headers.contentType) {
                    _api.response.headers['Content-Type'] = _api.response.headers.contentType;
                }

                for (var key in _api.response.headers) {
                    headers += key + ': ' + _api.response.headers[key] + '\n';
                }
                return headers;
            }
        };
    }

    this.request = jHttpClientServer;
    this.app = function() {
        /**
         * 
         * @param {*} method 
         */
        var self = this;

        function registerMethod(method) {
            /**
             * 
             * @param {*} url 
             * @param {*} controller 
             */
            self[method] = function(url, controller) {
                apiFactory.set({
                    url: url,
                    method: method.toUpperCase(),
                    controller: controller
                });

                return this;
            };
        }

        var methodVerbs = ['post', 'delete', 'get', 'put', 'patch', 'head'];
        for (var method in methodVerbs) {
            registerMethod(methodVerbs[method]);
        }
    };

    this.interceptor = _interceptor;
    this.socket = JHttpSocket;
}
/**
 * register to window
 */
window.jHttp = jHttp;

/**
 * @class JHTTPINTERCEPTOR
 */
function JHTTPINTERCEPTOR() {
    var _interceptors = [],
        _handler = Object.create({
            get: function(name) {
                return this[name];
            },
            set: function(name, hanlder) {
                this[name] = handler;
            }
        });

    /**
     * 
     * @param {*} type 
     * @param {*} handler 
     */
    this.set = function(handler) {
        if (handler) {
            if (typeof handler === "function") {
                handler = handler()
            }

            if (typeof handler === "object") {
                _interceptors.push(handler);
            } else {
                // log error here
            }
        }

        return this;
    };

    /**
     * 
     * @param {*} type 
     */
    this.get = function(type) {
        return _interceptors.filter(function(item) {
            return item.type === type;
        });
    };

    /**
     * 
     * @param {*} options 
     */
    this.resolve = function(type, options) {
        var _interceptor = this.get(type);
        var promise = new _Promise(function(resolve, reject) {
            var _resolved = 0;
            if (_interceptor.length) {
                _interceptor.forEach(process);
                if (_resolved == _interceptor.length) {
                    resolve(options);
                }
            } else {
                resolve(options);
            }

            function process(inter, idx) {
                if (typeof inter.handler === 'string') {
                    inter.handler = _handler.get(inter.handler);
                }

                if (isFunction(inter.handler)) {
                    options = inter.handler(options);
                    _resolved++;
                }
            }
        });

        return promise;
    }

    this.registerHandler = function(name, handler) {
        _handler.set(name, handler || function(options) { return options; });
    };

}

/**
 * HTTP MOCK
 * @class HTTPMOCK
 */

function JHTTPAPI(logger) {
    var _api = [];

    /**
     * @method generateRegExp
     * @param {*} url 
     * 
     * this method generates a regExp based on user defined API
     * eg /api/users/:userID
     */
    function generateRegExp(url) {
        var replacer = "\/(\\w+)",
            paramsMapping = [];
        url = url.replace(/([\/]|)([:]|)+(\w+)/g, function(match) {
            if (match.indexOf(":") > -1) {
                paramsMapping.push(match.split(":")[1]);
                return replacer;
            }
            return match;
        });

        return ({
            params: {},
            paramsMapping: paramsMapping,
            regexp: new RegExp("(?:" + url.split("?")[0] + ")$")
        });
    }

    /**
     * 
     * @param {*} str 
     * @return str
     */
    function lower(str) {
        return (str || '').toLocaleLowerCase();
    }

    /**
     * 
     * @param {*} options
     */
    function removeByURL(options) {
        if (options && (!options.url || !options.method)) {
            return;
        }

        _api = _api.filter(function(item) {
            return (item.url !== options.url && lower(options.method) !== lower(item.method));
        });
    }

    /**
     * 
     * @param {*} options 
     * {
     *  url: STRING,
     *  method: STRING,
     *  response: {
     *      headers:Object,
     *      text:String,
     *      status: Number 
     *  },
     *  controller: Function
     */
    this.set = function(options) {
        var _error = [],
            self = this;
        /**
         * check if option is an ARRAY
         */
        if (typeof options === "object" && options.length) {
            [].forEach.call(options, function(element) {
                validateAndRegister(element);
            });
        } else {
            validateAndRegister(options)
        }

        function validateAndRegister(settings) {
            var error = [];
            /**
             * validate options
             */
            if (!settings.url || !settings.method) {
                error.push("Invalid Api. url and method are required");
            }

            if (self.isExists(settings)) {
                error.push('Api already exists');
            }

            if (!error.length) {
                /**
                 * register the api
                 */
                settings._ = generateRegExp(settings.url);
                /**
                 * if no response was defined
                 * set default response
                 */
                if (!settings.response) {
                    settings.response = {
                        headers: {},
                        text: null,
                        status: 200
                    };
                }

                _api.push(settings);
            }

            _error.push.apply(_error, error);
        }

        if (_error.length) {
            logger.error(null, _error);
        }


        return this;
    }

    /**
     * 
     * @param {*} api 
     * Match the requested Api against stored APIS
     * using regExp
     */
    this.get = function(api) {
        var found = _api.filter(function(item) {
            return item._.regexp.test(api.url.split('?')[0]) && lower(item.method) == lower(api.method);
        })[0];

        if (found) {
            return extend(true, found);
        }

        return found;
    };

    /**
     * Check if an API already exists
     * @param {*} api
     */
    this.isExists = function(api) {
        return _api.some(function(item) {
            return item.url === api.url.split('?')[0] && lower(api.method) === lower(item.method);
        });
    };

    /**
     * Remove an Ajax mock from those held in memory. This will prevent any
     * future Ajax request mocking for matched requests.
     * NOTE: Clearing a mock will not prevent the resolution of in progress requests
     * 
     * @param {*} option optional
     * {
     *     url: String,
     *     method: String
     * }
     */
    this.clear = function(option) {
        if (option && typeof option === 'object') {
            removeByURL(option);
        } else {
            _api.length = 0;
        }
    };
}

/**
 * logger Instance
 */
var logger = {
        _log: function logger(mockOptions, args, level) {
            var loggerLevel = 2;
            var logLevelMethods = ['error', 'warn', 'info', 'log', 'debug'];
            if (mockOptions && typeof mockOptions.logging !== 'undefined') {
                loggerLevel = mockOptions.logging;
            }
            level = (level === 0) ? level : (level || logLevels.LOG);
            args = (args.splice) ? args : [args];

            // Is logging turned off for this mock or mockjax as a whole?
            // Or is this log message above the desired log level?
            if (loggerLevel === false || loggerLevel < level) {
                return;
            }

            if (mockOptions.log) {
                return mockOptions.log(args[1] || args[0]);
            } else if (mockOptions.logger && mockOptions.logger[logLevelMethods[level]]) {
                return mockOptions.logger[logLevelMethods[level]].apply(mockOptions.logger, args);
            }
        },
        /**
         * Convenience method for logging a DEBUG level message
         * @param  {Object} m  The mock handler in question
         * @param  {Array|String|Object} a  The items to log
         * @return {?}  Will return whatever the $.mockjaxSettings.logger method for this level would return (generally 'undefined')
         */
        debug: function(m, a) { return this._log(m, a, logLevels.DEBUG); },
        /**
         * @see logger.debug
         */
        log: function(m, a) { return this._log(m, a, logLevels.LOG); },
        /**
         * @see logger.debug
         */
        info: function(m, a) { return this._log(m, a, logLevels.INFO); },
        /**
         * @see logger.debug
         */
        warn: function(m, a) { return this._log(m, a, logLevels.WARN); },
        /**
         * @see logger.debug
         */
        error: function(m, a) { return this._log(m, a, logLevels.ERROR); }
    },
    logLevels = {
        DEBUG: 4,
        LOG: 3,
        INFO: 2,
        WARN: 1,
        ERROR: 0
    };

    /**
     * 
     * @param {*} resolver 
     */
    function _Promise(resolver) {
        var _succ = [],
            _err = [],
            state = -1,
            _cachedValue = null;
        var PROMISE_STATUS = "[[PromiseStaus]]";
        var PROMISE_VALUE = "[[PromiseValue]]";

        /**
         * error handler
         */
        function fail() {
            while (_err.length) {
                fn = _err.shift();
                fn.apply(fn, arguments);
            }
        }

        /**
         * success handler
         */
        function success() {
            while (_succ.length) {
                fn = _succ.shift();
                fn.apply(fn, arguments);
            }
        }

        /**
         * trigger the state only when changed
         */
        function triggerIfStatusChanged() {
            if (state > -1) {
                if (state) {
                    success.apply(null, _cachedValue);
                } else {
                    fail.apply(null, _cachedValue);
                }
            }
        }

        /**
         * core promise instance
         */
        function _promise() {
            this[PROMISE_STATUS] = "pending";
            this[PROMISE_VALUE] = null;

            var self = this;
            /**
             * @param {*} success
             * @param {*} error
             */
            resolver(function() {
                state = 1;
                resolve.apply(null, arguments);
                success.apply(null, arguments);
            }, function() {
                state = 0;
                resolve.apply(null, arguments);
                fail.apply(null, arguments);
            });

            /**
             * change the static state
             */
            function resolve() {
                self[PROMISE_VALUE] = _cachedValue = [].slice.call(arguments);
                self[PROMISE_STATUS] = "resolved";
            }
        }
        /**
         * 
         * @param {*} suc 
         * @param {*} err 
         */
        _promise.prototype.then = function(suc, err) {
            if (suc) {
                _succ.push(suc);
            }

            if (err) {
                _err.push(err);
            }

            triggerIfStatusChanged();
            return this;
        };

        /**
         * 
         * @param {*} fn 
         */
        _promise.prototype.catch = function(fn) {
            _err.push(fn);
            triggerIfStatusChanged();
            return this;
        };

        /**
         * 
         * @param {*} fn 
         */
        _promise.prototype.subscribe = function(fn) {
            _succ.push(fn);
            triggerIfStatusChanged();
        };

        /**
         * trigger user callback
         */
        if (!resolver) {
            throw new Error('Promise resolver undefined is not a function');
        }

        return (new _promise);
    };

(function() {
    'use strict';
    /**
     * LocalStorage Server
     */
    function _localStorageServer(isServerInstance) {
        var CORE_SOCKET_NAME = "[[_:lss:]]",
            CORE_MESSAGE_NAME,
            _hashId = null;

        /**
         * Creates the server instance if not exists
         * @param {*} definition
         * {
         *      domain: String,
         *      port: number
         * }
         */
        function createServerIfNotExists(definition) {
            _hashId = hashCode(definition.domain);
            /**
             * set CORE_MESSAGE_NAME
             * by concating hashId and port
             */
            CORE_MESSAGE_NAME = ['[[:jsm:message', _hashId, definition.port, ']]'].join(':');

            if (isServerInstance) {
                var openedSockets = JSON.parse(localStorage[CORE_SOCKET_NAME] || '{}');
                if (!openedSockets[_hashId]) {
                    openedSockets[_hashId] = {
                        ports: []
                    };
                }

                if (0 > openedSockets[_hashId].ports.indexOf(definition.port)) {
                    openedSockets[_hashId].ports.push(definition.port);
                    localStorage.setItem(CORE_SOCKET_NAME, JSON.stringify(openedSockets));
                }
            }
        }

        /**
         * 
         * @param {*} data 
         */
        function _send(data) {
            if (isDestroyed()) { return; }
            localStorage.setItem(CORE_MESSAGE_NAME, JSON.stringify(data));
            localStorage.removeItem(CORE_MESSAGE_NAME);
        }

        /**
         * startListener sets a listener for storgeEvent
         */
        function startListener(eventListener) {
            window.addEventListener('storage', function(e) {
                switch (e.key) {
                    case (CORE_MESSAGE_NAME):
                        var eData;
                        try {
                            eData = JSON.parse(e.newValue);
                        } catch (e) {} finally {
                            if (eData) {
                                eData = extend({
                                    type: "socket",
                                    time: +new Date
                                }, eData);
                                eventListener(eData);
                            }
                        }
                        break;
                    default:

                        break;
                }
            }, false);

        }

        /**
         * check if storage is destroyed
         */
        function isDestroyed() {
            return !localStorage[CORE_SOCKET_NAME];
        }


        /**
         * 
         * @param {*} ip
         */
        function validateDomain(ip) {
            if (-1 < ['localhost'].indexOf(ip)) {
                return true;
            }

            return isValidIpv4Addr(ip);
        }

        /**
         * 
         * @param {*} definition 
         * @param {*} eventListener 
         */
        function _listen(definition, eventListener) {
            if (definition.port && definition.domain) {
                if (isNaN(parseInt(definition.port))) {
                    throw new Error('Invalid Port Entered');
                }

                if (!validateDomain(definition.domain)) {
                    throw new Error('Invalid IP Address or domain');
                }

                /**
                 * create serve if not exists and start listening for changes
                 */
                createServerIfNotExists(definition);
                startListener(eventListener);
            } else {
                throw new Error('Failed to initialize socket and port are required');
            }
        }

        function _onDestroy(cb) {
            window.addEventListener('beforeunload', function(e) {
                (cb || function() {})(e);
                if (isServerInstance) {
                    localStorage.removeItem(CORE_SOCKET_NAME);
                }
            });
        }

        /**
         * disconnect from listeners
         */
        function _disconnect() {
            window.removeEventListener('beforeunload');
            window.removeEventListener('storage');
        }

        /**
         * public API
         */
        var ret = Object.create({
            listen: _listen
        });

        ret.send = _send;
        ret.onDestroy = _onDestroy;
        ret.disconnect = _disconnect;

        return ret;
    }
    /**
     * reference the localStorage Server
     */
    window.localServer = _localStorageServer;
})();



/**
 * 
 * @param {*} server
 */
function JHttpSocket(server) {
    var socketId = "sock_" + hashCode(+new Date);
    /**
     * 
     * @param {*} definition 
     * @param {*} handler 
     */
    this.connect = function(definition, handler) {
        var mainSocket = new _socket();
        server.listen(definition, mainSocket._trigger);
        handler(mainSocket);
    };

    /**
     * 
     * @param {*} eventId 
     * @param {*} data 
     * 
     * broadcast the event to the server
     */
    function _emit(eventId, data) {
        server.send({
            _eventId: eventId,
            _data: data
        });
    }

    this.disconnect = function() {
        server.send({
            _eventId: 'user.disconnected',
            _data: {
                id: socketId
            }
        });
        server.disconnect();
    };

    /**
     * socket class
     */
    function _socket() {
        var socket_events = {};
        this.id = socketId;
        /**
         * private API
         * @param {*} eData 
         */
        this._trigger = function(eData) {
            if (socket_events.hasOwnProperty(eData._eventId)) {
                socket_events[eData._eventId](eData);
            }
        };

        /**
         * 
         * @param {*} eventId 
         * @param {*} handler 
         */
        this.on = function(eventId, handler) {
            socket_events[eventId] = handler;
            return this;
        };

        /**
         * 
         * @param {*} eventId 
         */
        this.off = function(eventId) {
            if (socket_events.hasOwnProperty(eventId)) {
                delete socket_events[eventId];
            }

            return this;
        };
    }

    /**
     * 
     * @param {*} eventId 
     * @param {*} data 
     */
    _socket.prototype.emit = function(eventId, data) {
        _emit(eventId, data);
        return this;
    };


    /**
     * 
     * @param {*} eventId 
     * @param {*} data 
     */
    _socket.prototype.broadcast = function(eventId, data) {
        _emit(eventId, data);
        return this;
    };
}