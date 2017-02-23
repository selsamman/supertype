import {Supertype, supertypeClass, property} from '../../../index';
import {Ark} from './Arc';
import "reflect-metadata";


@supertypeClass
export class BaseTemplate extends Supertype
{
    name: string;
    isMammal: boolean = true;
    legs: Number = 2;
    @property({})
    ark:    Ark;
};
