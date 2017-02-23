import {Supertype, supertypeClass, property} from '../../../index';
import {BaseTemplate} from './BaseTemplate';

@supertypeClass
export class Lion extends BaseTemplate
{
    constructor () {
        super();
        this.name = 'Lion';
        this.legs = 4;
    };
    canRoar () {
        return true;
    }
};