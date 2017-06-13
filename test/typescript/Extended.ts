import {Supertype, supertypeClass, property} from '../../index';
import {expect} from 'chai';
import * as mocha from 'mocha';
import {Lion} from "./model/Lion";
import {Bear} from "./model/Bear";
import {Animal} from "./model/Animal";
import {amorphicStatic} from "../../index";

@supertypeClass
class AnimalContainer extends Supertype {
    @property({getType:() => Animal} )
    containee: Animal;
}

@supertypeClass
class LionContainer extends AnimalContainer {
    @property({getType:() => Lion})
    containee: Lion;
}

describe('AnimalContainer', function () {
    it ('has proper types', function () {
        expect(AnimalContainer.amorphicProperties.containee.type).to.equal(Animal);
        expect(LionContainer.amorphicProperties.containee.type).to.equal(Lion);
    });
});
