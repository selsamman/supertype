// import 'reflect-metadata';
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
function getTemplateProperties(props) {
    var templateProperties = {
        __toClient__: processProp(props.toClient, this.toClientRuleSet) != false,
        __toServer__: processProp(props.toServer, this.toServerRuleSet) != false
    };
    console.log(templateProperties);
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
        if (typeof (prop) === 'string') {
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
function _getDefineProperties(template, returnValue, includeVirtual) {
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
}
;
function getClasses() {
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
    function createMessageLine(exception) {
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
function supertypeClass(opts) {
    if (opts.prototype) {
        return decorator(opts);
    }
    return decorator;
    function decorator(ctor) {
        ctor.prototype.__template__ = ctor;
        ctor.prototype.amorphicClass = ctor;
        ctor.prototype.amorphicGetClassName = function () { return ctor['__name__']; };
        ctor['isObjectTemplate'] = true;
        ctor['__injections__'] = [];
        var createProps = getTemplateProperties(ctor);
        ctor['__toClient__'] = createProps.__toClient__;
        ctor['__toServer__'] = createProps.__toServer__;
        ctor['__shadowChildren__'] = [];
        Supertype.__templates__ = Supertype.__templates__ || [];
        Supertype.__templates__.push(ctor);
        Object.defineProperty(ctor, 'defineProperties', { get: defineProperties });
        Object.defineProperty(ctor, 'amorphicProperties', { get: defineProperties });
        Object.defineProperty(ctor, '__name__', { get: getName });
        Object.defineProperty(ctor, 'amorphicClassName', { get: getName });
        Object.defineProperty(ctor, 'parentTemplate', { get: getParent });
        Object.defineProperty(ctor, '__parent__', { get: getParent });
        Object.defineProperty(ctor, '__children__', { get: getChildren });
        Object.defineProperty(ctor, 'amorphicParentClass', { get: getParent });
        Object.defineProperty(ctor, 'amorphicChildClasses', { get: getChildren });
        Object.defineProperty(ctor, 'amorphicStatic', { get: function () { return Supertype; } });
        function defineProperties() {
            return ctor.prototype.__amorphicprops__;
        }
        function getName() {
            return ctor.toString().match(/function ([^(]*)/)[1];
        }
        function getDictionary() {
            getClasses();
        }
        function getParent() {
            getDictionary();
            return ctor['__shadowParent__'];
        }
        function getChildren() {
            getDictionary();
            return ctor['__shadowChildren__'];
        }
    }
}
var Supertype = (function () {
    function Supertype() {
    }
    return Supertype;
}());
Supertype.isObjectTemplate = false;
var testClass = (function (_super) {
    __extends(testClass, _super);
    function testClass() {
        return _super.call(this) || this;
    }
    return testClass;
}(Supertype));
testClass = __decorate([
    supertypeClass,
    __metadata("design:paramtypes", [])
], testClass);
var testClass2 = (function (_super) {
    __extends(testClass2, _super);
    function testClass2() {
        return _super.call(this) || this;
    }
    return testClass2;
}(Supertype));
testClass2 = __decorate([
    supertypeClass({ toClient: false }),
    __metadata("design:paramtypes", [])
], testClass2);
var instantiatedClass = new testClass();
console.log(testClass);
console.log(testClass.__toClient__);
console.log(testClass2.__toClient__);
//# sourceMappingURL=index.js.map