// StateSubscriptions - StateManagerのリアクティブ購読設定

import { calculateTotalHan, hasSpecialYaku, getRequiredFuForSpecialYaku, validateAndAdjustFu, getPinfuFu } from './validator.js';
import { updateSelectedYakuDisplay } from './display.js';
import { specialYakuFuRules } from '../data/constants.js';

// メイン購読設定関数
export function setupStateSubscriptions(stateManager, domElements, yakuData) {
    const subscriptions = [];

    // 役選択状態の変更を購読
    subscriptions.push(
        stateManager.subscribe('selectedYaku', (newYaku, oldYaku) => {
            // 選択された役の表示更新
            updateSelectedYakuDisplay(newYaku, yakuData, domElements.selectedYakuList);
            
            // 合計翻数の再計算
            const totalHan = calculateTotalHan(newYaku, yakuData);
            stateManager.setTotalHan(totalHan);
        })
    );

    // 合計翻数の変更を購読
    subscriptions.push(
        stateManager.subscribe('totalHan', (newHan) => {
            // 翻数表示の更新
            updateTotalHanDisplay(newHan, domElements.totalHan);
            
            // 役選択モードでの符数制限適用
            const currentState = stateManager.getState();
            if (currentState.inputMode === 'yaku') {
                adjustFuForYakuSelection(newHan, currentState, domElements, stateManager);
            }
        })
    );

    // 入力モードの変更を購読
    subscriptions.push(
        stateManager.subscribe('inputMode', (newMode, oldMode) => {
            // 入力セクションの表示切り替え
            toggleInputSections(newMode, domElements);
            
            // 符数入力の同期
            synchronizeFuInputs(newMode, domElements, stateManager);
            
            // モード変更時の特殊処理
            handleInputModeChange(newMode, oldMode, stateManager, domElements, yakuData);
        })
    );

    // 和了タイプの変更を購読
    subscriptions.push(
        stateManager.subscribe('winType', (newWinType) => {
            const currentState = stateManager.getState();
            if (currentState.inputMode === 'yaku') {
                updateFuForWinTypeChange(newWinType, currentState, stateManager, domElements);
            }
        })
    );

    // 符数の変更を購読
    subscriptions.push(
        stateManager.subscribe('currentFu', (newFu) => {
            const currentState = stateManager.getState();
            // 符数表示の同期
            synchronizeFuDisplays(newFu, currentState.inputMode, domElements);
        })
    );

    // 詳細表示状態の変更を購読
    subscriptions.push(
        stateManager.subscribe('isDetailVisible', (isVisible) => {
            toggleDetailVisibility(isVisible, domElements);
        })
    );

    return subscriptions;
}

// 合計翻数表示の更新
function updateTotalHanDisplay(totalHan, totalHanElement) {
    if (totalHanElement) {
        const display = totalHan >= 13 ? '役満' : `${totalHan}翻`;
        totalHanElement.textContent = display;
    }
}

// 入力セクションの表示切り替え
function toggleInputSections(inputMode, domElements) {
    const { manualInputSection, yakuInputSection } = domElements;
    
    if (manualInputSection && yakuInputSection) {
        if (inputMode === 'manual') {
            manualInputSection.style.display = 'block';
            yakuInputSection.style.display = 'none';
        } else if (inputMode === 'yaku') {
            manualInputSection.style.display = 'none';
            yakuInputSection.style.display = 'block';
        }
    }
}

// 符数入力の同期
function synchronizeFuInputs(inputMode, domElements, stateManager) {
    const { fuInput, fuYakuInput } = domElements;
    const currentState = stateManager.getState();
    
    if (fuInput && fuYakuInput) {
        if (inputMode === 'manual') {
            // 役選択モードから手動入力モードに切り替える時、符数を同期
            fuInput.value = fuYakuInput.value;
            stateManager.setFu(parseInt(fuYakuInput.value));
        } else if (inputMode === 'yaku') {
            // 手動入力モードから役選択モードに切り替える時、符数を同期
            fuYakuInput.value = fuInput.value;
            stateManager.setFu(parseInt(fuInput.value));
        }
    }
}

// 符数表示の同期
function synchronizeFuDisplays(fu, inputMode, domElements) {
    const { fuInput, fuYakuInput } = domElements;
    
    if (inputMode === 'manual' && fuInput) {
        fuInput.value = fu;
    } else if (inputMode === 'yaku' && fuYakuInput) {
        fuYakuInput.value = fu;
    }
}

// 入力モード変更時の特殊処理
function handleInputModeChange(newMode, oldMode, stateManager, domElements, yakuData) {
    const currentState = stateManager.getState();
    
    if (newMode === 'yaku') {
        // 役選択モードに切り替え時は特殊役の処理を実行
        updateFuInputForSpecialYaku(currentState, stateManager, domElements, yakuData);
    }
}

// 役選択モードでの符数調整
function adjustFuForYakuSelection(totalHan, currentState, domElements, stateManager) {
    // 特殊役の処理が優先される場合はそちらに任せる
    if (hasSpecialYaku(currentState.selectedYaku, specialYakuFuRules)) {
        return;
    }
    
    // 符数の検証・調整
    const adjustedFu = validateAndAdjustFu(totalHan, currentState.currentFu);
    if (adjustedFu !== null && adjustedFu !== currentState.currentFu) {
        stateManager.setFu(adjustedFu);
    }
    
    // 5翻以上の場合は符数入力を無効化
    const fuButtons = document.querySelectorAll('[data-target="fuYaku"]');
    if (totalHan >= 5) {
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

// 特殊役の符数処理
function updateFuInputForSpecialYaku(currentState, stateManager, domElements, yakuData) {
    if (currentState.inputMode !== 'yaku') return;
    
    // 1. 固定符数の特殊役（七対子など）を最優先で処理
    const requiredFu = getRequiredFuForSpecialYaku(currentState.selectedYaku, specialYakuFuRules);
    
    if (requiredFu) {
        stateManager.setFu(requiredFu);
        
        // 符数ボタンを無効化
        const fuButtons = document.querySelectorAll('[data-target="fuYaku"]');
        fuButtons.forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
        });
        return;
    }
    
    // 2. 平和の処理
    if (hasSpecialYaku(currentState.selectedYaku, { '平和': true })) {
        const pinfuFu = getPinfuFu(currentState.winType);
        stateManager.setFu(pinfuFu);
        
        // 符数ボタンを無効化
        const fuButtons = document.querySelectorAll('[data-target="fuYaku"]');
        fuButtons.forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
        });
        return;
    }
    
    // 3. 通常の符数制限を適用
    const fuButtons = document.querySelectorAll('[data-target="fuYaku"]');
    fuButtons.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('disabled');
    });
}

// 和了タイプ変更時の符数更新
function updateFuForWinTypeChange(winType, currentState, stateManager, domElements) {
    // 平和が選択されている場合のみ符数を調整
    if (hasSpecialYaku(currentState.selectedYaku, { '平和': true })) {
        const pinfuFu = getPinfuFu(winType);
        stateManager.setFu(pinfuFu);
    }
}

// 詳細表示の切り替え
function toggleDetailVisibility(isVisible, domElements) {
    const { detailResult, toggleDetailBtn } = domElements;
    
    if (detailResult) {
        detailResult.style.display = isVisible ? 'block' : 'none';
    }
    
    if (toggleDetailBtn) {
        toggleDetailBtn.textContent = isVisible ? '詳細を隠す' : '詳細を表示';
    }
}

// 購読解除（クリーンアップ用）
export function unsubscribeAll(subscriptions) {
    subscriptions.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    });
}