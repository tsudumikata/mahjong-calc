// StateManager テスト用関数群

import { StateManager, createDefaultState, createStateManager } from './stateManager.js';

// テスト結果の出力関数
function logTest(testName, passed, message = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const fullMessage = message ? ` - ${message}` : '';
    console.log(`${status}: ${testName}${fullMessage}`);
    return passed;
}

// StateManager基本機能テスト
export function testStateManagerBasics() {
    console.log('\n=== StateManager 基本機能テスト ===');
    let passCount = 0;
    let totalTests = 0;

    // テスト1: インスタンス作成
    totalTests++;
    try {
        const stateManager = new StateManager();
        const passed = stateManager instanceof StateManager;
        passCount += logTest('StateManagerインスタンス作成', passed) ? 1 : 0;
    } catch (error) {
        logTest('StateManagerインスタンス作成', false, error.message);
    }

    // テスト2: デフォルト状態
    totalTests++;
    try {
        const defaultState = createDefaultState();
        const expectedKeys = ['selectedYaku', 'inputMode', 'winType', 'playerType', 'currentFu', 'currentHan', 'totalHan', 'isDetailVisible'];
        const hasAllKeys = expectedKeys.every(key => key in defaultState);
        passCount += logTest('デフォルト状態の構造', hasAllKeys, `キー: ${Object.keys(defaultState).join(', ')}`) ? 1 : 0;
    } catch (error) {
        logTest('デフォルト状態の構造', false, error.message);
    }

    // テスト3: 状態取得
    totalTests++;
    try {
        const stateManager = createStateManager();
        const state = stateManager.getState();
        const isObject = typeof state === 'object' && state !== null;
        passCount += logTest('状態取得', isObject, `取得した状態: ${JSON.stringify(state, (key, value) => value instanceof Set ? Array.from(value) : value)}`) ? 1 : 0;
    } catch (error) {
        logTest('状態取得', false, error.message);
    }

    // テスト4: 状態更新
    totalTests++;
    try {
        const stateManager = createStateManager();
        stateManager.updateState({ inputMode: 'yaku' });
        const newState = stateManager.getState();
        const passed = newState.inputMode === 'yaku';
        passCount += logTest('状態更新', passed, `更新後のinputMode: ${newState.inputMode}`) ? 1 : 0;
    } catch (error) {
        logTest('状態更新', false, error.message);
    }

    console.log(`\n基本機能テスト結果: ${passCount}/${totalTests} テスト通過\n`);
    return { passed: passCount, total: totalTests };
}

// 役選択機能テスト
export function testYakuSelection() {
    console.log('\n=== 役選択機能テスト ===');
    let passCount = 0;
    let totalTests = 0;

    // テスト1: 役の追加
    totalTests++;
    try {
        const stateManager = createStateManager();
        stateManager.addYaku('立直');
        const state = stateManager.getState();
        const passed = state.selectedYaku.has('立直');
        passCount += logTest('役の追加', passed, `選択された役: ${Array.from(state.selectedYaku)}`) ? 1 : 0;
    } catch (error) {
        logTest('役の追加', false, error.message);
    }

    // テスト2: 役の削除
    totalTests++;
    try {
        const stateManager = createStateManager();
        stateManager.addYaku('立直');
        stateManager.addYaku('断么九');
        stateManager.removeYaku('立直');
        const state = stateManager.getState();
        const passed = !state.selectedYaku.has('立直') && state.selectedYaku.has('断么九');
        passCount += logTest('役の削除', passed, `選択された役: ${Array.from(state.selectedYaku)}`) ? 1 : 0;
    } catch (error) {
        logTest('役の削除', false, error.message);
    }

    // テスト3: 役の一括設定
    totalTests++;
    try {
        const stateManager = createStateManager();
        const yakuSet = new Set(['立直', '断么九', '平和']);
        stateManager.setSelectedYaku(yakuSet);
        const state = stateManager.getState();
        const passed = state.selectedYaku.size === 3 && state.selectedYaku.has('立直');
        passCount += logTest('役の一括設定', passed, `設定された役: ${Array.from(state.selectedYaku)}`) ? 1 : 0;
    } catch (error) {
        logTest('役の一括設定', false, error.message);
    }

    // テスト4: 役のクリア
    totalTests++;
    try {
        const stateManager = createStateManager();
        stateManager.addYaku('立直');
        stateManager.clearSelectedYaku();
        const state = stateManager.getState();
        const passed = state.selectedYaku.size === 0;
        passCount += logTest('役のクリア', passed, `クリア後のサイズ: ${state.selectedYaku.size}`) ? 1 : 0;
    } catch (error) {
        logTest('役のクリア', false, error.message);
    }

    console.log(`\n役選択機能テスト結果: ${passCount}/${totalTests} テスト通過\n`);
    return { passed: passCount, total: totalTests };
}

// リアクティブ機能テスト
export function testReactiveFeatures() {
    console.log('\n=== リアクティブ機能テスト ===');
    let passCount = 0;
    let totalTests = 0;

    // テスト1: 購読機能
    totalTests++;
    try {
        const stateManager = createStateManager();
        let notificationReceived = false;
        let receivedValue = null;

        const unsubscribe = stateManager.subscribe('inputMode', (newValue) => {
            notificationReceived = true;
            receivedValue = newValue;
        });

        stateManager.setInputMode('yaku');
        const passed = notificationReceived && receivedValue === 'yaku';
        passCount += logTest('購読機能', passed, `通知受信: ${notificationReceived}, 受信値: ${receivedValue}`) ? 1 : 0;
        
        unsubscribe();
    } catch (error) {
        logTest('購読機能', false, error.message);
    }

    // テスト2: 複数購読者
    totalTests++;
    try {
        const stateManager = createStateManager();
        let count1 = 0, count2 = 0;

        stateManager.subscribe('currentFu', () => count1++);
        stateManager.subscribe('currentFu', () => count2++);

        stateManager.setFu(30);
        const passed = count1 === 1 && count2 === 1;
        passCount += logTest('複数購読者', passed, `count1: ${count1}, count2: ${count2}`) ? 1 : 0;
    } catch (error) {
        logTest('複数購読者', false, error.message);
    }

    // テスト3: 購読解除
    totalTests++;
    try {
        const stateManager = createStateManager();
        let notificationCount = 0;

        const unsubscribe = stateManager.subscribe('winType', () => notificationCount++);
        
        stateManager.setWinType('ron');
        unsubscribe();
        stateManager.setWinType('tsumo');

        const passed = notificationCount === 1;
        passCount += logTest('購読解除', passed, `通知回数: ${notificationCount}`) ? 1 : 0;
    } catch (error) {
        logTest('購読解除', false, error.message);
    }

    console.log(`\nリアクティブ機能テスト結果: ${passCount}/${totalTests} テスト通過\n`);
    return { passed: passCount, total: totalTests };
}

// バリデーション機能テスト
export function testValidation() {
    console.log('\n=== バリデーション機能テスト ===');
    let passCount = 0;
    let totalTests = 0;

    // テスト1: 無効な入力モード
    totalTests++;
    try {
        const stateManager = createStateManager();
        const originalConsoleWarn = console.warn;
        let warningCalled = false;
        console.warn = () => warningCalled = true;

        stateManager.setInputMode('invalid');
        const state = stateManager.getState();
        const passed = state.inputMode === 'manual' && warningCalled; // デフォルト値を保持

        console.warn = originalConsoleWarn;
        passCount += logTest('無効な入力モード', passed, `inputMode: ${state.inputMode}, 警告出力: ${warningCalled}`) ? 1 : 0;
    } catch (error) {
        logTest('無効な入力モード', false, error.message);
    }

    // テスト2: 符数の範囲チェック
    totalTests++;
    try {
        const stateManager = createStateManager();
        const originalConsoleWarn = console.warn;
        let warningCalled = false;
        console.warn = () => warningCalled = true;

        stateManager.setFu(150); // 範囲外
        const state = stateManager.getState();
        const passed = state.currentFu === 20 && warningCalled; // デフォルト値を保持

        console.warn = originalConsoleWarn;
        passCount += logTest('符数範囲チェック', passed, `currentFu: ${state.currentFu}, 警告出力: ${warningCalled}`) ? 1 : 0;
    } catch (error) {
        logTest('符数範囲チェック', false, error.message);
    }

    console.log(`\nバリデーション機能テスト結果: ${passCount}/${totalTests} テスト通過\n`);
    return { passed: passCount, total: totalTests };
}

// 全テスト実行
export function runAllTests() {
    console.clear();
    console.log('🧪 StateManager 全機能テスト開始 🧪');
    
    const results = [
        testStateManagerBasics(),
        testYakuSelection(),
        testReactiveFeatures(),
        testValidation()
    ];
    
    const totalPassed = results.reduce((sum, result) => sum + result.passed, 0);
    const totalTests = results.reduce((sum, result) => sum + result.total, 0);
    
    console.log('='.repeat(50));
    console.log(`🎯 総合テスト結果: ${totalPassed}/${totalTests} テスト通過`);
    
    if (totalPassed === totalTests) {
        console.log('🎉 全てのテストが通過しました！');
    } else {
        console.log('⚠️ 一部のテストが失敗しました。');
    }
    
    return { passed: totalPassed, total: totalTests };
}

// ブラウザ用グローバル関数として公開
if (typeof window !== 'undefined') {
    window.testStateManager = {
        runAllTests,
        testStateManagerBasics,
        testYakuSelection, 
        testReactiveFeatures,
        testValidation
    };
}