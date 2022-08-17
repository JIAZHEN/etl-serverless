module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/test", "<rootDir>/etl-records"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.(js)$": "babel-jest",
  },
  transformIgnorePatterns: [],
};
