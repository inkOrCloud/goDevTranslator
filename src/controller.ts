import { Paragraph, Rule } from "./retrieve";
import { Trans, STATUS } from "./api";
import { GerneralConfig } from "./config";
import { GetTrans, SetTrans } from "./cache";

export class Controller {
    private rules: Rule[]
    private static Instance: Controller | null = null
    private queryTime//ms

    private constructor() {
        this.rules = []
        this.queryTime = 0
    }
    
    static GetInstance = (): Controller => {
        if (!Controller.Instance) {
            Controller.Instance = new Controller()
        }
        return <Controller>this.Instance
    }

    AddRule = (rule: Rule): void => {
        this.rules.push(rule)
    }

    private async apiTranlate(p: Paragraph): Promise<boolean> {
        const curTranslatorName = GerneralConfig.GetCurTranslator()
        const curTranslator = Trans.get(curTranslatorName)
        const delay = GerneralConfig.GetDelay()
        if (!curTranslator) {
            throw new Error("Translator " + curTranslatorName + " not found");
        }
        const {Oringinal} = p
        if (new Date().getTime() - this.queryTime < delay) {
            await new Promise(resolve => setTimeout(resolve, delay - (new Date().getTime() - this.queryTime)))
        }
        const ctx = await curTranslator.StringTranslate(Oringinal)
        this.queryTime = new Date().getTime()
        if (ctx.Status == STATUS.Error) {
            console.log(`[${new Date().toLocaleString()}][Error]${ctx.EroorCode}:${ctx.Message}`)
            return false
        }
        p.TransText = ctx.ResText
        return true
    }

    Translate = async (): Promise<void> => {
        console.log("Started")

        for (const rule of this.rules) {
            for(const paragraph of rule.Paragraphs) {
                const cache = GetTrans(paragraph.Oringinal)
                if(!paragraph.TransText && !cache) {
                    await this.apiTranlate(paragraph)
                    SetTrans(paragraph.Oringinal, paragraph.TransText)
                }else if (cache){
                    paragraph.TransText = cache
                }
                paragraph.Handler(paragraph)
            }
        }

    }

    Restore = async (): Promise<void> => {
        for(const rule of this.rules) {
            for(const paragraph of rule.Paragraphs) {
                paragraph.Restore(paragraph)
            }
        }
    }
}