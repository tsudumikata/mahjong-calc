// 麻雀点数計算モジュール
// 純粋関数群 - 副作用なし、同じ入力で同じ出力を保証

import { scoreTable } from '../data/scoreTable.js';

// 切り上げ満貫は適用しない（3翻60符・4翻30符は通常点）。
function isMangan(han, fu) {
    return han === 5 || (han === 3 && fu >= 70) || (han === 4 && fu >= 40);
}

// 複数役満の倍率。役満が選ばれていない（数え役満を含む）場合は1倍。
function normalizeYakumanMultiplier(yakumanMultiplier) {
    return Number.isInteger(yakumanMultiplier) && yakumanMultiplier > 1 ? yakumanMultiplier : 1;
}

/**
 * 役満の倍率から点数名を返す（1: 役満、2: ダブル役満、3: トリプル役満、4以上: N倍役満）
 * @param {number} yakumanMultiplier - 役満の倍率
 * @returns {string} 点数名
 */
export function getYakumanName(yakumanMultiplier = 1) {
    const multiplier = normalizeYakumanMultiplier(yakumanMultiplier);
    if (multiplier === 1) return "役満";
    if (multiplier === 2) return "ダブル役満";
    if (multiplier === 3) return "トリプル役満";
    return `${multiplier}倍役満`;
}

/**
 * 翻数・符数・和了方法・親子から点数を取得
 * @param {number} han - 翻数
 * @param {number} fu - 符数
 * @param {string} winType - 和了方法 ('ron' | 'tsumo')
 * @param {string} playerType - 親子 ('parent' | 'child')
 * @param {Array} scoreTableData - 点数テーブル（依存注入、デフォルトはscoreTable）
 * @param {number} yakumanMultiplier - 役満の倍率（複数役満の数。13翻以上のときだけ使う）
 * @returns {Object|null} 点数情報オブジェクト
 */
export function getScoreFromTable(han, fu, winType, playerType, scoreTableData = scoreTable, yakumanMultiplier = 1) {
    // 役満の場合。複数役満は役満の点数を倍率分だけ掛ける。
    if (han >= 13) {
        const multiplier = normalizeYakumanMultiplier(yakumanMultiplier);
        const childPayment = 8000 * multiplier;
        const parentPayment = 16000 * multiplier;
        return {
            score: winType === 'ron' ?
                (playerType === 'parent' ? 48000 * multiplier : 32000 * multiplier) :
                (playerType === 'parent' ? `${parentPayment}` : `${childPayment}/${parentPayment}`)
        };
    }
    
    // 満貫以上の場合（3翻70符以上・4翻40符以上も5翻の点数を使用）
    if (han >= 5 || isMangan(han, fu)) {
        const scoreHan = isMangan(han, fu) ? 5 : han;
        const entry = scoreTableData.find(entry => entry.han === scoreHan);
        if (entry) {
            return {
                score: winType === 'ron' ? 
                    (playerType === 'parent' ? entry.parentRon : entry.childRon) :
                    (playerType === 'parent' ? entry.parentTsumo : entry.childTsumo)
            };
        }
    }
    
    // 通常の場合
    const entry = scoreTableData.find(entry => entry.han === han && entry.fu === fu);
    if (entry) {
        return {
            score: winType === 'ron' ? 
                (playerType === 'parent' ? entry.parentRon : entry.childRon) :
                (playerType === 'parent' ? entry.parentTsumo : entry.childTsumo)
        };
    }
    
    return null;
}

/**
 * 翻数・符数から点数名を取得
 * @param {number} han - 翻数
 * @param {number} fu - 符数（5翻以上では無視）
 * @param {number} yakumanMultiplier - 役満の倍率（13翻以上のときだけ使う）
 * @returns {string} 点数名
 */
export function getScoreName(han, fu, yakumanMultiplier = 1) {
    if (han >= 13) return getYakumanName(yakumanMultiplier);
    if (han >= 11) return "三倍満";
    if (han >= 8) return "倍満";
    if (han >= 6) return "跳満";
    if (isMangan(han, fu)) return "満貫";
    return `${han}翻${fu}符`;
}

/**
 * 計算結果を統合してオブジェクトで返す
 * 計算ロジックとUI制御の分離のための新規関数
 * @param {number} han - 翻数
 * @param {number} fu - 符数
 * @param {string} winType - 和了方法
 * @param {string} playerType - 親子
 * @param {Array} scoreTableData - 点数テーブル（依存注入）
 * @param {number} yakumanMultiplier - 役満の倍率（複数役満の数。13翻以上のときだけ使う）
 * @returns {Object|null} 統合された計算結果
 */
export function calculateScoreResult(han, fu, winType, playerType, scoreTableData = scoreTable, yakumanMultiplier = 1) {
    const scoreInfo = getScoreFromTable(han, fu, winType, playerType, scoreTableData, yakumanMultiplier);
    
    if (!scoreInfo) return null;
    
    return {
        ...scoreInfo,
        name: getScoreName(han, fu, yakumanMultiplier),
        han,
        fu,
        winType,
        playerType
    };
}
