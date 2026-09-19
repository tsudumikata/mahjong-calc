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
 */
export function displayResult(result, han, fu, winType, playerType, inputMode = 'manual', selectedYakuSet, yakuDataArray, mainResultElement, detailResultElement) {
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
    [`翻数: ${han}翻`, `符数: ${fu}符`, `和了方法: ${winTypeText}`,
        `親子: ${playerTypeText}`, `点数名: ${result.name}`]
        .forEach(text => appendDetailItem(detailResultElement, text));
    
    // 役選択モードの場合、選択された役も表示
    if (inputMode === 'yaku' && selectedYakuSet.size > 0) {
        appendDetailItem(detailResultElement, '選択された役:');
        Array.from(selectedYakuSet).forEach(yakuName => {
            const yaku = yakuDataArray.find(y => y.name === yakuName);
            if (yaku) {
                appendDetailItem(detailResultElement, `・${yaku.name} (${yaku.hanText})`, 'yaku-detail');
            }
        });
    }
    
}

/**
 * 選択された役の表示を更新する
 * @param {Set} selectedYakuSet - 選択された役のセット
 * @param {Array} yakuDataArray - 役データ配列
 * @param {HTMLElement} selectedYakuListElement - 選択役リスト表示要素
 */
export function updateSelectedYakuDisplay(selectedYakuSet, yakuDataArray, selectedYakuListElement) {
    if (selectedYakuSet.size === 0) {
        selectedYakuListElement.textContent = '役を選択してください';
        return;
    }
    
    const yakuNames = Array.from(selectedYakuSet).map(yakuName => {
        const yaku = yakuDataArray.find(y => y.name === yakuName);
        return yaku ? `${yaku.name} (${yaku.hanText})` : null;
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
