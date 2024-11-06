import { GM_setValue, GM_getValue } from "vite-plugin-monkey/dist/client";

export enum Language {
    Auto = "auto",
    SimplifiedChinese = "zh-CHS",
    TraditionalChinese = "zh-CHT",
    English = "en",
}

export const GerneralConfig = {
    WebName: "GoDev",
    SetSrcLanguage: (srcLanguage: string) => GM_setValue("srcLanguage", srcLanguage),
    GetSrcLanguage: () => GM_getValue<string>("srcLanguage", Language.Auto),
    SetDstLanguage: (dstLanguage: string) => GM_setValue("dstLanguage", dstLanguage),
    GetDstLanguage: () => GM_getValue<string>("dstLanguage", Language.SimplifiedChinese),
    SetCurTranslator: (translator: string) => GM_setValue("curTranslator", translator),
    GetCurTranslator: () => GM_getValue<string>("curTranslator", "baidu"),
    SetDelay: (delay: number) => GM_setValue("delay", delay),//ms
    GetDelay: () => GM_getValue<number>("delay", 0),
}

class API {
    apiName: string
    host: string
    domain: string
    srcLanguage: Language[]
    dstLanguage: Language[]
    constructor(apiName: string, host: string, domain: string, srcLanguage: Language[], dstLanguage: Language[]) {
        this.apiName = apiName
        this.host = host
        this.domain = domain
        this.srcLanguage = srcLanguage
        this.dstLanguage = dstLanguage
    }
    SetAPPID = (id: string) => GM_setValue(this.apiName + "APIID", id)
    GetAPPID = () => GM_getValue<string>(this.apiName + "APIID")
    SetKey = (key: string) => GM_setValue(this.apiName + "Key", key)
    GetKey = () => GM_getValue<string>(this.apiName + "Key")
}

export const APIConfig = new Map([
    ["baidu", new API("baidu", 
        "https://fanyi-api.baidu.com/api/trans/vip/fieldtranslate", 
        "it",
        [Language.Auto, Language.SimplifiedChinese, Language.English],
        [Language.SimplifiedChinese, Language.English]
    )],
    ["youdao", new API("youdao", "https://openapi.youdao.com/api", 
        "computers",
        [Language.Auto, Language.SimplifiedChinese, Language.TraditionalChinese, Language.English],
        [Language.SimplifiedChinese, Language.TraditionalChinese, Language.English]
    )],
    ["youdaoAI", new API("youdaoAI", "https://openapi.youdao.com/llm_trans", 
        "9",
        [Language.Auto, Language.SimplifiedChinese, Language.English],
        [Language.SimplifiedChinese, Language.English]
    )]
])

export const AIPrompt = "This is a piece of documentation text for a Golang package. Please help me translate it."