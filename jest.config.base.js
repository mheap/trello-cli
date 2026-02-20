module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testRegex: ".test.tsx?$",
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  collectCoverage: false,
  testEnvironment: "node",
  coveragePathIgnorePatterns: [],
  testTimeout: 30000,
  restoreMocks: true
};
