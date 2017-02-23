import {Supertype, supertypeClass, property} from '../../../index';
import {Ark} from './Arc';

@supertypeClass
export class BaseTemplate extends Supertype
{
    name: string;
    isMammal: boolean = true;
    legs: Number = 2;
    @property({type: () => {return Ark}})
    ark:    Ark;
};
