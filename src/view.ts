import { Language, GerneralConfig, APIConfig } from "./config";
import {Controller} from "./controller"
import { GetSize, ClearCache } from "./cache";
import $ from "jquery";
import "bootstrap/dist/css/bootstrap.css"
import "bootstrap-icons/font/bootstrap-icons.css"
import "./ui.css"

const $floatingUI = $(`
    <div class="container mt-4" style="display: none;">
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h4 class="mb-0">设置</h4>
                <button type="button" class="btn-close"></button>
            </div>
            <div class="card-body">
                <form id="settingsForm">
                    <div class="mb-3">
                        <label for="appid" class="form-label">APPID</label>
                        <input type="text" class="form-control" id="appid" name="appid">
                    </div>

                    <div class="mb-3">
                        <label for="key" class="form-label">KEY</label>
                        <input type="password" class="form-control" id="key" name="key">
                    </div>

                    <div class="mb-3">
                        <label for="translator-api" class="form-label">翻译api选择</label>
                        <select class="form-select" id="translator-api" name="translator-api">
                            <!-- 选项可通过JavaScript动态添加 -->
                        </select>
                    </div>

                    <div class="mb-3">
                        <label for="source-lang" class="form-label">源语言</label>
                        <select class="form-select" id="source-lang" name="source-lang">
                            <!-- 选项可通过JavaScript动态添加 -->
                        </select>
                    </div>

                    <div class="mb-3">
                        <label for="target-lang" class="form-label">目标语言</label>
                        <select class="form-select" id="target-lang" name="target-lang">
                            <!-- 选项可通过JavaScript动态添加 -->
                        </select>
                    </div>

                    <div class="mb-3">
                        <label for="delay" class="form-label">请求延迟(毫秒)</label>
                        <input type="number" class="form-control" id="delay" name="delay" min="0" step="100">
                    </div>

                    <button type="button" class="btn btn-primary">应用</button>
                    <button type="button" class="btn btn-danger" id="clearCacheBtn">清理缓存</button>
                    <label class="form-label" id="cache-size"></label>
                </form>
            </div>
        </div>
    </div>
    <div class="button">
        <button class="floating-button setting-button">
            <i class="bi bi-gear-fill"></i>
        </button>
        <button id="translationButton" class="floating-button translate translate-button"
            data-state="translate"></button>
    </div>
    `)

const language = new Map([
    [Language.Auto, "自动"],
    [Language.SimplifiedChinese, "简体中文"],
    [Language.TraditionalChinese, "繁体中文"],
    [Language.English, "英语"]
])

const apiName = new Map([
    ["baidu", "百度翻译"],
    ["youdao", "有道文本翻译"]
])

function applySettings(): void {
    const translatorApi = <string>$("#translator-api").val()
    const sourceLang = <string>$("#source-lang").val()
    const targetLang = <string>$("#target-lang").val()
    const delay: string | undefined = <string | undefined>$("#delay").val()
    const appid = <string | undefined>$("#appid").val()
    const key = <string | undefined>$("#key").val()
    const api = APIConfig.get(translatorApi)!
    if (delay && parseInt(delay) > 0) { 
        GerneralConfig.SetDelay(parseInt(delay))
    }
    if (appid) {
        api.SetAPPID(appid)
    }
    if (key && !key.includes("*")) {
        api.SetKey(key)
    }
    GerneralConfig.SetCurTranslator(translatorApi)
    GerneralConfig.SetSrcLanguage(sourceLang)
    GerneralConfig.SetDstLanguage(targetLang)
}
function toggleHoverBox() {
    $(".container.mt-4").toggle();
    $(".setting-button").toggle()
}

async function handleClick() {
    const button = $("#translationButton");
    const state = button.attr('data-state');
    const controller = Controller.GetInstance()

    if (state === "translate") {
        //将按钮变为"翻译中"样式
        button.attr('data-state', 'translating');
        button.removeClass('translate').addClass('translating').addClass('start-translate');
        
        await controller.Translate()

        //将按钮变为"撤销翻译"样式
        button.attr('data-state', 'cancel');
        button.removeClass('translating').
        addClass('cancel').
        removeClass('start-translate').
        addClass('start-translating');
    } else if (state === "cancel") {
        controller.Restore()

        button.attr('data-state', 'translate');
        button.removeClass('cancel').addClass('translate').removeClass('start-translating');
    }
}

async function languageListInit() {
    const $src = $("#source-lang")
    const $dst = $("#target-lang")
    const curSrc = GerneralConfig.GetSrcLanguage()!
    const curDst = GerneralConfig.GetDstLanguage()!
    const srcLang = APIConfig.get(GerneralConfig.GetCurTranslator())!.srcLanguage//api允许的语言
    const dstLang = APIConfig.get(GerneralConfig.GetCurTranslator())!.dstLanguage
    for (const l of srcLang) {
        if (l == curSrc) {
            $src.append(`<option value="${l}" selected>${language.get(l)}</option>`)
        } else {
            $src.append(`<option value="${l}">${language.get(l)}</option>`)
        }
    }
    for (const l of dstLang) {
        if (l == curDst) {
            $dst.append(`<option value="${l}" selected>${language.get(l)}</option>`)
        } else {
            $dst.append(`<option value="${l}">${language.get(l)}</option>`)
        }
    }
}

async function APIListInit() {
    const $translator = $("#translator-api")
    const curTranslator = GerneralConfig.GetCurTranslator()!
    for (const a of APIConfig.keys()){
        if(a == curTranslator) {
            $translator.append(`<option value="${a}" selected>${apiName.get(a)}</option>`)
        }else{
            $translator.append(`<option value="${a}">${apiName.get(a)}</option>`)
        }
    }
}

async function updateLangList() {
    const $src = $("#source-lang")
    const $dst = $("#target-lang")
    const apiSelected = <string>$("#translator-api").val()
    const srcLang = APIConfig.get(apiSelected)!.srcLanguage
    const dstLang = APIConfig.get(apiSelected)!.dstLanguage
    $src.empty()
    $dst.empty()
    for (const l of srcLang) {
        $src.append(`<option value="${l}">${language.get(l)}</option>`)
    }
    for (const l of dstLang) {
        $dst.append(`<option value="${l}">${language.get(l)}</option>`)
    }
}

async function delayInit() {
    const $delay = $("#delay")
    $delay.val(GerneralConfig.GetDelay())
}

async function appidInputInit() {
    const api = APIConfig.get(GerneralConfig.GetCurTranslator())!
    const $appid = $("#appid")
    $appid.val(api.GetAPPID())
}

async function appidInputUpdate() {
    const $selectAPI = $("#translator-api")
    const $appid = $("#appid")
    const api = APIConfig.get(<string>$selectAPI.val())!
    $appid.val(api.GetAPPID())
}

async function keyInputInit() {
    const $key = $("#key")
    $key.val("************")
}

async function showCacheSize() {
    $("#cache-size").text("缓存大小:" + (GetSize() >> 10) + "KB")
}

async function settingUIInit() {
    languageListInit()
    APIListInit()
    delayInit()
    appidInputInit()
    keyInputInit()
    showCacheSize()
    const $selectAPI = $("#translator-api")
    const $closeSetting = $(".btn-close")
    $selectAPI.on("change", updateLangList)
    $selectAPI.on("change", appidInputUpdate)
    $selectAPI.on("change", keyInputInit)
    $closeSetting.on("click", () => $selectAPI.off("change", updateLangList))
    $closeSetting.on("click", () => $selectAPI.off("change", appidInputUpdate))
    $closeSetting.on("click", () => $selectAPI.off("change", keyInputInit))
}

export async function LoadView(): Promise<void> {
    $floatingUI.appendTo("body")
    $(window).on("load", () => {
        const $btnClose = $(".btn-close")
        const $settingBtn = $(".floating-button.setting-button")
        const $btnPrimary = $(".btn-primary")
        const $translateBtn = $(".floating-button.translate-button")
        const $clearBtn = $(".btn-danger")
        $btnClose.on("click", toggleHoverBox);
        $settingBtn.on("click", toggleHoverBox);
        $btnPrimary.on("click", applySettings);
        $translateBtn.on("click", handleClick);
        $settingBtn.on("click", settingUIInit)
        $clearBtn.on("click", () => {
            ClearCache()
            showCacheSize()
        }) 
    })
}