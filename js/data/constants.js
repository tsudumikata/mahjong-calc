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
