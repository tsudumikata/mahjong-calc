// StateManager - リアクティブ状態管理システム

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
        if (winType === 'tsumo' || winType === 'ron') {
            this.updateState({ winType });
        } else {
            console.warn(`StateManager: Invalid win type "${winType}"`);
        }
    }

    setPlayerType(playerType) {
        if (playerType === 'oya' || playerType === 'ko') {
            this.updateState({ playerType });
        } else {
            console.warn(`StateManager: Invalid player type "${playerType}"`);
        }
    }

    setWinInfo(winType, playerType) {
        const updates = {};
        if (winType === 'tsumo' || winType === 'ron') {
            updates.winType = winType;
        }
        if (playerType === 'oya' || playerType === 'ko') {
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
            totalHan: 0 
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
        winType: 'tsumo',   // 'tsumo' | 'ron'
        playerType: 'ko',   // 'oya' | 'ko'
        
        // 符数・翻数
        currentFu: 20,
        currentHan: 1,
        totalHan: 0,
        
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