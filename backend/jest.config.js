// process.env.TZ = "UTC";
module.exports = {
  testTimeout: 30000,
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: false,
            decorators: true
          },
          transform: {
            decoratorMetadata: true
          }
        },
        module: {
          type: "commonjs"
        }
      }
    ]
  },
  transformIgnorePatterns: [
    "/node_modules/(?!@faker-js/)",
  ],
  moduleNameMapper: {
    "@modules/(.+)$": "<rootDir>/src/@modules/$1",
    "^src/(.+)$": "<rootDir>/src/$1",
  },
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts"],
  roots: ["<rootDir>/src"],
  collectCoverage: false,
  verbose: true,
};