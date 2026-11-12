import test from 'node:test';
import assert from 'node:assert/strict';
import { yakuData } from '../../js/data/yakuData.js';
import { calculateTotalHan, calculateHanBreakdown, getYakuHan } from '../../js/modules/validator.js';
import { calculateScoreResult } from '../../js/modules/calculator.js';
import { validateYakuSelection, validateYakuAddition, getUnavailableYaku, menzenOnlyYaku } from '../../js/modules/yakuValidation.js';
import { createStateManager } from '../../js/modules/stateManager.js';

// 喰い下がりと門前限定役（Issue #49）。
// 期待値は役の定義から独立に列挙する（yakuData の openHan / menzenOnly を読んで作らない）。
const expectedOpenHan = {
    '混全帯幺九': [2, 1],
    '一気通貫': [2, 1],
    '三色同順': [2, 1],
    '純全帯幺九': [3, 2],
    '混一色': [3, 2],
    '清一色': [6, 5]
};
const expectedMenzenOnly = [
    '立直', 'ダブル立直', '一発', '門前清自摸和', '平和', '一盃口', '二盃口',
    '七対子', '国士無双', '四暗刻', '九蓮宝燈', '天和', '地和'
];

const open = { winType: 'ron', playerType: 'child', menzen: false };
const closed = { winType: 'ron', playerType: 'child', menzen: true };
const yaku = name => yakuData.find(y => y.name === name);

test('喰い下がりする役の副露時の翻数を棚卸しする', () => {
    const actual = Object.fromEntries(yakuData.filter(y => y.openHan !== undefined).map(y => [y.name, [y.han, y.openHan]]));
    assert.deepEqual(actual, expectedOpenHan);
});

test('門前限定役を棚卸しする', () => {
    assert.deepEqual([...menzenOnlyYaku].sort(), [...expectedMenzenOnly].sort());
    assert.deepEqual(yakuData.filter(y => y.menzenOnly).map(y => y.name).sort(), [...expectedMenzenOnly].sort());
});

test('門前限定役と喰い下がりする役は重ならない', () => {
    for (const name of expectedMenzenOnly) assert.equal(Object.hasOwn(expectedOpenHan, name), false, name);
});

for (const [name, [closedHan, openHan]] of Object.entries(expectedOpenHan)) {
    test(`${name}は門前${closedHan}翻、副露${openHan}翻`, () => {
        assert.equal(getYakuHan(yaku(name), true), closedHan);
        assert.equal(getYakuHan(yaku(name), false), openHan);
        assert.equal(calculateTotalHan(new Set([name]), yakuData, true), closedHan);
        assert.equal(calculateTotalHan(new Set([name]), yakuData, false), openHan);
        assert.equal(validateYakuSelection(new Set([name]), open).valid, true);
    });
}

test('喰い下がりのない役は副露でも翻数が変わらない', () => {
    for (const name of ['断幺九', '役牌', '対々和', '三暗刻', '小三元', '混老頭', '三色同刻', '三槓子']) {
        assert.equal(getYakuHan(yaku(name), false), yaku(name).han, name);
    }
});

test('門前／副露を省略したときは門前として数える（既存の呼び出しとの互換）', () => {
    assert.equal(calculateTotalHan(new Set(['混一色']), yakuData), 3);
    assert.equal(calculateHanBreakdown(new Set(['混一色']), yakuData, {}).totalHan, 3);
    assert.equal(validateYakuSelection(new Set(['立直']), { winType: 'ron', playerType: 'child' }).valid, true);
});

test('副露の合計翻数は喰い下がり後の翻数にドラを足す', () => {
    const selected = new Set(['混一色', '一気通貫', '役牌']);
    const breakdown = calculateHanBreakdown(selected, yakuData, { doraCount: 1, menzen: false });
    assert.deepEqual(
        { yakuHan: breakdown.yakuHan, totalHan: breakdown.totalHan, menzen: breakdown.menzen },
        { yakuHan: 4, totalHan: 5, menzen: false }
    );
    assert.equal(calculateHanBreakdown(selected, yakuData, { doraCount: 1, menzen: true }).totalHan, 7);
});

test('副露の清一色は5翻で満貫、門前は6翻で跳満', () => {
    const openHan = calculateHanBreakdown(new Set(['清一色']), yakuData, { menzen: false }).totalHan;
    const closedHan = calculateHanBreakdown(new Set(['清一色']), yakuData, { menzen: true }).totalHan;
    assert.equal(calculateScoreResult(openHan, 30, 'ron', 'child').score, 8000);
    assert.equal(calculateScoreResult(closedHan, 30, 'ron', 'child').score, 12000);
});

test('副露の混一色2翻30符は子ロン2000点（門前3翻なら3900点）', () => {
    const openHan = calculateHanBreakdown(new Set(['混一色']), yakuData, { menzen: false }).totalHan;
    assert.equal(calculateScoreResult(openHan, 30, 'ron', 'child').score, 2000);
    assert.equal(calculateScoreResult(3, 30, 'ron', 'child').score, 3900);
});

test('副露の役満は喰い下がりせず役満のまま', () => {
    for (const name of ['大三元', '字一色', '緑一色', '清老頭', '小四喜', '大四喜', '四槓子']) {
        const breakdown = calculateHanBreakdown(new Set([name]), yakuData, { menzen: false });
        assert.equal(breakdown.totalHan, 13, name);
        assert.equal(validateYakuSelection(new Set([name]), open).valid, true, name);
    }
});

for (const name of expectedMenzenOnly) {
    test(`${name}は副露では選べない`, () => {
        // 前提役・和了条件の問題を除いた menzen-only だけを確かめる
        const result = validateYakuAddition(new Set(), name, { ...open, winType: 'tsumo', playerType: name === '天和' ? 'parent' : 'child' });
        const codes = result.issues.map(issue => issue.code);
        assert.ok(codes.includes('menzen-only'), `${name}: ${codes.join(',')}`);
        const issue = result.issues.find(i => i.code === 'menzen-only');
        assert.equal(issue.type, 'condition');
        assert.deepEqual(issue.yaku, [name]);
        assert.match(issue.message, new RegExp(`${name}は門前でのみ成立します`));
    });
}

test('門前なら門前限定役に menzen-only の問題は出ない', () => {
    for (const name of expectedMenzenOnly) {
        const result = validateYakuSelection(new Set([name]), { ...closed, winType: 'tsumo', playerType: name === '天和' ? 'parent' : 'child' });
        assert.equal(result.issues.some(issue => issue.code === 'menzen-only'), false, name);
    }
});

test('副露ではフィルタが門前限定役を薄く表示する', () => {
    const unavailable = getUnavailableYaku(new Set(), { ...open, winType: 'tsumo' });
    for (const name of expectedMenzenOnly) assert.equal(unavailable.has(name), true, name);
    for (const name of Object.keys(expectedOpenHan)) assert.equal(unavailable.has(name), false, name);
});

test('門前限定役を選んだまま副露にすると、選択を残したまま検証で止める', () => {
    const result = validateYakuSelection(new Set(['立直', '断幺九']), open);
    assert.equal(result.valid, false);
    assert.deepEqual(result.issues.map(issue => issue.code), ['menzen-only']);
});

test('StateManager は門前／副露と符の内訳の門前を揃える', () => {
    const manager = createStateManager();
    assert.equal(manager.getState().menzen, true);
    assert.equal(manager.getState().fuComposition.menzen, true);

    manager.setMenzen(false);
    assert.equal(manager.getState().menzen, false);
    assert.equal(manager.getState().fuComposition.menzen, false);

    manager.setFuComposition({ ...manager.getState().fuComposition, menzen: true });
    assert.equal(manager.getState().menzen, true);

    manager.setMenzen(false);
    manager.resetState();
    assert.equal(manager.getState().menzen, true);
    assert.equal(manager.getState().fuComposition.menzen, true);
});

test('StateManager は不正な門前／副露を受け付けない', () => {
    const manager = createStateManager();
    const warn = console.warn;
    console.warn = () => {};
    try {
        manager.setMenzen('open');
    } finally {
        console.warn = warn;
    }
    assert.equal(manager.getState().menzen, true);
});
