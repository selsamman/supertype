import {Supertype, supertypeClass, property} from '../../../index';
import {BaseTemplate} from './BaseTemplate';

@supertypeClass
export class Bear extends BaseTemplate
{
    constructor () {
        super();
        this.name = 'Bear';
    };
    canHug () {
        return true;
    }
};
