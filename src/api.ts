import { GM_xmlhttpRequest } from "vite-plugin-monkey/dist/client";
import { MD5, SHA256} from "crypto-js";
import { APIConfig, GerneralConfig, Language } from "./config";

export enum STATUS {
    Ready = "ready",
    Started = "started",
    Success = "success",
    Error = "error"
}

function formGenerate(data: Map<string, string>): string {
    let form = ""
    for (const [key, val] of data) {
        form += encodeURIComponent(key) + "=" + encodeURIComponent(val) + "&"
    }
    if (form[form.length - 1] == "&") {
        form = form.substring(0, form.length - 1)
    }
    return form
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
    apiName: string
    host: string
    abstract language: Map<string, string>
    protected abstract gernerateData: (ctx: Context) => string
    protected abstract apiRequest: (ctx: Context) => Promise<Context>
    abstract translate: (ctx: Context) => Promise<Context>
    protected constructor(apiName: string, host: string) {
        this.host = host
        this.apiName = apiName
    }
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
    language: Map<string, string> = new Map([
        [Language.Auto, "auto"],
        [Language.SimplifiedChinese, "zh"],
        [Language.English, "en"]
    ])

    static Instance: translator | null = null
    static getInstance = (): translator => {
        if (BaiduTranlate.Instance == null) {
            const { apiName, host } = APIConfig.get("baidu")!
            BaiduTranlate.Instance = new BaiduTranlate(apiName, host)
        }
        return <translator>this.Instance
    }

    protected gernerateData = (ctx: Context): string => {//   application/x-www-form-url
        const {GetKey, GetAPPID, domain} = APIConfig.get("baidu")!
        const appid = GetAPPID()
        const key = GetKey() 
        const text = ctx.ReqText
        const salt = crypto.getRandomValues(new Uint32Array(1))[0].toString()
        const sign = MD5(appid + text + salt + domain + key).toString()//appid+q+salt+domain+密钥
        console.log(appid + text + salt + domain + key)
        const map = new Map([
            ["q", text],
            ["from", this.languageTrans(ctx.SrcLanguage)],
            ["to", this.languageTrans(ctx.DstLanguage)],
            ["appid", appid],
            ["salt", salt],
            ["sign", sign],
            ["domain", domain]
        ]);
        if (ctx.SrcLanguage == "unknown" || ctx.DstLanguage == "unknown") {
            ctx.Error("", "unknown language")
        }
        return formGenerate(map)
    }

    protected apiRequest = (ctx: Context): Promise<Context> => {
        const data = this.gernerateData(ctx)
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
        if(!this.checkCtx(ctx)) {
            return new Promise((resolve) => {
                resolve(ctx);
            });
        }
        return this.apiRequest(ctx)
    }
}

export class YoudaoTextTranslate extends translator {
    language: Map<string, string> = new Map([
        [Language.Auto, "auto"],
        [Language.SimplifiedChinese, "zh-CHS"],
        [Language.TraditionalChinese, "zh-CHT"],
        [Language.English, "en"]
    ]);
    static Instance: translator | null = null
    static getInstance = (): translator => {
        if (YoudaoTextTranslate.Instance == null) {
            const { apiName, host} = APIConfig.get("youdao")!
            YoudaoTextTranslate.Instance = new YoudaoTextTranslate(apiName, host)
        }
        return <translator>this.Instance
    }
    protected transInput(text:string):string {
        if(text.length <= 20) {
            return text
        }
        return text.substring(0, 10) + text.length + text.substring(text.length - 10)
    }
    protected gernerateData = (ctx: Context): string => {
        const salt = getSalt().toString()
        const curtime = Math.round(new Date().getTime() / 1000).toString()
        const {GetAPPID, GetKey, domain} = APIConfig.get("youdao")!
        const appid = GetAPPID()
        const key = GetKey()
        const sign = SHA256(appid + this.transInput(ctx.ReqText) + salt + curtime + key).toString()
        const data = new Map([
            ["q", ctx.ReqText],
            ["from", this.languageTrans(ctx.SrcLanguage)],
            ["to", this.languageTrans(ctx.DstLanguage)],
            ["appKey", appid],
            ["salt", salt],
            ["sign", sign],
            ["signType", "v3"],
            ["curtime", curtime],
            ["domain", domain]
        ])
        return formGenerate(data)
    }

    protected apiRequest = (ctx: Context): Promise<Context> => {
        const data = this.gernerateData(ctx)
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
                    } else{
                        ctx.Success(response.translation.join("\n"))
                        resolve(ctx)
                    }                 }
            })
        })
    }

    translate = (ctx: Context): Promise<Context> => {
        if(!this.checkCtx(ctx)) {
            return new Promise((resolve) => {
                resolve(ctx);
            })
        }
        return this.apiRequest(ctx)
    }
}

export const Trans = new Map<string, translator>([
    ["baidu", BaiduTranlate.getInstance()],
    ["youdao", YoudaoTextTranslate.getInstance()]
]);