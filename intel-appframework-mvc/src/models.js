/**
 * @Copyright Intel 2013
 * @Author Ian Maffett
 */
;(function($) {

    var storageAdapters = {}; //Each model can have it's own connector
    /**
     * This is the base model that all models inherit from.  This is used internally by $.mvc.model.extend

     * @param {String} name
     * @param {Object} opts properties and methods to add to the model
     * @api private
     * @title $.mvc.model
     */

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
    /**
    * This is used to clone a model to a new object and optionally clone the prototype too
    *
    * @param {Object} New object
    * @param {Object} Source Object
    * @param {Boolean} Clone the prototype
    * @title $.mvc.model.clone
    */

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

    /**
     * This is the model prototype
     * @api private
     */
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


    /**
     * This is called to create a new model type.  You pass in the name, default properties and an optional storage adapter
        ```
        $.mvc.model.extend('model',{foo:'bar'})
        $.mvc.model.extend('model',{foo:'bar'},myCustomAdapter)
        ```
     * @param {String} name
     * @param {Object} obj default methods/properties
     * @param {Object} [storageAdapter] - object implementing storageAdapter interface (look below for the default)
     * @param {Object} [prototype] - Optional prototype for the object
     */
    $.mvc.model.extend = function(name, obj, storageAdapter, proto) {
        storageAdapters[name] = storageAdapter ? storageAdapter : (localAdapter.linkerCache[name] = {}, localAdapter);
        return function() {
            return new $.mvc.model(name, obj);
        };
    };


    /**
     * This is the default storage adapater that wraps the HTML5 local storage item.
     * When implementing a new adapter, you must implement the four following functions.  It should be noted that getAll should return an array
     *
     * Each function has a callback function to be executed against.
     * Additionally, you should dispatch an event for the model type for save/remove/etc.
     * @api private
     */
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