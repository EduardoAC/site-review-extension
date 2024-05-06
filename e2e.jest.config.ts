// jest.config.ts
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const pathToExtension = `${__dirname}/dist`

console.log(pathToExtension)
const config = {
    preset: "jest-puppeteer",
    automock: false,
    testMatch: ["**/acceptance-tests/*.test.[jt]s?(x)"],
    transform: {
        "^.+\\.tsx?$": "ts-jest",
        // process `*.tsx` files with `ts-jest`
    },
    moduleNameMapper: {
        "\\.css$": "jest-css-modules",
    },
    globalSetup: "jest-environment-puppeteer/setup",
    globalTeardown: "jest-environment-puppeteer/teardown",
    testEnvironment: "jest-environment-puppeteer",
    setupFilesAfterEnv: ["expect-puppeteer"],
    launch: {
        headless: false,
        devtools: false,
        args: [
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`,
            "--disable-features=DialMediaRouteProvider",
        ],
        defaultViewport: {
            width: 1024,
            height: 800,
        },
        timeout: 0,
    },
}

export default config
