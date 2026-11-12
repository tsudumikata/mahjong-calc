// 麻雀バリデーション・状態管理モジュール
// グローバル状態を引数で受け取る純粋関数群

/**
 * 門前／副露に応じた役の翻数（Issue #49）
 * 副露なら喰い下がり（yakuData の openHan）を使う。門前限定役を副露で選ぶ矛盾は
 * yakuValidation.js の menzen-only が判定し、ここでは翻数を変えない。
 * @param {Object} yaku - 役データ
 * @param {boolean} menzen - 門前なら true、副露なら false
 * @returns {number}
 */
export function getYakuHan(yaku, menzen = true) {
    return !menzen && Number.isInteger(yaku.openHan) ? yaku.openHan : yaku.han;
}

/**
 * 選択された役から合計翻数を計算
 * @param {Set} selectedYakuSet - 選択された役のSet
 * @param {Array} yakuDataArray - 役データ配列
 * @param {boolean} menzen - 門前なら true、副露なら false（副露は喰い下がりを適用）
 * @returns {number} 合計翻数（役満の場合は役満の数に関わらず13。倍率は countYakuman）
 */
export function calculateTotalHan(selectedYakuSet, yakuDataArray, menzen = true) {
    let total = 0;
    let hasYakuman = false;
    
    selectedYakuSet.forEach(yakuName => {
        const yaku = yakuDataArray.find(y => y.name === yakuName);
        if (yaku) {
            if (yaku.han >= 13) {
                hasYakuman = true;
            } else {
                total += getYakuHan(yaku, menzen);
            }
        }
    });
    
    // 役満がある場合は役満として扱う
    return hasYakuman ? 13 : total;
}

/**
 * 選択された役満の数（複数役満の倍率）
 * 役満同士は複合し、役満1つにつき1倍を加える（大三元+字一色 = ダブル役満）。
 * 四暗刻単騎などを単独でダブル役満とする扱いは採用しない。
 * @param {Set} selectedYakuSet - 選択された役のSet
 * @param {Array} yakuDataArray - 役データ配列
 * @returns {number} 役満の数（役満がなければ0）
 */
export function countYakuman(selectedYakuSet, yakuDataArray) {
    return Array.from(selectedYakuSet).filter(yakuName => {
        const yaku = yakuDataArray.find(y => y.name === yakuName);
        return Boolean(yaku && yaku.han >= 13);
    }).length;
}

/**
 * 役満が選択されているか
 * @param {Set} selectedYakuSet - 選択された役のSet
 * @param {Array} yakuDataArray - 役データ配列
 * @returns {boolean}
 */
export function hasYakumanYaku(selectedYakuSet, yakuDataArray) {
    return countYakuman(selectedYakuSet, yakuDataArray) > 0;
}

/**
 * ドラ・赤ドラ・裏ドラの合計翻数
 * @param {Object} doraState - { doraCount, redDoraCount, uraDoraCount }
 * @returns {number}
 */
export function calculateDoraHan({ doraCount = 0, redDoraCount = 0, uraDoraCount = 0 } = {}) {
    return doraCount + redDoraCount + uraDoraCount;
}

/**
 * 役とドラを合わせた翻数の内訳を返す
 * - ドラは役ではないため、役がない場合は0翻（和了不可）
 * - 役満にはドラを加算しない
 * - 通常役+ドラが13翻以上なら数え役満として getScoreFromTable が扱う（倍率は1のまま）
 * - yakumanMultiplier は選択した役満の数。数え役満や通常役では1
 * - 副露（menzen: false）なら喰い下がりを適用する（Issue #49）。省略時は門前
 * @param {Set} selectedYakuSet - 選択された役のSet
 * @param {Array} yakuDataArray - 役データ配列
 * @param {Object} doraState - { doraCount, redDoraCount, uraDoraCount, menzen }（StateManager の状態をそのまま渡せる）
 * @returns {{ yakuHan: number, doraHan: number, appliedDoraHan: number, totalHan: number, isYakuman: boolean, yakumanMultiplier: number, menzen: boolean }}
 */
export function calculateHanBreakdown(selectedYakuSet, yakuDataArray, doraState = {}) {
    const menzen = doraState.menzen !== false;
    const yakuHan = calculateTotalHan(selectedYakuSet, yakuDataArray, menzen);
    const doraHan = calculateDoraHan(doraState);
    const yakumanCount = countYakuman(selectedYakuSet, yakuDataArray);
    const isYakuman = yakumanCount > 0;
    const appliedDoraHan = (yakuHan === 0 || isYakuman) ? 0 : doraHan;
    return {
        yakuHan, doraHan, appliedDoraHan, totalHan: yakuHan + appliedDoraHan, isYakuman,
        yakumanMultiplier: Math.max(1, yakumanCount), menzen
    };
}

/**
 * 役とドラを合わせた合計翻数
 * @param {Set} selectedYakuSet - 選択された役のSet
 * @param {Array} yakuDataArray - 役データ配列
 * @param {Object} doraState - { doraCount, redDoraCount, uraDoraCount, menzen }
 * @returns {number}
 */
export function calculateTotalHanWithDora(selectedYakuSet, yakuDataArray, doraState = {}) {
    return calculateHanBreakdown(selectedYakuSet, yakuDataArray, doraState).totalHan;
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

/**
 * 符数の増減ボタンで次に表示する符数
 * 有効な符数の一覧を順にたどる（2〜4翻なら 20→25→30→40…）。端では現在値のまま。
 * @param {number[]} fuList - 昇順の有効な符数
 * @param {number} currentFu - 現在の符数
 * @param {string} action - 'increase' | 'decrease'
 * @returns {number} 次の符数
 */
export function getSteppedFu(fuList, currentFu, action) {
    if (action === 'increase') return fuList.find(fu => fu > currentFu) ?? currentFu;
    if (action === 'decrease') return fuList.findLast(fu => fu < currentFu) ?? currentFu;
    return currentFu;
}
