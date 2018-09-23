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