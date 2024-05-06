import { JestPuppeteerConfig } from "jest-environment-puppeteer"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const pathToExtension = `${__dirname}/dist`

console.log(pathToExtension)

const puppeteerConfig: JestPuppeteerConfig = {
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

export default puppeteerConfig
