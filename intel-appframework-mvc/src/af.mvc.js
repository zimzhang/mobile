/**
 * @Copyright Intel 2013
 * @Author Ian Maffett
 */
//mvc.js



;(function($){
	var baseUrl = document.location.protocol + "//" + document.location.host;
    var initialUrl=location.href;
    var popped=('state' in window.history);
    $.mvc = {};
	 
    $.mvc = {};

    $.mvc._app=null; //Internal reference to app variable
    $.mvc.app = function() {$.mvc._app=this;}

    $.mvc.app.prototype = {
        _loadTimer: null,
        _modelsReady: false,
        _controllersReady: false,
        _loadedListeners: [],
        _modelsLoaded: 0,
        _totalModels: 0,
        _controllersDir: "controllers/",
        _modelsDir: "models/",
        _templateType: "text/x-dot-template",
        _hasModels:true,
        _useHistory:false,
        _html5Pop:function(e){
            var initialPop=!popped&&location.href!=initialUrl; //Chrome pop fix based on pjax
            popped=true;
            if(initialPop) return;
            $.mvc.route(document.location.href,e,true);
        },
        
        useHTML5History:function(hist){
             if(hist==true){
                this._useHistory=true;
                window.addEventListener("popstate",this._html5Pop);
            }
            else{
                this._useHistory=false;
                window.removeEventListener("popstate",this._html5Pop);
            }
        },
        
        setBaseDir:function(str){
            if(str[0]=="/")
                str = str.substr(1);
            if(str[str.length-1]=="/")
                str=str.slice(0,-1);
            baseUrl+="/"+str;
        },
        
        listenHashChange: function(listen) {
            window.addEventListener("hashchange", function(e) {
                var url = document.location.hash.replace("#", "/");
                $.mvc.route(url, e,true);
            });
        },
        
        controllersDir: function(path) {
            this._controllersDir = path;
        },
        
        modelsDir: function(path) {
            this._modelsDir = path;
        },
        

        setViewType: function(type) {
            this._templateType = type;
        },
        
        ready: function(fnc) {
            if(!this.loaded) $(document).one("afmvc:loaded", fnc);
            else fnc();
        },
        
        loadControllers: function(urls) {
            var that = this;
            $(document).ready(function() {
                if(typeof(urls) === "string") {
                    urls = [urls];
                }
                for(var i = 0; i < urls.length; i++) {
                    var file = document.createElement("script");
                    file.src = that._controllersDir + urls[i] + ".js";
                    file.onerror = function(e) {
                        console.log("error ", e);
                    };
                    $("head").append(file);
                    that._loadedListeners[urls[i]] = 1;
                    that._loadedListeners.length++;
                    $(document).one(urls[i] + ":ready", function(e,data) {
                        data=data||e.data;
                        delete that._loadedListeners[data.name];
                        that._loadedListeners.length--;
                        if(that._loadedListeners.length == 0) {
                            that._controllersReady = true;
                            if(that._modelsReady||!that._hasModels) {
                                $(document).trigger("afmvc:loaded");
                            }
                            else {
                                 that._loadTimer = setTimeout(function() {
                                    that._modelsReady = true;
                                    if(that._controllersReady) $(document).trigger("afmvc:loaded");
                                  }, 1500); //Used if no models are loaded
                            }
                        }
                    });
                    delete file;
                }
            });

        },

        
        loadModels: function(urls) {
            var that = this;

            clearTimeout(this._loadTimer);
            $(document).ready(function() {
                if(typeof(urls) === "string") {
                    urls = [urls];
                }
                that._totalModels = urls.length;

                for(var i = 0; i < urls.length; i++) {
                    var file = document.createElement("script");
                    file.src = that._modelsDir + urls[i] + ".js";
                    file.onload = function() {
                        that._modelsLoaded++;
                        if(that._modelsLoaded >= that._totalModels) {
                            that._modelsReady = true;
                            if(that._controllersReady) $(document).trigger("afmvc:loaded");
                        }
                    };
                    file.onerror = function(e) {
                        console.log("error ", e);
                    };
                    $("head").append(file);
                    delete file;
                }
            });
        }
    };

	
    $.mvc.route = function(url, evt,noHistory) {
        if(typeof(url)!=="string"&&url.nodeName&&url.nodeName.toLowerCase()=="a"){
            url=url.href;
        }else if(url.nodeName&&url.parentNode){
            return $.mvc.route(url.parentNode, evt,noHistory);
        }

        if(typeof(url)!=="string")
            throw "Invalid route parameter.  String or <a> expected";
        var route, axt;
        var origUrl=url;
        if(url.indexOf(baseUrl) === 0) url = url.substring(baseUrl.length, url.length);
        if(url[0] == "/") url = url.substr(1);
        if(url[url.length-1]=="/") url=url.slice(0,-1);
        url = url.split("/");

        if(url.length > 1) {
            route = url.splice(0, 1);
            axt = url.splice(0, 1);
        } else {
            route = url[0];
            axt = "default";
        }
        if($.mvc.controller[route] && $.mvc.controller[route].hasOwnProperty(axt)) {
            evt && evt.preventDefault();
            try{
                $.mvc.controller[route][axt].apply($.mvc.controller[route], url);
            }
            catch(e){
                console.log(e.message);
            }
            if($.mvc._app._useHistory&&noHistory!==true)
            {
                 window.history.pushState(origUrl,origUrl,origUrl);
            }
            return true;
        }
        return false;
    };


    $.mvc.addRoute = function(url, fnc) {
        if(url.indexOf(baseUrl) === 0) url = url.substring(baseUrl.length, url.length);
        if(url[0] == "/") url = url.substr(1);
        url = url.split("/");

        if(url.length > 1) {
            var route = url.splice(0, 1);
            var axt = url.splice(0, 1);
        } else {
            route = url[0];
            axt = "default";
        }
        if(!$.mvc.controller[route]) {
            $.mvc.controller[route] = {};
        }
        $.mvc.controller[route][axt] = fnc;

    };



    
    if($.ui) $.ui.customClickHandler = $.mvc.route;
    else {
        $(document).on("click", "a", function(evt) {
            $.mvc.route(evt.target, evt)
        });
    }
})(af);



//controller.js


(function($){
	var viewsCache = [],modelsCache = [],readyFuncs = {},viewsTotal = {},modelsTotal = {},viewsLoaded = {},modelsLoaded = {},controllerReady = {};


    $.mvc.controller = {};
    
	$.mvc.controller.create = function(name, obj) {
        var loaded = true;
        $.mvc.controller[name] = obj;
        viewsTotal[name] = 0;
        viewsLoaded[name] = 0;
        modelsLoaded[name] = 0;
        modelsTotal[name] = 0;
        if(obj.hasOwnProperty("init")) controllerReady[name] = obj;
        if(obj.hasOwnProperty("views") && (obj.views.length > 0 || Object.keys(obj.views).length) > 0) {
            loaded = false;
            viewsTotal[name] = obj.views.length || Object.keys(obj.views).length;
            for(var i in obj.views) {
                var shortName = $.isArray(obj.views) ? obj.views[i] : i;
                if(!viewsCache[shortName] && af("#" + shortName).length == 0) {
                    $.mvc.controller.addView(obj.views[i], name, shortName);
                    viewsCache[shortName] = 1;
                }
            }

        }

        if(loaded) {
            $(document).trigger(name + ":ready", {
                'name': name
            });
            controllerReady[name] && controllerReady[name].init.apply(controllerReady[name]);
        }
        return $.mvc.controller[name];

    };

    
    $.mvc.controller.addView = function(path, controller, name) {
        $.get(path, function(data) {
            var id = name;
            $(document.body).append($("<script type='" + $.mvc._app._templateType + "' id='" + id + "'>" + data + "</script>"));
            viewsLoaded[controller]++;
            if((viewsLoaded[controller] == viewsTotal[controller])) {
                $(document).trigger(controller + ":ready", {
                    name: controller
                });
                controllerReady[controller] && controllerReady[controller].init.apply(controllerReady[controller]);
            }
        });
    };
})(af);



//models.js


;(function($) {

    var storageAdapters = {}; //Each model can have it's own connector
    

    $.mvc.model = function(name, opts, proto) {
        var obj;
        if(this.__proto__){
            obj={};
            proto=proto||this.__proto__;
            obj.__proto__ = proto;
        }
        else{
            proto=proto||this;
            var tmp={};
            for(var j in proto){
                tmp[j]=proto[j];
            }
            obj=Object.create(Object.getPrototypeOf(this));
        }
        opts && opts['modelName'] && delete opts['modelName'];
        opts && opts['id'] && delete opts['id'];
        $.extend(obj, opts);
        obj.modelName = name;
        return obj;
    };
    

    $.mvc.model.clone=function(left,right,doProto){
        if(doProto){
            if(right.__proto__)
                left.__proto__=right.__proto__;
            else{
                var tmp={};
                for(var j in right.prototype){
                    tmp[j]=right.prototype[j];
                }
                left=Object.create(Object.getPrototypeOf(right));
            }
        }
        for(var j in right)
        {
            if(right.hasOwnProperty(j))
                left[j]=right[j];
        }
        return left;
    };

    
    $.mvc.model.prototype = {
        //Load a single object by id
        fetch: function(obj, callback) {
            if(typeof(obj) == "string") {
                this.id = obj;
            }
            var self = this;
            this.storageAdapter().fetch(self, function(theObj) {
                var el = self._prepareModel(theObj);
                if(callback) return callback(el);
                return el;
            }, this.modelName);

        },
        //Get all objects for a given type and executes a callback
        fetchAll: function(callback) {
            var self = this;
            this.storageAdapter().fetchAll(self, function(data) {
                var newRes = [];
                data.forEach(function(theObj) {
                    newRes.push(self._prepareModel(theObj));
                });
                if(callback) return callback(newRes);
                return newRes;
            });

        },
        //Save an object and executes a callback
        save: function(callback) {
            return this.storageAdapter().save(this, callback);

        },
        //Remove an object and execute a callback
        remove: function(callback) {
            return this.storageAdapter().remove(this, callback);
        },
        get: function(val) {
            if(this.hasOwnProperty(val)) return this[val];
            return undefined;
        },
        //Set properties on the model.  You can pass in a key/value or an object of properties
        set: function(obj, value, opts) {
            var oldObj=$.mvc.model.clone({},this);
            if($.isObject(obj)) {
                obj && obj['modelName'] && delete obj['modelName'];
                obj && obj['id'] && delete obj['id'];
                for(var j in obj) {
                    if(this.hasOwnProperty(j)) this[j] = obj[j];
                }
                if(!this._validate(opts)){ $.mvc.model.clone(this,oldObj); return false}
                return true;
            }
            if(obj.toLowerCase() != "id" && obj.toLowerCase() != "modelname") this[obj] = value;
            if(!this._validate(opts)) { $.mvc.model.clone(this,oldObj);  return false}
            return true;
        },
        // Gets a referene to the storage adapter for the object
        storageAdapter: function() {
            return storageAdapters[this.modelName];
        },
        //Boolean to check if the model is valid
        valid: function(opts) {
            return this.validate(opts) === true;
        },
        //Basic validate function
        validate: function(opts) {
            return true;
        },
        //Prepares a new instance of a given model.  Needed when loading
        //data from a storage adapter to add the new methods, etc.
        _prepareModel: function(theObj) {
            var self = this;
            var el = $.mvc.model.clone({}, self,true);
            el = $.mvc.model.clone(el, theObj);
            return el;
        },
        //Internal validate function - similar to backbone.js error handling
        _validate: function(opts) {
            if(opts && opts.silent) return true;
            var error = this.validate(opts);
            if(error===true) return true;
            if(opts && opts.error) opts.error(this, error, opts);
            return false
        }
    };


    
    $.mvc.model.extend = function(name, obj, storageAdapter, proto) {
        storageAdapters[name] = storageAdapter ? storageAdapter : (localAdapter.linkerCache[name] = {}, localAdapter);
        return function() {
            return new $.mvc.model(name, obj);
        };
    };


    
    var localAdapter = {
        linkerCache: {},
        //We do not store all documents in a single record, we keep a lookup document to link them
        save: function(obj, callback) {
            if(!obj.id) obj.id = $.uuid();
            window.localStorage[obj.id]=JSON.stringify(obj);
            this.linkerCache[obj.modelName][obj.id] = 1;
            window.localStorage[obj.modelName + "_linker"]=JSON.stringify(this.linkerCache[obj.modelName]);
            $(document).trigger(obj.modelName + ":save", obj);
            if(callback) return callback(obj);
        },
        fetch: function(obj, callback) {
            var id = obj.id;
            var el = window.localStorage.getItem(id);
            try {
                el = JSON.parse(el);
            } catch(e) {
                el = {}
            }
            return callback(el);
        },
        fetchAll: function(obj, callback) {
            var type = obj.modelName;
            var data = JSON.parse(window.localStorage.getItem(type + "_linker"));
            var res = [];
            for(var j in data) {
                if(localStorage[j]) {
                    var item = JSON.parse(localStorage[j]);
                    item.id = j;
                    res.push(item);
                } else {
                    delete data[j];
                }
            }
            this.linkerCache[type] = data ? data : {};
            //Fix dangling references
            window.localStorage[type + "_linker"]= JSON.stringify(this.linkerCache[type]);
            return callback(res);

        },
        remove: function(obj, callback) {
            window.localStorage.removeItem(obj.id);
            delete this.linkerCache[obj.modelName][obj.id];
            window.localStorage[obj.modelName + "_linker"]= JSON.stringify(this.linkerCache[obj.modelName]);
            $(document).trigger(obj.modelName + ":remove", obj.id);
            if(callback) return callback(obj);
        }
    };
})(af);


