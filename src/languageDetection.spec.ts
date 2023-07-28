import { isMostlyEnglish } from "./utils"

describe("Languge detection", () => {
    let testcases = [
        {
            name: "All charecters are english",
            text: "All charecters are english",
            expected: true
        },
        {
            name: "Exactly 90% English characters",
            text: "Sentenceରେ 10% ଓଡ଼ିଆ ଓ 90% English. This is a mixed sentence with Odia and English.",
            expected: true
        },
        {
            name: "More than 10% non-English characters",
            text: "ଏହି sentenceରେ ୧୫% ଓଡ଼ିଆ ଅକ୍ଷର ଅଛନ୍ତି ଏବଂ ୮୫% English characters ଅଛନ୍ତି। This sentence has more than 10% Odia characters.",
            expected: false
        },
        {
            name: "No English characters",
            text: "ଓଡ଼ିଶାରେ ଉତ୍ପାଦନ ହେଉଥିବା ବିଭିନ୍ନ ପ୍ରକାର ମିଲେଟ୍ ଗୁଡିକ କ'ଣ ?",
            expected: false
        },
        {
            name: "Contains 50% non-English characters",
            text: "Hello, world! 你好，世界!",
            expected: false
        }
    ]
    testcases.forEach(test=>{
        it(test.name, ()=>{
            expect(isMostlyEnglish(test.text)).toBe(test.expected)
        })
    })
})