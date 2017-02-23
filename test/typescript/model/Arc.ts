import {Supertype, supertypeClass, property} from '../../../index';
import {BaseTemplate} from './BaseTemplate';

@supertypeClass
export class Ark extends Supertype
{
    @property({type: BaseTemplate})
    animals: Array<BaseTemplate> = [];
    board (animal) {
        animal.ark = this;
        this.animals.push(animal);
    }
};
