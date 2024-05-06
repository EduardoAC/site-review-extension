import { type JestConfigWithTsJest } from "ts-jest"
// jest.config.ts

const config: JestConfigWithTsJest = {
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
}

export default config
