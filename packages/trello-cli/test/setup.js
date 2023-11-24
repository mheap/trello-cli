// This is a workaround for a bug in Jest that reports
// the parent CLI exit code instead of the test suite exit code.
// It only affects Node 20
// See https://github.com/jestjs/jest/issues/14501
afterEach(() => {
  process.exitCode = 0;
});
