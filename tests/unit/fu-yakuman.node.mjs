import test from 'node:test';
import assert from 'node:assert/strict';
import { yakuData } from '../../js/data/yakuData.js';
import { validFuByHan } from '../../js/data/constants.js';
import { calculateHanBreakdown, countYakuman, getSteppedFu, validateAndAdjustFu } from '../../js/modules/validator.js';
import { calculateScoreResult, getScoreName, getYakumanName } from '../../js/modules/calculator.js';
import { validateYakuSelection } from '../../js/modules/yakuValidation.js';

const yaku = names => new Set(names);
const step = (han, fu, action) => getSteppedFu(validFuByHan[han], fu, action);

test('#22 2〜4翻の符数は 20→25→30→40 の順にたどる', () => {
    for (const han of [2, 3, 4]) {
        assert.equal(step(han, 30, 'decrease'), 25, `${han}翻`);
        assert.equal(step(han, 25, 'decrease'), 20, `${han}翻`);
        assert.equal(step(han, 20, 'increase'), 25, `${han}翻`);
        assert.equal(step(han, 25, 'increase'), 30, `${han}翻`);
        assert.equal(step(han, 30, 'increase'), 40, `${han}翻`);
    }
});

test('#22 1翻は30符未満に下がらず、上下端では値を保つ', () => {
    assert.equal(step(1, 30, 'decrease'), 30);
    assert.equal(step(1, 110, 'increase'), 110);
    assert.equal(step(2, 20, 'decrease'), 20);
    assert.equal(step(2, 110, 'increase'), 110);
    assert.equal(getSteppedFu([20, 30, 40], 30, 'unknown'), 30);
});

test('#22 25符の点数と、1翻へ変更したときの補正', () => {
    for (const [han, childRon, childTsumo, parentRon, parentTsumo] of [
        [2, 1600, '400/800', 2400, '800'],
        [3, 3200, '800/1600', 4800, '1600'],
        [4, 6400, '1600/3200', 9600, '3200']
    ]) {
        assert.equal(calculateScoreResult(han, 25, 'ron', 'child').score, childRon);
        assert.equal(calculateScoreResult(han, 25, 'tsumo', 'child').score, childTsumo);
        assert.equal(calculateScoreResult(han, 25, 'ron', 'parent').score, parentRon);
        assert.equal(calculateScoreResult(han, 25, 'tsumo', 'parent').score, parentTsumo);
        assert.equal(calculateScoreResult(han, 25, 'ron', 'child').name, `${han}翻25符`);
    }
    assert.equal(validateAndAdjustFu(1, 25, validFuByHan), 30);
});

test('#8 役満の数を倍率として数え、ドラは加算しない', () => {
    assert.equal(countYakuman(yaku([]), yakuData), 0);
    assert.equal(countYakuman(yaku(['立直', '清一色']), yakuData), 0);
    assert.equal(countYakuman(yaku(['国士無双', '天和']), yakuData), 2);
    const triple = yaku(['大四喜', '字一色', '四暗刻']);
    assert.equal(validateYakuSelection(triple, { winType: 'ron', playerType: 'child' }).valid, true);
    const breakdown = calculateHanBreakdown(triple, yakuData, { doraCount: 3 });
    assert.equal(breakdown.totalHan, 13);
    assert.equal(breakdown.appliedDoraHan, 0);
    assert.equal(breakdown.yakumanMultiplier, 3);
});

test('#8 数え役満は翻数が大きくても1倍のまま', () => {
    const breakdown = calculateHanBreakdown(yaku(['立直', '清一色']), yakuData, { doraCount: 13, redDoraCount: 3, uraDoraCount: 4 });
    assert.equal(breakdown.totalHan, 27);
    assert.equal(breakdown.yakumanMultiplier, 1);
    const result = calculateScoreResult(breakdown.totalHan, 30, 'ron', 'child', undefined, breakdown.yakumanMultiplier);
    assert.equal(result.score, 32000);
    assert.equal(result.name, '役満');
});

test('#8 複数役満の点数は親子・ロンツモの4通りとも役満×倍率', () => {
    for (const [multiplier, name, childRon, childTsumo, parentRon, parentTsumo] of [
        [1, '役満', 32000, '8000/16000', 48000, '16000'],
        [2, 'ダブル役満', 64000, '16000/32000', 96000, '32000'],
        [3, 'トリプル役満', 96000, '24000/48000', 144000, '48000'],
        [4, '4倍役満', 128000, '32000/64000', 192000, '64000']
    ]) {
        assert.equal(calculateScoreResult(13, 30, 'ron', 'child', undefined, multiplier).score, childRon);
        assert.equal(calculateScoreResult(13, 30, 'tsumo', 'child', undefined, multiplier).score, childTsumo);
        assert.equal(calculateScoreResult(13, 30, 'ron', 'parent', undefined, multiplier).score, parentRon);
        assert.equal(calculateScoreResult(13, 30, 'tsumo', 'parent', undefined, multiplier).score, parentTsumo);
        assert.equal(calculateScoreResult(13, 30, 'ron', 'child', undefined, multiplier).name, name);
        assert.equal(getYakumanName(multiplier), name);
    }
});

test('#8 倍率は13翻以上だけに効き、不正な値は1倍として扱う', () => {
    assert.equal(calculateScoreResult(5, 30, 'ron', 'child', undefined, 2).score, 8000);
    assert.equal(getScoreName(12, 0, 2), '三倍満');
    for (const invalid of [0, -1, 1.5, NaN, undefined, '2']) {
        assert.equal(getYakumanName(invalid), '役満', String(invalid));
        assert.equal(calculateScoreResult(13, 30, 'ron', 'child', undefined, invalid).score, 32000, String(invalid));
    }
});
