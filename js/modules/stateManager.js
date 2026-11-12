// StateManager - リアクティブ状態管理システム

import { DORA_LIMITS, DEFAULT_FU_COMPOSITION } from '../data/constants.js';

// 符計算パネルの入力として受け付ける値（中身の矛盾は fuCalculator.js の calculateFu が判定する）
const FU_WAITS = new Set(['ryanmen', 'shanpon', 'kanchan', 'penchan', 'tanki']);
const FU_PAIRS = new Set(['plain', 'yakuhai', 'doubleWind']);
const FU_MELD_TYPES = new Set(['shuntsu', 'minko', 'anko', 'minkan', 'ankan']);

function isFuComposition(value) {
    return Boolean(value) && typeof value.menzen === 'boolean'
        && FU_WAITS.has(value.wait) && FU_PAIRS.has(value.pair)
        && Array.isArray(value.melds) && value.melds.length === 4
        && value.melds.every(meld => meld && FU_MELD_TYPES.has(meld.type) && typeof meld.terminal === 'boolean');
}

// 状態の外から書き換えられないよう、面子まで複製する
export function cloneFuComposition(composition) {
    return {
        menzen: composition.menzen,
        wait: composition.wait,
        pair: composition.pair,
        melds: composition.melds.map(({ type, terminal }) => ({ type, terminal }))
    };
}

export class StateManager {
    constructor(initialState = {}) {
        this.state = { ...initialState };
        this.listeners = new Map();
    }

    // 状態取得（読み取り専用）
    getState() {
        return { ...this.state };
    }

    // 状態更新（不変性保証）
    updateState(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };
        this.notifyListeners(oldState, this.state);
    }

    // 状態変更の購読
    subscribe(key, listener) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(listener);
        
        // 購読解除関数を返す
        return () => {
            const keyListeners = this.listeners.get(key);
            if (keyListeners) {
                const index = keyListeners.indexOf(listener);
                if (index > -1) {
                    keyListeners.splice(index, 1);
                }
                if (keyListeners.length === 0) {
                    this.listeners.delete(key);
                }
            }
        };
    }

    // リスナーへの通知
    notifyListeners(oldState, newState) {
        this.listeners.forEach((listeners, key) => {
            if (oldState[key] !== newState[key]) {
                listeners.forEach(listener => {
                    try {
                        listener(newState[key], oldState[key], key);
                    } catch (error) {
                        console.error(`StateManager: Error in listener for key "${key}":`, error);
                    }
                });
            }
        });
    }

    // 役選択操作メソッド
    addYaku(yakuName) {
        const newSelectedYaku = new Set(this.state.selectedYaku);
        newSelectedYaku.add(yakuName);
        this.updateState({ selectedYaku: newSelectedYaku });
    }

    removeYaku(yakuName) {
        const newSelectedYaku = new Set(this.state.selectedYaku);
        newSelectedYaku.delete(yakuName);
        this.updateState({ selectedYaku: newSelectedYaku });
    }

    setSelectedYaku(yakuSet) {
        this.updateState({ selectedYaku: new Set(yakuSet) });
    }

    clearSelectedYaku() {
        this.updateState({ selectedYaku: new Set() });
    }

    // 入力モード管理
    setInputMode(mode) {
        if (mode === 'manual' || mode === 'yaku') {
            this.updateState({ inputMode: mode });
        } else {
            console.warn(`StateManager: Invalid input mode "${mode}"`);
        }
    }

    // 和了情報設定
    setWinType(winType) {
        if (winType === 'ron' || winType === 'tsumo') {
            this.updateState({ winType });
        } else {
            console.warn(`StateManager: Invalid win type "${winType}"`);
        }
    }

    setPlayerType(playerType) {
        if (playerType === 'parent' || playerType === 'child') {
            this.updateState({ playerType });
        } else {
            console.warn(`StateManager: Invalid player type "${playerType}"`);
        }
    }

    setWinInfo(winType, playerType) {
        const updates = {};
        if (winType === 'ron' || winType === 'tsumo') {
            updates.winType = winType;
        }
        if (playerType === 'parent' || playerType === 'child') {
            updates.playerType = playerType;
        }
        this.updateState(updates);
    }

    // 符数・翻数管理
    setFu(fu) {
        const fuValue = parseInt(fu);
        if (!isNaN(fuValue) && fuValue >= 20 && fuValue <= 110) {
            this.updateState({ currentFu: fuValue });
        } else {
            console.warn(`StateManager: Invalid fu value "${fu}"`);
        }
    }

    setHan(han) {
        const hanValue = parseInt(han);
        if (!isNaN(hanValue) && hanValue >= 1 && hanValue <= 13) {
            this.updateState({ currentHan: hanValue });
        } else {
            console.warn(`StateManager: Invalid han value "${han}"`);
        }
    }

    setTotalHan(totalHan) {
        const totalHanValue = parseInt(totalHan);
        if (!isNaN(totalHanValue) && totalHanValue >= 0) {
            this.updateState({ totalHan: totalHanValue });
        } else {
            console.warn(`StateManager: Invalid total han value "${totalHan}"`);
        }
    }

    // ドラ枚数管理（kind: 'doraCount' | 'redDoraCount' | 'uraDoraCount'）
    setDoraCount(kind, count) {
        const max = DORA_LIMITS[kind];
        const value = Number(count);
        if (max === undefined) {
            console.warn(`StateManager: Invalid dora kind "${kind}"`);
        } else if (Number.isInteger(value) && value >= 0 && value <= max) {
            this.updateState({ [kind]: value });
        } else {
            console.warn(`StateManager: Invalid ${kind} value "${count}"`);
        }
    }

    // 符の自動計算（#9）
    setFuAutoEnabled(enabled) {
        if (typeof enabled === 'boolean') {
            this.updateState({ fuAutoEnabled: enabled });
        } else {
            console.warn(`StateManager: Invalid fuAutoEnabled value "${enabled}"`);
        }
    }

    // 門前／副露（Issue #49）。役の翻数（喰い下がり・門前限定役）と符の自動計算の両方が使うため、
    // menzen と fuComposition.menzen を同じ更新で書き換え、食い違いを残さない。
    setMenzen(menzen) {
        if (typeof menzen === 'boolean') {
            this.updateState({ menzen, fuComposition: { ...cloneFuComposition(this.state.fuComposition), menzen } });
        } else {
            console.warn(`StateManager: Invalid menzen value "${menzen}"`);
        }
    }

    setFuComposition(composition) {
        if (isFuComposition(composition)) {
            this.updateState({ menzen: composition.menzen, fuComposition: cloneFuComposition(composition) });
        } else {
            console.warn('StateManager: Invalid fu composition', composition);
        }
    }

    // UI状態管理
    setDetailVisible(isVisible) {
        this.updateState({ isDetailVisible: Boolean(isVisible) });
    }

    toggleDetailVisible() {
        this.updateState({ isDetailVisible: !this.state.isDetailVisible });
    }

    // 状態リセット
    resetState() {
        const defaultState = createDefaultState();
        this.updateState(defaultState);
    }

    resetYakuSelection() {
        this.updateState({ 
            selectedYaku: new Set(),
            totalHan: 0,
            doraCount: 0,
            redDoraCount: 0,
            uraDoraCount: 0
        });
    }

    // デバッグ用メソッド
    getListeners() {
        const result = {};
        this.listeners.forEach((listeners, key) => {
            result[key] = listeners.length;
        });
        return result;
    }

    // 状態の複製（テスト用）
    clone() {
        const newStateManager = new StateManager(this.getState());
        return newStateManager;
    }
}

// デフォルト状態の生成
export function createDefaultState() {
    return {
        // 役選択状態
        selectedYaku: new Set(),
        
        // 入力モード
        inputMode: 'manual', // 'manual' | 'yaku'
        
        // 和了情報
        winType: 'ron',     // 'ron' | 'tsumo' (HTMLの初期値に合わせて修正)
        playerType: 'parent', // 'parent' | 'child' (HTMLの初期値に合わせて修正)
        
        // 符数・翻数
        currentFu: 20,
        currentHan: 1,
        totalHan: 0,

        // ドラ（役選択モードで役の翻数に加算）
        doraCount: 0,
        redDoraCount: 0,
        uraDoraCount: 0,

        // 門前／副露（#49）。副露なら役の喰い下がりを適用し、門前限定役を選べなくする。
        // fuComposition.menzen と常に同じ値（setMenzen / setFuComposition が揃える）。
        menzen: DEFAULT_FU_COMPOSITION.menzen,

        // 符の自動計算（#9）。オフのときは±ボタンで入力した符を使う。
        fuAutoEnabled: false,
        fuComposition: cloneFuComposition(DEFAULT_FU_COMPOSITION),
        
        // UI状態
        isDetailVisible: false
    };
}

// StateManagerインスタンスの作成
export function createStateManager(initialState = null) {
    const defaultState = createDefaultState();
    const state = initialState ? { ...defaultState, ...initialState } : defaultState;
    return new StateManager(state);
}