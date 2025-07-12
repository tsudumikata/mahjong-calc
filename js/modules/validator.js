// 麻雀バリデーション・状態管理モジュール
// グローバル状態を引数で受け取る純粋関数群

/**
 * 選択された役から合計翻数を計算
 * @param {Set} selectedYakuSet - 選択された役のSet
 * @param {Array} yakuDataArray - 役データ配列
 * @returns {number} 合計翻数（役満の場合は13）
 */
export function calculateTotalHan(selectedYakuSet, yakuDataArray) {
    let total = 0;
    let hasYakuman = false;
    
    selectedYakuSet.forEach(yakuName => {
        const yaku = yakuDataArray.find(y => y.name === yakuName);
        if (yaku) {
            if (yaku.han >= 13) {
                hasYakuman = true;
            } else {
                total += yaku.han;
            }
        }
    });
    
    // 役満がある場合は役満として扱う
    return hasYakuman ? 13 : total;
}

/**
 * 特殊役（固定符数）が選択されているかチェック
 * @param {Set} selectedYakuSet - 選択された役のSet
 * @param {Object} specialYakuFuRulesObj - 特殊役符数ルールオブジェクト
 * @returns {boolean} 特殊役が選択されているか
 */
export function hasSpecialYaku(selectedYakuSet, specialYakuFuRulesObj) {
    return Array.from(selectedYakuSet).some(yakuName => 
        specialYakuFuRulesObj.hasOwnProperty(yakuName)
    );
}

/**
 * 平和が選択されているかチェック
 * @param {Set} selectedYakuSet - 選択された役のSet
 * @returns {boolean} 平和が選択されているか
 */
export function hasPinfu(selectedYakuSet) {
    return selectedYakuSet.has('平和');
}

/**
 * 特殊役の必要符数を取得
 * @param {Set} selectedYakuSet - 選択された役のSet
 * @param {Object} specialYakuFuRulesObj - 特殊役符数ルールオブジェクト
 * @returns {number|null} 必要符数（特殊役がない場合はnull）
 */
export function getRequiredFuForSpecialYaku(selectedYakuSet, specialYakuFuRulesObj) {
    for (const yakuName of selectedYakuSet) {
        if (specialYakuFuRulesObj.hasOwnProperty(yakuName)) {
            return specialYakuFuRulesObj[yakuName];
        }
    }
    return null;
}

/**
 * 平和の符数を取得（和了方法によって動的に変化）
 * @param {string} winType - 和了方法 ('ron' | 'tsumo')
 * @returns {number} 平和の符数
 */
export function getPinfuFu(winType) {
    return winType === 'ron' ? 30 : 20;
}

/**
 * 翻数に基づいて符数を検証・調整する
 * @param {number} han - 翻数
 * @param {number} currentFu - 現在の符数
 * @param {Object} validFuByHanObj - 翻数別有効符数オブジェクト
 * @returns {number|null} 調整後の符数（5翻以上の場合はnull）
 */
export function validateAndAdjustFu(han, currentFu, validFuByHanObj) {
    const validFuList = validFuByHanObj[han] || [];
    
    // 5翻以上は符数無関係
    if (han >= 5) {
        return null; // 符数無関係を示す
    }
    
    // 現在の符数が有効な場合はそのまま
    if (validFuList.includes(currentFu)) {
        return currentFu;
    }
    
    // 無効な場合は最も近い有効な符数に調整
    if (validFuList.length > 0) {
        // 現在の符数より大きい最小の有効符数を探す
        const higherFu = validFuList.find(fu => fu >= currentFu);
        if (higherFu) {
            return higherFu;
        }
        
        // 見つからない場合は最大の有効符数
        return validFuList[validFuList.length - 1];
    }
    
    return currentFu; // デフォルト
}