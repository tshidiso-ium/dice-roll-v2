"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {extractBearerToken} = require("./requestSafety");

test("extractBearerToken accepts exactly one bearer credential", () => {
  assert.equal(extractBearerToken("Bearer abc.def.ghi"), "abc.def.ghi");
  assert.equal(extractBearerToken("bearer token"), "token");
  assert.equal(extractBearerToken("Basic token"), null);
  assert.equal(extractBearerToken("Bearer two tokens"), null);
  assert.equal(extractBearerToken(undefined), null);
});
