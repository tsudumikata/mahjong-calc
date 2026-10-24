import test from 'node:test';
import assert from 'node:assert/strict';
import { yakuData } from '../../js/data/yakuData.js';
import { validateYakuSelection, yakuValidationAudit } from '../../js/modules/yakuValidation.js';
import { calculateTotalHan } from '../../js/modules/validator.js';
import { calculateScoreResult } from '../../js/modules/calculator.js';

const ron = { winType: 'ron', playerType: 'child' };
const tsumo = { winType: 'tsumo', playerType: 'child' };
const validate = (names, context = ron) => validateYakuSelection(new Set(names), context);

// Expected combinations are independent examples derived from the yaku definitions;
// do not generate expected results by reading the implementation's conflict registry.
const impossiblePairs = [
    ['七対子', '対々和'], ['七対子', '役牌'], ['七対子', '混全帯幺九'],
    ['七対子', '一気通貫'], ['七対子', '三色同順'], ['七対子', '三暗刻'],
    ['七対子', '小三元'], ['七対子', '三色同刻'], ['七対子', '三槓子'],
    ['七対子', '純全帯幺九'], ['七対子', '国士無双'], ['七対子', '四暗刻'],
    ['七対子', '大三元'], ['七対子', '小四喜'], ['七対子', '大四喜'],
    ['七対子', '緑一色'], ['七対子', '清老頭'], ['七対子', '九蓮宝燈'],
    ['七対子', '四槓子'], ['七対子', '嶺上開花'],
    ['平和', '対々和'], ['平和', '役牌'], ['平和', '三暗刻'],
    ['平和', '小三元'], ['平和', '三色同刻'], ['平和', '三槓子'],
    ['平和', '混老頭'], ['平和', '四暗刻'], ['平和', '大三元'],
    ['平和', '小四喜'], ['平和', '大四喜'], ['平和', '字一色'],
    ['平和', '清老頭'], ['平和', '九蓮宝燈'], ['平和', '四槓子'], ['平和', '嶺上開花'],
    ['断幺九', '混老頭'], ['断幺九', '役牌'], ['断幺九', '混全帯幺九'],
    ['断幺九', '純全帯幺九'], ['断幺九', '一気通貫'], ['断幺九', '小三元'],
    ['断幺九', '混一色'], ['断幺九', '大三元'], ['断幺九', '小四喜'],
    ['断幺九', '大四喜'], ['断幺九', '字一色'], ['断幺九', '清老頭'], ['断幺九', '九蓮宝燈'],
    ['一盃口', '三暗刻'], ['一盃口', '大三元'], ['一盃口', '九蓮宝燈'],
    ['混全帯幺九', '一気通貫'], ['混全帯幺九', '混老頭'], ['混全帯幺九', '清一色'],
    ['混全帯幺九', '緑一色'], ['混全帯幺九', '字一色'],
    ['一気通貫', '三色同順'], ['一気通貫', '三暗刻'], ['一気通貫', '小三元'],
    ['一気通貫', '二盃口'], ['一気通貫', '純全帯幺九'], ['一気通貫', '緑一色'],
    ['三色同順', '二盃口'], ['三色同順', '混一色'], ['三色同順', '清一色'], ['三色同順', '緑一色'],
    ['三色同刻', '小三元'], ['三色同刻', '混一色'], ['三色同刻', '清一色'],
    ['三色同刻', '大三元'], ['三色同刻', '小四喜'], ['三色同刻', '大四喜'], ['三色同刻', '字一色'],
    ['小三元', '大三元'], ['小三元', '小四喜'], ['小三元', '清一色'], ['小三元', '緑一色'],
    ['純全帯幺九', '混一色'], ['純全帯幺九', '混老頭'], ['純全帯幺九', '緑一色'],
    ['混一色', '字一色'], ['混一色', '清老頭'], ['混一色', '九蓮宝燈'],
    ['清一色', '混老頭'], ['清一色', '字一色'], ['清一色', '清老頭'],
    ['国士無双', '四暗刻'], ['国士無双', '混一色'], ['国士無双', '一気通貫'],
    ['国士無双', '字一色'], ['国士無双', '四槓子'],
    ['大三元', '小四喜'], ['大三元', '大四喜'], ['小四喜', '大四喜'],
    ['字一色', '緑一色'], ['字一色', '清老頭'], ['緑一色', '清老頭'], ['緑一色', '混老頭'],
    ['九蓮宝燈', '対々和'], ['九蓮宝燈', '四暗刻'], ['九蓮宝燈', '三暗刻'],
    ['九蓮宝燈', '三槓子'], ['九蓮宝燈', '四槓子'], ['九蓮宝燈', '嶺上開花'],
    ['槍槓', '七対子'], ['槍槓', '二盃口'], ['槍槓', '対々和'], ['槍槓', '四暗刻'],
    ['槍槓', '大四喜'], ['槍槓', '字一色'], ['槍槓', '清老頭'], ['槍槓', '四槓子']
];

for (const pair of impossiblePairs) {
    test(`構成上の矛盾を双方向で拒否: ${pair.join(' + ')}`, () => {
        for (const names of [pair, [...pair].reverse()]) {
            const context = names.includes('嶺上開花') ? tsumo : ron;
            const result = validate(names, context);
            assert.equal(result.valid, false);
            assert.ok(result.issues.some(issue => issue.type === 'structure'), JSON.stringify(result));
        }
    });
}

for (const pair of [
    ['立直', 'ダブル立直'], ['一盃口', '二盃口'], ['混全帯幺九', '純全帯幺九'],
    ['混一色', '清一色'], ['七対子', '平和'], ['七対子', '一盃口'], ['七対子', '二盃口']
]) {
    test(`重複加算と別解釈を双方向で拒否: ${pair.join(' + ')}`, () => {
        for (const names of [pair, [...pair].reverse()]) {
            const result = validate(names);
            assert.equal(result.valid, false);
            assert.ok(result.issues.some(issue => issue.type === 'duplicate'));
        }
    });
}

const legalSelections = [
    ['七対子', '混老頭'], ['七対子', '断幺九'], ['七対子', '混一色'], ['七対子', '清一色'], ['七対子', '字一色'],
    ['平和', '一盃口'], ['平和', '二盃口'], ['平和', '三色同順'], ['平和', '一気通貫'],
    ['平和', '混全帯幺九'], ['平和', '純全帯幺九'], ['対々和', '三暗刻'], ['対々和', '混老頭'],
    ['一発', '立直'], ['一発', 'ダブル立直'], ['一発', '立直', '槍槓'],
    ['一発', '立直', '三槓子'], ['一発', '立直', '四槓子'],
    ['ダブル立直', '三槓子'], ['ダブル立直', '四槓子'],
    ['一盃口', '一気通貫'], ['一盃口', '三色同順'], ['一盃口', '小三元'],
    ['三色同刻', '役牌'], ['三色同刻', '混全帯幺九'], ['三色同刻', '純全帯幺九'],
    ['小三元', '混一色'], ['小三元', '三暗刻'], ['小四喜', '混全帯幺九'],
    ['大三元', '字一色'], ['小四喜', '字一色'], ['大四喜', '字一色'],
    ['四暗刻', '対々和', '三暗刻'], ['四槓子', '三槓子', '対々和'], ['清老頭', '混老頭'],
    ['緑一色', '清一色'], ['緑一色', '断幺九'], ['緑一色', '一盃口'],
    ['緑一色', '二盃口'], ['緑一色', '平和'], ['緑一色', '混一色'], ['緑一色', '役牌'],
    ['緑一色', '混一色', '二盃口'], ['緑一色', '清一色', '平和'],
    ['緑一色', '断幺九', '清一色', '平和', '二盃口'],
    ['国士無双', '混老頭'], ['国士無双', '槍槓'], ['国士無双', '混老頭', '槍槓'], ['混老頭', '槍槓'],
    ['九蓮宝燈', '清一色'], ['九蓮宝燈', '一気通貫'],
    ['七対子', '断幺九', '清一色'], ['三暗刻', '三槓子'],
    ['一盃口', '三色同順', '混全帯幺九']
];
for (const names of legalSelections) {
    test(`合法な複合を維持: ${names.join(' + ')}`, () => {
        assert.deepEqual(validate(names), { valid: true, issues: [] });
        assert.deepEqual(validate([...names].reverse()), { valid: true, issues: [] });
    });
}

test('全役の棚卸しに漏れがなく、各役は適切な和了条件なら単独で有効', () => {
    assert.equal(yakuData.length, 38);
    assert.deepEqual(Object.keys(yakuValidationAudit).sort(), yakuData.map(y => y.name).sort());
    for (const { name } of yakuData) {
        const names = name === '一発' ? ['一発', '立直'] : [name];
        const tsumoOnly = ['門前清自摸和', '海底撈月', '嶺上開花', '天和', '地和'].includes(name);
        const context = { winType: tsumoOnly ? 'tsumo' : 'ron', playerType: name === '天和' ? 'parent' : 'child' };
        assert.equal(validate(names, context).valid, true, name);
        assert.ok(yakuValidationAudit[name].length > 10);
    }
});

test('前提役の追加・解除を再検証し、元のSetを書き換えない', () => {
    const selected = new Set(['一発']);
    assert.equal(validateYakuSelection(selected, ron).issues[0].type, 'prerequisite');
    selected.add('立直');
    assert.equal(validateYakuSelection(selected, ron).valid, true);
    selected.delete('立直');
    assert.equal(validateYakuSelection(selected, ron).valid, false);
    assert.deepEqual([...selected], ['一発']);
});

for (const name of ['門前清自摸和', '海底撈月', '嶺上開花']) {
    test(`ツモ限定役の条件変更: ${name}`, () => {
        assert.equal(validate([name], ron).valid, false);
        assert.equal(validate([name], tsumo).valid, true);
        assert.equal(validate([name], ron).valid, false);
    });
}
for (const name of ['河底撈魚', '槍槓']) {
    test(`ロン限定役の条件変更: ${name}`, () => {
        assert.equal(validate([name], tsumo).valid, false);
        assert.equal(validate([name], ron).valid, true);
    });
}

test('天和・地和の親子とツモ条件は独立に確認する', () => {
    assert.equal(validate(['天和'], { winType: 'tsumo', playerType: 'parent' }).valid, true);
    assert.equal(validate(['地和'], tsumo).valid, true);
    assert.equal(validate(['天和'], tsumo).valid, false);
    assert.equal(validate(['地和'], { winType: 'tsumo', playerType: 'parent' }).valid, false);
    assert.equal(validate(['天和'], { winType: 'ron', playerType: 'parent' }).valid, false);
    assert.equal(validate(['地和'], ron).valid, false);
    assert.equal(validate(['天和', '国士無双'], { winType: 'tsumo', playerType: 'parent' }).valid, true);
    assert.equal(validate(['地和', '七対子'], tsumo).valid, true);
});

test('四暗刻の単騎ロンをツモ限定と誤判定しない', () => {
    assert.equal(validate(['四暗刻'], ron).valid, true);
    assert.equal(validate(['四暗刻'], tsumo).valid, true);
});

test('手牌構成の三役以上の矛盾と、成立時点の三役以上の矛盾', () => {
    for (const names of [
        ['一盃口', '三色同順', '役牌'], ['一盃口', '一気通貫', '役牌'],
        ['三色同刻', '役牌', '混全帯幺九'], ['三色同刻', '小三元', '三暗刻'],
        ['緑一色', '混一色', '平和']
    ]) assert.equal(validate(names).valid, false, names.join('+'));
    for (const name of ['海底撈月', '河底撈魚', '槍槓', '三槓子', '四槓子']) {
        const context = name === '海底撈月' ? tsumo : ron;
        assert.equal(validate(['ダブル立直', '一発', name], context).valid, false, name);
        assert.equal(validate(['ダブル立直', name], context).valid, true, name);
        assert.equal(validate(['立直', '一発', name], context).valid, true, name);
    }
});

test('海底/嶺上・河底/槍槓・一発/嶺上の理由を区別する', () => {
    for (const names of [['海底撈月', '嶺上開花'], ['河底撈魚', '槍槓'], ['立直', '一発', '嶺上開花']]) {
        const context = names.includes('嶺上開花') ? tsumo : ron;
        const result = validate(names, context);
        assert.equal(result.valid, false);
        assert.ok(result.issues.some(issue => issue.type === 'condition'));
    }
});

test('全ての問題は対象役とユーザー向け理由を返し、結果の変更は次回に影響しない', () => {
    const names = new Set(['七対子', '対々和', '一発', '不明な役']);
    const result = validateYakuSelection(names, ron);
    assert.equal(result.valid, false);
    for (const issue of result.issues) {
        assert.ok(issue.yaku.length);
        assert.ok(issue.code);
        assert.ok(issue.message.length > 10);
    }
    assert.ok(result.issues.some(issue => issue.type === 'unknown'));
    result.issues.length = 0;
    assert.equal(validateYakuSelection(names, ron).valid, false);
    assert.deepEqual([...names], ['七対子', '対々和', '一発', '不明な役']);
    assert.deepEqual(validate([]), { valid: true, issues: [] }); // 未選択のエラーは計算境界が担当
});

test('合法な通常役の翻・固定符と得点を維持', () => {
    for (const [names, han, fu, score] of [
        [['七対子', '混老頭'], 4, 25, 6400], [['平和', '一盃口'], 2, 30, 2000],
        [['七対子', '断幺九'], 3, 25, 3200], [['対々和', '三暗刻'], 4, 40, 8000]
    ]) {
        assert.equal(validate(names).valid, true);
        assert.equal(calculateTotalHan(new Set(names), yakuData), han);
        assert.equal(calculateScoreResult(han, fu, 'ron', 'child').score, score);
    }
});

test('合法な複合役満と通常役を許可し、現行の単一役満集計を変更しない', () => {
    for (const names of [
        ['大三元', '字一色'], ['四暗刻', '対々和', '三暗刻'], ['清老頭', '混老頭'],
        ['四槓子', '三槓子'], ['九蓮宝燈', '一気通貫', '清一色']
    ]) {
        assert.equal(validate(names).valid, true, names.join('+'));
        assert.equal(calculateTotalHan(new Set(names), yakuData), 13);
        assert.equal(calculateScoreResult(13, 30, 'ron', 'child').score, 32000);
    }
});
