// 役検証の表示。ルール自体は yakuValidation.js だけで定義する。
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
    const yakumanNote = document.getElementById('yakumanScoringNote');
    if (yakumanNote) yakumanNote.hidden = invalid || state.totalHan < 13;
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
