// エラーハンドリング共通モジュール（Issue #41）
// DOM要素の欠落や処理中の例外でアプリ全体が止まらないよう、
// 失敗を文脈付きでログに残し、呼び出し元にはフォールバック値を返す。

const LOG_PREFIX = '[ErrorHandler]';

/**
 * 例外を文脈付きでログに残す
 * @param {string} context - どの処理で起きたか（例: 'handleNumberInput'）
 * @param {unknown} error - 発生した例外
 */
export function reportError(context, error) {
    console.error(`${LOG_PREFIX} ${context}:`, error);
}

/**
 * 処理を実行し、例外が出たらログに残してフォールバック値を返す
 * @template T
 * @param {() => T} operation - 実行する処理
 * @param {string} context - ログに出す処理名
 * @param {T} [fallback] - 例外時に返す値
 * @returns {T}
 */
export function safeRun(operation, context, fallback = undefined) {
    try {
        return operation();
    } catch (error) {
        reportError(context, error);
        return fallback;
    }
}

/**
 * 状態操作を実行し、失敗したら復旧処理を試みる
 * @param {() => unknown} operation - StateManager への操作
 * @param {(() => unknown) | null} recovery - 失敗時の復旧処理（不要なら null）
 * @param {string} context - ログに出す処理名
 * @returns {boolean} 操作が成功したら true
 */
export function safeStateOperation(operation, recovery, context) {
    try {
        operation();
        return true;
    } catch (error) {
        reportError(context, error);
        if (recovery) safeRun(recovery, `${context} (recovery)`);
        return false;
    }
}

/**
 * イベントハンドラを包み、例外が外に漏れて後続の操作を壊さないようにする
 * @param {(event: Event) => unknown} handler
 * @param {string} context
 * @returns {(event: Event) => unknown}
 */
export function wrapHandler(handler, context) {
    return (event) => safeRun(() => handler(event), context);
}

/**
 * id で要素を取得する。見つからなければログに残して null を返す
 * @param {string} id
 * @param {string} context
 * @returns {HTMLElement | null}
 */
export function safeGetElement(id, context) {
    const element = safeRun(() => document.getElementById(id), context, null);
    if (!element) console.error(`${LOG_PREFIX} ${context}: element not found: #${id}`);
    return element;
}

/**
 * セレクタに最初に一致する要素を取得する。見つからなければ null（ログは任意）
 * @param {string} selector
 * @param {string} context
 * @param {{ required?: boolean }} [options] - required: true なら欠落時にログを出す
 * @returns {Element | null}
 */
export function safeQuerySelector(selector, context, { required = false } = {}) {
    const element = safeRun(() => document.querySelector(selector), context, null);
    if (!element && required) console.error(`${LOG_PREFIX} ${context}: element not found: ${selector}`);
    return element;
}

/**
 * セレクタに一致する要素を配列で取得する。不正なセレクタなどで失敗したら空配列
 * @param {string} selector
 * @param {string} context
 * @returns {Element[]}
 */
export function safeQuerySelectorAll(selector, context) {
    return safeRun(() => Array.from(document.querySelectorAll(selector)), context, []);
}

/**
 * 要素があればイベントリスナーを登録する（ハンドラの例外は wrapHandler で捕捉）
 * @param {EventTarget | null | undefined} element
 * @param {string} type
 * @param {(event: Event) => unknown} handler
 * @param {string} context
 * @returns {boolean} 登録できたら true
 */
export function safeAddListener(element, type, handler, context) {
    if (!element) {
        console.error(`${LOG_PREFIX} ${context}: cannot add "${type}" listener to a missing element`);
        return false;
    }
    element.addEventListener(type, wrapHandler(handler, context));
    return true;
}

/**
 * 数値入力欄の値を整数で読む。要素が無い・数値でない場合は fallback
 * @param {{ value?: string } | null | undefined} input
 * @param {number} fallback
 * @returns {number}
 */
export function readIntValue(input, fallback) {
    const value = parseInt(input?.value, 10);
    return Number.isNaN(value) ? fallback : value;
}
