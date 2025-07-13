// イベント処理専門モジュール - Phase3b実装
// StateManager統合済みのイベント処理を提供

import { calculateTotalHan, validateAndAdjustFu } from './validator.js';
import { calculateScoreResult } from './calculator.js';
import { displayResult } from './display.js';
import { validFuByHan } from '../data/constants.js';

export class EventHandlers {
    constructor(stateManager, yakuData, domElements) {
        this.stateManager = stateManager;
        this.yakuData = yakuData;
        this.elements = domElements;
    }

    /**
     * 数値入力処理（増減ボタン）
     * Phase3b-1: script.jsから分離された複雑なイベント処理関数
     */
    handleNumberInput(event) {
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
            this.adjustFuForHanChange(newValue);
            
        } else if (target === 'fu' || target === 'fuYaku') {
            // 特殊役選択時は符数変更を無効化
            if (target === 'fuYaku' && this.hasSpecialYaku()) {
                return; // 特殊役が選択されている場合は符数変更を無効
            }
            
            // 符数変更時の制限チェック
            let currentHan;
            if (target === 'fu') {
                // 手動入力モードの場合
                currentHan = parseInt(this.elements.hanInput.value);
            } else {
                // 役選択モードの場合（StateManager経由）
                const currentState = this.stateManager.getState();
                currentHan = calculateTotalHan(currentState.selectedYaku, this.yakuData);
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

    /**
     * 翻数変更時の符数調整（StateManager対応）
     * Phase3b-1: handleNumberInput()から使用される関数
     */
    adjustFuForHanChange(newHan) {
        const currentState = this.stateManager.getState();
        
        if (currentState.inputMode === 'manual') {
            // 手動入力モードでの調整
            const currentFu = parseInt(this.elements.fuInput.value);
            const adjustedFu = validateAndAdjustFu(newHan, currentFu);
            
            if (adjustedFu !== null) {
                this.elements.fuInput.value = adjustedFu;
                this.stateManager.setFu(adjustedFu);
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

    /**
     * 特殊役判定
     * Phase3b-1: handleNumberInput()から使用される判定関数
     */
    hasSpecialYaku() {
        const currentState = this.stateManager.getState();
        const selectedYaku = currentState.selectedYaku;
        
        // 特殊役の判定（符数が固定される役）
        const specialYaku = ['平和', '七対子', '国士無双', '九蓮宝燈', '大三元', '大四喜', '小四喜', '字一色', '清老頭', '緑一色', '四暗刻', '小三元', '混老頭', '四カン子', '大車輪'];
        
        return specialYaku.some(yaku => selectedYaku.has(yaku));
    }

    /**
     * タブ切り替え処理
     * Phase3b-2: script.jsから分離されたタブ制御関数
     */
    handleTabSwitch(event) {
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

    /**
     * 入力モード切り替え処理（リアクティブ購読システム対応）
     * Phase3b-2: StateManager統合済みイベント処理
     */
    handleInputModeChange(event) {
        const inputMode = event.target.value;
        
        // StateManager経由で入力モードを設定
        // UI更新は stateSubscriptions.js の購読者が自動実行
        this.stateManager.setInputMode(inputMode);
    }

    /**
     * 勝ち方（ロン/ツモ）切り替え処理（リアクティブ購読システム対応）
     * Phase3b-2: StateManager統合済みイベント処理
     */
    handleWinTypeChange(event) {
        const winType = event.target.value;
        
        // StateManager経由で和了タイプを設定
        // 平和処理等のUI更新は stateSubscriptions.js の購読者が自動実行
        this.stateManager.setWinType(winType);
    }

    /**
     * 親子切り替え処理（リアクティブ購読システム対応）
     * Phase3b-2: StateManager統合済みイベント処理
     */
    handlePlayerTypeChange(event) {
        const playerType = event.target.value;
        
        // StateManager経由で親子タイプを設定
        this.stateManager.setPlayerType(playerType);
    }

    /**
     * 役選択処理
     * Phase3b-2: StateManager統合済み役選択イベント処理
     */
    handleYakuSelection(event) {
        const yakuName = event.target.value;
        const isChecked = event.target.checked;
        
        // StateManager経由で役の追加・削除
        if (isChecked) {
            this.stateManager.addYaku(yakuName);
        } else {
            this.stateManager.removeYaku(yakuName);
        }
        
        // UI更新は stateSubscriptions.js の購読者が自動実行
    }

    /**
     * 役選択UIを生成
     * Phase3b-2: script.jsから分離されたUI生成関数
     */
    generateYakuSelectionUI() {
        const yakuByHan = {
            1: this.yakuData.filter(yaku => yaku.han === 1),
            2: this.yakuData.filter(yaku => yaku.han === 2),
            3: this.yakuData.filter(yaku => yaku.han === 3),
            6: this.yakuData.filter(yaku => yaku.han === 6),
            13: this.yakuData.filter(yaku => yaku.han === 13)
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
                checkbox.addEventListener('change', (event) => this.handleYakuSelection(event));
                
                container.appendChild(yakuCheckbox);
            });
        });
    }

    /**
     * イベントリスナー設定
     * Phase3b-3: 全イベント処理の統合設定関数（計算ボタンも統合）
     */
    setupEventListeners(toggleDetailDisplay) {
        // 数値入力ボタン (Phase3b-1: EventHandlers使用)
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', (event) => this.handleNumberInput(event));
        });

        // 計算ボタン (Phase3b-3: EventHandlers内で処理)
        this.elements.calculateBtn.addEventListener('click', () => this.calculateScore());

        // 詳細表示切り替え
        this.elements.toggleDetailBtn.addEventListener('click', () => 
            toggleDetailDisplay(this.elements.detailResult, this.elements.toggleDetailBtn)
        );

        // タブ切り替え
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (event) => this.handleTabSwitch(event));
        });

        // 入力モード切り替え
        document.querySelectorAll('input[name="inputMode"]').forEach(radio => {
            radio.addEventListener('change', (event) => this.handleInputModeChange(event));
        });
        
        // 勝ち方（ロン/ツモ）切り替え
        document.querySelectorAll('input[name="winType"]').forEach(radio => {
            radio.addEventListener('change', (event) => this.handleWinTypeChange(event));
        });
        
        // 親子切り替え
        document.querySelectorAll('input[name="playerType"]').forEach(radio => {
            radio.addEventListener('change', (event) => this.handlePlayerTypeChange(event));
        });
    }

    /**
     * HTMLフォームの初期状態をStateManagerに同期
     * Phase3b-3: script.jsから分離された初期化処理
     */
    syncInitialFormStateToStateManager() {
        // 入力モードの同期
        const inputModeElement = document.querySelector('input[name="inputMode"]:checked');
        if (inputModeElement) {
            this.stateManager.setInputMode(inputModeElement.value);
        }
        
        // 和了タイプの同期
        const winTypeElement = document.querySelector('input[name="winType"]:checked');
        if (winTypeElement) {
            this.stateManager.setWinType(winTypeElement.value);
        }
        
        // 親子の同期
        const playerTypeElement = document.querySelector('input[name="playerType"]:checked');
        if (playerTypeElement) {
            this.stateManager.setPlayerType(playerTypeElement.value);
        }
        
        // 符数の同期（初期値）
        const initialFu = parseInt(this.elements.fuInput.value) || 20;
        this.stateManager.setFu(initialFu);
        
        // 翻数の同期（初期値）
        const initialHan = parseInt(this.elements.hanInput.value) || 1;
        this.stateManager.setHan(initialHan);
    }

    /**
     * 点数計算実行
     * Phase3b-3: script.jsから分離された計算処理
     */
    calculateScore() {
        // StateManager経由で全状態を取得
        const currentState = this.stateManager.getState();
        let han, fu;
        
        if (currentState.inputMode === 'manual') {
            han = parseInt(this.elements.hanInput.value);
            fu = parseInt(this.elements.fuInput.value);
        } else {
            // 役選択モードの場合、選択された役から翻数を計算
            han = calculateTotalHan(currentState.selectedYaku, this.yakuData);
            fu = parseInt(this.elements.fuYakuInput.value);
            
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
            displayResult(
                result, han, fu, winType, playerType, 
                currentState.inputMode, currentState.selectedYaku, 
                this.yakuData, this.elements.mainResult, this.elements.detailResult
            );
            this.elements.resultSection.style.display = 'block';
            this.elements.resultSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            alert('該当する点数が見つかりません。');
        }
    }

    /**
     * タッチイベントの最適化
     * Phase3b-3: パフォーマンス最適化処理
     */
    setupTouchOptimization() {
        document.addEventListener('touchstart', function() {}, { passive: true });
        document.addEventListener('touchend', function() {}, { passive: true });
        document.addEventListener('touchmove', function() {}, { passive: true });
    }
}

/**
 * EventHandlersインスタンス作成用ファクトリー関数
 * Phase3b-1: script.jsからの簡単な利用を提供
 */
export function createEventHandlers(stateManager, yakuData, domElements) {
    return new EventHandlers(stateManager, yakuData, domElements);
}