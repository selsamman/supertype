const expect = require('chai').expect;
const assert = require('chai').assert;
const sinon = require('sinon');

const supertype = require('../index.js');

describe('supertype', function () {
    describe('init', function () {
        it('should set initialization values on the supertype object', function () {
            const loggerInstance = {logger: 'logger'};
            const createLoggerStub = sinon.stub(supertype, 'createLogger');
            createLoggerStub.returns(loggerInstance);
            supertype.init();

            expect(supertype.__templateUsage__).to.be.an('object').that.is.empty;
            expect(supertype.__injections__).to.be.an('array').that.is.empty;
            expect(supertype.__dictionary__).to.be.an('object').that.is.empty;
            expect(supertype.__anonymousId__).to.equal(1);
            expect(supertype.__templatesToInject__).to.be.an('object').that.is.empty;
            assert(createLoggerStub.called);
            expect(supertype.logger).to.deep.equal(loggerInstance);
        });
    });
    describe('getTemplateByName', function (){
        it('should look up a template by name', function () {
            const getClassesStub = sinon.stub(supertype, 'getClasses');
            const classes = {
                'test': 'testClass'
            };
            getClassesStub.returns(classes);

            const result = supertype.getTemplateByName('test');
            expect(result).to.equal('testClass');
        });
    });
});