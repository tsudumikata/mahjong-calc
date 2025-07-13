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

// DOM要素
const hanInput = document.getElementById('hanInput');
const fuInput = document.getElementById('fuInput');
const fuYakuInput = document.getElementById('fuYakuInput');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const resultSection = document.getElementById('resultSection');
const mainResult = document.getElementById('mainResult');
const detailResult = document.getElementById('detailResult');
const toggleDetailBtn = document.getElementById('toggleDetailBtn');
const scoreTableBody = document.getElementById('scoreTableBody');
const yakuListContainer = document.getElementById('yakuListContainer');

// 役選択関連のDOM要素
const manualInputSection = document.querySelector('.manual-input-section');
const yakuInputSection = document.querySelector('.yaku-input-section');
const selectedYakuList = document.getElementById('selectedYakuList');
const totalHan = document.getElementById('totalHan');

// 状態管理
let stateManager;
let stateSubscriptions; // 将来のクリーンアップ用に保持
let eventHandlers; // Phase3b: イベント処理クラス

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // StateManager初期化
    stateManager = createStateManager();
    
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
    
    // HTMLフォームの実際の初期状態をStateManagerに同期 (Phase3b-3: EventHandlers使用)
    eventHandlers.syncInitialFormStateToStateManager();
    
    // リアクティブ購読設定
    stateSubscriptions = setupStateSubscriptions(stateManager, domElements, yakuData);
    
    // 基本UI初期化 (Phase3b-3: EventHandlers完全統合)
    eventHandlers.setupEventListeners(toggleDetailDisplay);
    eventHandlers.setupTouchOptimization();
    generateScoreTable(scoreTable, scoreTableBody);
    generateYakuList(yakuData, yakuListContainer);
    eventHandlers.generateYakuSelectionUI();
    
    // 初期状態の符数制限を設定 (Phase3b: EventHandlers使用)
    const initialHan = parseInt(hanInput.value);
    eventHandlers.adjustFuForHanChange(initialHan);
    
    // 役選択モードの初期制限も設定（StateManager経由）
    const currentState = stateManager.getState();
    const totalHanValue = calculateTotalHan(currentState.selectedYaku, yakuData);
    stateManager.setTotalHan(totalHanValue);
    
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