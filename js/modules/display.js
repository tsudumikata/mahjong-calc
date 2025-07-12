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
        row.innerHTML = `
            <td>${entry.han}翻</td>
            <td>${entry.fu > 0 ? entry.fu + '符' : '—'}</td>
            <td>${entry.childRon.toLocaleString()}</td>
            <td>${entry.childTsumo}</td>
            <td>${entry.parentRon.toLocaleString()}</td>
            <td>${entry.parentTsumo}</td>
        `;
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
        yakuItem.innerHTML = `
            <div class="yaku-name">${yaku.name}</div>
            <div class="yaku-han">${yaku.hanText}</div>
            <div class="yaku-description">${yaku.description}</div>
        `;
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
        mainResultElement.innerHTML = `
            <div class="result-title">${playerTypeText}・${winTypeText}</div>
            <div class="result-score">${result.score.toLocaleString()}点</div>
            <div class="result-name">${result.name}</div>
        `;
    } else {
        mainResultElement.innerHTML = `
            <div class="result-title">${playerTypeText}・${winTypeText}</div>
            <div class="result-score">${result.score}</div>
            <div class="result-name">${result.name}</div>
        `;
    }
    
    // 詳細表示
    let detailHTML = `
        <h4>計算詳細</h4>
        <div class="detail-item">
            <span>翻数: ${han}翻</span>
        </div>
        <div class="detail-item">
            <span>符数: ${fu}符</span>
        </div>
        <div class="detail-item">
            <span>和了方法: ${winTypeText}</span>
        </div>
        <div class="detail-item">
            <span>親子: ${playerTypeText}</span>
        </div>
        <div class="detail-item">
            <span>点数名: ${result.name}</span>
        </div>
    `;
    
    // 役選択モードの場合、選択された役も表示
    if (inputMode === 'yaku' && selectedYakuSet.size > 0) {
        detailHTML += `
            <div class="detail-item">
                <span>選択された役:</span>
            </div>
        `;
        Array.from(selectedYakuSet).forEach(yakuName => {
            const yaku = yakuDataArray.find(y => y.name === yakuName);
            if (yaku) {
                detailHTML += `
                    <div class="detail-item yaku-detail">
                        <span>・${yaku.name} (${yaku.hanText})</span>
                    </div>
                `;
            }
        });
    }
    
    detailResultElement.innerHTML = detailHTML;
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
        return `${yaku.name} (${yaku.hanText})`;
    });
    
    selectedYakuListElement.innerHTML = yakuNames.join('<br>');
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