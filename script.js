// 麻雀点数計算アプリ

// ES6モジュールインポート
import { yakuData } from './js/data/yakuData.js';
import { scoreTable } from './js/data/scoreTable.js';
import { validFuByHan, DEFAULT_SETTINGS } from './js/data/constants.js';
import { calculateScoreResult } from './js/modules/calculator.js';
import { calculateTotalHan, validateAndAdjustFu } from './js/modules/validator.js';
import { generateScoreTable, generateYakuList, displayResult, toggleDetailDisplay } from './js/modules/display.js';
import { createStateManager } from './js/modules/stateManager.js';
import { setupStateSubscriptions } from './js/modules/stateSubscriptions.js';
import { createEventHandlers } from './js/modules/eventHandlers.js';
import { safeGetElement, safeQuerySelector, safeRun, safeStateOperation, readIntValue } from './js/modules/errorHandler.js';

// DOM要素（Issue #41: 欠けていても初期化全体は止めず、ログに残して null にする）
const hanInput = safeGetElement('hanInput', 'init');
const fuInput = safeGetElement('fuInput', 'init');
const fuYakuInput = safeGetElement('fuYakuInput', 'init');
const calculateBtn = safeGetElement('calculateBtn', 'init');
const resetBtn = safeGetElement('resetBtn', 'init');
const resultSection = safeGetElement('resultSection', 'init');
const mainResult = safeGetElement('mainResult', 'init');
const detailResult = safeGetElement('detailResult', 'init');
const toggleDetailBtn = safeGetElement('toggleDetailBtn', 'init');
const scoreTableBody = safeGetElement('scoreTableBody', 'init');
const yakuListContainer = safeGetElement('yakuListContainer', 'init');

// 役選択関連のDOM要素
const manualInputSection = safeQuerySelector('.manual-input-section', 'init', { required: true });
const yakuInputSection = safeQuerySelector('.yaku-input-section', 'init', { required: true });
const selectedYakuList = safeGetElement('selectedYakuList', 'init');
const totalHan = safeGetElement('totalHan', 'init');

// 状態管理
let stateManager;
let stateSubscriptions; // 将来のクリーンアップ用に保持
let eventHandlers; // Phase3b: イベント処理クラス

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // StateManager は全機能の前提。作れなければ以降の初期化はできない。
    stateManager = safeRun(() => createStateManager(), 'initializeApp - createStateManager', null);
    if (!stateManager) return;
    
    // DOM要素オブジェクト作成
    const domElements = {
        hanInput,
        fuInput,
        fuYakuInput,
        calculateBtn,
        resetBtn,
        resultSection,
        mainResult,
        detailResult,
        toggleDetailBtn,
        manualInputSection,
        yakuInputSection,
        selectedYakuList,
        totalHan
    };
    
    // Phase3b: EventHandlers初期化
    eventHandlers = createEventHandlers(stateManager, yakuData, domElements);
    
    // 以降の各ステップは独立して実行し、1つが失敗しても残りの初期化を続ける。
    // HTMLフォームの実際の初期状態をStateManagerに同期 (Phase3b-3: EventHandlers使用)
    safeRun(() => eventHandlers.syncInitialFormStateToStateManager(), 'initializeApp - syncInitialFormState');
    
    // リアクティブ購読設定
    stateSubscriptions = safeRun(
        () => setupStateSubscriptions(stateManager, domElements, yakuData),
        'initializeApp - setupStateSubscriptions',
        null
    );
    
    // 基本UI初期化 (Phase3b-3: EventHandlers完全統合)
    safeRun(() => eventHandlers.setupEventListeners(toggleDetailDisplay), 'initializeApp - setupEventListeners');
    safeRun(() => eventHandlers.setupTouchOptimization(), 'initializeApp - setupTouchOptimization');
    safeRun(() => generateScoreTable(scoreTable, scoreTableBody), 'initializeApp - generateScoreTable');
    safeRun(() => generateYakuList(yakuData, yakuListContainer), 'initializeApp - generateYakuList');
    safeRun(() => eventHandlers.generateYakuSelectionUI(), 'initializeApp - generateYakuSelectionUI');
    
    // 初期状態の符数制限を設定 (Phase3b: EventHandlers使用)
    safeRun(() => eventHandlers.adjustFuForHanChange(readIntValue(hanInput, 1)), 'initializeApp - adjustFuForHanChange');
    
    // 役選択モードの初期制限も設定（StateManager経由）
    safeStateOperation(() => {
        const currentState = stateManager.getState();
        stateManager.setTotalHan(calculateTotalHan(currentState.selectedYaku, yakuData));
    }, null, 'initializeApp - setTotalHan');
    
    // テスト用: StateManager動作確認
    console.log('StateManager初期化完了:', stateManager.getState());
}

// Phase3b-3: syncInitialFormStateToStateManager()関数はeventHandlers.jsに移行済み

// Phase3b-2: setupEventListeners()関数はeventHandlers.jsに移行済み

// Phase3b-1: handleNumberInput()関数はeventHandlers.jsに移行済み

// Phase3b-3: calculateScore()関数はeventHandlers.jsに移行済み




// Phase3b-2: handleTabSwitch()関数はeventHandlers.jsに移行済み


// Phase3b-2: generateYakuSelectionUI()関数はeventHandlers.jsに移行済み

// Phase3b-2: 以下のイベント処理関数はeventHandlers.jsに移行済み
// - handleInputModeChange()
// - handleWinTypeChange()
// - handlePlayerTypeChange()
// - handleYakuSelection()

// 選択された役の表示更新

// 合計翻数の計算と表示更新機能は stateSubscriptions.js に移行済み

// 選択された役から合計翻数を計算

// 特殊役の処理関数


// 平和の処理関数


// 特殊役符数処理機能は stateSubscriptions.js に移行済み

// 翻数に基づいて符数を検証・調整する関数

// Phase3b-1: adjustFuForHanChange()関数はeventHandlers.jsに移行済み

// 役選択モードでの符数調整機能は stateSubscriptions.js に移行済み

// Phase3b-3: タッチイベント最適化はeventHandlers.jsに移行済み