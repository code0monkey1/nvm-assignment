/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\.tsx?$': ['ts-jest', {}],
    },
    verbose: true,
    collectCoverage: true,
    coverageProvider: 'v8',
    collectCoverageFrom: [
        'src/**/*.ts', // include all .ts files in src
        '!tests', // exclude the coverage of all test files
        '!src/migration/**', // exclude the migration files
        '!**/node_modules/**', // exclude checking the code from node modules
    ],
};
