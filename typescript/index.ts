// import 'reflect-metadata';

function getTemplateProperties(props) {
    let templateProperties = {
        __toClient__: processProp(props.toClient, this.toClientRuleSet) != false,
        __toServer__: processProp(props.toServer, this.toServerRuleSet) != false
    }

    // if (ObjectTemplate.__toClient__ == false) {
    //     props.toClient = false;
    // }

    if (processProp(props.isLocal, this.isLocalRuleSet)) {
        props.toServer = false;
        props.toClient = false;
    }

    // templateProperties.__toClient__ = processProp(props.toClient, this.toClientRuleSet) != false;
    // templateProperties.__toServer__ = processProp(props.toServer, this.toServerRuleSet) != false;

    return templateProperties;

/**
 * Allow the property to be either a boolean a function that returns a boolean or a string
 * matched against a rule set array of string in ObjectTemplate
 *
 * @param {unknown} prop unknown
 * @param {unknown} ruleSet unknown
 *
 * @returns {function(this:ObjectTemplate)}
 */
    function processProp(prop, ruleSet) {
        var ret = null;

        // if (typeof(prop) === 'function') {
        //     ret = prop.call(ObjectTemplate);
        // }
        // else
        if (typeof(prop) === 'string') {
            ret = false;

            if (ruleSet) {
                ruleSet.map(function i(rule) {
                    if (!ret) {
                        ret = rule == prop;
                    }
                });
            }
        }
        else if (prop instanceof Array) {
            prop.forEach(function h(prop) {
                ret = ret || processProp(prop, ruleSet);
            });
        }
        else {
            ret = prop;
        }

        return ret;
    }
}

function _getDefineProperties(template, returnValue, includeVirtual)  {
    if (!returnValue) {
        returnValue = {};
    }

    if (template.defineProperties) {
        for (var prop in template.defineProperties) {
            if (includeVirtual || !template.defineProperties[prop].isVirtual) {
                returnValue[prop] = template.defineProperties[prop];
            }
        }
    }

    if (template.parentTemplate) {
        this._getDefineProperties(template.parentTemplate, returnValue, includeVirtual);
    }

    return returnValue;
};

function getClasses () {
    if (this.__templates__) {
        for (var ix = 0; ix < this.__templates__.length; ++ix) {
            var template = this.__templates__[ix];
            this.__dictionary__[constructorName(template)] = template;
            this.__templatesToInject__[constructorName(template)] = template;
            processDeferredTypes(template);
        }
        this.__templates__ = undefined;
        for (var templateName1 in this.__dictionary__) {
            var template = this.__dictionary__[templateName1];
            var parentTemplateName = constructorName(Object.getPrototypeOf(template.prototype).constructor);
            template.__shadowParent__ = this.__dictionary__[parentTemplateName];
            if (template.__shadowParent__) {
                template.__shadowParent__.__shadowChildren__.push(template);
            }
            template.props = {};
            var propst = _getDefineProperties(template, undefined, true);
            for (var propd in propst) {
                template.props[propd] = propst[propd];
            }
        }
        if (this.__exceptions__) {
            throw new Error(this.__exceptions__.map(createMessageLine).join('\n'));
        }
    }
    function createMessageLine (exception) {
        return exception.func(exception.class(), exception.prop);
    }
    function processDeferredTypes(template) {
        if (template.prototype.__deferredType__) {
            for (var prop in template.prototype.__deferredType__) {
                var defineProperty = template.defineProperties[prop];
                if (defineProperty) {
                    var type = template.prototype.__deferredType__[prop]();
                    if (defineProperty.type === Array) {
                        defineProperty.of = type;
                    }
                    else {
                        defineProperty.type = type;
                    }
                }
            }
        }
    }
    return this.__dictionary__;

    function constructorName(constructor) {
        var namedFunction = constructor.toString().match(/function ([^(]*)/);
        return namedFunction ? namedFunction[1] : null;
    }

}

function supertypeClass(opts: any): any {
    if (opts.prototype) {
        return decorator(opts);
    }

    return decorator;

    function decorator(ctor: Function) {
        ctor.prototype.__template__ = ctor;
        ctor.prototype.amorphicClass = ctor;
        ctor.prototype.amorphicGetClassName = function () { return ctor['__name__'] };
        ctor['isObjectTemplate'] = true;
        ctor['__injections__'] = [];

        let createProps = getTemplateProperties(opts);
        ctor['__toClient__'] = createProps.__toClient__;
        ctor['__toServer__'] = createProps.__toServer__;
        ctor['__shadowChildren__'] = [];

        Supertype.__templates__ = Supertype.__templates__ || [];
        Supertype.__templates__.push(ctor);

        Object.defineProperty(ctor, 'defineProperties', {get: defineProperties});
        Object.defineProperty(ctor, 'amorphicProperties', {get: defineProperties});
        Object.defineProperty(ctor, '__name__', {get: getName});
        Object.defineProperty(ctor, 'amorphicClassName', {get: getName});
        Object.defineProperty(ctor, 'parentTemplate', {get: getParent});
        Object.defineProperty(ctor, '__parent__', {get: getParent});
        Object.defineProperty(ctor, '__children__', {get: getChildren});
        Object.defineProperty(ctor, 'amorphicParentClass', {get: getParent});
        Object.defineProperty(ctor, 'amorphicChildClasses', {get: getChildren});
        Object.defineProperty(ctor, 'amorphicStatic', {get: function () {return Supertype}});


        function defineProperties() {
            return ctor.prototype.__amorphicprops__;
        }
        function getName () {
            return ctor.toString().match(/function ([^(]*)/)[1];
        }
        function getDictionary () {
            getClasses();
        }
        function getParent () {
            getDictionary();
            return ctor['__shadowParent__'];
        }
        function getChildren () {
            getDictionary();
            return ctor['__shadowChildren__'];
        }
    }
}

class Supertype {
    // Static Members that child needs
    static __injections__: object;
    static isObjectTemplate: boolean = false;
    static __toClient__: boolean;
    static __toServer__: boolean;
    static __shadowChildren__: object;

    // Static Member that is necessary for Supertype
    static __templates__: Array<Supertype>;

}

@supertypeClass
class testClass extends Supertype {
    constructor() {
        super();
    }
}

@supertypeClass({toClient: false})
class testClass2 extends Supertype {
    constructor() {
        super();
    }
}

let instantiatedClass = new testClass();
console.log(testClass);
console.log(testClass.__toClient__);
console.log(testClass2.__toClient__);