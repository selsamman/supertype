/* Copyright 2011-2012 Sam Elsamman
 Permission is hereby granted, free of charge, to any person obtaining
 a copy of this software and associated documentation files (the
 "Software"), to deal in the Software without restriction, including
 without limitation the rights to use, copy, modify, merge, publish,
 distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to
 the following conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/*
 * ObjectTemplate - n Type System with Benefits
 */

 var chalk;

 if (typeof require === 'function') {
    chalk = require('chalk');
 }

function ObjectTemplate() {
}

ObjectTemplate.performInjections = function ()
{
    if (this.__templatesToInject__) {
        var objectTemplate = this;
        for (var templateName in this.__templatesToInject__) {
            var template = this.__templatesToInject__[templateName];
            template.inject = function (injector) {
                objectTemplate.inject(this, injector);
            }
            this._injectIntoTemplate(template);
        }
    }
}
ObjectTemplate.init = function () {
    this.__injections__ = [];
    this.__dictionary__ = {};
    this.__anonymousId__ = 1;
    this.__templatesToInject__ = {};
    this.logger = this.createLogger(); // create a default logger
}
ObjectTemplate.getTemplateByName = function (name) {
    return this.__dictionary__[name];
}
ObjectTemplate.getTemplateProperties = function(props)
{
    var templateProperties = {};
    if (ObjectTemplate.__toClient__ == false)
        props.toClient = false;

    if (processProp(props.isLocal, this.isLocalRuleSet)) {
        props.toServer = false;
        props.toClient = false;
    }
    templateProperties.__toClient__ = processProp(props.toClient, this.toClientRuleSet) == false ?  false : true;
    templateProperties.__toServer__ = processProp(props.toServer, this.toServerRuleSet) == false ?  false : true;

    return templateProperties;
    /**
     * Allow the property to be either a boolean a function that returns a boolean or a string
     * matched against a rule set array of string in ObjectTemplate
     * @param prop
     * @returns {function(this:ObjectTemplate)}
     */
    function processProp(prop, ruleSet) {
        var ret = null;
        if (typeof(prop) == 'function')
            ret = prop.call(ObjectTemplate);
        else if (typeof(prop) == 'string') {
            ret = false;
            if (ruleSet)
                ruleSet.map(function (rule) {ret = ret ? ret : rule == prop});
        } else if (prop instanceof Array) {
            prop.forEach(function (prop) {
                ret = ret  == null ? ret : processProp(prop, ruleSet)
            });
        }
        else
            ret = prop;
        return ret;
    }

}
ObjectTemplate.setTemplateProperties = function(template, name, props)
{
    this.__templatesToInject__[name] = template;
    this.__dictionary__[name] = template;
    template.__name__ = name;
    template.__injections__ = [];
    template.__objectTemplate__ = this;
    template.__children__ = [];
    template.__toClient__ = props.__toClient__;
    template.__toServer__ = props.__toServer__;
};

/**
 * Create and object template that is instantiated with the new operator.
 * properties is
 * @param name the name of the template or an object with
 *        name - the name of the class
 *        toClient - whether the object is to be shipped to the client (with semotus)
 *        toServer - whether the object is to be shipped to the server (with semotus)
 *        isLocal - equivalent to setting toClient && toServer to false
 * @param properties an object whose properties represent data and function
 * properties of the object.  The data properties may use the defineProperty
 * format for properties or may be properties assigned a Number, String or Date.
 * @return {*} the object template
 */
ObjectTemplate.create = function (name, properties) {
    if (typeof(name) != 'undefined' && name.name) {
        var props = name;
        name = props.name;
    } else
        props = {};
    if (typeof(name) != 'string' || name.match(/[^A-Za-z0-9_]/))
        throw new Error("incorrect template name");
    if (typeof(properties) != 'object')
        throw new Error("missing template property definitions");
    var createProps = this.getTemplateProperties(props);
    if (typeof(this.templateInterceptor) == 'function')
        this.templateInterceptor("create", name, properties);
    var template = this._createTemplate(null, Object, properties ? properties : name, createProps);
    this.setTemplateProperties(template, name, createProps);
    return template;
};

/**
 * Extend and existing (parent template)
 *
 * @param parentTemplate
 * @param the name of the template
 * @param properties are the same as for create
 * @return {*} the object template
 */
ObjectTemplate.extend = function (parentTemplate, name, properties)
{
    if (!parentTemplate.__objectTemplate__)
        throw new Error("incorrect parent template");
    if (typeof(name) != 'string' || name.match(/[^A-Za-z0-9_]/))
        throw new Error("incorrect template name");
    if (typeof(properties) != 'object')
        throw new Error("missing template property definitions");
    if (typeof(this.templateInterceptor) == 'function')
        this.templateInterceptor("extend", name, properties);
    var template = this._createTemplate(null, parentTemplate, properties ? properties : name, parentTemplate);
    this.setTemplateProperties(template, name, parentTemplate);

    // Maintain graph of parent and child templates
    template.__parent__ = parentTemplate;
    parentTemplate.__children__.push(template);
    return template;
};

/**
 *  Mix in addition properties into a template
 *
 * @param template to mix into
 * @param properties are the same as for create
 * @return {*} the template with the new properties mixed in
 */
ObjectTemplate.mixin = function (template, properties)
{
    if (typeof(this.templateInterceptor) == 'function')
        this.templateInterceptor("create", template.__name__, properties);
    return this._createTemplate(template, null, properties, template);
};

/**
 * Add a function that will fire on object creation
 *
 * @param injector
 */
ObjectTemplate.inject = function (template, injector) {
    template.__injections__.push(injector);
}
ObjectTemplate.globalInject = function (injector) {
    this.__injections__.push(injector);
}

/**
 * General function to create templates used by create, extend and mixin
 *
 * @param template - template used for a mixin
 * @param parentTemplate - template used for an extend
 * @param properties - properties to be added/mxied in
 * @return {Function}
 * @private
 */
ObjectTemplate._createTemplate = function (template, parentTemplate, properties, createProperties)
{
    // We will return a constructor that can be used in a new function
    // that will call an init() function found in properties, define properties using Object.defineProperties
    // and make copies of those that are really objects
    var functionProperties = {};	// Will be populated with init function from properties
    var objectProperties = {};	// List of properties to be processed by hand
    var defineProperties = {};	// List of properties to be sent to Object.defineProperties()
    var objectTemplate = this;
    var templatePrototype;

    // Setup variables depending on the type of call (create, extend, mixin)
    if (template) { // mixin
        defineProperties = template.defineProperties;
        objectProperties = template.objectProperties;
        functionProperties = template.functionProperties;
        templatePrototype = template.prototype;
        parentTemplate = template.parentTemplate;
    } else {		// extend
        function F() {}
        F.prototype = parentTemplate.prototype;
        templatePrototype = new F();
    }

    /**
     * Constructor that will be returned
     */
    var template = function() {

        this.__template__ = template;
        if (objectTemplate.__transient__) {
            this.__transient__ = true;
        }
        var prunedObjectProperties = pruneExisting(this, objectProperties);
        var prunedDefineProperties = pruneExisting(this, defineProperties);

        try {
            // Create properties either with EMCA 5 defineProperties or by hand
            if (Object.defineProperties)
                Object.defineProperties(this, prunedDefineProperties);	// This method will be added pre-EMCA 5
        } catch (e) {
            console.log(e);
        }
        this.fromRemote = this.fromRemote || objectTemplate._stashObject(this, template);

        this.copyProperties = function (obj) {
            for (var prop in obj)
                this[prop] = obj[prop];
        }


        // Initialize properties from the defineProperties value property
        for (var propertyName in prunedObjectProperties) {
            var defineProperty = prunedObjectProperties[propertyName];
            if (typeof(defineProperty.init) != 'undefined')
                if (defineProperty.byValue)
                    this[propertyName] = ObjectTemplate.clone(defineProperty.init, defineProperty.of || defineProperty.type || null);
                else
                    this[propertyName] = (defineProperty.init);
        }

        // type system level injection
        objectTemplate._injectIntoObject(this);

        // Template level injections
        for (var ix = 0; ix < template.__injections__.length; ++ix)
            template.__injections__[ix].call(this, this);

        // Global injections
        for (var ix = 0; ix < objectTemplate.__injections__.length; ++ix)
            objectTemplate.__injections__[ix].call(this, this);

        this.__prop__ = function(prop) {
            return ObjectTemplate._getDefineProperty(prop, this.__template__);
        }

        this.__values__ = function (prop) {
            var defineProperty = this.__prop__(prop);
            return typeof(defineProperty.values) == 'function' ?
                defineProperty.values.call(this) :
                defineProperty.values;
        }

        this.__descriptions__ = function (prop) {
            var defineProperty = this.__prop__(prop);
            return typeof(defineProperty.descriptions) == 'function' ?
                defineProperty.descriptions.call(this) :
                defineProperty.descriptions;
        }
        // If we don't have an init function or are a remote creation call parent constructor otherwise call init
        // function who will be responsible for calling parent constructor to allow for parameter passing.
        if (this.fromRemote || !functionProperties.init || objectTemplate.noInit) {
            if (parentTemplate && parentTemplate.isObjectTemplate)
                parentTemplate.call(this);
        } else {
            if (functionProperties.init)
                functionProperties.init.apply(this, arguments);
        }

        this.__template__ = template;

        this.toJSONString = function(cb) {
            return ObjectTemplate.toJSONString(this, cb);
        }
        /* Clone and object calling a callback for each referenced object.
         The call back is passed (obj, prop, template)
         obj - the parent object (except the highest level)
         prop - the name of the property
         template - the template of the object to be created
         the function returns:
         - falsy - clone object as usual with a new id
         - object reference - the callback created the object (presumably to be able to pass init parameters)
         - [object] - a one element array of the object means don't copy the properties or traverse
         */
        this.createCopy = function(creator) {
            return ObjectTemplate.createCopy(this, creator);
        };

        function pruneExisting(obj, props) {
            var newProps = {};
            for (var prop in props)
                if (typeof(obj[prop]) == 'undefined')
                    newProps[prop] = props[prop];
            return newProps;
        }
    };

    template.prototype = templatePrototype;


    var createProperty = function (propertyName, propertyValue, properties, createProperties) {
        if (!properties) {
            properties = {};
            properties[propertyName] = propertyValue;
        }

        // record the initialization function
        if (propertyName == 'init' && typeof(properties[propertyName]) == 'function') {
            functionProperties.init = properties[propertyName];
        } else
        {
            var defineProperty = null;	// defineProperty to be added to defineProperties

            // Determine the property value which may be a defineProperties structure or just an initial value
            var descriptor = properties ? Object.getOwnPropertyDescriptor(properties, propertyName) : {};
            var type = descriptor.get || descriptor.set ? 'getset' : ((properties[propertyName] == null) ? 'null' : typeof(properties[propertyName]));
            switch (type) {

                // Figure out whether this is a defineProperty structure (has a constructor of object)
                case 'object': // or array
                    // Handle remote function calls
                    if (properties[propertyName].body && typeof(properties[propertyName].body) == "function") {
                        templatePrototype[propertyName] =
                            objectTemplate._setupFunction(propertyName, properties[propertyName].body, properties[propertyName].on, properties[propertyName].validate);
                        if (properties[propertyName].type)
                            templatePrototype[propertyName].__returns__ = properties[propertyName].type;
                        if (properties[propertyName].of) {
                            templatePrototype[propertyName].__returns__ = properties[propertyName].of;
                            templatePrototype[propertyName].__returnsarray__ = true;
                        }
                        break;
                        //var origin = properties[propertyName].constructor.toString().replace(/^function */m,'').replace(/\(.*/m,'');
                        //if (origin.match(/^Object/)) { // A defineProperty type definition
                    } else if (properties[propertyName].type) {
                        defineProperty = properties[propertyName];
                        properties[propertyName].writable = true;  // We are using setters
                        if (typeof(properties[propertyName].enumerable) == 'undefined')
                            properties[propertyName].enumerable = true;
                        break;
                    }

                case 'string':
                    defineProperty = {type: String, value: properties[propertyName], enumerable: true, writable: true, isLocal: true};
                    break;

                case 'boolean':
                    defineProperty = {type: Boolean, value: properties[propertyName], enumerable: true, writable: true, isLocal: true};
                    break;

                case 'number':
                    defineProperty = {type: Number, value: properties[propertyName], enumerable: true, writable: true, isLocal: true};
                    break;

                case 'function':
                    templatePrototype[propertyName] = objectTemplate._setupFunction(propertyName, properties[propertyName]);
                    break;

                case 'getset': // getters and setters
                    Object.defineProperty(templatePrototype, propertyName, descriptor);
                    break;
            }

            // If a defineProperty to be added
            if (defineProperty)
                objectTemplate._setupProperty(propertyName, defineProperty, objectProperties, defineProperties, parentTemplate, createProperties);
        }
    }

    // Walk through properties and construct the defineProperties hash of properties, the list of
    // objectProperties that have to be reinstantiated and attach functions to the prototype
    for (var propertyName in properties) {
        createProperty(propertyName, null, properties, createProperties);
    };

    template.defineProperties = defineProperties;
    template.objectProperties = objectProperties;
    template.getProperties = function(includeVirtual) {
        return ObjectTemplate._getDefineProperties(template, includeVirtual);
    }

    template.functionProperties = functionProperties;
    template.parentTemplate = parentTemplate;

    template.extend = function (p1, p2) {
        return objectTemplate.extend.call(objectTemplate, this, p1, p2);
    };
    template.mixin = function (p1, p2) {
        return objectTemplate.mixin.call(objectTemplate, this, p1, p2);
    };
    template.fromPOJO = function(pojo) {
        return objectTemplate.fromPOJO(pojo, template);
    };
    template.fromJSON = function(str, idPrefix) {
        return objectTemplate.fromJSON(str, template, idPrefix);
    };

    template.isObjectTemplate = true;
    template.createProperty = createProperty;

    template.props = {}
    var props = ObjectTemplate._getDefineProperties(template, true);
    for (var prop in props)
        template.props[prop] = props[prop];

    return template;
}
/**
 * Overridden by other Type Systems to cache or globally identify objects
 * Also assigns a unique internal Id so that complex structures with
 * recursive objects can be serialized
 *
 * @param obj - the object to be passed during creation time
 * @private
 */
ObjectTemplate._stashObject = function(obj, template)
{
    if (!obj.__id__) {
        if (!ObjectTemplate.nextId)
            ObjectTemplate.nextId = 1;
        obj.__id__ = "local-" + template.__name__ + "-" + ++ObjectTemplate.nextId;
        //obj.__id__ = ++ObjectTemplate.nextId;
    }
    return false;
};
/**
 * Overridden by other Type Systems to inject other elements
 *
 * @param obj - the object to be passed during creation time
 * @private
 */
ObjectTemplate._injectIntoObject = function(obj) {
};
/**
 * Overridden by other Type Systems to inject other elements
 *
 * @param obj - the object to be passed during creation time
 * @private
 */
ObjectTemplate._injectIntoTemplate = function(template){
};
/**
 * Overridden by other Type Systems to be able to create remote functions or
 * otherwise intercept function calls
 *
 * @param propertyName is the name of the function
 * @param propertyValue is the function itself
 * @return {*} a new function to be assigned to the object prototype
 * @private
 */
ObjectTemplate._setupFunction = function(propertyName, propertyValue) {
    return propertyValue;
};

/**
 * Used by template setup to create an property descriptor for use by the constructor
 *
 * @param propertyName is the name of the property
 * @param defineProperty is the property descriptor passed to the template
 * @param objectProperties is all properties that will be processed manually.  A new property is
 *                         added to this if the property needs to be initialized by value
 * @param defineProperties is all properties that will be passed to Object.defineProperties
 *                         A new property will be added to this object
 * @private
 */
ObjectTemplate._setupProperty = function(propertyName, defineProperty, objectProperties, defineProperties) {
    //determine whether value needs to be re-initialized in constructor
    var value   = defineProperty.value;
    var byValue = value && typeof(value) != 'number' && typeof(value) != 'string';
    if (byValue || !Object.defineProperties || defineProperty.get || defineProperty.set) {
        objectProperties[propertyName] = {
            init:	 defineProperty.value,
            type:	 defineProperty.type,
            of:		 defineProperty.of,
            byValue: byValue
        };
        delete defineProperty.value;
    }
    // When a super class based on objectTemplate don't transport properties
    defineProperty.toServer = false;
    defineProperty.toClient = false;
    defineProperties[propertyName] = defineProperty;

    // Add getters and setters
    if (defineProperty.get || defineProperty.set) {

        var userSetter = defineProperty.set;
        defineProperty.set = (function() {
            // use a closure to record the property name which is not passed to the setter
            var prop = propertyName;
            return function (value) {
                value = userSetter ? userSetter.call(this, value) : value;
                if (!defineProperty.isVirtual)
                    this["__" + prop] = value;
            }
        })();

        var userGetter = defineProperty.get
        defineProperty.get = (function () {
            // use closure to record property name which is not passed to the getter
            var prop = propertyName; return function () {
                return userGetter ? userGetter.call(this, defineProperty.isVirtual ? undefined : this["__"+prop]) : this["__"+prop];
            }
        })();

        if (!defineProperty.isVirtual)
            defineProperties['__' + propertyName] = {enumerable: false, writable: true};
        delete defineProperty.value;
        delete defineProperty.writable;

    }
};

/**
 *
 * Clone an object created from an ObjectTemplate
 * Used only within supertype (see copyObject for general copy)
 *
 * @param obj is the source object
 * @param template is the template used to create the object
 * @return {*} a copy of the object
 */
// Function to clone simple objects using ObjectTemplate as a guide
ObjectTemplate.clone = function (obj, template)
{
    if (obj instanceof Date)
        return new Date(obj.getTime());
    else if (obj instanceof Array) {
        var copy = [];
        for (var ix = 0; ix < obj.length; ++ix)
            copy[ix] = this.clone(obj[ix], template);
        return copy;
    } else if (template && obj instanceof template) {
        var copy = new template();
        for (var prop in obj) {
            if (prop != '__id__' && !(obj[prop] instanceof Function)) {
                var defineProperty = this._getDefineProperty(prop, template) || {};
                if (obj.hasOwnProperty(prop))
                    copy[prop] = this.clone(obj[prop], defineProperty.of || defineProperty.type || null);
            }
        }
        return copy;
    } else if (obj instanceof Object) {
        var copy =  {};
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop))
                copy[prop] = this.clone(obj[prop]);
        }
        return copy;
    } else
        return obj;
};
ObjectTemplate.createCopy = function (obj, creator) {
    return this.fromPOJO(obj, obj.__template__, null, null, undefined, null, null, creator);
};
ObjectTemplate.fromJSON = function (str, template, idQualifier)
{
    return this.fromPOJO(JSON.parse(str), template, null, null, idQualifier);
}
ObjectTemplate.fromPOJO = function (pojo, template, defineProperty, idMap, idQualifier, parent, prop, creator)
{
    function getId(id) {
        return typeof(idQualifier) != 'undefined' ? id + '-' + idQualifier : id
    };

    // For recording back refs
    if (!idMap)
        idMap = {};

    if (!pojo.__id__)
        return;

    if (creator) {
        var obj = creator(parent, prop, template, idMap[pojo.__id__.toString()], pojo.__transient__);
        //console.log ("creator returned " + obj + " on " + template.__name__ + "." + prop);
        if (obj instanceof Array) {
            obj = obj[0];
            idMap[obj.__id__.toString()] = obj;
            return obj;
        }
        if (!obj) {
            this.noInit = true;
            obj = new template();
            this.noInit = false;
        }
    } else
        var obj = this._createEmptyObject(template, getId(pojo.__id__.toString()), defineProperty, pojo.__transient__);
    idMap[getId(pojo.__id__.toString())] = obj;

    // Go through all the properties and transfer them to newly created object
    var props = obj.__template__.getProperties();
    for (var prop in props) {
        var value = pojo[prop];
        var defineProperty = props[prop];
        var type = defineProperty.type;
        if (type && pojo[prop] == null)
            obj[prop] = null;
        else if (type && typeof(pojo[prop]) != 'undefined')
            if (type == Array && defineProperty.of && defineProperty.of.isObjectTemplate) // Array of templated objects
            {
                obj[prop] = [];
                for (var ix = 0; ix < pojo[prop].length; ++ix)
                    obj[prop][ix] = pojo[prop][ix] ?
                        (pojo[prop][ix].__id__ && idMap[getId(pojo[prop][ix].__id__.toString())] ?
                            idMap[getId(pojo[prop][ix].__id__.toString())] :
                            this.fromPOJO(pojo[prop][ix], defineProperty.of, defineProperty, idMap, idQualifier, obj, prop, creator))
                        : null;
            }
            else if (type.isObjectTemplate) // Templated objects

                obj[prop] =	(pojo[prop].__id__ && idMap[getId(pojo[prop].__id__.toString())] ?
                    idMap[getId(pojo[prop].__id__.toString())] :
                    this.fromPOJO(pojo[prop], type,  defineProperty, idMap, idQualifier, obj, prop, creator));

            else if (type == Date)
                obj[prop] = pojo[prop] ? new Date(pojo[prop]) : null;
            else
                obj[prop] = pojo[prop];
    }
    if (!creator && pojo._id) // For the benefit of persistObjectTemplate
        obj._id = getId(pojo._id);

    function propXfer(prop) {
        if (pojo[prop])
            obj[prop] = pojo[prop];
    }
    if (!creator) {
        propXfer('__changed__');
        propXfer('__version__');
    }
    propXfer('__toServer__');
    propXfer('__toClient__');
    return obj;
};

/**
 * Abstract function for benefit of Semotus
 */
ObjectTemplate.withoutChangeTracking = function (cb) {
    cb();
}

/**
 * Convert an object to JSON, stripping any recursive object references so they can be
 * reconstituted later
 *
 * @param obj
 */
ObjectTemplate.toJSONString = function (obj, cb) {
    var idMap = [];
    try {
        return JSON.stringify(obj, function (key, value) {
            if (value && value.__template__ && value.__id__)
                if (idMap[value.__id__])
                    value = {__id__: value.__id__.toString()}
                else
                    idMap[value.__id__.toString()] = value;
            return cb ? cb(key, value) : value;
        });
    } catch (e) {
        throw e;
    }
}
/**
 * Find the right subclass to instantiate by either looking at the
 * declared list in the subClasses define property or walking through
 * the subclasses of the declared template
 *
 * @param template
 * @param objId
 * @param defineProperty
 * @returns {*}
 * @private
 */
ObjectTemplate._resolveSubClass = function (template, objId, defineProperty)
{
    var templateName = objId.match(/-([A-Za-z0-9_:]*)-/) ? RegExp.$1 : "";
    // Resolve template subclass for polymorphic instantiation
    if (defineProperty && defineProperty.subClasses && objId != "anonymous)") {
        if (templateName)
            for (var ix = 0; ix < defineProperty.subClasses.length; ++ix)
                if (templateName == defineProperty.subClasses[ix].__name__)
                    template = defineProperty.subClasses[ix];
    } else {
        var subClass = this._findSubClass(template, templateName);
        if (subClass)
            template = subClass;
    }
    return template;
}
/**
 * Walk recursively through extensions of template via __children__
 * looking for a name match
 *
 * @param template
 * @param templateName
 * @returns {*}
 * @private
 */
ObjectTemplate._findSubClass = function (template, templateName) {
    if (template.__name__ == templateName)
        return template;
    for (var ix = 0; ix < template.__children__.length; ++ix) {
        var subClass = this._findSubClass(template.__children__[ix], templateName);
        if (subClass)
            return subClass;
    }
    return null;
}
/**
 * Return the highest level template
 *
 * @param template
 * @returns {*}
 * @private
 */
ObjectTemplate._getBaseClass = function(template) {
    while(template.__parent__)
        template = template.__parent__
    return template;
}
/**
 * An overridable function used to create an object from a template and optionally
 * manage the caching of that object (used by derivative type systems).  It
 * preserves the original id of an object
 *
 * @param type of object
 * @param objId and id (if present)
 * @return {*}
 * @private
 */
ObjectTemplate._createEmptyObject = function(template, objId, defineProperty)
{
    template = this._resolveSubClass(template, objId, defineProperty);

    var oldStashObject = this._stashObject;
    if (objId)
        this._stashObject = function(){return true};
    var newValue = new template();
    this._stashObject = oldStashObject;
    if (objId)
        newValue.__id__ = objId;
    return newValue;
};

/**
 * Looks up a property in the defineProperties saved with the template cascading
 * up the prototype chain to find it
 *
 * @param prop is the property being sought
 * @param template is the template used to create the object containing the property
 * @return {*} the "defineProperty" structure for the property
 * @private
 */
ObjectTemplate._getDefineProperty = function(prop, template)
{
    return	template && (template != Object) && template.defineProperties && template.defineProperties[prop] ?
        template.defineProperties[prop] :
        template && template.parentTemplate ?
            this._getDefineProperty(prop, template.parentTemplate) :
            null;
};
/**
 * returns a hash of all properties including those inherited
 *
 * @param template is the template used to create the object containing the property
 * @return {*} an associative array of each "defineProperty" structure for the property
 * @private
 */
ObjectTemplate._getDefineProperties = function(template, returnValue, includeVirtual)
{
    if (!returnValue)
        returnValue = {};

    if (template.defineProperties)
        for (var prop in template.defineProperties)
            if (includeVirtual || !template.defineProperties[prop].isVirtual)
                returnValue[prop] = template.defineProperties[prop]
    if (template.parentTemplate)
        this._getDefineProperties(template.parentTemplate, returnValue, includeVirtual);

    return returnValue;
};
/**
 * A function to clone the Type System
 * @return {F}
 * @private
 */
ObjectTemplate._createObject = function () {

    function F() {}
    F.prototype = this;
    var newF =  new F();
    newF.init();
    return newF;
};


ObjectTemplate.createLogger = function (context) {
    var levelToStr = {60: 'fatal', 50: 'error', 40: 'warn', 30: 'info', 20: 'debug', 10: 'trace'};
    var strToLevel = {'fatal':60, 'error':50, 'warn':40, 'info':30, 'debug':20, 'trace':10};
    return createLogger(context);

    // return a new logger object that has our api and a context
    function createLogger () {
        var logger = {
            context: {},
            granularLevels: {},
            level: 'info',
            log: log,
            fatal: function () {this.log.apply(this, [60].concat(Array.prototype.slice.call(arguments)))},
            error: function () {this.log.apply(this, [50].concat(Array.prototype.slice.call(arguments)))},
            warn: function () {this.log.apply(this, [40].concat(Array.prototype.slice.call(arguments)))},
            info: function () {this.log.apply(this, [30].concat(Array.prototype.slice.call(arguments)))},
            debug: function () {this.log.apply(this, [20].concat(Array.prototype.slice.call(arguments)))},
            trace: function () {this.log.apply(this, [10].concat(Array.prototype.slice.call(arguments)))},
            setLevel: setLevel,
            sendToLog: sendToLog,
            formatDateTime: formatDateTime,
            split: split,
            startContext: startContext,
            setContextProps: setContextProps,
            clearContextProps: clearContextProps,
            createChildLogger: createChildLogger,
            prettyPrint: prettyPrint
        }
        return logger;
    }

    // Parse log levels such as warn.activity
    function setLevel(level) {
        var levels = level.split(';');
        for (var ix = 0; ix < levels.length; ++ix) {
            var level = levels[ix];
            if (level.match(/:/)) {
                if (levels[ix].match(/(.*):(.*)/)) {
                    this.granularLevels[RegExp.$1] = this.granularLevels[RegExp.$1] || {}
                    this.granularLevels[RegExp.$1] = RegExp.$2;
                } else
                    this.level = levels[ix];
            } else
                this.level = level;
        }
    }

    // Logging is enabled if either the level threshold is met or the granular level matches
    function isEnabled(level, obj) {
        level = strToLevel[level];
        if (level >= strToLevel[this.level])
            return true;
        if (this.granularLevels)
            for (var level in this.granularLevels)
                if (obj[level] && obj[level] == this.granularLevels[level])
                    return true;
    }

    // log all arguments assuming the first one is level and the second one might be an object (similar to banyan)
    function log () {
        var msg = "";
        var obj = {time: (new Date()).toISOString(), msg: ""};
        for (var prop in this.context)
            obj[prop] = this.context[prop];
        for (var ix = 0; ix < arguments.length; ++ix) {
            var arg = arguments[ix]
            if (ix == 0)
                obj.level = arg;
            else if (ix == 1 && isObject(arg))
                for (var prop in arg)
                    obj[prop] = arg[prop];
            else
                msg += arg + " ";
        }
        obj.msg += obj.msg.length ? " " : "";
        if (msg.length)
            obj.msg += (obj.module && obj.activity ? obj.module + '[' + obj.activity + '] - ' : '') + msg;
        else if (obj.module && obj.activity)
            obj.msg += obj.module + '[' + obj.activity + ']';


        if (isEnabled.call(this, levelToStr[obj.level], obj))
            this.sendToLog(levelToStr[obj.level], obj);
        function isObject(obj) {
            return obj != null && typeof(obj) == 'object' && !(obj instanceof Array) &&
                !(obj instanceof Date) && !(obj instanceof Error)
        }
    }

    function startContext (context) {
        this.context = context;
    }

    // Save the properties in the context and return a new object that has the properties only so they can ber cleared
    function setContextProps (context) {
        reverse = {}
        for (var prop in context) {
            reverse[prop] = true;
            this.context[prop] = context[prop];
        }
        return reverse;
    }

    // Remove any properties recorded by setContext
    function clearContextProps(contextToClear) {
        for (var prop in contextToClear)
            delete this.context[prop];
    }

    // Create a new logger and copy over it's context
    function createChildLogger(context) {
        var child = {};
        for (var prop in this)
            child[prop] = this[prop];
        child.context = context || {};
        for (var prop in this.context)
            child.context[prop] = this.context[prop];
        return child;
    }

    function formatDateTime(date) {
        var str =  f(2, (date.getMonth() + 1), '/') + f(2, date.getDate(), '/') + f(4, date.getFullYear(), " ") +
            f(2, date.getHours(), ':') + f(2, date.getMinutes(), ':') + f(2, date.getSeconds(), ':') +
            f(3, date.getMilliseconds()) + ' GMT' + (0 - date.getTimezoneOffset() / 60);
        return str
        function f(z, d, s) {
            while ((d + "").length < z)
                d = '0' + d;
            return d + (s || '');
        }
    }

    function sendToLog(level, json) {
        console.log(this.prettyPrint(level, json));
    }

    function prettyPrint(level, json) {
        var split = this.split(json, {time: 1, msg: 1, level: 1, name: 1});
        var logOutput = this.formatDateTime(new Date(json.time)) + ": " + level.toUpperCase() + ': ' +  o(split[1].name, ': ') + o(split[1].msg, ': ') + xy(split[0]);
        var levelColors = {
            fatal: 'red',
            error: 'red',
            warn: 'yellow',
            info: 'green',
            debug: 'cyan',
            trace: 'cyan'
        };

        var levelColor = levelColors[level];

        if (chalk && levelColor) {
            return chalk[levelColor](logOutput);
        } else {
            return logOutput;
        }

        function o (s, d) {
            return s ? s + d : ''
        }
        function xy(j) {
            var str = '';
            var sep = '';
            for (var prop in j) {
                str += sep + prop + '=' + JSON.stringify(j[prop]);
                sep = ' ';
            }
            return str.length > 0 ? '(' + str + ')' : '';
        }
    }

    function split (json, props) {
        var a = {};
        var b = {};
        for (var prop in json)
            (props[prop] ? b : a)[prop] = json[prop];
        return [a, b];
    }

}

ObjectTemplate.init();

if (typeof(module) != 'undefined')
    module.exports = ObjectTemplate;
