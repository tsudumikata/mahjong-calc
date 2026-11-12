// UI表示制御モジュール

/**
 * 点数表を生成してコンテナに追加する
 * @param {Array} scoreTableData - 点数表データ
 * @param {HTMLElement} containerElement - 追加先のコンテナ要素
 */
export function generateScoreTable(scoreTableData, containerElement) {
    // 表示対象をフィルタリング（4翻以下または符数0）
    const displayRows = scoreTableData.filter(entry => entry.han <= 4 || entry.fu === 0);
    
    displayRows.forEach(entry => {
        const row = document.createElement('tr');
        [
            `${entry.han}翻`,
            entry.fu > 0 ? `${entry.fu}符` : '—',
            entry.childRon.toLocaleString(),
            entry.childTsumo,
            entry.parentRon.toLocaleString(),
            entry.parentTsumo
        ].forEach(value => appendTextElement(row, 'td', value));
        containerElement.appendChild(row);
    });
}

/**
 * 役一覧を生成してコンテナに追加する
 * @param {Array} yakuDataArray - 役データ配列
 * @param {HTMLElement} containerElement - 追加先のコンテナ要素
 */
export function generateYakuList(yakuDataArray, containerElement) {
    yakuDataArray.forEach(yaku => {
        const yakuItem = document.createElement('div');
        yakuItem.className = 'yaku-item';
        appendTextElement(yakuItem, 'div', yaku.name, 'yaku-name');
        appendTextElement(yakuItem, 'div', yaku.hanText, 'yaku-han');
        appendTextElement(yakuItem, 'div', yaku.description, 'yaku-description');
        containerElement.appendChild(yakuItem);
    });
}

/**
 * 選択した役の翻数の表示（例: 「3翻」、副露の混一色は「2翻・喰い下がり」、役満は「役満」）
 * @param {Object} yaku - 役データ
 * @param {boolean} menzen - 門前なら true、副露なら false
 * @returns {string}
 */
export function formatSelectedYakuHan(yaku, menzen = true) {
    if (yaku.han >= 13) return '役満';
    if (!menzen && Number.isInteger(yaku.openHan)) return `${yaku.openHan}翻・喰い下がり`;
    return `${yaku.han}翻`;
}

/**
 * 計算結果を表示する
 * @param {Object} result - 計算結果オブジェクト
 * @param {number} han - 翻数
 * @param {number} fu - 符数
 * @param {string} winType - 和了方法（'ron' | 'tsumo'）
 * @param {string} playerType - 親子（'parent' | 'child'）
 * @param {string} inputMode - 入力モード（'manual' | 'yaku'）
 * @param {Set} selectedYakuSet - 選択された役のセット
 * @param {Array} yakuDataArray - 役データ配列
 * @param {HTMLElement} mainResultElement - メイン結果表示要素
 * @param {HTMLElement} detailResultElement - 詳細結果表示要素
 * @param {Object|null} doraInfo - 役選択モードのドラ内訳（calculateHanBreakdown の結果+各枚数）
 * @param {Object|null} fuInfo - 符を自動計算したときの calculateFu の結果（内訳を表示する）
 */
export function displayResult(result, han, fu, winType, playerType, inputMode = 'manual', selectedYakuSet, yakuDataArray, mainResultElement, detailResultElement, doraInfo = null, fuInfo = null) {
    const winTypeText = winType === 'ron' ? 'ロン' : 'ツモ';
    const playerTypeText = playerType === 'parent' ? '親' : '子';
    
    if (winType === 'ron') {
        replaceResult(mainResultElement, playerTypeText, winTypeText, `${result.score.toLocaleString()}点`, result.name);
    } else {
        replaceResult(mainResultElement, playerTypeText, winTypeText, result.score, result.name);
    }
    
    // 詳細表示
    detailResultElement.replaceChildren();
    appendTextElement(detailResultElement, 'h4', '計算詳細');
    // 複数役満は13翻の倍数ではなく役満の数で表す（数え役満は1倍のまま）。
    const multiplier = doraInfo?.yakumanMultiplier ?? 1;
    const hanText = han >= 13 && multiplier > 1 ? `役満×${multiplier}` : `${han}翻`;
    [`翻数: ${hanText}`, `符数: ${fu}符`, `和了方法: ${winTypeText}`,
        `親子: ${playerTypeText}`, `点数名: ${result.name}`]
        .forEach(text => appendDetailItem(detailResultElement, text));
    
    // 役選択モードの場合、門前／副露と選択された役も表示
    const menzen = doraInfo?.menzen !== false;
    if (inputMode === 'yaku') appendDetailItem(detailResultElement, `門前／副露: ${menzen ? '門前' : '副露'}`);
    if (inputMode === 'yaku' && selectedYakuSet.size > 0) {
        appendDetailItem(detailResultElement, '選択された役:');
        Array.from(selectedYakuSet).forEach(yakuName => {
            const yaku = yakuDataArray.find(y => y.name === yakuName);
            if (yaku) {
                appendDetailItem(detailResultElement, `・${yaku.name} (${formatSelectedYakuHan(yaku, menzen)})`, 'yaku-detail');
            }
        });
    }

    if (inputMode === 'yaku' && doraInfo && doraInfo.doraHan > 0) {
        const counts = [['ドラ', doraInfo.doraCount], ['赤ドラ', doraInfo.redDoraCount], ['裏ドラ', doraInfo.uraDoraCount]]
            .filter(([, count]) => count > 0)
            .map(([label, count]) => `${label}${count}`)
            .join('・');
        const note = doraInfo.isYakuman ? '（役満のため加算なし）' : '';
        appendDetailItem(detailResultElement, `ドラ: ${doraInfo.appliedDoraHan}翻 (${counts})${note}`);
    }

    // 符を自動計算したときは内訳を表示する（Issue #9）
    if (fuInfo && fuInfo.breakdown.length > 0) {
        appendDetailItem(detailResultElement, '符の内訳:');
        fuInfo.breakdown.forEach(item => {
            appendDetailItem(detailResultElement, `・${item.label} ${item.fu}符`, 'yaku-detail fu-detail');
        });
        const rounded = fuInfo.fu !== fuInfo.rawFu ? ` → ${fuInfo.fu}符` : '';
        appendDetailItem(detailResultElement, `・合計 ${fuInfo.rawFu}符${rounded}`, 'yaku-detail fu-detail');
        fuInfo.notes.forEach(note => appendDetailItem(detailResultElement, `・${note.message}`, 'yaku-detail fu-detail'));
    }
    
}

/**
 * 選択された役の表示を更新する
 * @param {Set} selectedYakuSet - 選択された役のセット
 * @param {Array} yakuDataArray - 役データ配列
 * @param {HTMLElement} selectedYakuListElement - 選択役リスト表示要素
 * @param {boolean} menzen - 門前なら true、副露なら false（副露は喰い下がりの翻数を表示）
 */
export function updateSelectedYakuDisplay(selectedYakuSet, yakuDataArray, selectedYakuListElement, menzen = true) {
    if (selectedYakuSet.size === 0) {
        selectedYakuListElement.textContent = '役を選択してください';
        return;
    }
    
    const yakuNames = Array.from(selectedYakuSet).map(yakuName => {
        const yaku = yakuDataArray.find(y => y.name === yakuName);
        return yaku ? `${yaku.name} (${formatSelectedYakuHan(yaku, menzen)})` : null;
    }).filter(Boolean);

    selectedYakuListElement.replaceChildren();
    yakuNames.forEach((name, index) => {
        if (index > 0) selectedYakuListElement.appendChild(document.createElement('br'));
        selectedYakuListElement.appendChild(document.createTextNode(name));
    });
}

function appendTextElement(parent, tagName, text, className) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = String(text);
    parent.appendChild(element);
    return element;
}

function replaceResult(container, playerType, winType, score, resultName) {
    container.replaceChildren();
    appendTextElement(container, 'div', `${playerType}・${winType}`, 'result-title');
    appendTextElement(container, 'div', score, 'result-score');
    appendTextElement(container, 'div', resultName, 'result-name');
}

function appendDetailItem(container, text, additionalClass = '') {
    const item = document.createElement('div');
    item.className = `detail-item${additionalClass ? ` ${additionalClass}` : ''}`;
    appendTextElement(item, 'span', text);
    container.appendChild(item);
}

/**
 * 詳細表示の切り替えを行う
 * @param {HTMLElement} detailResultElement - 詳細結果表示要素
 * @param {HTMLElement} toggleDetailBtnElement - 詳細切り替えボタン要素
 */
export function toggleDetailDisplay(detailResultElement, toggleDetailBtnElement) {
    const computedStyle = window.getComputedStyle(detailResultElement);
    const isVisible = computedStyle.display !== 'none';
    detailResultElement.style.display = isVisible ? 'none' : 'block';
    toggleDetailBtnElement.textContent = isVisible ? '詳細を表示' : '詳細を隠す';
}
