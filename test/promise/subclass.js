"use strict";
require('../../'); // import Promise from es6-shim

var assert = require("assert");

describe("Support user subclassing of Promise", function() {
  it("should work if you do it right", function() {
    // This is the "correct" es6-compatible way; see gh #170
    // (Thanks, @domenic!)
    var MyPromise = function(executor) {
      Promise.call(this, executor);
      this.mine = 'yeah';
    };
    if (!MyPromise.__proto__) { return; } // skip test if on IE < 11
    MyPromise.__proto__ = Promise; // mutable __proto__ is in es6.
    MyPromise.prototype = Object.create(Promise.prototype);
    MyPromise.prototype.constructor = MyPromise;

    // let's try it!
    var p1 = MyPromise.resolve(5);
    assert.strictEqual(p1.mine, 'yeah');
    p1 = p1.then(function(x) {
      assert.strictEqual(x, 5);
    });
    assert.strictEqual(p1.mine, 'yeah');

    var p2 = new MyPromise(function(r) { r(6); });
    assert.strictEqual(p2.mine, 'yeah');
    p2 = p2.then(function(x) {
      assert.strictEqual(x, 6);
    });
    assert.strictEqual(p2.mine, 'yeah');

    var p3 = MyPromise.all([p1, p2]);
    assert.strictEqual(p3.mine, 'yeah');
    p3 = p3.then(function() { done(); });
  });

  it("should throw if you inherit incompletely", function() {
    var MyPromise = function(executor) {
      Promise.call(this, executor);
      this.mine = 'yeah';
    };
    // If the constructor doesn't inherit from Promise then
    // in an es6 engine we won't pick up the internal @@create
    // method, even if we do everything else 'correctly'
    MyPromise.prototype = Object.create(Promise.prototype);
    MyPromise.prototype.constructor = MyPromise;

    assert.throws(function() {
      new MyPromise(function(r) { r(5); });
    }, TypeError);

    assert.throws(function() {
      Promise.resolve.call(MyPromise, 5);
    }, TypeError);
  });

  it("should throw if you don't inherit at all", function() {
    var MyPromise = function(executor) { };
    assert.throws(function() {
      Promise.all.call(MyPromise, []);
    }, TypeError);
  });
});
