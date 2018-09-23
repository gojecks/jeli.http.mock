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