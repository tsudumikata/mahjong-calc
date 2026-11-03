import test from 'node:test';
import assert from 'node:assert/strict';
import { yakuData } from '../../js/data/yakuData.js';
import { DORA_LIMITS } from '../../js/data/constants.js';
import { calculateHanBreakdown, calculateTotalHanWithDora, calculateDoraHan } from '../../js/modules/validator.js';
import { calculateScoreResult } from '../../js/modules/calculator.js';
import { validateYakuSelection, validateYakuAddition, getUnavailableYaku, redDoraIncompatibleYaku, yakuValidationAudit } from '../../js/modules/yakuValidation.js';
import { createStateManager } from '../../js/modules/stateManager.js';

const yaku = names => new Set(names);
const dora = (doraCount = 0, redDoraCount = 0, uraDoraCount = 0) => ({ doraCount, redDoraCount, uraDoraCount });

test('ドラ・赤ドラ・裏ドラの枚数を合計する', () => {
    assert.equal(calculateDoraHan(dora(2, 1, 1)), 4);
    assert.equal(calculateDoraHan(), 0);
});

test('役の翻数にドラを加算する', () => {
    const result = calculateHanBreakdown(yaku(['立直', '断幺九']), yakuData, dora(1, 1, 1));
    assert.deepEqual(result, { yakuHan: 2, doraHan: 3, appliedDoraHan: 3, totalHan: 5, isYakuman: false, yakumanMultiplier: 1 });
});

test('ドラだけでは役にならず0翻のまま', () => {
    const result = calculateHanBreakdown(yaku([]), yakuData, dora(3, 1, 0));
    assert.equal(result.totalHan, 0);
    assert.equal(result.appliedDoraHan, 0);
    assert.equal(result.doraHan, 4);
});

test('役満にはドラを加算しない', () => {
    const result = calculateHanBreakdown(yaku(['国士無双']), yakuData, dora(2, 1, 0));
    assert.equal(result.totalHan, 13);
    assert.equal(result.appliedDoraHan, 0);
    assert.equal(result.isYakuman, true);
});

test('通常役+ドラが13翻以上なら数え役満の点数になる', () => {
    const han = calculateTotalHanWithDora(yaku(['立直', '清一色']), yakuData, dora(4, 2, 0));
    assert.equal(han, 13);
    assert.equal(calculateScoreResult(han, 30, 'ron', 'child').score, 32000);
    const over = calculateTotalHanWithDora(yaku(['立直', '清一色']), yakuData, dora(6, 3, 4));
    assert.equal(over, 20);
    assert.equal(calculateScoreResult(over, 30, 'ron', 'parent').score, 48000);
});

test('ドラ込みの翻数で点数表を引く', () => {
    // 立直+ドラ2 = 3翻30符
    const han = calculateTotalHanWithDora(yaku(['立直']), yakuData, dora(2));
    assert.equal(han, 3);
    assert.equal(calculateScoreResult(han, 30, 'ron', 'child').score, 3900);
    // 立直+断幺九+赤1+ドラ2 = 5翻（満貫）
    const mangan = calculateTotalHanWithDora(yaku(['立直', '断幺九']), yakuData, dora(2, 1));
    assert.equal(calculateScoreResult(mangan, 30, 'tsumo', 'child').name, '満貫');
});

test('裏ドラは立直・ダブル立直がないと検証エラー', () => {
    const noRiichi = validateYakuSelection(yaku(['断幺九']), { winType: 'ron', playerType: 'child', uraDoraCount: 1 });
    assert.equal(noRiichi.valid, false);
    assert.ok(noRiichi.issues.some(issue => issue.code === 'ura-dora-riichi'));
    for (const riichi of ['立直', 'ダブル立直']) {
        const ok = validateYakuSelection(yaku([riichi, '断幺九']), { winType: 'ron', playerType: 'child', uraDoraCount: 2 });
        assert.equal(ok.valid, true, riichi);
    }
    assert.equal(validateYakuSelection(yaku(['断幺九']), { winType: 'ron', playerType: 'child', uraDoraCount: 0 }).valid, true);
});

test('混老頭と赤ドラ1〜3枚の矛盾を理由付きで拒否する（Issue #39）', () => {
    for (const names of [['混老頭'], ['七対子', '混老頭']]) {
        for (const redDoraCount of [1, 2, 3]) {
            const result = validateYakuSelection(yaku(names), { redDoraCount });
            assert.equal(result.valid, false, `${names.join('+')}・赤ドラ${redDoraCount}`);
            const issue = result.issues.find(issue => issue.code === 'red-dora-structure');
            assert.ok(issue);
            assert.deepEqual(issue.yaku, ['混老頭']);
            assert.match(issue.message, /混老頭/);
            assert.match(issue.message, /赤ドラ/);
            assert.match(issue.message, /5/);
        }
    }
});

test('赤ドラ入力後の混老頭追加を拒否し、0枚または役解除で復帰する', () => {
    const selected = yaku(['七対子']);
    const conditions = { winType: 'ron', playerType: 'child', redDoraCount: 1 };
    assert.equal(validateYakuAddition(selected, '混老頭', conditions).valid, false);
    assert.equal(getUnavailableYaku(selected, conditions).has('混老頭'), true);
    assert.deepEqual([...selected], ['七対子']);

    const honroutou = yaku(['七対子', '混老頭']);
    assert.equal(validateYakuSelection(honroutou, conditions).valid, false);
    assert.equal(validateYakuSelection(honroutou, { ...conditions, redDoraCount: 0 }).valid, true);
    assert.equal(validateYakuSelection(selected, conditions).valid, true);
    assert.equal(getUnavailableYaku(selected, { ...conditions, redDoraCount: 0 }).has('混老頭'), false);
});

test('赤ドラなしの七対子＋混老頭は4翻25符・子ロン6400点を維持する', () => {
    const selected = yaku(['七対子', '混老頭']);
    for (const counts of [{}, dora()]) {
        const conditions = { winType: 'ron', playerType: 'child', ...counts };
        assert.equal(validateYakuSelection(selected, conditions).valid, true);
        const han = calculateTotalHanWithDora(selected, yakuData, conditions);
        assert.equal(han, 4);
        assert.equal(calculateScoreResult(han, 25, 'ron', 'child').score, 6400);
    }
});

test('混老頭の通常ドラ・立直時の裏ドラと、合法な役の赤ドラを許可する', () => {
    for (const { names, counts, han, fu, score } of [
        { names: ['七対子', '混老頭'], counts: dora(1), han: 5, fu: 25, score: 8000 },
        { names: ['立直', '七対子', '混老頭'], counts: dora(1, 0, 1), han: 7, fu: 25, score: 12000 },
        { names: ['七対子'], counts: dora(0, 1), han: 3, fu: 25, score: 3200 },
        { names: ['断幺九'], counts: dora(0, 1), han: 2, fu: 30, score: 2000 },
    ]) {
        const selected = yaku(names);
        const conditions = { winType: 'ron', playerType: 'child', ...counts };
        assert.equal(validateYakuSelection(selected, conditions).valid, true, names.join('+'));
        assert.equal(calculateTotalHanWithDora(selected, yakuData, conditions), han);
        assert.equal(calculateScoreResult(han, fu, 'ron', 'child').score, score);
    }
    assert.equal(validateYakuSelection(yaku(['七対子', '混老頭']), dora(0, 0, 1)).valid, false);
});

// 期待値は役定義から独立に列挙する（実装の一覧を読んで期待値を作らない）。
// どれも各色の5牌を一枚も含められない（Issue #44）。
const redDoraImpossible = [
    { name: '混全帯幺九', yakuman: false },
    { name: '純全帯幺九', yakuman: false },
    { name: '混老頭', yakuman: false },
    { name: '国士無双', yakuman: true },
    { name: '字一色', yakuman: true },
    { name: '緑一色', yakuman: true },
    { name: '清老頭', yakuman: true },
];
// 5牌を含められる役。赤ドラと一律に排他にしない。
const redDoraPossible = [
    '立直', '断幺九', '平和', '一盃口', '役牌', '七対子', '一気通貫', '三色同順', '対々和',
    '三暗刻', '小三元', '三色同刻', '三槓子', '二盃口', '混一色', '清一色',
    '四暗刻', '大三元', '小四喜', '大四喜', '九蓮宝燈', '四槓子',
];

test('赤ドラと両立しない役の一覧は対象役の棚卸しと一致し、理由と監査説明がある（Issue #44）', () => {
    const names = new Set(yakuData.map(y => y.name));
    assert.deepEqual(Object.keys(redDoraIncompatibleYaku).sort(), redDoraImpossible.map(y => y.name).sort());
    for (const { name } of redDoraImpossible) {
        assert.ok(names.has(name), name);
        assert.ok(redDoraIncompatibleYaku[name].length > 5, name);
        assert.match(yakuValidationAudit[name], /赤ドラ/, name);
    }
    for (const name of redDoraPossible) {
        assert.ok(names.has(name), name);
        assert.doesNotMatch(yakuValidationAudit[name], /赤ドラ/, name);
    }
});

test('対象役は単独で選んでも赤ドラ0枚なら有効、1〜3枚なら理由付きで拒否する（Issue #44）', () => {
    for (const { name } of redDoraImpossible) {
        const selected = yaku([name]);
        assert.equal(validateYakuSelection(selected, { ...dora(), winType: 'ron', playerType: 'child' }).valid, true, `${name}・赤ドラ0`);
        for (const redDoraCount of [1, 2, 3]) {
            const result = validateYakuSelection(selected, { winType: 'ron', playerType: 'child', redDoraCount });
            assert.equal(result.valid, false, `${name}・赤ドラ${redDoraCount}`);
            const issues = result.issues.filter(issue => issue.code === 'red-dora-structure');
            assert.equal(issues.length, 1, name);
            assert.deepEqual(issues[0].yaku, [name]);
            assert.equal(issues[0].type, 'structure');
            assert.match(issues[0].message, new RegExp(name));
            assert.match(issues[0].message, /赤ドラ/);
            assert.match(issues[0].message, /5牌/);
        }
    }
});

test('赤ドラを先に入力すると対象役の追加を拒否・グレー表示し、0枚で戻る（Issue #44）', () => {
    const conditions = { winType: 'ron', playerType: 'child', redDoraCount: 1 };
    const unavailable = getUnavailableYaku(yaku([]), conditions);
    for (const { name } of redDoraImpossible) {
        assert.equal(validateYakuAddition(yaku([]), name, conditions).valid, false, name);
        assert.equal(unavailable.has(name), true, name);
    }
    for (const name of redDoraPossible) {
        assert.equal(unavailable.has(name), false, name);
        assert.equal(validateYakuSelection(yaku([name]), { ...conditions, winType: name === '四暗刻' ? 'tsumo' : 'ron' }).valid, true, name);
    }
    const cleared = getUnavailableYaku(yaku([]), { ...conditions, redDoraCount: 0 });
    for (const { name } of redDoraImpossible) assert.equal(cleared.has(name), false, name);
});

test('役満でも赤ドラとの矛盾を拒否し、役満のドラ非加算と得点は変えない（Issue #44）', () => {
    const conditions = { winType: 'ron', playerType: 'child' };
    for (const { name } of redDoraImpossible.filter(y => y.yakuman)) {
        const selected = yaku([name]);
        assert.equal(validateYakuSelection(selected, { ...conditions, redDoraCount: 1 }).valid, false, name);
        const breakdown = calculateHanBreakdown(selected, yakuData, dora(2));
        assert.equal(breakdown.totalHan, 13, name);
        assert.equal(breakdown.yakumanMultiplier, 1, name);
        assert.equal(calculateScoreResult(13, 30, 'ron', 'child', undefined, breakdown.yakumanMultiplier).score, 32000);
    }
    // 5牌を含められる役満は赤ドラがあっても有効で、ドラは加算しない。
    const daisangen = yaku(['大三元']);
    assert.equal(validateYakuSelection(daisangen, { ...conditions, redDoraCount: 1 }).valid, true);
    const breakdown = calculateHanBreakdown(daisangen, yakuData, dora(0, 1));
    assert.equal(breakdown.totalHan, 13);
    assert.equal(breakdown.yakumanMultiplier, 1);
    // 複数役満の倍率も変えない。赤ドラがあれば対象役を含む組み合わせだけ拒否する。
    const double = yaku(['字一色', '大四喜']);
    assert.equal(validateYakuSelection(double, conditions).valid, true);
    assert.equal(calculateHanBreakdown(double, yakuData, dora()).yakumanMultiplier, 2);
    const result = validateYakuSelection(double, { ...conditions, redDoraCount: 1 });
    assert.deepEqual(result.issues.filter(issue => issue.code === 'red-dora-structure').map(issue => issue.yaku), [['字一色']]);
});

test('対象役を複数選ぶと役ごとに理由を示し、解除すれば正常に戻る（Issue #44）', () => {
    const conditions = { winType: 'ron', playerType: 'child', redDoraCount: 1 };
    const result = validateYakuSelection(yaku(['対々和', '混老頭', '清老頭']), conditions);
    assert.deepEqual(
        result.issues.filter(issue => issue.code === 'red-dora-structure').map(issue => issue.yaku[0]).sort(),
        ['混老頭', '清老頭'].sort()
    );
    assert.equal(validateYakuSelection(yaku(['対々和', '混老頭', '清老頭']), { ...conditions, redDoraCount: 0 }).valid, true);
    assert.equal(validateYakuSelection(yaku(['対々和']), conditions).valid, true);
    const chanta = yaku(['立直', '純全帯幺九']);
    assert.equal(validateYakuSelection(chanta, conditions).valid, false);
    assert.equal(validateYakuSelection(yaku(['立直']), conditions).valid, true);
});

test('対象役でも通常ドラと立直時の裏ドラは加算し、裏ドラの立直条件は維持する（Issue #44）', () => {
    for (const { names, counts, han } of [
        { names: ['純全帯幺九'], counts: dora(1), han: 4 },
        { names: ['混全帯幺九'], counts: dora(2), han: 4 },
        { names: ['立直', '純全帯幺九'], counts: dora(1, 0, 1), han: 6 },
        { names: ['国士無双'], counts: dora(3), han: 13 },
    ]) {
        const selected = yaku(names);
        const conditions = { winType: 'ron', playerType: 'child', ...counts };
        assert.equal(validateYakuSelection(selected, conditions).valid, true, names.join('+'));
        assert.equal(calculateTotalHanWithDora(selected, yakuData, conditions), han, names.join('+'));
    }
    const noRiichi = validateYakuSelection(yaku(['純全帯幺九']), { ...dora(0, 0, 1), winType: 'ron', playerType: 'child' });
    assert.deepEqual(noRiichi.issues.map(issue => issue.code), ['ura-dora-riichi']);
});

test('StateManager はドラ枚数を範囲内だけ受け付け、リセットで0に戻す', () => {
    const originalWarn = console.warn;
    console.warn = () => {};
    try {
        const manager = createStateManager();
        assert.equal(manager.getState().doraCount, 0);
        manager.setDoraCount('doraCount', 2);
        manager.setDoraCount('redDoraCount', DORA_LIMITS.redDoraCount);
        manager.setDoraCount('redDoraCount', DORA_LIMITS.redDoraCount + 1);
        manager.setDoraCount('uraDoraCount', -1);
        manager.setDoraCount('unknown', 1);
        assert.deepEqual(
            [manager.getState().doraCount, manager.getState().redDoraCount, manager.getState().uraDoraCount],
            [2, DORA_LIMITS.redDoraCount, 0]
        );
        assert.equal(manager.getState().unknown, undefined);
        manager.resetState();
        assert.equal(manager.getState().doraCount, 0);
        assert.equal(manager.getState().redDoraCount, 0);
    } finally {
        console.warn = originalWarn;
    }
});
