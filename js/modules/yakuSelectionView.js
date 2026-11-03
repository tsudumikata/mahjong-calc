// 役検証の表示。ルール自体は yakuValidation.js だけで定義する。
import { yakuData } from '../data/yakuData.js';
import { DORA_LIMITS, RIICHI_YAKU } from '../data/constants.js';
import { calculateHanBreakdown } from './validator.js';

const issueLabels = {
    structure: '成立条件の矛盾',
    duplicate: '重複計上',
    prerequisite: '前提役',
    condition: '和了条件',
    unknown: '未定義の役'
};

export function showYakuIssues(issues, id = 'yakuValidationErrors') {
    const container = document.getElementById(id);
    if (!container) return;
    container.replaceChildren();
    container.hidden = issues.length === 0;
    if (!issues.length) return;
    const list = document.createElement('ul');
    issues.forEach(issue => {
        const item = document.createElement('li');
        item.textContent = `${issueLabels[issue.type] || '選択の確認'}: ${issue.message}`;
        list.appendChild(item);
    });
    container.appendChild(list);
}

export function clearYakuFeedback() {
    showYakuIssues([], 'yakuValidationFeedback');
}

export function hideCalculationResult(elements) {
    if (elements.resultSection) elements.resultSection.style.display = 'none';
    if (elements.mainResult) elements.mainResult.replaceChildren();
    if (elements.detailResult) {
        elements.detailResult.replaceChildren();
        elements.detailResult.style.display = 'none';
    }
    if (elements.toggleDetailBtn) elements.toggleDetailBtn.textContent = '詳細を表示';
}

export function renderYakuValidation(state, validation, elements) {
    const invalid = state.inputMode === 'yaku' && !validation.valid;
    showYakuIssues(invalid ? validation.issues : []);
    if (elements.totalHan) {
        elements.totalHan.textContent = validation.valid
            ? (state.totalHan >= 13 ? '役満' : `${state.totalHan}翻`)
            : '選択を確認';
    }
    const breakdown = calculateHanBreakdown(state.selectedYaku, yakuData, state);
    const yakumanNote = document.getElementById('yakumanScoringNote');
    // 数え役満（通常役+ドラ）では一般役を加算するため、役満選択時だけ表示する。
    if (yakumanNote) yakumanNote.hidden = invalid || !breakdown.isYakuman;
    renderHanBreakdown(breakdown, validation.valid);
    renderDoraInputs(state);
    const invalidNames = new Set(validation.issues.flatMap(issue => issue.yaku));
    document.querySelectorAll('.yaku-checkbox input').forEach(checkbox => {
        checkbox.checked = state.selectedYaku.has(checkbox.value);
        checkbox.setAttribute('aria-invalid', String(invalid && invalidNames.has(checkbox.value)));
    });
    // 一括更新もフォームに反映し、表示上の選択と計算条件を揃える。
    for (const key of ['inputMode', 'winType', 'playerType']) {
        document.querySelectorAll(`input[name="${key}"]`).forEach(radio => {
            radio.checked = radio.value === state[key];
        });
    }
    if (elements.fuYakuInput) {
        elements.fuYakuInput.setAttribute('aria-invalid', String(invalid));
        if (invalid) elements.fuYakuInput.value = '';
    }
    if (invalid) {
        document.querySelectorAll('[data-target="fuYaku"]').forEach(button => {
            button.disabled = true;
            button.classList.add('disabled');
        });
    }
}

// 役とドラの内訳。ドラが0枚なら表示しない。
function renderHanBreakdown({ yakuHan, doraHan, appliedDoraHan, isYakuman }, valid) {
    const element = document.getElementById('hanBreakdown');
    if (!element) return;
    let text = '';
    if (valid && doraHan > 0) {
        if (yakuHan === 0) text = `ドラ${doraHan}翻は役がないため加算しません。`;
        else if (isYakuman) text = `役満のためドラ${doraHan}翻は加算しません。`;
        else text = `役 ${yakuHan}翻 + ドラ ${appliedDoraHan}翻`;
    }
    element.textContent = text;
    element.hidden = text === '';
}

// 一括更新・リセット後もドラの表示と状態を揃える。裏ドラは立直時のみ増やせる。
function renderDoraInputs(state) {
    const hasRiichi = RIICHI_YAKU.some(name => state.selectedYaku.has(name));
    for (const kind of Object.keys(DORA_LIMITS)) {
        const target = kind.replace(/Count$/, '');
        const input = document.getElementById(`${target}Input`);
        const count = state[kind] ?? 0;
        if (input) input.value = String(count);
        for (const action of ['increase', 'decrease']) {
            const button = document.querySelector(`[data-target="${target}"][data-action="${action}"]`);
            if (!button) continue;
            const disabled = action === 'increase'
                ? count >= DORA_LIMITS[kind] || (kind === 'uraDoraCount' && !hasRiichi)
                : count <= 0;
            button.disabled = disabled;
            button.classList.toggle('disabled', disabled);
        }
    }
}
