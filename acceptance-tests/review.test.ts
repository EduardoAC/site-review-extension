const EXTENSION_ID = "kldoafelkajoifcomeeecjgjhdgeomap"

describe("Content Script - Site Reviewer", () => {
    it("one history item is visible", async () => {
        const page = await browser.newPage()
        await page.goto(`chrome-extension://${EXTENSION_ID}/popup.html`)

        const list = await page.$("ul")
        const children = await list?.$$("li")

        expect(children?.length).toBe(1)
    })
})
