import test from 'node:test';
import assert from 'node:assert/strict';
import {
    safeRun,
    safeStateOperation,
    wrapHandler,
    safeGetElement,
    safeQuerySelector,
    safeQuerySelectorAll,
    safeAddListener,
    readIntValue
} from '../../js/modules/errorHandler.js';
import { createStateManager } from '../../js/modules/stateManager.js';

// console.error を一時的に差し替えてログを集める
function captureErrors(t) {
    const logs = [];
    t.mock.method(console, 'error', (...args) => logs.push(args.map(String).join(' ')));
    return logs;
}

// テスト用の最小限の document
function stubDocument(t, { elements = {}, selectors = {} } = {}) {
    globalThis.document = {
        getElementById: id => elements[id] ?? null,
        querySelector: selector => {
            if (selector === '!!invalid') throw new SyntaxError('invalid selector');
            return selectors[selector]?.[0] ?? null;
        },
        querySelectorAll: selector => {
            if (selector === '!!invalid') throw new SyntaxError('invalid selector');
            return selectors[selector] ?? [];
        }
    };
    t.after(() => { delete globalThis.document; });
}

test('safeRun: 成功時は戻り値、例外時はフォールバック値を返して文脈をログに残す', t => {
    const logs = captureErrors(t);
    assert.equal(safeRun(() => 42, 'ok'), 42);
    assert.equal(safeRun(() => { throw new Error('boom'); }, 'calc', 'fallback'), 'fallback');
    assert.equal(logs.length, 1);
    assert.match(logs[0], /^\[ErrorHandler\] calc:.*boom/);
});

test('safeStateOperation: 失敗したら復旧処理を実行して false を返す', t => {
    captureErrors(t);
    let recovered = false;
    assert.equal(safeStateOperation(() => {}, null, 'noop'), true);
    assert.equal(safeStateOperation(() => { throw new Error('state'); }, () => { recovered = true; }, 'set'), false);
    assert.equal(recovered, true);
});

test('safeStateOperation: 復旧処理自体の例外も外に漏らさない', t => {
    const logs = captureErrors(t);
    assert.doesNotThrow(() => safeStateOperation(
        () => { throw new Error('first'); },
        () => { throw new Error('second'); },
        'reset'
    ));
    assert.equal(logs.length, 2);
    assert.match(logs[1], /reset \(recovery\)/);
});

test('safeStateOperation: StateManager の操作に失敗してもリセットで既定状態に戻せる', t => {
    captureErrors(t);
    const manager = createStateManager();
    const ok = safeStateOperation(
        () => {
            // 一部だけ更新したところで失敗した、という状況
            manager.setHan(5);
            manager.addYaku('立直');
            throw new Error('mid-operation');
        },
        () => manager.resetState(),
        'update'
    );
    assert.equal(ok, false);
    assert.deepEqual(manager.getState(), createStateManager().getState());
});

test('wrapHandler: ハンドラの例外を捕捉して呼び出し元に投げない', t => {
    captureErrors(t);
    const handler = wrapHandler(() => { throw new Error('click'); }, 'onClick');
    assert.doesNotThrow(() => handler({}));
});

test('safeGetElement: 要素があれば返し、無ければ null とログ', t => {
    const logs = captureErrors(t);
    const element = { id: 'hanInput' };
    stubDocument(t, { elements: { hanInput: element } });
    assert.equal(safeGetElement('hanInput', 'init'), element);
    assert.equal(safeGetElement('missing', 'init'), null);
    assert.deepEqual(logs, ['[ErrorHandler] init: element not found: #missing']);
});

test('safeQuerySelector / safeQuerySelectorAll: 不正なセレクタでも例外を出さない', t => {
    const logs = captureErrors(t);
    const buttons = [{}, {}];
    stubDocument(t, { selectors: { '.number-btn': buttons } });
    assert.deepEqual(safeQuerySelectorAll('.number-btn', 'setup'), buttons);
    assert.deepEqual(safeQuerySelectorAll('!!invalid', 'setup'), []);
    assert.equal(safeQuerySelector('!!invalid', 'setup'), null);
    assert.equal(safeQuerySelector('.none', 'setup'), null);
    assert.equal(logs.length, 2, '任意の要素が無いだけではログを出さない');
    assert.equal(safeQuerySelector('.none', 'setup', { required: true }), null);
    assert.equal(logs.length, 3);
});

test('safeAddListener: 要素が無ければ登録せず false、あればハンドラを包んで登録する', t => {
    captureErrors(t);
    assert.equal(safeAddListener(null, 'click', () => {}, 'missing'), false);
    let registered;
    const element = { addEventListener: (type, listener) => { registered = { type, listener }; } };
    assert.equal(safeAddListener(element, 'click', () => { throw new Error('x'); }, 'btn'), true);
    assert.equal(registered.type, 'click');
    assert.doesNotThrow(() => registered.listener({}));
});

test('readIntValue: 要素が無い・数値でないときはフォールバック', () => {
    assert.equal(readIntValue({ value: '40' }, 30), 40);
    assert.equal(readIntValue({ value: '' }, 30), 30);
    assert.equal(readIntValue(null, 1), 1);
    assert.ok(Number.isNaN(readIntValue(undefined, NaN)));
});

test('handleNumberInput: 状態更新が途中で失敗したら、入力欄を確定済みの状態値に合わせる', async t => {
    captureErrors(t);
    const fuInput = { value: '30' };
    stubDocument(t, { elements: { fuInput } });
    const { createEventHandlers } = await import('../../js/modules/eventHandlers.js');
    const manager = createStateManager();
    manager.setHan(2);
    manager.setFu(30);
    // 値を確定させたあとで例外を出す setFu
    const originalSetFu = manager.setFu.bind(manager);
    manager.setFu = value => {
        originalSetFu(value);
        throw new Error('after commit');
    };
    const handlers = createEventHandlers(manager, [], { hanInput: { value: '2' } });
    assert.doesNotThrow(() => handlers.handleNumberInput({ target: { dataset: { action: 'increase', target: 'fu' } } }));
    assert.equal(manager.getState().currentFu, 40);
    assert.equal(fuInput.value, '40');
});
