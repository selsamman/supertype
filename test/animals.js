var expect = require('chai').expect;
var Q = require("q");
var ObjectTemplate = require('../index.js');
var chalk = require('chalk');

/* Teacher Student Example */

BaseTemplate = ObjectTemplate.create("BaseTemplate",
{
	name: {type: String},
	isMammal: {type: Boolean, value: true},
	legs: {type: Number}
});
BaseTemplate.mixin({
	legs: {type: Number, value: 2} // Make sure duplicate props work
});
Lion = BaseTemplate.extend("Lion",
{
	init: function () {
		BaseTemplate.call(this);
		this.name = "Lion";
		this.legs = 4;
	},
	canRoar: function () {return true},
});

Bear = BaseTemplate.extend("Bear",
{
	init: function () {
		BaseTemplate.call(this);
		this.name = "Bear";
	},
	canHug: function () {return true}
});

Ark = ObjectTemplate.create("Ark",
{
	animals: {type: Array, of: BaseTemplate, value: []},
	board: function (animal) {
		animal.ark = this;
		this.animals.push(animal)
	}
});
BaseTemplate.mixin(
{
	ark:    {type: Ark}
});

describe("Freeze Dried Arks", function () {

	var ark1;
	var ark2;

	it ("create the arc", function (done) {
		ark1 = new Ark();
		ark1.board(new Lion());
		ark1.board(new Bear());
		ark2 = new Ark();
		ark2.board(new Lion());
		ark2.board(new Bear());
		expect(ark1.animals[0].canRoar()).to.equal(true);
		expect(ark1.animals[1].canHug()).to.equal(true);
		expect(ark1.animals[0].legs).to.equal(4);
		expect(ark1.animals[1].legs).to.equal(2);
		expect(ark1.animals[0].ark instanceof Ark).to.equal(true);
		expect(ark1.animals[1].ark instanceof Ark).to.equal(true);

		expect(ark2.animals[0].canRoar()).to.equal(true);
		expect(ark2.animals[1].canHug()).to.equal(true);
		expect(ark2.animals[0].legs).to.equal(4);
		expect(ark2.animals[1].legs).to.equal(2);
		expect(ark2.animals[0].ark instanceof Ark).to.equal(true);
		expect(ark2.animals[1].ark instanceof Ark).to.equal(true);

		done();
	});

	it ("save and restore the arc", function (done)
	{
		var serialArk1 = ark1.toJSONString();
		var serialArk2 = ark2.toJSONString();

		ark1 = Ark.fromJSON(serialArk1);
		expect(ark1.animals[0].canRoar()).to.equal(true);
		expect(ark1.animals[1].canHug()).to.equal(true);
		expect(ark1.animals[0].legs).to.equal(4);
		expect(ark1.animals[1].legs).to.equal(2);
		expect(ark1.animals[0].ark instanceof Ark).to.equal(true);
		expect(ark1.animals[1].ark instanceof Ark).to.equal(true);

		ark2 = Ark.fromJSON(serialArk2);
		expect(ark2.animals[0].canRoar()).to.equal(true);
		expect(ark2.animals[1].canHug()).to.equal(true);
		expect(ark2.animals[0].legs).to.equal(4);
		expect(ark2.animals[1].legs).to.equal(2);
		expect(ark2.animals[0].ark instanceof Ark).to.equal(true);
		expect(ark2.animals[1].ark instanceof Ark).to.equal(true);

		done();
	});

	it ("can log", function () {
		var date = new Date('11/11/2010');
		var output = '';
		ObjectTemplate.logger.sendToLog = function (level, obj) {
				obj.time = date;
				var str = ObjectTemplate.logger.prettyPrint(level, obj);
				console.log(str);
				output += str;
		}
		ObjectTemplate.logger.startContext({name: 'supertype'})
		ObjectTemplate.logger.warn({foo: "bar1"}, "Yippie");
		var context = ObjectTemplate.logger.setContextProps({permFoo: 'permBar1'});
		ObjectTemplate.logger.warn({foo: "bar2"});
		ObjectTemplate.logger.clearContextProps(context);
		ObjectTemplate.logger.warn({foo: "bar3"});
		var child = ObjectTemplate.logger.createChildLogger({name: 'supertype_child'});
		child.setContextProps({permFoo: 'childFoo'});
		child.warn({'foo': 'bar4'})
		ObjectTemplate.logger.warn({foo: "bar5"});
		ObjectTemplate.logger.startContext({name: 'supertype2'});
		ObjectTemplate.logger.warn({foo: "bar6", woopie: {yea: true, oh: date}}, "hot dog");
		ObjectTemplate.logger.setLevel('error');
		console.log('setting level to error');
		ObjectTemplate.logger.warn({foo: "bar6", woopie: {yea: true, oh: date}}, "hot dog");
		ObjectTemplate.logger.setLevel('error;foo:bar6');
		ObjectTemplate.logger.warn({foo: "bar6", woopie: {yea: true, oh: date}}, "hot dog");
		ObjectTemplate.logger.setLevel('error;foo:bar7');
		ObjectTemplate.logger.warn({foo: "bar6", woopie: {yea: true, oh: date}}, "hot dog");

		output += chalk.yellow(':');
		var result = 'supertype: Yippie : (foo="bar1")11/11/2010 00:00:00:000 GMT-5: WARN: supertype: (permFoo="permBar1" foo="bar2")11/11/2010 00:00:00:000 GMT-5: WARN: supertype: (foo="bar3")11/11/2010 00:00:00:000 GMT-5: WARN: supertype: (permFoo="childFoo" foo="bar4")11/11/2010 00:00:00:000 GMT-5: WARN: supertype: (foo="bar5")11/11/2010 00:00:00:000 GMT-5: WARN: supertype2: hot dog : (foo="bar6" woopie={"yea":true,"oh":"2010-11-11T05:00:00.000Z"})11/11/2010 00:00:00:000 GMT-5: WARN: supertype2: hot dog : (foo="bar6" woopie={"yea":true,"oh":"2010-11-11T05:00:00.000Z"})'
		var loggedResult = ObjectTemplate.logger.prettyPrint('warn', {msg: result, time: date});

		expect(output.length).to.equal(loggedResult.length);

	});

});







