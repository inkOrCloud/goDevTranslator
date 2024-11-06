import { GM_xmlhttpRequest } from "vite-plugin-monkey/dist/client";
import { MD5, SHA256 } from "crypto-js";
import { APIConfig, GerneralConfig, Language, AIPrompt } from "./config";

export enum STATUS {
    Ready = "ready",
    Started = "started",
    Success = "success",
    Error = "error"
}

class event {
    type: string
    data: string
    constructor(type: string, data?: string) {
        this.type = type
        if (data) {
            this.data = data
        } else {
            this.data = ""
        }
    }
}

function sseBodyParse(body: string): event[] {
    const eventsStr = body.trim().split("\n\n")
    const events: event[] = []
    for (const e of eventsStr) {
        const [type, data] = e.split("\n", 2).map((v: string) => {
            return v.trim().slice(v.indexOf(":") + 1)
        })
        events.push(new event(type, data))
    }
    return events
}

let getSalt = () => crypto.getRandomValues(new Uint32Array(1))[0]

export class Context {
    APIName: string
    SrcLanguage: string
    DstLanguage: string
    ReqText: string
    ResText: string = ""
    Status: string = STATUS.Ready
    Message: string = ""
    EroorCode: number = -1
    constructor(api: string, srcLanguage: string, dstLanguage: string, text: string) {
        this.APIName = api
        this.SrcLanguage = srcLanguage
        this.DstLanguage = dstLanguage
        this.ReqText = text
    }
    Success = (text: string, message?: string, errorCode?: number): void => {
        this.ResText = text
        if (message != undefined) {
            this.Message = message
        } else {
            this.Message = "ok"
        }
        if (errorCode != undefined) {
            this.EroorCode = errorCode
        } else {
            this.EroorCode = -1
        }
        this.Status = STATUS.Success
    }
    Error = (text?: string, message?: string, errorCode?: number): void => {
        if (text != undefined) {
            this.ResText = text
        } else {
            this.ResText = ""
        }
        if (message != undefined) {
            this.Message = message
        } else {
            this.Message = "error"
        }
        if (errorCode != undefined) {
            this.EroorCode = errorCode
        } else {
            this.EroorCode = -1
        }
        this.Status = STATUS.Error
    }
}

export abstract class translator {
    abstract apiName: string
    abstract host: string
    abstract language: Map<string, string>
    protected abstract generateData: (ctx: Context) => string
    protected abstract apiRequest: (ctx: Context) => Promise<Context>
    abstract translate: (ctx: Context) => Promise<Context>
    protected checkCtx = (ctx: Context): boolean => {
        const regxp = /[\S]/
        if (ctx.Status == STATUS.Error) {
            return false
        }
        if (!ctx.ReqText || !regxp.test(ctx.ReqText)) {
            ctx.Error(undefined, "ReqText is empty")
            return false
        }
        return true
    }
    StringTranslate = (text: string): Promise<Context> => {
        const ctx = new Context(this.apiName,
            GerneralConfig.GetSrcLanguage(),
            GerneralConfig.GetDstLanguage(),
            text
        )
        return this.translate(ctx)
    }
    protected languageTrans = (language: string): string => {
        if (this.language.has(language)) {
            return this.language.get(language)!
        } else {
            return "unknown"
        }
    }
}

export class BaiduTranlate extends translator {
    apiName: string;
    host: string;
    static Instance: translator | null = null
    private constructor(apiName: string, host: string) {
        super()
        this.apiName = apiName
        this.host = host
    }
    language: Map<string, string> = new Map([
        [Language.Auto, "auto"],
        [Language.SimplifiedChinese, "zh"],
        [Language.English, "en"]
    ])
    static getInstance = (): translator => {
        if (BaiduTranlate.Instance == null) {
            const { apiName, host } = APIConfig.get("baidu")!
            BaiduTranlate.Instance = new BaiduTranlate(apiName, host)
        }
        return <translator>this.Instance
    }

    protected generateData = (ctx: Context): string => {//   application/x-www-form-url
        const { GetKey, GetAPPID, domain } = APIConfig.get("baidu")!
        const appid = GetAPPID()
        const key = GetKey()
        const text = ctx.ReqText
        const salt = getSalt().toString()
        const sign = MD5(appid + text + salt + domain + key).toString()//appid+q+salt+domain+密钥
        const form = new URLSearchParams();
        form.append("q", text);
        form.append("from", this.languageTrans(ctx.SrcLanguage));
        form.append("to", this.languageTrans(ctx.DstLanguage));
        form.append("appid", appid);
        form.append("salt", salt);
        form.append("sign", sign);
        form.append("domain", domain);
        if (ctx.SrcLanguage == "unknown" || ctx.DstLanguage == "unknown") {
            ctx.Error("", "unknown language")
        }
        return form.toString()
    }

    protected apiRequest = (ctx: Context): Promise<Context> => {
        const data = this.generateData(ctx)
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: "POST",
                url: this.host,
                data: data,
                responseType: "json",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                onload: ({ status, response }) => {
                    if (status !== 200) {
                        ctx.Error(undefined, "Internet error", status);
                    } else if (response.error_code) {
                        ctx.Error(undefined, response.error_msg, response.error_code);
                    } else {
                        const translations = response.trans_result.map((res: any) => res.dst).join("\n");
                        ctx.Success(translations);
                    }
                    resolve(ctx);
                }
            });
        });
    }

    translate = (ctx: Context): Promise<Context> => {
        if (!this.checkCtx(ctx)) {
            return new Promise((resolve) => {
                resolve(ctx);
            });
        }
        return this.apiRequest(ctx)
    }
}

export class YoudaoTextTranslate extends translator {
    apiName: string;
    host: string;
    static Instance: translator | null = null
    language: Map<string, string> = new Map([
        [Language.Auto, "auto"],
        [Language.SimplifiedChinese, "zh-CHS"],
        [Language.TraditionalChinese, "zh-CHT"],
        [Language.English, "en"]
    ]);
    private constructor(apiName: string, host: string) {
        super()
        this.apiName = apiName
        this.host = host
    }
    static getInstance = (): translator => {
        if (YoudaoTextTranslate.Instance == null) {
            const { apiName, host } = APIConfig.get("youdao")!
            YoudaoTextTranslate.Instance = new YoudaoTextTranslate(apiName, host)
        }
        return <translator>this.Instance
    }
    protected transInput(text: string): string {
        if (text.length <= 20) {
            return text
        }
        return text.substring(0, 10) + text.length + text.substring(text.length - 10)
    }
    protected generateData = (ctx: Context): string => {
        const salt = getSalt().toString()
        const curtime = Math.round(new Date().getTime() / 1000).toString()
        const { GetAPPID, GetKey, domain } = APIConfig.get("youdao")!
        const appid = GetAPPID()
        const key = GetKey()
        const sign = SHA256(appid + this.transInput(ctx.ReqText) + salt + curtime + key).toString()
        const form = new URLSearchParams();
        form.append("q", ctx.ReqText);
        form.append("from", this.languageTrans(ctx.SrcLanguage));
        form.append("to", this.languageTrans(ctx.DstLanguage));
        form.append("appKey", appid);
        form.append("salt", salt);
        form.append("sign", sign);
        form.append("signType", "v3");
        form.append("curtime", curtime);
        form.append("domain", domain);
        return form.toString()
    }

    protected apiRequest = (ctx: Context): Promise<Context> => {
        const data = this.generateData(ctx)
        return new Promise((resolve) => {
            if (ctx.Status == STATUS.Error) {
                resolve(ctx)
                return
            }
            GM_xmlhttpRequest({
                method: "POST",
                url: this.host,
                data: data,
                responseType: "json",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                onload: ({ status, response }) => {
                    if (status != 200) {
                        ctx.Error(undefined, "Internet error", status)
                        resolve(ctx)
                    } else if (Number(response.errorCode)) {
                        ctx.Error(undefined, undefined, response.errorCode)
                        resolve(ctx)
                    } else {
                        ctx.Success(response.translation.join("\n"))
                        resolve(ctx)
                    }
                }
            })
        })
    }

    translate = (ctx: Context): Promise<Context> => {
        if (!this.checkCtx(ctx)) {
            return new Promise((resolve) => {
                resolve(ctx);
            })
        }
        return this.apiRequest(ctx)
    }
}

export class YoudaoAITraslate extends translator {
    apiName: string;
    host: string;
    static Instance: translator | null = null
    private constructor(apiName: string, host: string) {
        super()
        this.apiName = apiName
        this.host = host
    }
    language = new Map<string, string>([
        [Language.Auto, "auto"],
        [Language.SimplifiedChinese, "zh-CHS"],
        [Language.English, "en"]
    ])

    static GetInstance = (): translator => {
        if (this.Instance == null) {
            const { apiName, host } = APIConfig.get("youdaoAI")!
            this.Instance = new YoudaoAITraslate(apiName, host)
        }
        return this.Instance
    }

    protected transInput(text: string): string {
        if (text.length <= 20) {
            return text
        }
        return text.substring(0, 10) + text.length + text.substring(text.length - 10)
    }

    protected generateData = (ctx: Context): string => {
        const { GetAPPID, GetKey, domain } = APIConfig.get("youdaoAI")!
        const appid = GetAPPID()
        const key = GetKey()
        const salt = getSalt().toString()
        const curtime = Math.round(new Date().getTime() / 1000).toString()
        const sign = SHA256(appid + this.transInput(ctx.ReqText) + salt + curtime + key).toString()
        const form = new URLSearchParams();
        form.append("i", ctx.ReqText);
        form.append("from", this.languageTrans(ctx.SrcLanguage));
        form.append("to", this.languageTrans(ctx.DstLanguage));
        form.append("appKey", appid);
        form.append("salt", salt);
        form.append("sign", sign);
        form.append("signType", "v3");
        form.append("curtime", curtime);
        form.append("polishOption", domain);
        form.append("prompt", AIPrompt)
        return form.toString()
    }

    protected apiRequest = (ctx: Context): Promise<Context> => {
        const data = this.generateData(ctx)
        return new Promise((resolve) => {
            if (ctx.Status == STATUS.Error) {
                resolve(ctx)
                return
            }
            GM_xmlhttpRequest({
                url: this.host,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                method: "POST",
                data: data,
                onload: ({ status, responseText }) => {
                    let transText = ""
                    if (status !== 200) {
                        ctx.Error(undefined, "internet error", status)
                        resolve(ctx)
                        return
                    }
                    const events = sseBodyParse(responseText)
                    if (events.length === 0) {
                        ctx.Error(undefined, "sse body error")
                        resolve(ctx)
                        return
                    }
                    const end = events[events.length - 1]
                    if (end.type === "error") {
                        const data = JSON.parse(end.data)
                        ctx.Error(undefined, data.msg, data.code)
                        resolve(ctx)
                        return
                    }
                    for(const e of events) {
                        if(e.type !== "message") {
                            continue
                        }
                        console.log(e)
                        const data = JSON.parse(e.data)
                        transText += data.transIncre
                    }
                    ctx.Success(transText)
                    resolve(ctx)
                }
            })
        })
    };

    translate = (ctx: Context): Promise<Context> => {
        if (!this.checkCtx(ctx)) {
            return new Promise((resolve) => {
                resolve(ctx);
            })
        }
        return this.apiRequest(ctx)
    };
}
export const Trans = new Map<string, translator>([
    ["baidu", BaiduTranlate.getInstance()],
    ["youdao", YoudaoTextTranslate.getInstance()],
    ["youdaoAI", YoudaoAITraslate.GetInstance()]
]);