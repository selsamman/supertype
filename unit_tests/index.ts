import {expect, assert} from 'chai';
import * as sinon from 'sinon';

import {property, Supertype, supertypeClass} from '../index.js';

describe('supertype', function() {
    describe('getClasses', function() {
        it('should be able to return all the classes that have been declared with the decorator @supertypeClass', function() {
            @supertypeClass
            class Base extends Supertype {};

            @supertypeClass
            class Test extends Supertype {};

            const baseInstantiated = new Base();
            const result = baseInstantiated.amorphic.getClasses();

            expect(result['Base']).to.deep.equal(Base);
            expect(result['Test']).to.deep.equal(Test);
        });
    });

    describe('@supertypeClass', function () {
        it('should setup a supertype class since the class is passed through the decorator function', function() {
            @supertypeClass
            class Test2 extends Supertype {};

            console.log(Test2);
            assert(Test2.isObjectTemplate);
            expect(Test2.__injections__).to.be.an('array');

        });
    });
});