// 符の自動計算（Issue #9）
// 和了形の内訳（門前／副露・待ち・雀頭・面子4つ）から符を求める純粋関数。
// 牌姿の入力や面子分解は行わない。役の組み合わせの検証は yakuValidation.js の責務で、
// ここでは符の内訳として成り立たない入力だけを issues として返す。
//
// 七対子（25符）・平和（ツモ20符／ロン30符）の固定符は、役の選択から決まるため
// 呼び出し側（stateSubscriptions.js の updateFuForYakuSelection）で優先する。

import { FU_RULES } from '../data/constants.js';

const MELD_LABELS = Object.freeze({
    shuntsu: '順子',
    minko: '明刻',
    anko: '暗刻',
    minkan: '明槓',
    ankan: '暗槓'
});

const PAIR_LABELS = Object.freeze({
    plain: '数牌・客風牌',
    yakuhai: '役牌',
    doubleWind: '連風牌'
});

const WAIT_LABELS = Object.freeze({
    ryanmen: '両面',
    shanpon: 'シャンポン',
    kanchan: '嵌張',
    penchan: '辺張',
    tanki: '単騎'
});

// 順子を含まないと成り立たない待ち
const SHUNTSU_WAITS = new Set(['ryanmen', 'kanchan', 'penchan']);

const has = (table, key) => typeof key === 'string' && Object.hasOwn(table, key);

/**
 * 入力の形を確かめ、問題があれば issues に積む
 * @returns {boolean} 計算を続けられる形か
 */
function checkShape(composition, winType, issues) {
    const invalid = message => issues.push({ code: 'invalid-input', message });
    if (!composition || typeof composition !== 'object') {
        invalid('符の内訳が入力されていません。');
        return false;
    }
    const { menzen, wait, pair, melds } = composition;
    if (typeof menzen !== 'boolean') invalid('門前か副露かを選んでください。');
    if (!has(WAIT_LABELS, wait)) invalid('待ちの形を選んでください。');
    if (!has(PAIR_LABELS, pair)) invalid('雀頭の種類を選んでください。');
    if (winType !== 'ron' && winType !== 'tsumo') invalid('ロンかツモかを選んでください。');
    if (!Array.isArray(melds) || melds.length !== 4) {
        invalid('面子を4つ入力してください。');
    } else {
        melds.forEach((meld, index) => {
            if (!meld || !has(MELD_LABELS, meld.type) || typeof meld.terminal !== 'boolean') {
                invalid(`${index + 1}つ目の面子の種類を選んでください。`);
            }
        });
    }
    return issues.length === 0;
}

/**
 * 形は正しいが、和了形として両立しない組み合わせを issues に積む
 */
function checkConsistency({ menzen, wait, melds }, winType, issues) {
    const count = type => melds.filter(meld => meld.type === type).length;
    const shuntsu = count('shuntsu');
    const minko = count('minko');
    const anko = count('anko');

    if (menzen && count('minkan') > 0) {
        issues.push({ code: 'menzen-minkan', message: '明槓は鳴いて作る面子のため、門前では選べません。副露を選ぶか暗槓に直してください。' });
    }
    // 門前の明刻は、シャンポン待ちをロンで完成させた刻子1つだけ
    const menzenMinkoAllowed = wait === 'shanpon' && winType === 'ron' ? 1 : 0;
    if (menzen && minko > menzenMinkoAllowed) {
        issues.push({
            code: 'menzen-minko',
            message: menzenMinkoAllowed
                ? '門前で明刻になるのは、シャンポン待ちをロンで完成させた刻子1つだけです。'
                : '門前で明刻を選べるのは、シャンポン待ちをロンで完成させた刻子だけです。暗刻に直すか副露を選んでください。'
        });
    }
    if (wait === 'shanpon' && winType === 'ron' && minko === 0) {
        issues.push({ code: 'shanpon-ron-minko', message: 'シャンポン待ちをロンで完成させた刻子は明刻として数えます。その刻子を明刻にしてください。' });
    }
    if (wait === 'shanpon' && winType === 'tsumo' && anko === 0) {
        issues.push({ code: 'shanpon-tsumo-anko', message: 'シャンポン待ちをツモで完成させた刻子は暗刻です。刻子を1つ以上暗刻にしてください。' });
    }
    if (SHUNTSU_WAITS.has(wait) && shuntsu === 0) {
        issues.push({ code: 'wait-needs-shuntsu', message: `${WAIT_LABELS[wait]}待ちは順子で待つ形です。順子を1つ以上選ぶか、待ちを直してください。` });
    }
}

/**
 * 和了形の内訳から符を計算する
 * @param {Object} composition - { menzen: boolean, wait: string, pair: string, melds: [{ type: string, terminal: boolean }] ×4 }
 *   wait: 'ryanmen' | 'shanpon' | 'kanchan' | 'penchan' | 'tanki'
 *   pair: 'plain'（数牌・客風牌） | 'yakuhai' | 'doubleWind'
 *   meld.type: 'shuntsu' | 'minko' | 'anko' | 'minkan' | 'ankan'、meld.terminal: 幺九牌（1・9・字牌）か
 * @param {Object} conditions - { winType: 'ron' | 'tsumo' }
 * @param {Object} rules - 符の加算表（依存注入、デフォルトは FU_RULES）
 * @returns {{ fu: number|null, rawFu: number, breakdown: Array<{code: string, label: string, fu: number}>,
 *             notes: Array<{code: string, message: string}>, issues: Array<{code: string, message: string}> }}
 *   fu は10符単位に切り上げた符。issues があるときは null（呼び出し側は符を更新しない）。
 */
export function calculateFu(composition, { winType } = {}, rules = FU_RULES) {
    const issues = [];
    if (!checkShape(composition, winType, issues)) {
        return { fu: null, rawFu: 0, breakdown: [], notes: [], issues };
    }
    checkConsistency(composition, winType, issues);

    const { menzen, wait, pair, melds } = composition;
    const breakdown = [{ code: 'base', label: '副底', fu: rules.base }];
    const notes = [];

    const isPinfuShape = menzen && wait === 'ryanmen' && pair === 'plain'
        && melds.every(meld => meld.type === 'shuntsu');

    if (menzen && winType === 'ron') {
        breakdown.push({ code: 'menzen-ron', label: '門前ロン', fu: rules.menzenRon });
    }
    if (winType === 'tsumo') {
        if (isPinfuShape) {
            notes.push({ code: 'pinfu-tsumo', message: '平和形のツモはツモ符を加えません。' });
        } else {
            breakdown.push({ code: 'tsumo', label: 'ツモ', fu: rules.tsumo });
        }
    }
    melds.forEach(({ type, terminal }) => {
        const fu = rules.meld[type][terminal ? 1 : 0];
        if (fu > 0) {
            breakdown.push({ code: `meld-${type}`, label: `${MELD_LABELS[type]}（${terminal ? '幺九牌' : '中張牌'}）`, fu });
        }
    });
    if (rules.pair[pair] > 0) {
        breakdown.push({ code: `pair-${pair}`, label: `雀頭（${PAIR_LABELS[pair]}）`, fu: rules.pair[pair] });
    }
    if (rules.wait[wait] > 0) {
        breakdown.push({ code: `wait-${wait}`, label: `待ち（${WAIT_LABELS[wait]}）`, fu: rules.wait[wait] });
    }

    const rawFu = breakdown.reduce((sum, item) => sum + item.fu, 0);
    let fu = Math.ceil(rawFu / 10) * 10;
    if (!menzen && rawFu === rules.base) {
        fu = rules.openPinfuRon;
        notes.push({ code: 'open-pinfu', message: `副露で加符のない形は${rules.openPinfuRon}符として扱います。` });
    }
    if (fu > rules.max) {
        fu = rules.max;
        notes.push({ code: 'capped', message: `${rules.max}符を上限とします。` });
    }

    return { fu: issues.length ? null : fu, rawFu, breakdown, notes, issues };
}
