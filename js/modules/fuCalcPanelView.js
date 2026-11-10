// 符を計算するパネルの表示（Issue #9）。符の計算は fuCalculator.js、状態は StateManager が持つ。
// パネルの入力は状態から描き直し、リセットや一括更新でも表示と状態を揃える。

const MELD_COUNT = 4;

function setText(element, lines) {
    element.replaceChildren();
    lines.forEach(line => {
        const item = document.createElement('p');
        item.textContent = line;
        element.appendChild(item);
    });
    element.hidden = lines.length === 0;
}

/**
 * 内訳を1行の式にする（例: 副底20 ＋ 門前ロン10 ＋ 暗刻（幺九牌）8 ＝ 38符 → 40符）
 * @param {Object} result - calculateFu の戻り値
 * @returns {string}
 */
export function formatFuFormula(result) {
    if (!result || result.breakdown.length === 0) return '';
    const sum = result.breakdown.map(item => `${item.label}${item.fu}`).join(' ＋ ');
    const rounded = result.fu !== null && result.fu !== result.rawFu ? ` → ${result.fu}符` : '';
    return `${sum} ＝ ${result.rawFu}符${rounded}`;
}

function syncControls(composition) {
    document.querySelectorAll('input[name="fuMenzen"]').forEach(radio => {
        radio.checked = (radio.value === 'menzen') === composition.menzen;
    });
    const wait = document.getElementById('fuWait');
    if (wait) wait.value = composition.wait;
    const pair = document.getElementById('fuPair');
    if (pair) pair.value = composition.pair;
    for (let index = 0; index < MELD_COUNT; index++) {
        const meld = composition.melds[index];
        const type = document.getElementById(`fuMeldType${index}`);
        const terminal = document.getElementById(`fuMeldTerminal${index}`);
        if (type) type.value = meld.type;
        if (terminal) {
            terminal.checked = meld.terminal;
            // 順子は幺九牌でも符がつかないため選べなくする
            terminal.disabled = meld.type === 'shuntsu';
            terminal.closest('label')?.classList.toggle('disabled', terminal.disabled);
        }
    }
}

/**
 * パネルを描き直す
 * @param {Object} state - StateManager の状態
 * @param {Object} auto - fuCalculator.js の resolveAutoFu の戻り値
 * @param {Object} elements - { fuInput, fuYakuInput }
 */
export function renderFuCalcPanel(state, auto, elements = {}) {
    const toggle = document.getElementById('fuAutoToggle');
    if (toggle) toggle.checked = state.fuAutoEnabled;
    const fields = document.getElementById('fuCalcFields');
    if (fields) fields.hidden = !state.fuAutoEnabled;
    syncControls(state.fuComposition);

    const issues = document.getElementById('fuCalcIssues');
    if (issues) {
        issues.replaceChildren();
        const list = document.createElement('ul');
        auto.issues.forEach(issue => {
            const item = document.createElement('li');
            item.textContent = issue.message;
            list.appendChild(item);
        });
        if (auto.issues.length) issues.appendChild(list);
        issues.hidden = auto.issues.length === 0;
    }

    const resultElement = document.getElementById('fuCalcResult');
    if (resultElement) {
        const lines = [];
        if (auto.fixed) {
            lines.push(`${auto.fixed.yaku}を選んでいるため、符は${auto.fixed.fu}符に固定します（自動計算は使いません）。`);
        } else if (auto.fuNotUsed) {
            lines.push('5翻以上は符を使わないため、自動計算の符は使いません。');
        } else if (auto.active) {
            const formula = formatFuFormula(auto.result);
            if (formula) lines.push(formula);
            auto.result.notes.forEach(note => lines.push(note.message));
        }
        setText(resultElement, lines);
    }

    // 符を決められないときは、古い符を有効な値に見せない
    const input = state.inputMode === 'manual' ? elements.fuInput : elements.fuYakuInput;
    if (input && auto.active && auto.fu === null) {
        input.value = '';
        input.setAttribute('aria-invalid', 'true');
    } else if (input === elements.fuInput && input) {
        input.setAttribute('aria-invalid', 'false');
    }
}
