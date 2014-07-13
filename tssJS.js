(function(window, undefined) {

    var _tssJS = (function() {

        // 构建tssJS对象
        var tssJS = function(selector) {
            return new tssJS.fn.init(selector, parent, rootTssJS);
        },

        version = "1.0.0",

        // Map over the $ in case of overwrite
        _$ = window.$,

        rootTssJS,

        // The deferred used on DOM ready
        readyList = [],

        // Check if a string has a non-whitespace character in it
        rnotwhite = /\S/,

        // Used for trimming whitespace
        trimLeft = /^\s+/,
        trimRight = /\s+$/,

        // Check for digits
        rdigit = /\d/,
 
        // JSON RegExp
        rvalidchars = /^[\],:{}\s]*$/,

        toString = Object.prototype.toString,
        push = Array.prototype.push,
        slice = Array.prototype.slice,
        trim = String.prototype.trim,
        indexOf = Array.prototype.indexOf,

        ua = navigator.userAgent.toLowerCase(),
        mc = function(e) {
            return e.test(ua)
        },

        isOpera  = mc(/opera/),
        isChrome = mc(/\bchrome\b/),
        isWebKit = mc(/webkit/),
        isSafari = !isChrome && mc(/safari/),
        isIE = !isOpera && mc(/msie/),
        supportCanvas = !!document.createElement('canvas').getContext,
        isMobile = mc(/ipod|ipad|iphone|android/gi),

        // [[Class]] -> type pairs
        class2type = {};


        // tssJS对象原型
        tssJS.fn = tssJS.prototype = {

            tssjs : version,

            constructor: tssJS,

            init: function(selector, parent, rootTssJS) {
                // Handle $(""), $(null), or $(undefined)
                if (!selector) {
                    return this;
                }

                // Handle $(DOMElement)
                if (selector.nodeType || selector === document) {
                    this[0] = selector;
                    this.length = 1;
                    return this;
                }

                if(typeof selector === "string") {
                    // TODO 待ready
                    return this.find(selector);
                }

                if (tssJS.isFunction(selector)) {
                    return rootTssJS.ready(selector);
                }
            },

            size: function() {
                return this.length;
            },

            each: function(callback, args) {
                return tssJS.each(this, callback, args);
            },

            ready: function(fn, args) {
                // Attach the listeners
                tssJS.bindReady.call(this, fn, args);

                return this;
            },
        };

        // Give the init function the tssJS prototype for later instantiation
        tssJS.fn.init.prototype = tssJS.fn;

        // 合并内容到第一个参数中，后续大部分功能都通过该函数扩展
        // 通过tssJS.fn.extend扩展的函数，大部分都会调用通过tssJS.extend扩展的同名函数
        tssJS.extend = tssJS.fn.extend = function(fnMap) {
            fnMap = fnMap || {};
            for (var name in fnMap) {
                this[name] = fnMap[name];
            }

            // Return the modified object
            return this;
        };

        // 在tssJS上扩展静态方法
        tssJS.extend({

            // 释放$的 tssJS 控制权
            // 许多 JavaScript 库使用 $ 作为函数或变量名，tssJS 也一样。
            // 在 tssJS 中，$ 仅仅是 tssJS 的别名，因此即使不使用 $ 也能保证所有功能性。
            // 假如我们需要使用 tssJS 之外的另一 JavaScript 库，我们可以通过调用 $.noConflict() 向该库返回控制权。
            noConflict: function(deep) {
                // 交出$的控制权
                if (window.$ === tssJS) {
                    window.$ = _$;
                }

                return tssJS;
            },

            // Is the DOM ready to be used? Set to true once it occurs.
            isReady: false,

            // Handle when the DOM is ready
            ready: function(fn, args) {
                if (!tssJS.isReady) {
                    // 确保document.body存在
                    if (!document.body) {
                        setTimeout( function() { tssJS.ready(fn, args); }, 10);
                        return;
                    }

                    // Remember that the DOM is ready
                    tssJS.isReady = true;

                    // If there are functions bound, to execute
                    if(fn) {
                        fn(args);
                    }
                    else {
                        tssJS.each(readyList, function(i, name) {
                            var _ = readyList[i];
                            _.fn.call(_._this, _.args);
                        });

                        readyList = [];
                    }
                }
            },

            bindReady: function(fn, args) {
                readyList.push({"_this": this, "fn": fn, "args": args});

                if (document.readyState === "complete") {
                    return setTimeout(tssJS.ready, 1);
                }

                if (document.addEventListener) {
                    document.addEventListener("DOMContentLoaded", DOMContentLoaded, false);
                    window.addEventListener("load", tssJS.ready, false);
                } else if (document.attachEvent) {           
                    document.attachEvent("onreadystatechange", DOMContentLoaded);
                    window.attachEvent("onload", tssJS.ready);
                    
                    var toplevel = false;
                    try {
                        toplevel = window.frameElement == null;
                    } catch(e) {}

                    if (document.documentElement.doScroll && toplevel) {
                        doScrollCheck();
                    }
                }             
            },

            // 是否函数
            isFunction: function(obj) {
                return tssJS.type(obj) === "function";
            },

            // 是否数组
            isArray: Array.isArray ||  function(obj) { return tssJS.type(obj) === "array"; },

            // 简单的判断（判断setInterval属性）是否window对象
            isWindow: function(obj) {
                return obj && typeof obj === "object" && "setInterval" in obj;
            },

            // 是否是保留字NaN
            isNaN: function(obj) {
                // 等于null 或 不是数字 或调用window.isNaN判断
                return obj == null || !rdigit.test(obj) || isNaN(obj);
            },

            // 获取对象的类型
            type: function(obj) {
                // 通过核心API创建一个对象，不需要new关键字
                // 普通函数不行
                // 调用Object.prototype.toString方法，生成 "[object Xxx]"格式的字符串
                // class2type[ "[object " + name + "]" ] = name.toLowerCase();
                return obj == null ? String(obj) : class2type[toString.call(obj)] || "object";
            },

            // 是否空对象
            isEmptyObject: function(obj) {
                for (var name in obj) {
                    return false;
                }
                return true;
            },

            // 抛出一个异常
            error: function(msg) {
                throw msg;
            },

            // parseJSON把一个字符串变成JSON对象。
            // 我们一般使用的是eval。parseJSON封装了这个操作，但是eval被当作了最后手段。
            // 因为最新JavaScript标准中加入了JSON序列化和反序列化的API。
            // 如果浏览器支持这个标准，则这两个API是在JS引擎中用Native Code实现的，效率肯定比eval高很多。
            // 目前来看，Chrome和Firefox4都支持这个API。
            parseJSON: function(data) {
                if (typeof data !== "string" || !data) {
                    return null;
                }

                // Make sure leading/trailing whitespace is removed (IE can't handle it)
                data = tssJS.trim(data);

                // 原生JSON API。反序列化是JSON.stringify(object)
                if (window.JSON && window.JSON.parse) {
                    return window.JSON.parse(data);
                }

                // ... 大致地检查一下字符串合法性
                if (rvalidchars.test(data.replace(rvalidescape, "@").replace(rvalidtokens, "]").replace(rvalidbraces, ""))) {

                    return (new Function("return " + data))();

                }
                tssJS.error("Invalid JSON: " + data);
            },

            // 解析XML 跨浏览器
            // parseXML函数也主要是标准API和IE的封装。
            // 标准API是DOMParser对象。
            // 而IE使用的是Microsoft.XMLDOM的 ActiveXObject对象。
            parseXML: function(data, xml, tmp) {

                if (window.DOMParser) { // Standard 标准XML解析器
                    tmp = new DOMParser();
                    xml = tmp.parseFromString(data, "text/xml");
                } else { // IE IE的XML解析器
                    xml = new ActiveXObject("Microsoft.XMLDOM");
                    xml.async = "false";
                    xml.loadXML(data);
                }

                tmp = xml.documentElement;

                if (!tmp || !tmp.nodeName || tmp.nodeName === "parsererror") {
                    alert("Invalid XML: " + data);
                }

                return xml;
            },

            // globalEval函数把一段脚本加载到全局context（window）中。
            // IE中可以使用window.execScript, 其他浏览器 需要使用eval。
            // 因为整个tssJS代码都是一整个匿名函数，所以当前context是tssJS，如果要将上下文设置为window则需使用globalEval。
            globalEval: function(data) {
                if (data && /\S/.test(data)) { // data非空
                    // use execScript on IE
                    // use an anonymous function so that context is window rather than tssJS in Firefox
                    (window.execScript ||
                    function(data) {
                        window["eval"].call(window, data);
                    })(data);
                }
            },

            // 遍历对象或数组
            each: function(object, callback, args) {
                var name, i = 0,
                length = object.length,
                isObj = length === undefined || tssJS.isFunction(object);

                // 如果有参数args，调用apply，上下文设置为当前遍历到的对象，参数使用args
                if (args) {
                    if (isObj) {
                        for (name in object) {
                            if (callback.apply(object[name], args) === false) {
                                break;
                            }
                        }
                    } else {
                        for (; i < length;) {
                            if (callback.apply(object[i++], args) === false) {
                                break;
                            }
                        }
                    }
                }
                // 没有参数args则调用，则调用call，上下文设置为当前遍历到的对象，参数设置为key/index和value
                else {
                    if (isObj) {
                        for (name in object) {
                            if (callback.call(object[name], name, object[name]) === false) {
                                break;
                            }
                        }
                    } else {
                        for (; i < length;) {
                            if (callback.call(object[i], i, object[i++]) === false) {
                                break;
                            }
                        }
                    }
                }

                return object;
            },

            // 尽可能的使用本地String.trim方法，否则先过滤开头的空格，再过滤结尾的空格
            trim: trim ?
                    function(text) {
                        return trim.call(text);
                    }:
                    // Otherwise use our own trimming functionality
                    function(text) {
                        return text.toString().replace(trimLeft, "").replace(trimRight, "");
                    },

            // 过滤数组，返回新数组；callback返回true时保留
            grep: function(elems, callback) {
                var ret = [],
                retVal;

                for (var i = 0,
                length = elems.length; i < length; i++) {
                    retVal = !!callback(elems[i], i);
                    if (retVal) {
                        ret.push(elems[i]);
                    }
                }

                return ret;
            },

            // 获取当前时间的便捷函数
            now: function() {
                return (new Date()).getTime();
            }
        });

        // Populate the class2type map
        tssJS.each("Boolean Number String Function Array Date RegExp Object".split(" "),
            function(i, name) {
                class2type["[object " + name + "]"] = name.toLowerCase();
            }
        );

        var DOMContentLoaded = (function() {
          if (document.addEventListener) {
              return function() {
                  document.removeEventListener("DOMContentLoaded", DOMContentLoaded, false);
                  tssJS.ready();
              };
          } else if (document.attachEvent) {
              return function() {
                  if (document.readyState === "complete") {
                      document.detachEvent("onreadystatechange", DOMContentLoaded);
                      tssJS.ready();
                  }
              };
          }
        })();

        var doScrollCheck = function() {
            if (isReady) {
                return;
            }
            try {
                document.documentElement.doScroll("left");
            } catch(e) {
                setTimeout(doScrollCheck, 1);
                return;
            }
            tssJS.ready();
        }

        rootTssJS = tssJS(document);

        // Expose tssJS to the global object
        // 到这里，tssJS对象构造完成，后边的代码都是对tssJS或tssJS对象的扩展
        return tssJS;

    })();

    /**
     * Add useful method
     */
    Array.prototype.each = function(f, s) {
        var j = this.length,
        r;
        for (var i = 0; i < j; i++) {
            r = s ? f.call(s, this[i], i) : f(this[i], i);
            if (typeof r === "boolean" && !r) {
                break
            }
        };
        return this;
    };

    Array.prototype.sort = function(f) {
        var _ = this, L = _.length - 1;

        for (var i = 0; i < L; i++) {
            for (var j = L; j > i; j--) {　　
                if (f ? !f(_[j], _[j - 1]) : (_[j] < _[j - 1])) {　　
                    var T = _[j];　　
                    _[j] = _[j - 1];　　
                    _[j - 1] = T;
                }
            }
        }
    };

    Array.prototype.contains = function(obj) {  
        var i = this.length;  
        while (i--) {  
            if (this[i] === obj) {  
                return true;  
            }  
        }  
        return false;  
    }

    window.tssJS = window.$ = _tssJS;

})(window);


// 扩展tssJS原型方法
;(function($) {
    $.fn.extend({

        "find": function(selector, parent) {
            var elements = [];
            switch (selector.charAt(0)) {
                case '#' :
                  elements[0] = $.getElementById(selector.substring(1));
                  break;
                case '.' : 
                  elements = $.getElementsByClass(selector.substring(1), parent);
                  break;
                default : 
                  elements = $.getElementsByTag(selector, parent);
            }

            this.length = elements.length;
            for (var i = 0; i < this.length; i ++) {
              this[i] = (elements[i]);
            }

            return this;
        }

    });
})(tssJS);

// 扩展tssJS静态方法
;(function($) {
    $.extend({
        "getElementById": function (id) {
            return document.getElementById(id);
        },

        "getElementsByTag": function (tag, parentNode) {
            var node = parentNode ? parentNode : document;
            return node.getElementsByTagName(tag);
        },

        "getElementsByClass": function (cn, parentNode) {
            var node = parentNode ? parentNode : document;
            var result = [];
            var all = node.getElementsByTagName('*');
            for (var i = 0; i < all.length; i ++) {
              if ( hasClass(all[i], cn) ) {
                result.push(all[i]);
              }
            }
            return result;
        },

        "hasClass":function(element, className){
            var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
            return element.className.match(reg);
        }
    });
})(tssJS);