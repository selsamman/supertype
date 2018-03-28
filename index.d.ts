type Constructable = new (...args: any[]) => {};


export class SupertypeLogger {
    context: any;
    granularLevels: any;
    level: any;
    log (level : number, ...data : any[]);
    fatal (...data : any[]) : void;
    error (...data : any[]) : void;
    warn (...data : any[]) : void;
    info (...data : any[]) : void;
    debug (...data : any[]) : void;
    trace (...data : any[]) : void;
    setLevel(number) : void;
    startContext(context : any) : void;
    setContextProps(context : any) : void;
    clearContextProps(context : any) : void;
    createChildLogger(context : any) : SupertypeLogger;
    prettyPrint(level : number, ...data : any[]) : string;

    // for overriding
    sendToLog: Function;
    formatDateTime: Function;
}

export class SupertypeSession {
    logger: SupertypeLogger
    __dictionary__ : any;
    getClasses() : any;
}

export class amorphicStatic extends SupertypeSession {}

export abstract class Supertype {

    constructor ()
    amorphic : SupertypeSession;

    // Class members (static)
    static isObjectTemplate: boolean;
    static __toServer__: boolean;
    static __toClient__: boolean;
    static amorphicCreateProperty(prop: string, defineProperty: object)
    static amorphicGetProperties(includeVirtualProperties?: boolean)
    static amorphicProperties: any;
    static amorphicChildClasses: Array<Constructable>;
    static amorphicParentClass: Constructable;
    static amorphicFromJSON(json: string)
    static amorphicClassName: string;
    static amorphicStatic: SupertypeSession;
    static fromPOJO (pojo: object);
    static __injections__: any;

    // Deprecated legacy naming (static)
    static createProperty(prop: string, defineProperty: object);
    static getProperties(includeVirtualProperties?: boolean);
    static __children__: Array<Constructable>;
    static __parent__: Constructable;
    static fromJSON (json: string, idPrefix?: string);
    static inject(injector: any);
    createCopy(callback: Function);
    copyProperties(obj: any);
    abstract init(...args);
    toJSONString();
    __props__();
    __descriptions__(prop: string);
    __values__(prop: string);
    amorphicClass: this;
    amorphicGetClassName (): string;

    // Object members
    __id__: string;
    __template__ : this;
    amorphicLeaveEmpty: boolean;
    amorphicToJSON(callback?: Function): string;
    amorphicGetPropertyDefinition(propertyName: string);
    amorphicGetPropertyValues(propertyName: string);
    amorphicGetPropertyDescriptions(propertyName: string);

}
export function property(props?: object);
export function supertypeClass(target?: any);
export function performInjections();
