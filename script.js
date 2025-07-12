// 麻雀点数計算アプリ

// ES6モジュールインポート
import { yakuData } from './js/data/yakuData.js';
import { scoreTable } from './js/data/scoreTable.js';
import { validFuByHan, specialYakuFuRules, DEFAULT_SETTINGS } from './js/data/constants.js';
import { calculateScoreResult } from './js/modules/calculator.js';
import { calculateTotalHan, hasSpecialYaku, hasPinfu, getRequiredFuForSpecialYaku, validateAndAdjustFu, getPinfuFu } from './js/modules/validator.js';

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

// 選択された役を追跡
let selectedYaku = new Set();

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    generateScoreTable();
    generateYakuList();
    generateYakuSelectionUI();
    
    // 初期状態の符数制限を設定
    const initialHan = parseInt(hanInput.value);
    adjustFuForHanChange(initialHan);
    
    // 役選択モードの初期制限も設定
    const totalHan = calculateTotalHan(selectedYaku, yakuData);
    adjustFuForYakuSelection(totalHan);
}

function setupEventListeners() {
    // 数値入力ボタン
    document.querySelectorAll('.number-btn').forEach(btn => {
        btn.addEventListener('click', handleNumberInput);
    });

    // 計算ボタン
    calculateBtn.addEventListener('click', calculateScore);

    // 詳細表示切り替え
    toggleDetailBtn.addEventListener('click', toggleDetailDisplay);

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
            // 役選択モードの場合
            currentHan = calculateTotalHan(selectedYaku, yakuData);
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
    const inputMode = document.querySelector('input[name="inputMode"]:checked').value;
    let han, fu;
    
    if (inputMode === 'manual') {
        han = parseInt(hanInput.value);
        fu = parseInt(fuInput.value);
    } else {
        // 役選択モードの場合、選択された役から翻数を計算
        han = calculateTotalHan(selectedYaku, yakuData);
        fu = parseInt(fuYakuInput.value);
        
        if (han === 0) {
            alert('役が選択されていません。');
            return;
        }
    }
    
    const winType = document.querySelector('input[name="winType"]:checked').value;
    const playerType = document.querySelector('input[name="playerType"]:checked').value;
    
    // 純粋関数を使用した計算
    const result = calculateScoreResult(han, fu, winType, playerType);
    
    if (result) {
        displayResult(result, han, fu, winType, playerType, inputMode);
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        alert('該当する点数が見つかりません。');
    }
}



function displayResult(result, han, fu, winType, playerType, inputMode = 'manual') {
    const winTypeText = winType === 'ron' ? 'ロン' : 'ツモ';
    const playerTypeText = playerType === 'parent' ? '親' : '子';
    
    if (winType === 'ron') {
        mainResult.innerHTML = `
            <div class="result-title">${playerTypeText}・${winTypeText}</div>
            <div class="result-score">${result.score.toLocaleString()}点</div>
            <div class="result-name">${result.name}</div>
        `;
    } else {
        mainResult.innerHTML = `
            <div class="result-title">${playerTypeText}・${winTypeText}</div>
            <div class="result-score">${result.score}</div>
            <div class="result-name">${result.name}</div>
        `;
    }
    
    // 詳細表示
    let detailHTML = `
        <h4>計算詳細</h4>
        <div class="detail-item">
            <span>翻数: ${han}翻</span>
        </div>
        <div class="detail-item">
            <span>符数: ${fu}符</span>
        </div>
        <div class="detail-item">
            <span>和了方法: ${winTypeText}</span>
        </div>
        <div class="detail-item">
            <span>親子: ${playerTypeText}</span>
        </div>
        <div class="detail-item">
            <span>点数名: ${result.name}</span>
        </div>
    `;
    
    // 役選択モードの場合、選択された役も表示
    if (inputMode === 'yaku' && selectedYaku.size > 0) {
        detailHTML += `
            <div class="detail-item">
                <span>選択された役:</span>
            </div>
        `;
        Array.from(selectedYaku).forEach(yakuName => {
            const yaku = yakuData.find(y => y.name === yakuName);
            if (yaku) {
                detailHTML += `
                    <div class="detail-item yaku-detail">
                        <span>・${yaku.name} (${yaku.hanText})</span>
                    </div>
                `;
            }
        });
    }
    
    detailResult.innerHTML = detailHTML;
}

function toggleDetailDisplay() {
    const computedStyle = window.getComputedStyle(detailResult);
    const isVisible = computedStyle.display !== 'none';
    detailResult.style.display = isVisible ? 'none' : 'block';
    toggleDetailBtn.textContent = isVisible ? '詳細を表示' : '詳細を隠す';
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

function generateScoreTable() {
    const displayRows = scoreTable.filter(entry => entry.han <= 4 || entry.fu === 0);
    
    displayRows.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.han}翻</td>
            <td>${entry.fu > 0 ? entry.fu + '符' : '—'}</td>
            <td>${entry.childRon.toLocaleString()}</td>
            <td>${entry.childTsumo}</td>
            <td>${entry.parentRon.toLocaleString()}</td>
            <td>${entry.parentTsumo}</td>
        `;
        scoreTableBody.appendChild(row);
    });
}

function generateYakuList() {
    yakuData.forEach(yaku => {
        const yakuItem = document.createElement('div');
        yakuItem.className = 'yaku-item';
        yakuItem.innerHTML = `
            <div class="yaku-name">${yaku.name}</div>
            <div class="yaku-han">${yaku.hanText}</div>
            <div class="yaku-description">${yaku.description}</div>
        `;
        yakuListContainer.appendChild(yakuItem);
    });
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

// 入力モード切り替え処理
function handleInputModeChange(event) {
    const inputMode = event.target.value;
    
    if (inputMode === 'manual') {
        // 役選択モードから手動入力モードに切り替える時、符数を同期
        fuInput.value = fuYakuInput.value;
        manualInputSection.style.display = 'block';
        yakuInputSection.style.display = 'none';
    } else {
        // 手動入力モードから役選択モードに切り替える時、符数を同期
        fuYakuInput.value = fuInput.value;
        manualInputSection.style.display = 'none';
        yakuInputSection.style.display = 'block';
        // 特殊役の処理を適用
        updateFuInputForSpecialYaku();
        // 一般的な翻数・符数制限を適用
        const totalHan = calculateTotalHan(selectedYaku, yakuData);
        adjustFuForYakuSelection(totalHan);
    }
}

// 勝ち方（ロン/ツモ）切り替え処理
function handleWinTypeChange(event) {
    const inputMode = document.querySelector('input[name="inputMode"]:checked');
    
    // 役選択モードでのみ処理
    if (inputMode && inputMode.value === 'yaku') {
        // 平和が選択されている場合、符数を更新
        if (hasPinfu()) {
            updateFuInputForSpecialYaku();
        }
    }
}

// 役選択処理
function handleYakuSelection(event) {
    const yakuName = event.target.value;
    const isChecked = event.target.checked;
    
    if (isChecked) {
        selectedYaku.add(yakuName);
    } else {
        selectedYaku.delete(yakuName);
    }
    
    updateSelectedYakuDisplay();
    updateTotalHan();
    updateFuInputForSpecialYaku();
}

// 選択された役の表示更新
function updateSelectedYakuDisplay() {
    if (selectedYaku.size === 0) {
        selectedYakuList.textContent = '役を選択してください';
        return;
    }
    
    const yakuNames = Array.from(selectedYaku).map(yakuName => {
        const yaku = yakuData.find(y => y.name === yakuName);
        return `${yaku.name} (${yaku.hanText})`;
    });
    
    selectedYakuList.innerHTML = yakuNames.join('<br>');
}

// 合計翻数の計算と表示更新
function updateTotalHan() {
    const total = calculateTotalHan(selectedYaku, yakuData);
    totalHan.textContent = total >= 13 ? '役満' : `${total}翻`;
    
    // 役選択モードでの符数制限適用
    adjustFuForYakuSelection(total);
}

// 選択された役から合計翻数を計算

// 特殊役の処理関数


// 平和の処理関数


function updateFuInputForSpecialYaku() {
    const inputMode = document.querySelector('input[name="inputMode"]:checked').value;
    if (inputMode !== 'yaku') return;
    
    // 1. 固定符数の特殊役（七対子など）を最優先で処理
    const requiredFu = getRequiredFuForSpecialYaku();
    if (requiredFu) {
        fuYakuInput.value = requiredFu;
        // 符数入力を無効化
        document.querySelectorAll('[data-target="fuYaku"]').forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
        });
        return;
    }
    
    // 2. 平和の処理（動的符数）
    if (hasPinfu()) {
        const winTypeElement = document.querySelector('input[name="winType"]:checked');
        if (winTypeElement) {
            const winType = winTypeElement.value;
            const pinfuFu = getPinfuFu(winType);
            fuYakuInput.value = pinfuFu;
            // 符数入力を無効化
            document.querySelectorAll('[data-target="fuYaku"]').forEach(btn => {
                btn.disabled = true;
                btn.classList.add('disabled');
            });
        } else {
            // winTypeが選択されていない場合はデフォルトで20符（ツモ）
            fuYakuInput.value = 20;
            document.querySelectorAll('[data-target="fuYaku"]').forEach(btn => {
                btn.disabled = true;
                btn.classList.add('disabled');
            });
        }
        return;
    }
    
    // 3. 特殊役がない場合の一般処理
    const totalHan = calculateTotalHan(selectedYaku, yakuData);
    if (totalHan < 5) {
        // 5翻未満の場合のみ符数入力を有効化
        document.querySelectorAll('[data-target="fuYaku"]').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('disabled');
        });
    }
}

// 翻数に基づいて符数を検証・調整する関数

// 翻数変更時の符数調整
function adjustFuForHanChange(newHan) {
    const inputMode = document.querySelector('input[name="inputMode"]:checked').value;
    
    if (inputMode === 'manual') {
        // 手動入力モードでの調整
        const currentFu = parseInt(fuInput.value);
        const adjustedFu = validateAndAdjustFu(newHan, currentFu);
        
        if (adjustedFu !== null) {
            fuInput.value = adjustedFu;
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

// 役選択モードでの符数調整
function adjustFuForYakuSelection(totalHan) {
    const inputMode = document.querySelector('input[name="inputMode"]:checked').value;
    
    if (inputMode === 'yaku') {
        // 特殊役の処理が優先される場合はそちらに任せる
        if (hasSpecialYaku(selectedYaku, specialYakuFuRules)) {
            return;
        }
        
        // 役選択モードでの調整
        const currentFu = parseInt(fuYakuInput.value);
        const adjustedFu = validateAndAdjustFu(totalHan, currentFu);
        
        if (adjustedFu !== null) {
            fuYakuInput.value = adjustedFu;
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
}

// タッチイベントの最適化
document.addEventListener('touchstart', function() {}, { passive: true });
document.addEventListener('touchend', function() {}, { passive: true });
document.addEventListener('touchmove', function() {}, { passive: true });