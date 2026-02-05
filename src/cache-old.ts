import { GM_getValue, GM_setValue } from "vite-plugin-monkey/dist/client";
import { GerneralConfig } from "./config";
import {SuperJSON} from "superjson"

const dataName = GerneralConfig.WebName + "TranslatoeCache"
let cache: Map<string, string>

function setMap() {
    GM_setValue(dataName, SuperJSON.stringify(cache))
}

function getMap() {
    const s = <string|undefined>GM_getValue(dataName)
    let m
    if(s) {
        m = SuperJSON.parse(s)
    }
    if(m && m instanceof Map) {
        cache = m
    }else {
        cache = new Map()
        setMap()
    }
}
getMap()


export function GetTrans(t: string): string {
    const r = cache.get(t)
    if(r) {
        return r
    }else{
        return ""
    }
}

export function SetTrans(t: string, r: string) {
    cache.set(t, r)
    setMap()
}

export function GetSize(): number {//单位字节
    let s = <string|undefined>GM_getValue(dataName)
    if (s) {
        return new Blob([s]).size
    }else {
        return 0
    }
}

export function ClearCache() {
    cache = new Map()
    setMap()
}