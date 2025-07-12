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

// DOM要素
const hanInput = document.getElementById('hanInput');
const fuInput = document.getElementById('fuInput');
const fuYakuInput = document.getElementById('fuYakuInput');
const calculateBtn = document.getElementById('calculateBtn');
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

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // StateManager初期化
    stateManager = createStateManager();
    
    // HTMLフォームの実際の初期状態をStateManagerに同期
    syncInitialFormStateToStateManager();
    
    // DOM要素オブジェクト作成
    const domElements = {
        hanInput,
        fuInput,
        fuYakuInput,
        mainResult,
        detailResult,
        toggleDetailBtn,
        manualInputSection,
        yakuInputSection,
        selectedYakuList,
        totalHan
    };
    
    // リアクティブ購読設定
    stateSubscriptions = setupStateSubscriptions(stateManager, domElements, yakuData);
    
    // 基本UI初期化
    setupEventListeners();
    generateScoreTable(scoreTable, scoreTableBody);
    generateYakuList(yakuData, yakuListContainer);
    generateYakuSelectionUI();
    
    // 初期状態の符数制限を設定
    const initialHan = parseInt(hanInput.value);
    adjustFuForHanChange(initialHan);
    
    // 役選択モードの初期制限も設定（StateManager経由）
    const currentState = stateManager.getState();
    const totalHanValue = calculateTotalHan(currentState.selectedYaku, yakuData);
    stateManager.setTotalHan(totalHanValue);
    
    // テスト用: StateManager動作確認
    console.log('StateManager初期化完了:', stateManager.getState());
}

// HTMLフォームの初期状態をStateManagerに同期
function syncInitialFormStateToStateManager() {
    // 入力モードの同期
    const inputModeElement = document.querySelector('input[name="inputMode"]:checked');
    if (inputModeElement) {
        stateManager.setInputMode(inputModeElement.value);
    }
    
    // 和了タイプの同期
    const winTypeElement = document.querySelector('input[name="winType"]:checked');
    if (winTypeElement) {
        stateManager.setWinType(winTypeElement.value);
    }
    
    // 親子の同期
    const playerTypeElement = document.querySelector('input[name="playerType"]:checked');
    if (playerTypeElement) {
        stateManager.setPlayerType(playerTypeElement.value);
    }
    
    // 符数の同期（初期値）
    const initialFu = parseInt(fuInput.value) || 20;
    stateManager.setFu(initialFu);
    
    // 翻数の同期（初期値）
    const initialHan = parseInt(hanInput.value) || 1;
    stateManager.setHan(initialHan);
}

function setupEventListeners() {
    // 数値入力ボタン
    document.querySelectorAll('.number-btn').forEach(btn => {
        btn.addEventListener('click', handleNumberInput);
    });

    // 計算ボタン
    calculateBtn.addEventListener('click', calculateScore);

    // 詳細表示切り替え
    toggleDetailBtn.addEventListener('click', () => toggleDetailDisplay(detailResult, toggleDetailBtn));

    // タブ切り替え
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', handleTabSwitch);
    });

    // 入力モード切り替え
    document.querySelectorAll('input[name="inputMode"]').forEach(radio => {
        radio.addEventListener('change', handleInputModeChange);
    });
    
    // 勝ち方（ロン/ツモ）切り替え - 平和の符数更新のため
    document.querySelectorAll('input[name="winType"]').forEach(radio => {
        radio.addEventListener('change', handleWinTypeChange);
    });
    
    // 親子切り替え
    document.querySelectorAll('input[name="playerType"]').forEach(radio => {
        radio.addEventListener('change', handlePlayerTypeChange);
    });
}

function handleNumberInput(event) {
    const action = event.target.dataset.action;
    const target = event.target.dataset.target;
    const input = document.getElementById(target + 'Input');
    
    let currentValue = parseInt(input.value);
    let newValue = currentValue;
    
    if (target === 'han') {
        if (action === 'increase' && currentValue < 13) {
            newValue = currentValue + 1;
        } else if (action === 'decrease' && currentValue > 1) {
            newValue = currentValue - 1;
        }
        
        // 翻数変更時の符数調整
        input.value = newValue;
        adjustFuForHanChange(newValue);
        
    } else if (target === 'fu' || target === 'fuYaku') {
        // 特殊役選択時は符数変更を無効化
        if (target === 'fuYaku' && hasSpecialYaku()) {
            return; // 特殊役が選択されている場合は符数変更を無効
        }
        
        // 符数変更時の制限チェック
        let currentHan;
        if (target === 'fu') {
            // 手動入力モードの場合
            currentHan = parseInt(hanInput.value);
        } else {
            // 役選択モードの場合（StateManager経由）
            const currentState = stateManager.getState();
            currentHan = calculateTotalHan(currentState.selectedYaku, yakuData);
        }
        const validFuList = validFuByHan[currentHan] || [];
        
        if (action === 'increase' && currentValue < 110) {
            let testValue = currentValue + 10;
            // 有効な符数まで進める
            while (testValue <= 110 && validFuList.length > 0 && !validFuList.includes(testValue)) {
                testValue += 10;
            }
            if (testValue <= 110 && (validFuList.length === 0 || validFuList.includes(testValue))) {
                newValue = testValue;
            }
        } else if (action === 'decrease' && currentValue > 20) {
            let testValue = currentValue - 10;
            // 有効な符数まで戻す
            while (testValue >= 20 && validFuList.length > 0 && !validFuList.includes(testValue)) {
                testValue -= 10;
            }
            if (testValue >= 20 && (validFuList.length === 0 || validFuList.includes(testValue))) {
                newValue = testValue;
            }
        }
        
        input.value = newValue;
    }
}

function calculateScore() {
    // StateManager経由で全状態を取得
    const currentState = stateManager.getState();
    let han, fu;
    
    if (currentState.inputMode === 'manual') {
        han = parseInt(hanInput.value);
        fu = parseInt(fuInput.value);
    } else {
        // 役選択モードの場合、選択された役から翻数を計算
        han = calculateTotalHan(currentState.selectedYaku, yakuData);
        fu = parseInt(fuYakuInput.value);
        
        if (han === 0) {
            alert('役が選択されていません。');
            return;
        }
    }
    
    const winType = currentState.winType;
    const playerType = currentState.playerType;
    
    // 純粋関数を使用した計算
    const result = calculateScoreResult(han, fu, winType, playerType);
    
    if (result) {
        displayResult(result, han, fu, winType, playerType, currentState.inputMode, currentState.selectedYaku, yakuData, mainResult, detailResult);
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        alert('該当する点数が見つかりません。');
    }
}




function handleTabSwitch(event) {
    const targetTab = event.target.dataset.tab;
    
    // タブボタンの状態更新
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // タブコンテンツの表示切り替え
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(targetTab).classList.add('active');
}


// 新しい役選択UIを生成
function generateYakuSelectionUI() {
    const yakuByHan = {
        1: yakuData.filter(yaku => yaku.han === 1),
        2: yakuData.filter(yaku => yaku.han === 2),
        3: yakuData.filter(yaku => yaku.han === 3),
        6: yakuData.filter(yaku => yaku.han === 6),
        13: yakuData.filter(yaku => yaku.han === 13)
    };

    Object.entries(yakuByHan).forEach(([hanValue, yakuList]) => {
        const containerId = hanValue === '13' ? 'yakuYakuman' : `yaku${hanValue}Han`;
        const container = document.getElementById(containerId);
        
        yakuList.forEach(yaku => {
            const yakuCheckbox = document.createElement('label');
            yakuCheckbox.className = 'yaku-checkbox';
            yakuCheckbox.innerHTML = `
                <input type="checkbox" value="${yaku.name}" data-han="${yaku.han}">
                <span class="checkbox-custom"></span>
                <span class="yaku-text">${yaku.name}</span>
            `;
            
            const checkbox = yakuCheckbox.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', handleYakuSelection);
            
            container.appendChild(yakuCheckbox);
        });
    });
}

// 入力モード切り替え処理（リアクティブ購読システム対応）
function handleInputModeChange(event) {
    const inputMode = event.target.value;
    
    // StateManager経由で入力モードを設定
    // UI更新は stateSubscriptions.js の購読者が自動実行
    stateManager.setInputMode(inputMode);
}

// 勝ち方（ロン/ツモ）切り替え処理（リアクティブ購読システム対応）
function handleWinTypeChange(event) {
    const winType = event.target.value;
    
    // StateManager経由で和了タイプを設定
    // 平和処理等のUI更新は stateSubscriptions.js の購読者が自動実行
    stateManager.setWinType(winType);
}

// 親子切り替え処理（リアクティブ購読システム対応）
function handlePlayerTypeChange(event) {
    const playerType = event.target.value;
    
    // StateManager経由で親子タイプを設定
    stateManager.setPlayerType(playerType);
}

// 役選択処理
function handleYakuSelection(event) {
    const yakuName = event.target.value;
    const isChecked = event.target.checked;
    
    // StateManager経由で役の追加・削除
    if (isChecked) {
        stateManager.addYaku(yakuName);
    } else {
        stateManager.removeYaku(yakuName);
    }
    
    // UI更新は stateSubscriptions.js の購読者が自動実行
}

// 選択された役の表示更新

// 合計翻数の計算と表示更新機能は stateSubscriptions.js に移行済み

// 選択された役から合計翻数を計算

// 特殊役の処理関数


// 平和の処理関数


// 特殊役符数処理機能は stateSubscriptions.js に移行済み

// 翻数に基づいて符数を検証・調整する関数

// 翻数変更時の符数調整（StateManager対応）
function adjustFuForHanChange(newHan) {
    const currentState = stateManager.getState();
    
    if (currentState.inputMode === 'manual') {
        // 手動入力モードでの調整
        const currentFu = parseInt(fuInput.value);
        const adjustedFu = validateAndAdjustFu(newHan, currentFu);
        
        if (adjustedFu !== null) {
            fuInput.value = adjustedFu;
            stateManager.setFu(adjustedFu);
        }
        
        // 5翻以上の場合は符数入力を無効化
        const fuButtons = document.querySelectorAll('[data-target="fu"]');
        if (newHan >= 5) {
            fuButtons.forEach(btn => {
                btn.disabled = true;
                btn.classList.add('disabled');
            });
        } else {
            fuButtons.forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('disabled');
            });
        }
    }
}

// 役選択モードでの符数調整機能は stateSubscriptions.js に移行済み

// タッチイベントの最適化
document.addEventListener('touchstart', function() {}, { passive: true });
document.addEventListener('touchend', function() {}, { passive: true });
document.addEventListener('touchmove', function() {}, { passive: true });