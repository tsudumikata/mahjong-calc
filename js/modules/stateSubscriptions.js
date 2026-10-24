// StateSubscriptions - StateManagerのリアクティブ購読設定

import { calculateTotalHan, hasSpecialYaku, getRequiredFuForSpecialYaku, validateAndAdjustFu, getPinfuFu } from './validator.js';
import { updateSelectedYakuDisplay } from './display.js';
import { specialYakuFuRules, validFuByHan } from '../data/constants.js';
import { validateYakuSelection } from './yakuValidation.js';
import { clearYakuFeedback, hideCalculationResult, renderYakuValidation } from './yakuSelectionView.js';

// メイン購読設定関数
export function setupStateSubscriptions(stateManager, domElements, yakuData) {
    const subscriptions = [];

    // 条件・前提役の解除や一括更新も同じ検証経路へ通す。
    for (const key of ['selectedYaku', 'inputMode', 'winType', 'playerType']) {
        subscriptions.push(stateManager.subscribe(key, () => {
            hideCalculationResult(domElements);
            clearYakuFeedback();
            const state = stateManager.getState();
            if (key === 'inputMode') {
                toggleInputSections(state.inputMode, domElements);
                synchronizeFuInputs(state.inputMode, domElements, stateManager);
            }
            synchronizeYakuState(stateManager, domElements, yakuData);
        }));
    }

    subscriptions.push(stateManager.subscribe('totalHan', () => {
        const state = stateManager.getState();
        renderYakuValidation(state, validateYakuSelection(state.selectedYaku, state), domElements);
    }));

    // 符数の変更を購読
    subscriptions.push(
        stateManager.subscribe('currentFu', () => {
            hideCalculationResult(domElements);
            const currentState = stateManager.getState();
            // 符数表示の同期
            // 一括更新の通知途中に固定符数へ補正されることがあるため、最新値を使う。
            synchronizeFuDisplays(currentState.currentFu, currentState.inputMode, domElements);
            renderYakuValidation(currentState, validateYakuSelection(currentState.selectedYaku, currentState), domElements);
        })
    );
    subscriptions.push(stateManager.subscribe('currentHan', () => hideCalculationResult(domElements)));

    // 詳細表示状態の変更を購読
    subscriptions.push(
        stateManager.subscribe('isDetailVisible', (isVisible) => {
            toggleDetailVisibility(isVisible, domElements);
        })
    );

    synchronizeYakuState(stateManager, domElements, yakuData);
    return subscriptions;
}

// UI更新と計算直前の両方から使う。無効な選択の翻・符を有効値として表示しない。
export function synchronizeYakuState(stateManager, domElements, yakuData) {
    const state = stateManager.getState();
    const validation = validateYakuSelection(state.selectedYaku, state);
    updateSelectedYakuDisplay(state.selectedYaku, yakuData, domElements.selectedYakuList);
    stateManager.setTotalHan(validation.valid ? calculateTotalHan(state.selectedYaku, yakuData) : 0);
    if (validation.valid) {
        updateFuForYakuSelection(stateManager.getState(), stateManager);
        synchronizeFuDisplays(stateManager.getState().currentFu, state.inputMode, domElements);
    }
    renderYakuValidation(stateManager.getState(), validation, domElements);
    return validation;
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
            const fu = parseInt(fuYakuInput.value) || currentState.currentFu;
            fuInput.value = fu;
            stateManager.setFu(fu);
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

// 役選択モードでの符数調整
function adjustFuForYakuSelection(totalHan, currentState, stateManager) {
    // 符数の検証・調整
    // 七対子解除後の25符は通常の30符に戻し、10符刻みの操作を可能にする
    const currentFu = currentState.currentFu === 25 ? 30 : currentState.currentFu;
    const adjustedFu = validateAndAdjustFu(totalHan, currentFu, validFuByHan);
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

// 選択役と入力モードに応じた符数・入力可否をまとめて更新
function updateFuForYakuSelection(currentState, stateManager) {
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
    adjustFuForYakuSelection(currentState.totalHan, currentState, stateManager);
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
