import test from 'node:test';
import assert from 'node:assert/strict';
import { yakuData } from '../../js/data/yakuData.js';
import { DORA_LIMITS } from '../../js/data/constants.js';
import { calculateHanBreakdown, calculateTotalHanWithDora, calculateDoraHan } from '../../js/modules/validator.js';
import { calculateScoreResult } from '../../js/modules/calculator.js';
import { validateYakuSelection } from '../../js/modules/yakuValidation.js';
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
