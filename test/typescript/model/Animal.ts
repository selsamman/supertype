import {Supertype, supertypeClass, property} from '../../../index';
import {Ark} from './Arc';

@supertypeClass
export class Animal extends Supertype
{
    name: string;
    @property()
    isMammal: boolean = true;
    legs: Number = 2;

    hasDNA () {
        return true;
    }
    
    @property({getType: () => {return Ark}})
    ark:    Ark;
};
