import {expect, assert} from 'chai';
import * as sinon from 'sinon';

import {property, Supertype, supertypeClass} from '../index.js';

describe('supertype', function() {
    describe('base class', function() {
        it('should have all the functionality the base class should have', function() {
            @supertypeClass
            class Base extends Supertype {};

            const baseInstantiated = new Base;
            console.log(Object.keys(baseInstantiated))
        });
    });
});