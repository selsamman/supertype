export class Supertype {
    constructor ()
    static fromJSON (json: string)
    static getFromPersistWithId(id?, cascade?, isTransient?, idMap?, isRefresh?, logger?)
    static getFromPersistWithQuery(query, cascade?, start?, limit?, isTransient?, idMap?, options?, logger?)
    static deleteFromPersistWithQuery (query, txn?, logger?)
    static deleteByQuery(query, options)
    static deleteFromPersistWithId (id, txn?, logger?)
    static countFromPersistWithQuery(query?, logger?)
    static fetchByQuery (query, options)
    static deleteFromPersistWithId(id, txn?, logger?)
    static getTableName(alias)
    static getParentKey(prop, alias?)
    static getPrimaryKey(alias?)
    static getChildKey(prop, alias?)
    static getTableName()
    static getKnex()
    static isKnex()
    static knexParentJoin(targetTemplate, primaryAlias, targetAlias, joinKey)
    static knexChildJoin(targetTemplate, primaryAlias, targetAlias, joinKey)
    static createProperty(prop : String, defineProperty: Object)
    static getProperties()
    _id: Object;
    __id__: String;
    __empty__: boolean;

    toJSONString()

    setDirty()
    cascadeSave(any)

    persistSave (txn?, logger?)
    persistTouch (txn?, logger?)
    persistDelete (txn?, logger?)
    setDirty (txn?, onlyIfChanged?, cascade?, logger?)
    isStale ()
    fetchProperty (prop, cascade?, queryOptions?, isTransient?, idMap?, logger?)
    fetch(cascade, isTransient, idMap, logger)
    fetchReferences(options)
    refresh (logger?)
    persist (options)
}
export function remote(props?);
export function property(props?: Object);
export function supertypeClass(target?: Function);