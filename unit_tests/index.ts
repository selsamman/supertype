import {expect, assert} from 'chai';
import * as sinon from 'sinon';

import {property, Supertype, supertypeClass} from '../index.js';
import * as ObjectTemplate from '../index.js';

describe('Supertype', function() {
    describe('base class', function() {
        it('should have all the functionality the base class should have', function() {
            @supertypeClass
            class Base extends Supertype {
                static new() {
                    return new Base().init();
                }
                init() {
                    return this;
                }
            };

            const baseInstantiated = new Base;

            assert(!baseInstantiated.amorphicLeaveEmpty);
            expect(baseInstantiated.__id__).to.be.a('string');
            expect(baseInstantiated.amorphic).to.deep.equal(ObjectTemplate);
        });
    });
    describe('test', function() {
        it('should setup a supertype class since the class is passed through the decorator function', function() {
            @supertypeClass
            class Test2 extends Supertype {
                init() {
                    return this;
                }
            };

            assert(Test2.isObjectTemplate);
            expect(Test2.__injections__).to.be.an('array');
            expect(Test2.fromPOJO).to.be.a('function');
            expect(Test2.amorphicFromJSON).to.be.a('function');
            expect(Test2.fromJSON).to.be.a('function');
            expect(Test2.amorphicGetProperties).to.be.a('function');
            expect(Test2.amorphicCreateProperty).to.be.a('function');
            assert(Test2.__toClient__);
            assert(Test2.__toServer__);
            expect(Test2.__shadowChildren__).to.be.an('array');
        });
    });

    describe('.amorphicToJSON', () => {
        let baseInstance, anotherInstance;
        before(() => {
            @supertypeClass
            class Another extends Supertype {
                static new() {
                    return new Another().init();
                }
                init() {
                    return this;
                }
            };

            @supertypeClass

            class Base extends Supertype {
                @property()
                __objectTemplate__ = 'notNull';

                @property()
                another: Another;
                @property()
                another2: Another;
                static new(another: Another) {
                    return new Base().init(another);
                }
                init(another: Another) {
                    this.another = another;
                    this.another2 = another;
                    return this;
                }
            };

            anotherInstance = Another.new();
            baseInstance = Base.new(anotherInstance);
        });

        it('should return base json with 6 expected properties', () => {
            const jsonBlob = JSON.parse(baseInstance.amorphicToJSON());
            expect(jsonBlob).to.have.property('__id__');
            expect(jsonBlob).to.have.property('amorphicLeaveEmpty');
            expect(jsonBlob).to.have.property('amorphic', null);
            expect(jsonBlob).to.have.property('__objectTemplate__', null);
            expect(jsonBlob.another.__id__).to.be.equal(jsonBlob.another2.__id__);
            expect(Object.keys(jsonBlob).length).to.equal(6);
        });

        it('should return base json with 6 expected properties and corresponding values', () => {
            // Callback is funky for this. first pass passes the whole json blob as value, with key string and length === 0,
            // '__objectTemplate___' and 'amorphic properties always return null
            // @TODO: come back and redo the callback implementation so it works as intended not this way
            const callback = (key, value) => (typeof key === 'string' && key.length > 0) ? key : value;
            const jsonBlob = JSON.parse(baseInstance.amorphicToJSON(callback));

            expect(jsonBlob).to.have.property('__id__', '__id__');
            expect(jsonBlob).to.have.property('amorphicLeaveEmpty', 'amorphicLeaveEmpty');
            expect(jsonBlob).to.have.property('amorphic', null);
            expect(jsonBlob).to.have.property('__objectTemplate__', null);
            expect(jsonBlob).to.have.property('another2', 'another2');
            expect(jsonBlob).to.have.property('another', 'another');
            expect(Object.keys(jsonBlob).length).to.equal(6);
        });

        it('should throw a new error', () => {
            const callback = (key, value) => {throw new Error('MochaError')};
            expect(() => baseInstance.amorphicToJSON(callback)).to.throw(Error, 'MochaError');
        });
    });
});