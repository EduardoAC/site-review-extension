import { type JestConfigWithTsJest } from "ts-jest"
// jest.config.ts

const config: JestConfigWithTsJest = {
    projects: ["acceptance-tests/jest.config.ts"],
}

export default config
