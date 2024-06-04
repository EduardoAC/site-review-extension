import "@testing-library/jest-dom"
import "isomorphic-fetch"
// import { chrome } from "jest-chrome/lib/index.cjs"
// import { chrome } from "jest-chrome"
import * as chrome from "jest-chrome"

Object.assign(global, chrome)
