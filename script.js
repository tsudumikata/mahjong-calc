// 麻雀点数計算アプリ

// 役データ
const yakuData = [
    {
        name: "立直",
        han: 1,
        hanText: "1翻",
        description: "門前でリーチを宣言して和了"
    },
    {
        name: "一発",
        han: 1,
        hanText: "1翻",
        description: "リーチ後、一巡以内に和了（鳴きが入ると無効）"
    },
    {
        name: "門前清自摸和",
        han: 1,
        hanText: "1翻",
        description: "門前でツモ和了"
    },
    {
        name: "断幺九",
        han: 1,
        hanText: "1翻",
        description: "2〜8の数牌のみで和了"
    },
    {
        name: "平和",
        han: 1,
        hanText: "1翻",
        description: "門前で、4面子が全て順子、雀頭が役牌以外、待ちが両面"
    },
    {
        name: "一盃口",
        han: 1,
        hanText: "1翻",
        description: "門前で、同じ順子を2組作る"
    },
    {
        name: "役牌",
        han: 1,
        hanText: "1翻",
        description: "三元牌（白・發・中）または自風牌・場風牌の刻子"
    },
    {
        name: "海底撈月",
        han: 1,
        hanText: "1翻",
        description: "海底牌でツモ和了"
    },
    {
        name: "河底撈魚",
        han: 1,
        hanText: "1翻",
        description: "河底牌でロン和了"
    },
    {
        name: "嶺上開花",
        han: 1,
        hanText: "1翻",
        description: "カンした後の嶺上牌でツモ和了"
    },
    {
        name: "槍槓",
        han: 1,
        hanText: "1翻",
        description: "他家の加カンに対してロン和了"
    },
    {
        name: "ダブル立直",
        han: 2,
        hanText: "2翻",
        description: "配牌時に天聴でリーチ"
    },
    {
        name: "七対子",
        han: 2,
        hanText: "2翻",
        description: "7種類の対子で和了"
    },
    {
        name: "混全帯幺九",
        han: 2,
        hanText: "2翻",
        description: "全ての面子と雀頭に幺九牌が含まれる"
    },
    {
        name: "一気通貫",
        han: 2,
        hanText: "2翻",
        description: "同種の数牌で123・456・789の順子を作る"
    },
    {
        name: "三色同順",
        han: 2,
        hanText: "2翻",
        description: "3種の数牌で同じ順子を作る"
    },
    {
        name: "対々和",
        han: 2,
        hanText: "2翻",
        description: "4面子が全て刻子または槓子"
    },
    {
        name: "三暗刻",
        han: 2,
        hanText: "2翻",
        description: "暗刻を3組作る"
    },
    {
        name: "小三元",
        han: 2,
        hanText: "2翻",
        description: "三元牌のうち2種を刻子、1種を雀頭とする"
    },
    {
        name: "混老頭",
        han: 2,
        hanText: "2翻",
        description: "幺九牌のみで和了"
    },
    {
        name: "三色同刻",
        han: 2,
        hanText: "2翻",
        description: "3種の数牌で同じ刻子を作る"
    },
    {
        name: "三槓子",
        han: 2,
        hanText: "2翻",
        description: "槓子を3組作る"
    },
    {
        name: "二盃口",
        han: 3,
        hanText: "3翻",
        description: "門前で、同じ順子を2組×2作る"
    },
    {
        name: "純全帯幺九",
        han: 3,
        hanText: "3翻",
        description: "全ての面子と雀頭に幺九牌が含まれ、字牌を使わない"
    },
    {
        name: "混一色",
        han: 3,
        hanText: "3翻",
        description: "1種の数牌と字牌のみで和了"
    },
    {
        name: "清一色",
        han: 6,
        hanText: "6翻",
        description: "1種の数牌のみで和了"
    },
    {
        name: "国士無双",
        han: 13,
        hanText: "役満",
        description: "13種の幺九牌を1枚ずつ+1種の幺九牌をもう1枚"
    },
    {
        name: "四暗刻",
        han: 13,
        hanText: "役満",
        description: "暗刻を4組作る"
    },
    {
        name: "大三元",
        han: 13,
        hanText: "役満",
        description: "三元牌（白・發・中）の刻子を全て作る"
    },
    {
        name: "小四喜",
        han: 13,
        hanText: "役満",
        description: "風牌の刻子を3組と雀頭を1組作る"
    },
    {
        name: "大四喜",
        han: 13,
        hanText: "役満",
        description: "風牌の刻子を4組作る"
    },
    {
        name: "字一色",
        han: 13,
        hanText: "役満",
        description: "字牌のみで和了"
    },
    {
        name: "緑一色",
        han: 13,
        hanText: "役満",
        description: "緑色の牌（2・3・4・6・8索、發）のみで和了"
    },
    {
        name: "清老頭",
        han: 13,
        hanText: "役満",
        description: "老頭牌（1・9の数牌）のみで和了"
    },
    {
        name: "九蓮宝燈",
        han: 13,
        hanText: "役満",
        description: "門前で1種の数牌による特定の形"
    },
    {
        name: "四槓子",
        han: 13,
        hanText: "役満",
        description: "槓子を4組作る"
    },
    {
        name: "天和",
        han: 13,
        hanText: "役満",
        description: "親の配牌で和了"
    },
    {
        name: "地和",
        han: 13,
        hanText: "役満",
        description: "子の第一ツモで和了"
    }
];

// 点数計算テーブル
const scoreTable = [
    { han: 1, fu: 30, childRon: 1000, childTsumo: "300/500", parentRon: 1500, parentTsumo: "500" },
    { han: 1, fu: 40, childRon: 1300, childTsumo: "400/700", parentRon: 2000, parentTsumo: "700" },
    { han: 1, fu: 50, childRon: 1600, childTsumo: "400/800", parentRon: 2400, parentTsumo: "800" },
    { han: 1, fu: 60, childRon: 2000, childTsumo: "500/1000", parentRon: 2900, parentTsumo: "1000" },
    { han: 1, fu: 70, childRon: 2300, childTsumo: "600/1200", parentRon: 3400, parentTsumo: "1200" },
    { han: 1, fu: 80, childRon: 2600, childTsumo: "700/1300", parentRon: 3900, parentTsumo: "1300" },
    { han: 1, fu: 90, childRon: 2900, childTsumo: "800/1500", parentRon: 4400, parentTsumo: "1500" },
    { han: 1, fu: 100, childRon: 3200, childTsumo: "800/1600", parentRon: 4800, parentTsumo: "1600" },
    { han: 1, fu: 110, childRon: 3600, childTsumo: "900/1800", parentRon: 5300, parentTsumo: "1800" },
    
    { han: 2, fu: 20, childRon: 1300, childTsumo: "400/700", parentRon: 2000, parentTsumo: "700" },
    { han: 2, fu: 25, childRon: 1600, childTsumo: "400/800", parentRon: 2400, parentTsumo: "800" },
    { han: 2, fu: 30, childRon: 2000, childTsumo: "500/1000", parentRon: 2900, parentTsumo: "1000" },
    { han: 2, fu: 40, childRon: 2600, childTsumo: "700/1300", parentRon: 3900, parentTsumo: "1300" },
    { han: 2, fu: 50, childRon: 3200, childTsumo: "800/1600", parentRon: 4800, parentTsumo: "1600" },
    { han: 2, fu: 60, childRon: 3900, childTsumo: "1000/2000", parentRon: 5800, parentTsumo: "2000" },
    { han: 2, fu: 70, childRon: 4500, childTsumo: "1200/2300", parentRon: 6800, parentTsumo: "2300" },
    { han: 2, fu: 80, childRon: 5200, childTsumo: "1300/2600", parentRon: 7700, parentTsumo: "2600" },
    { han: 2, fu: 90, childRon: 5800, childTsumo: "1500/2900", parentRon: 8700, parentTsumo: "2900" },
    { han: 2, fu: 100, childRon: 6400, childTsumo: "1600/3200", parentRon: 9600, parentTsumo: "3200" },
    { han: 2, fu: 110, childRon: 7100, childTsumo: "1800/3600", parentRon: 10600, parentTsumo: "3600" },
    
    { han: 3, fu: 20, childRon: 2600, childTsumo: "700/1300", parentRon: 3900, parentTsumo: "1300" },
    { han: 3, fu: 25, childRon: 3200, childTsumo: "800/1600", parentRon: 4800, parentTsumo: "1600" },
    { han: 3, fu: 30, childRon: 3900, childTsumo: "1000/2000", parentRon: 5800, parentTsumo: "2000" },
    { han: 3, fu: 40, childRon: 5200, childTsumo: "1300/2600", parentRon: 7700, parentTsumo: "2600" },
    { han: 3, fu: 50, childRon: 6400, childTsumo: "1600/3200", parentRon: 9600, parentTsumo: "3200" },
    { han: 3, fu: 60, childRon: 7700, childTsumo: "2000/3900", parentRon: 11600, parentTsumo: "3900" },
    
    { han: 4, fu: 20, childRon: 5200, childTsumo: "1300/2600", parentRon: 7700, parentTsumo: "2600" },
    { han: 4, fu: 25, childRon: 6400, childTsumo: "1600/3200", parentRon: 9600, parentTsumo: "3200" },
    { han: 4, fu: 30, childRon: 7700, childTsumo: "2000/3900", parentRon: 11600, parentTsumo: "3900" },
    
    { han: 5, fu: 0, childRon: 8000, childTsumo: "2000/4000", parentRon: 12000, parentTsumo: "4000" },
    { han: 6, fu: 0, childRon: 12000, childTsumo: "3000/6000", parentRon: 18000, parentTsumo: "6000" },
    { han: 7, fu: 0, childRon: 12000, childTsumo: "3000/6000", parentRon: 18000, parentTsumo: "6000" },
    { han: 8, fu: 0, childRon: 16000, childTsumo: "4000/8000", parentRon: 24000, parentTsumo: "8000" },
    { han: 9, fu: 0, childRon: 16000, childTsumo: "4000/8000", parentRon: 24000, parentTsumo: "8000" },
    { han: 10, fu: 0, childRon: 16000, childTsumo: "4000/8000", parentRon: 24000, parentTsumo: "8000" },
    { han: 11, fu: 0, childRon: 24000, childTsumo: "6000/12000", parentRon: 36000, parentTsumo: "12000" },
    { han: 12, fu: 0, childRon: 24000, childTsumo: "6000/12000", parentRon: 36000, parentTsumo: "12000" },
    { han: 13, fu: 0, childRon: 32000, childTsumo: "8000/16000", parentRon: 48000, parentTsumo: "16000" }
];

// 翻数に応じた有効な符数の組み合わせ
const validFuByHan = {
    1: [30, 40, 50, 60, 70, 80, 90, 100, 110],
    2: [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110],
    3: [20, 25, 30, 40, 50, 60],
    4: [20, 25, 30],
    5: [], // 満貫以上は符数無関係
    6: [],
    7: [],
    8: [],
    9: [],
    10: [],
    11: [],
    12: [],
    13: [] // 役満
};

// 特殊役の符数固定ルール
const specialYakuFuRules = {
    "七対子": 25
};

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
    const totalHan = calculateTotalHanFromSelectedYaku();
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
            currentHan = calculateTotalHanFromSelectedYaku();
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
        han = calculateTotalHanFromSelectedYaku();
        fu = parseInt(fuYakuInput.value);
        
        if (han === 0) {
            alert('役が選択されていません。');
            return;
        }
    }
    
    const winType = document.querySelector('input[name="winType"]:checked').value;
    const playerType = document.querySelector('input[name="playerType"]:checked').value;
    
    const result = getScoreFromTable(han, fu, winType, playerType);
    
    if (result) {
        displayResult(result, han, fu, winType, playerType, inputMode);
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        alert('該当する点数が見つかりません。');
    }
}

function getScoreFromTable(han, fu, winType, playerType) {
    // 役満の場合
    if (han >= 13) {
        return {
            score: playerType === 'parent' ? 48000 : 32000,
            tsumoScore: playerType === 'parent' ? "16000" : "8000/16000",
            name: "役満"
        };
    }
    
    // 跳満以上の場合
    if (han >= 5) {
        const entry = scoreTable.find(entry => entry.han === han);
        if (entry) {
            return {
                score: winType === 'ron' ? 
                    (playerType === 'parent' ? entry.parentRon : entry.childRon) :
                    (playerType === 'parent' ? entry.parentTsumo : entry.childTsumo),
                name: getScoreName(han)
            };
        }
    }
    
    // 通常の場合
    const entry = scoreTable.find(entry => entry.han === han && entry.fu === fu);
    if (entry) {
        return {
            score: winType === 'ron' ? 
                (playerType === 'parent' ? entry.parentRon : entry.childRon) :
                (playerType === 'parent' ? entry.parentTsumo : entry.childTsumo),
            name: getScoreName(han, fu)
        };
    }
    
    return null;
}

function getScoreName(han, fu) {
    if (han >= 13) return "役満";
    if (han >= 11) return "三倍満";
    if (han >= 8) return "倍満";
    if (han >= 6) return "跳満";
    if (han === 5) return "満貫";
    return `${han}翻${fu}符`;
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
    const isVisible = detailResult.style.display !== 'none';
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
        const totalHan = calculateTotalHanFromSelectedYaku();
        adjustFuForYakuSelection(totalHan);
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
    const total = calculateTotalHanFromSelectedYaku();
    totalHan.textContent = total >= 13 ? '役満' : `${total}翻`;
    
    // 役選択モードでの符数制限適用
    adjustFuForYakuSelection(total);
}

// 選択された役から合計翻数を計算
function calculateTotalHanFromSelectedYaku() {
    let total = 0;
    let hasYakuman = false;
    
    selectedYaku.forEach(yakuName => {
        const yaku = yakuData.find(y => y.name === yakuName);
        if (yaku) {
            if (yaku.han >= 13) {
                hasYakuman = true;
            } else {
                total += yaku.han;
            }
        }
    });
    
    // 役満がある場合は役満として扱う
    return hasYakuman ? 13 : total;
}

// 特殊役の処理関数
function hasSpecialYaku() {
    return Array.from(selectedYaku).some(yakuName => 
        specialYakuFuRules.hasOwnProperty(yakuName)
    );
}

function getRequiredFuForSpecialYaku() {
    for (const yakuName of selectedYaku) {
        if (specialYakuFuRules.hasOwnProperty(yakuName)) {
            return specialYakuFuRules[yakuName];
        }
    }
    return null;
}

function updateFuInputForSpecialYaku() {
    const inputMode = document.querySelector('input[name="inputMode"]:checked').value;
    if (inputMode !== 'yaku') return;
    
    const requiredFu = getRequiredFuForSpecialYaku();
    if (requiredFu) {
        fuYakuInput.value = requiredFu;
        // 符数入力を無効化
        document.querySelectorAll('[data-target="fuYaku"]').forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
        });
    } else {
        // 特殊役がない場合でも、5翻以上なら符数入力は無効のまま
        const totalHan = calculateTotalHanFromSelectedYaku();
        if (totalHan < 5) {
            // 5翻未満の場合のみ符数入力を有効化
            document.querySelectorAll('[data-target="fuYaku"]').forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('disabled');
            });
        }
    }
}

// 翻数に基づいて符数を検証・調整する関数
function validateAndAdjustFu(han, currentFu) {
    const validFuList = validFuByHan[han] || [];
    
    // 5翻以上は符数無関係
    if (han >= 5) {
        return null; // 符数無関係を示す
    }
    
    // 現在の符数が有効な場合はそのまま
    if (validFuList.includes(currentFu)) {
        return currentFu;
    }
    
    // 無効な場合は最も近い有効な符数に調整
    if (validFuList.length > 0) {
        // 現在の符数より大きい最小の有効符数を探す
        const higherFu = validFuList.find(fu => fu >= currentFu);
        if (higherFu) {
            return higherFu;
        }
        
        // 見つからない場合は最大の有効符数
        return validFuList[validFuList.length - 1];
    }
    
    return currentFu; // デフォルト
}

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
        if (hasSpecialYaku()) {
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