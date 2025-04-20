/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^~(.*)$": "<rootDir>/src/app/$1",
  },
  automock: false,
};
