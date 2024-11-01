// @ts-ignore isolatedModules
import { Controller } from "./controller";
import { Rule, inserAfterHandler, restoreHandler } from "./retrieve";
import $ from "jquery"
import { LoadView } from "./view";

const rules = [
    {
        CssSelector: ".go-Main-article.js-mainContent p",
        ContentInd: "text",
        Handler: inserAfterHandler,
        Restore: restoreHandler
    },
    {
        CssSelector: ".UnitDoc h2,h3",
        ContentInd: "text",
        Handler: inserAfterHandler,
        Restore: restoreHandler
    },
    {
        CssSelector: ".Documentation-deprecatedTag",
        ContentInd: "text",
        Handler: inserAfterHandler,
        Restore: restoreHandler
    }
]


const controller = Controller.GetInstance()
for (const r of rules) {
    controller.AddRule(new Rule($(r.CssSelector), r.ContentInd, r.Handler, r.Restore))
}
LoadView()