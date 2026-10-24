import { yakuData } from '../data/yakuData.js';

// 役の選択だけで確定できる制約。牌姿の成立判定・食い下がり・符計算は行わない。
// 定義の確認元（これらの競技規定全体を採用ルールに変更するものではない）:
// https://www.nihon-majan.org/ritimajyanyakuitiran.html
// https://saikouisen.com/pdf/saikouisen_regulation.pdf 第47〜48条
// https://m-league.jp/about/ 第5章第4条、第9章第1条
// 役満と通常役の物理的に可能な複合は許可する。通常役を加点しないこと、
// 複数役満でも13翻とする現在の得点仕様は calculateTotalHan の責務（Issue #8）。

const rules = [];
function exclude(name, others, type, reason) {
    for (const other of others) {
        rules.push({ code: `${name}/${other}`, type, yaku: [name, other], message: reason(name, other) });
    }
}
const structure = (a, b) => `${a}と${b}は必要な牌・面子の構成が両立しません。どちらかを解除してください。`;
const duplicate = (a, b) => `${a}と${b}は重複して加算できません。成立する上位役のみを選んでください。`;

exclude('立直', ['ダブル立直'], 'duplicate', duplicate);
exclude('一盃口', ['二盃口'], 'duplicate', duplicate);
exclude('混全帯幺九', ['純全帯幺九'], 'duplicate', duplicate);
exclude('混一色', ['清一色'], 'duplicate', duplicate);

// 七対子と順子による別解釈を同時に計上しない。混老頭・断幺九・色役・字一色は可能。
exclude('七対子', [
    '役牌', '混全帯幺九', '一気通貫', '三色同順', '対々和',
    '三暗刻', '小三元', '三色同刻', '三槓子', '純全帯幺九', '国士無双',
    '四暗刻', '大三元', '小四喜', '大四喜', '清老頭', '九蓮宝燈', '四槓子', '緑一色'
], 'structure', structure);
exclude('七対子', ['平和', '一盃口', '二盃口'], 'duplicate', (a, b) =>
    `${a}と${b}は別の面子構成として扱うため同時計上できません。どちらかを選んでください。`);

// 国士の牌姿は刻子・順子・七対子と両立しない。混老頭は現行の「幺九牌のみ」
// という説明に合わせて許可し、通常役の加点はしない。
const kokushiCompatible = new Set([
    '国士無双', '立直', '一発', '門前清自摸和', '海底撈月', '河底撈魚', '槍槓',
    'ダブル立直', '混老頭', '天和', '地和'
]);
exclude('国士無双', yakuData.map(y => y.name).filter(name => !kokushiCompatible.has(name)), 'structure', structure);

exclude('断幺九', [
    '役牌', '混全帯幺九', '純全帯幺九', '一気通貫', '小三元', '混老頭', '混一色', '大三元',
    '小四喜', '大四喜', '字一色', '清老頭', '九蓮宝燈'
], 'structure', structure);
exclude('一気通貫', ['三色同順', '二盃口', '混全帯幺九', '純全帯幺九', '緑一色'], 'structure', structure);
exclude('三色同順', ['二盃口', '混一色', '清一色', '緑一色', '九蓮宝燈'], 'structure', structure);
exclude('三色同刻', ['混一色', '清一色', '緑一色', '九蓮宝燈'], 'structure', structure);
exclude('小三元', ['大三元'], 'structure', (a, b) =>
    `${a}の三元牌の雀頭と${b}の三元牌3組の刻子は両立しません。どちらかを解除してください。`);
exclude('小四喜', ['大四喜'], 'structure', (a, b) =>
    `${a}の風牌の雀頭と${b}の風牌4組の刻子は両立しません。どちらかを解除してください。`);

// 数牌のみの役と、必ず字牌を必要とする役。混全帯は順子と字牌を含む形、
// 字牌を含まない上位の形は純全帯として選ぶ。
for (const numberOnly of ['純全帯幺九', '清一色', '清老頭', '九蓮宝燈']) {
    exclude(numberOnly, ['役牌', '小三元', '大三元', '小四喜', '大四喜', '字一色', '混全帯幺九'], 'structure', structure);
}
exclude('純全帯幺九', ['混一色', '緑一色', '九蓮宝燈'], 'structure', structure);
exclude('混一色', ['字一色', '清老頭', '九蓮宝燈'], 'structure', structure);
exclude('清一色', ['清老頭', '混老頭'], 'structure', structure);
exclude('字一色', ['三色同刻', '緑一色', '清老頭', '九蓮宝燈'], 'structure', structure);
exclude('緑一色', ['小三元', '大三元', '小四喜', '大四喜', '混老頭', '混全帯幺九', '清老頭', '九蓮宝燈'], 'structure', structure);
rules.push({
    code: 'green-honitsu-pinfu', type: 'structure', yaku: ['緑一色', '混一色', '平和'],
    message: '緑一色と混一色を複合するには字牌の發が必要です。平和の四順子では發は役牌の雀頭になるため、この三役は両立しません。どれかを解除してください。'
});
exclude('九蓮宝燈', ['平和', '一盃口', '二盃口', '三暗刻', '混老頭', '嶺上開花'], 'structure', structure);

// 一つの和了牌は海底の自摸牌・嶺上牌、河底の捨て牌・加槓牌を兼ねない。
exclude('海底撈月', ['嶺上開花'], 'condition', (a, b) => `${a}と${b}は同じ和了牌では成立しません。どちらかを解除してください。`);
exclude('河底撈魚', ['槍槓'], 'condition', (a, b) => `${a}と${b}は同じ和了牌では成立しません。どちらかを解除してください。`);
exclude('一発', ['嶺上開花'], 'condition', () => '一発は槓で無効になるため、嶺上開花とは同時に選べません。一発または嶺上開花を解除してください。');
// 現行の槍槓は「他家の加カン」。刻子手の双碰・単騎、七対子の単騎では、
// 和了者の待ち牌と他家の刻子＋加槓牌を合わせると同一牌が5枚以上になる。
// 国士の暗槓槍槓等、ローカルルールの追加はここでは行わない。
exclude('槍槓', ['七対子', '二盃口', '対々和', '四暗刻', '大四喜', '字一色', '清老頭', '四槓子'], 'structure', (a, b) =>
    `${a}は現行仕様では他家の加カンによる和了です。${b}の待ちと合わせると同じ牌が5枚以上必要になるため両立しません。`);
for (const firstDraw of ['天和', '地和']) {
    exclude(firstDraw, ['立直', 'ダブル立直', '一発', '海底撈月', '河底撈魚', '嶺上開花', '槍槓', '三槓子', '四槓子'], 'condition', (a, b) =>
        `${a}は配牌または最初のツモでの和了のため、${b}の宣言・和了時点とは両立しません。どちらかを解除してください。`);
}

// 四面子の枠を共有するため、単純な二役の排他だけでなく三役以上でも確認する。
// 暗刻・槓子・役牌は同じ刻子と重なり得るので足さず、最低必要数の最大値を取る。
// 三元牌・風牌・三色同刻の数牌の刻子は互いに異なり、その必要数は合計する。
const profiles = {
    '七対子': { maxKans: 0 },
    '平和': { sequences: 4 }, '一盃口': { sequences: 2 }, '二盃口': { sequences: 4 },
    '混全帯幺九': { sequences: 1 }, '純全帯幺九': { sequences: 1 },
    '一気通貫': { sequences: 3 }, '三色同順': { sequences: 3 },
    '役牌': { honors: 1 }, '対々和': { triplets: 4, maxSequences: 0 },
    '三暗刻': { triplets: 3 }, '小三元': { dragons: 2 }, '三色同刻': { numbers: 3 },
    '三槓子': { triplets: 3, kans: 3 }, '四暗刻': { triplets: 4, maxSequences: 0 },
    '大三元': { dragons: 3 }, '小四喜': { winds: 3 }, '大四喜': { winds: 4 },
    '混老頭': { maxSequences: 0 }, '字一色': { maxSequences: 0 },
    '清老頭': { triplets: 4, maxSequences: 0 },
    '四槓子': { triplets: 4, kans: 4, maxSequences: 0 },
    '嶺上開花': { triplets: 1, kans: 1 },
    // 余剰牌1なら111/123/456/789/99で刻子は一組。一通との合法な複合を残す。
    '九蓮宝燈': { sequences: 2, triplets: 1, maxKans: 0 }
};

// 全38役を監査対象として明示。新しい役を追加したら単体テストが棚卸し漏れを検出する。
export const yakuValidationAudit = Object.freeze({
    '立直': '上位役との重複・最初のツモ役との時間的矛盾。門前の実態は未判定。',
    '一発': '立直前提・槓/最初のツモ役との矛盾。槍槓は許可、鳴き履歴は未判定。',
    '門前清自摸和': 'ツモ条件。門前の実態は未判定。',
    '断幺九': '幺九牌・字牌必須役と矛盾。',
    '平和': '四順子・刻子なし。雀頭の役牌/両面待ちの実態は未判定。',
    '一盃口': '二順子・上位役/七対子との同時計上。',
    '役牌': '字牌の刻子が必要。自風/場風や複数役牌の加点は現行仕様のまま。',
    '海底撈月': 'ツモ条件・嶺上/最初のツモ役と矛盾。実際の最終牌は未判定。',
    '河底撈魚': 'ロン条件・加槓/最初のツモ役と矛盾。実際の最終打牌は未判定。',
    '嶺上開花': 'ツモ・自身の槓が必要。一発/海底/槓不可の構成と矛盾。',
    '槍槓': 'ロン・現行定義の加槓と同一牌枚数の矛盾。国士は許可。暗槓のローカル例外は追加しない。',
    'ダブル立直': '立直との重複。最初のツモ役と矛盾。宣言時点/鳴き履歴は未判定。',
    '七対子': '七種の対子と面子構成の矛盾/別解釈の重複。緑/清老頭は種類不足。混老頭を許可。',
    '混全帯幺九': '順子と幺九牌/字牌を含む形。純全帯との重複。',
    '一気通貫': '三種の異なる順子。三色/二盃口と枠不足。九蓮との複合は許可。',
    '三色同順': '三種の数牌の順子。色役との矛盾と四面子の枠。',
    '対々和': '四刻子。順子との枠と加槓槍槓の待ち牌枚数。',
    '三暗刻': '三刻子以上。門前/暗刻の実態は未判定。四暗刻との物理的複合を許可。',
    '小三元': '三元牌二刻子+雀頭。大三元との矛盾と四面子の枠。',
    '混老頭': '幺九牌のみ・順子なし。七対子/国士/清老頭の物理的複合を許可。',
    '三色同刻': '三種の数牌の刻子。色役との矛盾と字牌刻子を含む枠。',
    '三槓子': '三槓子以上。四槓子との物理的複合は許可。槓の履歴は未判定。',
    '二盃口': '四順子。七対子と別解釈/一盃口の重複。',
    '純全帯幺九': '順子と老頭牌を含む形・字牌なし。',
    '混一色': '一種の数牌と字牌。三色/字牌のみ/数牌のみの上位形との矛盾・重複。',
    '清一色': '一種の数牌のみ。混一色との重複。',
    '国士無双': '十三種の幺九牌。刻子/順子/色役と矛盾。',
    '四暗刻': '四刻子。単騎ロンを許可。実際の待ち/暗刻は未判定。',
    '大三元': '三元牌三刻子。小三元/色役との矛盾と四面子の枠。',
    '小四喜': '風牌三刻子+雀頭。大四喜との矛盾と四面子の枠。',
    '大四喜': '風牌四刻子。小四喜との矛盾と四面子の枠。',
    '字一色': '字牌のみ・順子なし。七対子を許可。',
    '緑一色': '23468索+發の六種類。發のない清一色/断幺九/平和/盃口を許可。',
    '清老頭': '六種類の老頭牌のみ・四刻子。七対子/一色との種類不足。',
    '九蓮宝燈': '1112345678999+一枚。一盃口/平和/三刻子/槓不可。一通/清一色を許可。',
    '四槓子': '四槓子。対々和/三暗刻等の物理的に可能な通常役を許可。',
    '天和': '親ツモ・配牌時点。牌姿そのもの/配牌履歴は未判定。',
    '地和': '子ツモ・第一ツモ時点。鳴き履歴は未判定。'
});

// 同じ組を二度表示しない。公開値はテスト・棚卸し用で、検証中に変更しない。
export const yakuConflictRules = Object.freeze(rules.filter((rule, index) =>
    rules.findIndex(other => [...other.yaku].sort().join('/') === [...rule.yaku].sort().join('/')) === index
).map(rule => Object.freeze({ ...rule, yaku: Object.freeze(rule.yaku) })));

/** 副作用なし。選択済み役と和了条件だけで確定する問題をすべて返す。 */
export function validateYakuSelection(selectedYaku, { winType = 'ron', playerType = 'parent' } = {}) {
    const selected = new Set(selectedYaku);
    const issues = [];
    const add = (code, type, yaku, message) => issues.push({ code, type, yaku, message });
    for (const name of selected) {
        if (!Object.hasOwn(yakuValidationAudit, name)) {
            add('unknown-yaku', 'unknown', [name], `未定義の役「${name}」が含まれています。選択を解除してください。`);
        }
    }
    for (const rule of yakuConflictRules) {
        if (rule.yaku.every(name => selected.has(name))) issues.push({ ...rule, yaku: [...rule.yaku] });
    }
    if (selected.has('一発') && !selected.has('立直') && !selected.has('ダブル立直')) {
        add('ippatsu-riichi', 'prerequisite', ['一発'], '一発には立直またはダブル立直が必要です。前提役を選ぶか、一発を解除してください。');
    }
    if (selected.has('ダブル立直') && selected.has('一発')) {
        for (const name of ['海底撈月', '河底撈魚', '槍槓', '三槓子', '四槓子']) {
            if (selected.has(name)) {
                add('double-riichi-ippatsu-timing', 'condition', ['ダブル立直', '一発', name],
                    `ダブル立直と一発の成立期間に${name}は成立しません。一発など、時点の矛盾する役を解除してください。`);
            }
        }
    }
    // 混老頭+槍槓だけでは国士型の可能性を否定しない。選択役は部分的な情報であり、
    // 国士が未選択であることからその牌姿がないとは判定できない。
    for (const [method, names] of [
        ['tsumo', ['門前清自摸和', '海底撈月', '嶺上開花', '天和', '地和']],
        ['ron', ['河底撈魚', '槍槓']]
    ]) {
        for (const name of names) {
            if (selected.has(name) && winType !== method) {
                add('win-type', 'condition', [name], `${name}は${method === 'tsumo' ? 'ツモ' : 'ロン'}でのみ成立します。和了方法を変更するか、役を解除してください。`);
            }
        }
    }
    for (const [name, required] of [['天和', 'parent'], ['地和', 'child']]) {
        if (selected.has(name) && playerType !== required) {
            add('player-type', 'condition', [name], `${name}は${required === 'parent' ? '親' : '子'}の役です。親子を変更するか、役を解除してください。`);
        }
    }

    const chosen = [...selected].filter(name => profiles[name]);
    const maximum = key => Math.max(0, ...chosen.map(name => profiles[name][key] || 0));
    let sequences = maximum('sequences');
    if (selected.has('一盃口') && (selected.has('一気通貫') || selected.has('三色同順'))) sequences = Math.max(sequences, 4);
    const honorTriplets = Math.max(maximum('dragons') + maximum('winds'), maximum('honors'));
    const triplets = Math.max(maximum('triplets'), honorTriplets + maximum('numbers'));
    const maxSequences = Math.min(4, ...chosen.map(name => profiles[name].maxSequences ?? 4));
    const maxKans = Math.min(4, ...chosen.map(name => profiles[name].maxKans ?? 4));
    if (sequences + triplets > 4 || sequences > maxSequences || maximum('kans') > maxKans) {
        add('meld-capacity', 'structure', chosen, `${chosen.join('・')}に必要な順子・刻子・槓子が、同じ四面子の中に収まりません。構成の異なる役を解除してください。`);
    }
    return { valid: issues.length === 0, issues };
}
