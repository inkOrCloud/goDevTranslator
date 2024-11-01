import $ from "jquery";

function getText($elem: JQuery<HTMLElement>, ContentInd: string): string {
        let text: string|undefined = ""
        if(ContentInd == "text") {
            text = $elem.text()
        }else{
            text = $elem.attr(ContentInd)
        }
        if(!text) {
            return ""
        }
        return text
    }

export const inserAfterHandler = (p: Paragraph):boolean => {
    const {TransText, $Elem} = p
    if(!TransText) {
        return false
    }
    const $transElem = $Elem.clone()
    $transElem.text(TransText)
    $transElem.addClass("trans-text")
    $transElem.insertAfter($Elem)
    return true
}

export const restoreHandler = ():boolean => {
    $(".trans-text").remove()
    return true
}

export class Rule {
    Paragraphs: Paragraph[]
    $Elements: JQuery<HTMLElement>
    ContenInd: string
    constructor($elements: JQuery<HTMLElement>, ContentInd: string, 
        handler: (p: Paragraph) => boolean,
        Restore: (p: Paragraph) => boolean
    ) {
        this.$Elements = $elements
        this.ContenInd = ContentInd 
        this.Paragraphs = []
        this.$Elements.each((_, e) => {
            this.Paragraphs.push(new Paragraph($(e), ContentInd, handler, Restore))
        })
    }
}

export class Paragraph {
    ContentInd: string//内容在元素中的位置,“text"代表html文本内容
    $Elem: JQuery<HTMLElement>
    TransText: string
    Oringinal: string
    //undefined表示翻译失败
    Handler: (p: Paragraph) => boolean
    Restore: (p: Paragraph) => boolean
    constructor($elem: JQuery<HTMLElement>, ContenInd:string , 
        handler: (p: Paragraph) => boolean,
        Restore: (p: Paragraph) => boolean
    ){
        this.$Elem = $elem
        this.ContentInd = ContenInd
        this.Handler = handler
        this.Restore = Restore
        this.TransText = ""
        this.Oringinal = getText($elem, ContenInd) 
        }
}
