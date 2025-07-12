// 麻雀点数計算モジュール
// 純粋関数群 - 副作用なし、同じ入力で同じ出力を保証

import { scoreTable } from '../data/scoreTable.js';

/**
 * 翻数・符数・和了方法・親子から点数を取得
 * @param {number} han - 翻数
 * @param {number} fu - 符数
 * @param {string} winType - 和了方法 ('ron' | 'tsumo')
 * @param {string} playerType - 親子 ('parent' | 'child')
 * @param {Array} scoreTableData - 点数テーブル（依存注入、デフォルトはscoreTable）
 * @returns {Object|null} 点数情報オブジェクト
 */
export function getScoreFromTable(han, fu, winType, playerType, scoreTableData = scoreTable) {
    // 役満の場合
    if (han >= 13) {
        return {
            score: playerType === 'parent' ? 48000 : 32000,
            tsumoScore: playerType === 'parent' ? "16000" : "8000/16000"
        };
    }
    
    // 跳満以上の場合
    if (han >= 5) {
        const entry = scoreTableData.find(entry => entry.han === han);
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
 * @returns {string} 点数名
 */
export function getScoreName(han, fu) {
    if (han >= 13) return "役満";
    if (han >= 11) return "三倍満";
    if (han >= 8) return "倍満";
    if (han >= 6) return "跳満";
    if (han === 5) return "満貫";
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
 * @returns {Object|null} 統合された計算結果
 */
export function calculateScoreResult(han, fu, winType, playerType, scoreTableData = scoreTable) {
    const scoreInfo = getScoreFromTable(han, fu, winType, playerType, scoreTableData);
    
    if (!scoreInfo) return null;
    
    return {
        ...scoreInfo,
        name: getScoreName(han, fu),
        han,
        fu,
        winType,
        playerType
    };
}