import { type JestConfigWithTsJest } from "ts-jest"
// jest.config.ts

const config: JestConfigWithTsJest = {
    // verbose: true, // More in-depth information on time and tests that execute
    preset: "ts-jest",
    testEnvironment: "jest-environment-jsdom",
    automock: false,
    setupFilesAfterEnv: ["./setupTests.ts"],
    testMatch: [
        "**/__tests__/**/*.[jt]s?(x)",
        "**/?(*.)+(spec|test).[jt]s?(x)",
    ],
    transform: {
        "^.+\\.tsx?$": "ts-jest",
        // process `*.tsx` files with `ts-jest`
    },
    moduleNameMapper: {
        "\\.css$": "jest-css-modules",
    },
    // reporters: [
    //     [
    //         // To investigate to learn why a particular test is slow
    //         "jest-slow-test-reporter",
    //         { numTests: 8, warnOnSlowerThan: 1000, color: true },
    //     ],
    // ],
}

export default config
