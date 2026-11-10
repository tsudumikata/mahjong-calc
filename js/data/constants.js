// 麻雀計算用定数定義

// 翻数に応じた有効な符数の組み合わせ
export const validFuByHan = {
    1: [30, 40, 50, 60, 70, 80, 90, 100, 110],
    2: [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110],
    3: [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110],
    4: [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110],
    5: [], // 満貫以上は符数無関係
    6: [],
    7: [],
    8: [],
    9: [],
    10: [],
    11: [],
    12: [],
    13: [] // 役満
};

// 特殊役の符数固定ルール
export const specialYakuFuRules = {
    "七対子": 25
};

// 符の自動計算（#9）の加算表。js/modules/fuCalculator.js が使う。
// 面子の符は [中張牌, 幺九牌] の順。連風牌の雀頭は2符（Mリーグ・最高位戦の規定に合わせる）。
export const FU_RULES = Object.freeze({
    base: 20,           // 副底
    menzenRon: 10,      // 門前加符
    tsumo: 2,           // ツモ符（平和形のツモは加えない）
    openPinfuRon: 30,   // 副露で加符のない形（喰い平和形）は30符
    max: 110,           // 入力できる符の上限
    meld: Object.freeze({
        shuntsu: Object.freeze([0, 0]),
        minko: Object.freeze([2, 4]),
        anko: Object.freeze([4, 8]),
        minkan: Object.freeze([8, 16]),
        ankan: Object.freeze([16, 32])
    }),
    pair: Object.freeze({
        plain: 0,       // 数牌・客風牌
        yakuhai: 2,     // 三元牌・自風牌・場風牌
        doubleWind: 2   // 連風牌（自風＝場風）
    }),
    wait: Object.freeze({
        ryanmen: 0,
        shanpon: 0,
        kanchan: 2,
        penchan: 2,
        tanki: 2
    })
});

// 符計算パネルの初期値（門前・両面待ち・数牌の雀頭・順子4つ）。
export const DEFAULT_FU_COMPOSITION = Object.freeze({
    menzen: true,
    wait: 'ryanmen',
    pair: 'plain',
    melds: Object.freeze([
        Object.freeze({ type: 'shuntsu', terminal: false }),
        Object.freeze({ type: 'shuntsu', terminal: false }),
        Object.freeze({ type: 'shuntsu', terminal: false }),
        Object.freeze({ type: 'shuntsu', terminal: false })
    ])
});

// ドラ入力の上限。赤ドラは各色の5に1枚ずつ入る一般的な3枚ルール。
// ドラ・裏ドラは13翻（数え役満）を超える入力を想定しないため13枚までとする。
export const DORA_LIMITS = Object.freeze({
    doraCount: 13,
    redDoraCount: 3,
    uraDoraCount: 13
});

// 裏ドラは立直者のみが数える。
export const RIICHI_YAKU = Object.freeze(['立直', 'ダブル立直']);

// デフォルト設定値
export const DEFAULT_SETTINGS = {
    inputMode: 'manual',
    winType: 'ron',
    playerType: 'parent',
    hanInput: 1,
    fuInput: 30,
    fuYakuInput: 30
};
