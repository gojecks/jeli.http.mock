/**
 * CORE JHTTP_MOCK
 * {
 *     logger: {
 *          
 *     },
 *     interceptor : {}
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
        interceptor: null
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
            options.type = options.method = options.method || options.type;
        }

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
                logger.log(null, ['No mock matched to request', options.url]);
                reject(null, request);
            }
        });

        return promise;
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
                    var params = {};
                    if (request.method.toLowerCase() === 'get') {
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

                    } else {
                        params = (reqeuest.body || {});
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
}
/**
 * register to window
 */
window.jHttp = jHttp;