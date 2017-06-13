import {expect} from 'chai';
import * as mocha from 'mocha';

class Base {
    myVar: string = 'Base';
    constructor () {
        expect (this.myVar).to.equal('Base');
        this.setup();
    }
    setup () {}
};

class Child extends Base {
    myVar: string = 'Child';
    myArray: Array<string> = [];
    constructor () {
        super();
    }
    setup () {
        expect(this.myArray).to.equal(undefined);
    }
};

it('child properties not accessible to parent during constructor', function() {
    var child = new Child();
});