import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_FU_COMPOSITION, validFuByHan } from '../../js/data/constants.js';
import { calculateFu } from '../../js/modules/fuCalculator.js';

// 面子の略記: s=順子, m=明刻, a=暗刻, M=明槓, A=暗槓。後ろに9を付けると幺九牌（例: 'a9'）。
const MELD_TYPES = { s: 'shuntsu', m: 'minko', a: 'anko', M: 'minkan', A: 'ankan' };
const meld = code => ({ type: MELD_TYPES[code[0]], terminal: code.endsWith('9') });
const hand = ({ menzen = true, wait = 'ryanmen', pair = 'plain', melds = ['s', 's', 's', 's'] } = {}) =>
    ({ menzen, wait, pair, melds: melds.map(meld) });
const fuOf = (composition, winType) => calculateFu(composition, { winType });
const codes = list => list.map(item => item.code);

test('#9 平和形: 門前ロンは30符、門前ツモはツモ符なしの20符', () => {
    const ron = fuOf(hand(), 'ron');
    assert.equal(ron.fu, 30);
    assert.deepEqual(codes(ron.breakdown), ['base', 'menzen-ron']);

    const tsumo = fuOf(hand(), 'tsumo');
    assert.equal(tsumo.fu, 20);
    assert.equal(tsumo.rawFu, 20);
    assert.deepEqual(codes(tsumo.notes), ['pinfu-tsumo']);
});

test('#9 副露で加符のない形: ロンは30符に繰り上げ、ツモは22符を切り上げて30符', () => {
    const ron = fuOf(hand({ menzen: false }), 'ron');
    assert.equal(ron.rawFu, 20);
    assert.equal(ron.fu, 30);
    assert.deepEqual(codes(ron.notes), ['open-pinfu']);

    const tsumo = fuOf(hand({ menzen: false }), 'tsumo');
    assert.equal(tsumo.rawFu, 22);
    assert.equal(tsumo.fu, 30);
    assert.deepEqual(codes(tsumo.notes), []);
});

test('#9 役牌の雀頭や両面以外の待ちがあれば平和形のツモにならない', () => {
    assert.equal(fuOf(hand({ pair: 'yakuhai' }), 'tsumo').rawFu, 24);
    assert.equal(fuOf(hand({ wait: 'kanchan' }), 'tsumo').rawFu, 24);
    assert.equal(fuOf(hand({ pair: 'yakuhai' }), 'tsumo').fu, 30);
});

test('#9 面子の符: 明刻2/4・暗刻4/8・明槓8/16・暗槓16/32（中張牌/幺九牌）', () => {
    const expected = { m: 2, m9: 4, a: 4, a9: 8, M: 8, M9: 16, A: 16, A9: 32 };
    for (const [code, fu] of Object.entries(expected)) {
        const result = fuOf(hand({ menzen: false, melds: [code, 's', 's', 's'] }), 'tsumo');
        assert.equal(result.rawFu, 20 + 2 + fu, code);
        assert.deepEqual(result.issues, [], code);
    }
});

test('#9 雀頭: 役牌2符、連風牌も2符（Mリーグ・最高位戦と同じ）、数牌・客風牌0符', () => {
    assert.equal(fuOf(hand({ pair: 'plain' }), 'ron').rawFu, 30);
    assert.equal(fuOf(hand({ pair: 'yakuhai' }), 'ron').rawFu, 32);
    assert.equal(fuOf(hand({ pair: 'doubleWind' }), 'ron').rawFu, 32);
    assert.equal(fuOf(hand({ pair: 'doubleWind' }), 'ron').breakdown.at(-1).label, '雀頭（連風牌）');
});

test('#9 待ち: 嵌張・辺張・単騎は2符、両面・シャンポンは0符', () => {
    for (const wait of ['kanchan', 'penchan', 'tanki']) {
        assert.equal(fuOf(hand({ wait }), 'ron').rawFu, 32, wait);
    }
    assert.equal(fuOf(hand({ wait: 'ryanmen' }), 'ron').rawFu, 30);
    const shanpon = fuOf(hand({ wait: 'shanpon', melds: ['m', 'a', 's', 's'] }), 'ron');
    assert.equal(shanpon.rawFu, 20 + 10 + 2 + 4);
});

test('#9 代表的な手の符（10符単位に切り上げ）', () => {
    const cases = [
        // [説明, 内訳, 和了方法, 素点, 符]
        ['門前ロン・幺九牌の暗刻・単騎', hand({ wait: 'tanki', melds: ['a9', 's', 's', 's'] }), 'ron', 40, 40],
        ['門前ツモ・中張牌の暗刻・嵌張・役牌の雀頭', hand({ wait: 'kanchan', pair: 'yakuhai', melds: ['a', 's', 's', 's'] }), 'tsumo', 30, 30],
        ['副露ロン・役牌のポン', hand({ menzen: false, melds: ['m9', 's', 's', 's'] }), 'ron', 24, 30],
        ['門前ロン・嵌張（32符→40符）', hand({ wait: 'kanchan' }), 'ron', 32, 40],
        ['門前ロン・幺九牌の暗槓', hand({ melds: ['A9', 's', 's', 's'] }), 'ron', 62, 70],
        ['副露ツモ・明刻3つと単騎', hand({ menzen: false, wait: 'tanki', melds: ['m9', 'm9', 'm', 's'] }), 'tsumo', 34, 40],
        ['門前シャンポンロン・明刻（中張）と暗刻（幺九）', hand({ wait: 'shanpon', melds: ['m', 'a9', 's', 's'] }), 'ron', 40, 40],
        ['副露ロン・幺九牌の明槓2つと暗刻', hand({ menzen: false, wait: 'tanki', melds: ['M9', 'M9', 'a9', 's'] }), 'ron', 62, 70]
    ];
    for (const [label, composition, winType, rawFu, fu] of cases) {
        const result = fuOf(composition, winType);
        assert.deepEqual(result.issues, [], label);
        assert.equal(result.rawFu, rawFu, label);
        assert.equal(result.fu, fu, label);
    }
});

test('#9 110符を上限とする', () => {
    const result = fuOf(hand({ wait: 'tanki', pair: 'yakuhai', melds: ['A9', 'A9', 'A9', 'A9'] }), 'ron');
    assert.equal(result.rawFu, 20 + 10 + 128 + 2 + 2);
    assert.equal(result.fu, 110);
    assert.deepEqual(codes(result.notes), ['capped']);
});

test('#9 和了形として両立しない入力は issues を返し、符は null', () => {
    const cases = [
        ['門前で明槓', hand({ melds: ['M', 's', 's', 's'] }), 'ron', 'menzen-minkan'],
        ['門前・両面待ちで明刻', hand({ melds: ['m', 's', 's', 's'] }), 'ron', 'menzen-minko'],
        ['門前・シャンポンロンで明刻2つ', hand({ wait: 'shanpon', melds: ['m', 'm', 's', 's'] }), 'ron', 'menzen-minko'],
        ['門前・シャンポンツモで明刻', hand({ wait: 'shanpon', melds: ['m', 'a', 's', 's'] }), 'tsumo', 'menzen-minko'],
        ['シャンポンロンで明刻なし', hand({ wait: 'shanpon', melds: ['a', 'a', 's', 's'] }), 'ron', 'shanpon-ron-minko'],
        ['シャンポンツモで暗刻なし', hand({ menzen: false, wait: 'shanpon', melds: ['m', 'm', 's', 's'] }), 'tsumo', 'shanpon-tsumo-anko'],
        ['両面待ちで順子なし', hand({ melds: ['a', 'a', 'a', 'a'] }), 'tsumo', 'wait-needs-shuntsu'],
        ['辺張待ちで順子なし', hand({ menzen: false, wait: 'penchan', melds: ['m', 'm', 'm', 'm'] }), 'ron', 'wait-needs-shuntsu'],
        ['副露なのに暗刻・暗槓だけ', hand({ menzen: false, wait: 'tanki', melds: ['a', 'a9', 'A', 'a'] }), 'tsumo', 'open-needs-called-meld'],
        ['副露・シャンポンロンで明刻がロンで完成した1つだけ', hand({ menzen: false, wait: 'shanpon', melds: ['m', 'a', 'a', 'a'] }), 'ron', 'open-needs-called-meld']
    ];
    for (const [label, composition, winType, code] of cases) {
        const result = fuOf(composition, winType);
        assert.equal(result.fu, null, label);
        assert.ok(codes(result.issues).includes(code), `${label}: ${JSON.stringify(result.issues)}`);
        assert.ok(result.issues.every(issue => issue.message.length > 0), label);
    }
});

test('#9 副露のシャンポンロンは、ポンした明刻があれば受け付ける（どれが和了牌の刻子かは判別しない）', () => {
    const result = fuOf(hand({ menzen: false, wait: 'shanpon', melds: ['m9', 'm', 's', 's'] }), 'ron');
    assert.deepEqual(result.issues, []);
    assert.equal(result.fu, 30);
});

test('#9 入力が欠けている・不正な場合は invalid-input を返す', () => {
    const bad = [
        [undefined, 'ron'],
        [{ ...hand(), melds: hand().melds.slice(0, 3) }, 'ron'],
        [{ ...hand(), wait: 'nobetan' }, 'ron'],
        [{ ...hand(), pair: 'dragon' }, 'ron'],
        [{ ...hand(), menzen: 'yes' }, 'ron'],
        [{ ...hand(), melds: [{ type: 'pon', terminal: false }, ...hand().melds.slice(1)] }, 'ron'],
        [{ ...hand(), melds: [{ type: 'anko' }, ...hand().melds.slice(1)] }, 'ron'],
        [{ ...hand(), wait: 'hasOwnProperty' }, 'ron'],
        [hand(), undefined]
    ];
    for (const [composition, winType] of bad) {
        const result = fuOf(composition, winType);
        assert.equal(result.fu, null);
        assert.deepEqual(result.breakdown, []);
        assert.ok(codes(result.issues).includes('invalid-input'), JSON.stringify(composition));
    }
});

test('#9 符計算パネルの初期値は平和形（ロン30符・ツモ20符）', () => {
    assert.equal(fuOf(DEFAULT_FU_COMPOSITION, 'ron').fu, 30);
    assert.equal(fuOf(DEFAULT_FU_COMPOSITION, 'tsumo').fu, 20);
});

test('#9 全組み合わせで、符は有効な符数の一覧に入り、20符は門前ツモの平和形だけ', () => {
    const meldCodes = ['s', 's9', 'm', 'm9', 'a', 'a9', 'M', 'M9', 'A', 'A9'];
    const meldSets = [];
    const pick = (start, chosen) => {
        if (chosen.length === 4) return meldSets.push(chosen);
        for (let i = start; i < meldCodes.length; i++) pick(i, [...chosen, meldCodes[i]]);
    };
    pick(0, []);

    const validFu = new Set(validFuByHan[2].filter(fu => fu !== 25));
    let valid = 0;
    for (const melds of meldSets) {
        for (const menzen of [true, false]) {
            for (const wait of ['ryanmen', 'shanpon', 'kanchan', 'penchan', 'tanki']) {
                for (const pair of ['plain', 'yakuhai', 'doubleWind']) {
                    for (const winType of ['ron', 'tsumo']) {
                        const composition = hand({ menzen, wait, pair, melds });
                        const result = fuOf(composition, winType);
                        const label = JSON.stringify({ menzen, wait, pair, melds, winType });
                        assert.equal(result.fu === null, result.issues.length > 0, label);
                        if (result.fu === null) continue;
                        valid++;
                        assert.ok(validFu.has(result.fu), `${label} → ${result.fu}`);
                        assert.equal(result.rawFu, result.breakdown.reduce((sum, item) => sum + item.fu, 0), label);
                        assert.ok(result.fu >= Math.min(result.rawFu, 110), label);
                        const pinfuTsumo = menzen && winType === 'tsumo' && wait === 'ryanmen'
                            && pair === 'plain' && melds.every(code => code[0] === 's');
                        assert.equal(result.fu === 20, pinfuTsumo, label);
                    }
                }
            }
        }
    }
    assert.ok(valid > 1000, `有効な組み合わせが少なすぎる: ${valid}`);
});
