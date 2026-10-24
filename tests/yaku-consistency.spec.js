import { test as base, expect } from '@playwright/test';

const test = base.extend({
  appErrors: [async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && message.text().startsWith('StateManager: Error in listener')) {
        errors.push(message.text());
      }
    });
    await use(errors);
    expect(errors, '役の検証と状態購読で例外が発生しない').toEqual([]);
  }, { auto: true }],
});

const select = (page, name) => page.locator(`label.yaku-checkbox:has(input[value="${name}"])`).click();
const checkbox = (page, name) => page.locator(`.yaku-checkbox input[value="${name}"]`);
const choose = (page, name, value) => page.locator(`label:has(input[name="${name}"][value="${value}"])`).click();

async function expectInvalid(page, names) {
  await expect(page.locator('#yakuValidationErrors')).toBeVisible();
  for (const name of names) await expect(page.locator('#yakuValidationErrors')).toContainText(name);
  await expect(page.locator('#totalHan')).toHaveText('選択を確認');
  await expect(page.locator('#fuYakuInput')).toHaveValue('');
  await expect(page.locator('#resultSection')).toBeHidden();
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#resultSection')).toBeHidden();
}

// 本番の StateManager・購読・計算ハンドラを実 DOM に接続して、UI を通らない変更を検証する。
async function installStateHarness(page) {
  await page.evaluate(async () => {
    const { createStateManager } = await import('/js/modules/stateManager.js');
    const { setupStateSubscriptions } = await import('/js/modules/stateSubscriptions.js');
    const { createEventHandlers } = await import('/js/modules/eventHandlers.js');
    const { yakuData } = await import('/js/data/yakuData.js');
    const stateManager = createStateManager({ currentFu: 30 });
    const elements = Object.fromEntries([
      'hanInput', 'fuInput', 'fuYakuInput', 'calculateBtn', 'resetBtn', 'resultSection',
      'mainResult', 'detailResult', 'toggleDetailBtn', 'selectedYakuList', 'totalHan',
      'yakuValidationFeedback', 'yakuValidationErrors',
    ].map(id => [id, document.getElementById(id)]));
    elements.manualInputSection = document.querySelector('.manual-input-section');
    elements.yakuInputSection = document.querySelector('.yaku-input-section');
    setupStateSubscriptions(stateManager, elements, yakuData);
    const handlers = createEventHandlers(stateManager, yakuData, elements);
    stateManager.setWinInfo('ron', 'child');
    stateManager.setInputMode('yaku');
    window.validationHarness = { stateManager, handlers };
  });
}

test.describe('役選択の整合性 #33', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await choose(page, 'playerType', 'child');
    await choose(page, 'inputMode', 'yaku');
  });

  const conflicts = [
    ['七対子', '対々和'],
    ['平和', '対々和'],
    ['七対子', '平和'],
    ['断幺九', '混老頭'],
    ['立直', 'ダブル立直'],
    ['一盃口', '二盃口'],
    ['国士無双', '四暗刻'],
  ];

  for (const pair of conflicts) {
    for (const [first, second] of [pair, [...pair].reverse()]) {
      test(`${first} → ${second} は理由を示して追加を拒否し、解除後は再選択できる`, async ({ page }) => {
        await select(page, first);
        await select(page, second);
        await expect(checkbox(page, first)).toBeChecked();
        await expect(checkbox(page, second)).not.toBeChecked();
        await expect(page.locator('#yakuValidationFeedback')).toBeVisible();
        await expect(page.locator('#yakuValidationFeedback')).toContainText(first);
        await expect(page.locator('#yakuValidationFeedback')).toContainText(second);
        await expect(page.locator('.yaku-checkbox input:checked')).toHaveCount(1);
        await select(page, first);
        await select(page, second);
        await expect(checkbox(page, second)).toBeChecked();
        await expect(page.locator('#yakuValidationFeedback')).toBeHidden();
      });
    }
  }

  test('一発の前提役の追加・解除と解消後の再計算', async ({ page }) => {
    await select(page, '一発');
    await expect(checkbox(page, '一発')).not.toBeChecked();
    await expect(page.locator('#yakuValidationFeedback')).toContainText('立直');
    await select(page, 'ダブル立直');
    await select(page, '一発');
    await expect(page.locator('#totalHan')).toHaveText('3翻');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#resultSection')).toBeVisible();
    await select(page, 'ダブル立直');
    await expect(checkbox(page, '一発')).toBeChecked();
    await expectInvalid(page, ['一発']);
    await select(page, '立直');
    await expect(page.locator('#yakuValidationErrors')).toBeHidden();
    await expect(page.locator('#totalHan')).toHaveText('2翻');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#resultSection')).toBeVisible();
  });

  test('ツモ限定役はロンで拒否し、選択後の条件変更でも古い結果を隠す', async ({ page }) => {
    await select(page, '門前清自摸和');
    await expect(checkbox(page, '門前清自摸和')).not.toBeChecked();
    await expect(page.locator('#yakuValidationFeedback')).toContainText('ツモ');
    await choose(page, 'winType', 'tsumo');
    await select(page, '門前清自摸和');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#resultSection')).toBeVisible();
    await choose(page, 'winType', 'ron');
    await expectInvalid(page, ['門前清自摸和']);
    await expect(checkbox(page, '門前清自摸和')).toBeChecked();
    await choose(page, 'winType', 'tsumo');
    await expect(page.locator('#yakuValidationErrors')).toBeHidden();
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#resultSection')).toBeVisible();
  });

  for (const { name, winType } of [
    { name: '海底撈月', winType: 'tsumo' },
    { name: '嶺上開花', winType: 'tsumo' },
    { name: '河底撈魚', winType: 'ron' },
    { name: '槍槓', winType: 'ron' },
  ]) {
    test(`${name} の和了条件を選択時と変更後の両方で検証する`, async ({ page }) => {
      const wrongWin = winType === 'ron' ? 'tsumo' : 'ron';
      await choose(page, 'winType', wrongWin);
      await select(page, name);
      await expect(checkbox(page, name)).not.toBeChecked();
      await expect(page.locator('#yakuValidationFeedback')).toContainText(name);
      await choose(page, 'winType', winType);
      await select(page, name);
      await expect(checkbox(page, name)).toBeChecked();
      await page.locator('#calculateBtn').click();
      await expect(page.locator('#resultSection')).toBeVisible();
      await choose(page, 'winType', wrongWin);
      await expectInvalid(page, [name]);
      await select(page, name);
      await expect(page.locator('#yakuValidationErrors')).toBeHidden();
    });
  }

  test('天和と地和の親子条件を変更後も検証し、四暗刻ロンは許可する', async ({ page }) => {
    await choose(page, 'winType', 'tsumo');
    await select(page, '天和');
    await expect(checkbox(page, '天和')).not.toBeChecked();
    await expect(page.locator('#yakuValidationFeedback')).toContainText('親');
    await choose(page, 'playerType', 'parent');
    await select(page, '天和');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#resultSection')).toBeVisible();
    await choose(page, 'playerType', 'child');
    await expectInvalid(page, ['天和']);
    await select(page, '天和');
    await select(page, '地和');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#resultSection')).toBeVisible();
    await choose(page, 'playerType', 'parent');
    await expectInvalid(page, ['地和']);
    await select(page, '地和');
    await choose(page, 'winType', 'ron');
    await select(page, '四暗刻');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-score')).toHaveText('48,000点');
  });

  const legalCases = [
    { roles: ['七対子', '混老頭'], han: '4翻', fu: '25', score: '6,400点' },
    { roles: ['平和', '一盃口'], han: '2翻', fu: '30', score: '2,000点' },
    { roles: ['七対子', '断幺九'], han: '3翻', fu: '25', score: '3,200点' },
    { roles: ['対々和', '三暗刻'], han: '4翻', fu: '40', score: '8,000点', initialFu: 40 },
    { roles: ['大三元', '字一色'], han: '役満', fu: null, score: '32,000点' },
    { roles: ['大三元', '役牌'], han: '役満', fu: null, score: '32,000点' },
    { roles: ['立直', '一発', '槍槓'], han: '3翻', fu: '30', score: '3,900点' },
  ];
  for (const { roles, han, fu, score, initialFu } of legalCases) {
    test(`合法な ${roles.join('＋')} の選択と点数を維持する`, async ({ page }) => {
      if (initialFu === 40) await page.locator('[data-target="fuYaku"][data-action="increase"]').click();
      for (const name of roles) await select(page, name);
      await expect(page.locator('.yaku-checkbox input:checked')).toHaveCount(roles.length);
      await expect(page.locator('#totalHan')).toHaveText(han);
      await expect(page.locator('#yakuValidationErrors')).toBeHidden();
      if (fu) await expect(page.locator('#fuYakuInput')).toHaveValue(fu);
      await page.locator('#calculateBtn').click();
      await expect(page.locator('#mainResult .result-score')).toHaveText(score);
    });
  }

  test('不整合のままモードを往復しても役選択計算を止め、手動入力は計算できる', async ({ page }) => {
    await select(page, '立直');
    await select(page, '一発');
    await select(page, '立直');
    await expectInvalid(page, ['一発']);
    await choose(page, 'inputMode', 'manual');
    await expect(page.locator('#fuInput')).not.toHaveValue('');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#resultSection')).toBeVisible();
    await choose(page, 'inputMode', 'yaku');
    await expectInvalid(page, ['一発']);
    await select(page, '一発');
    await select(page, '七対子');
    await expect(page.locator('#fuYakuInput')).toHaveValue('25');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#resultSection')).toBeVisible();
  });

  test('リセットは拒否理由と不整合を消し、同じ役を再選択できる', async ({ page }) => {
    await select(page, '立直');
    await select(page, '一発');
    await select(page, '立直');
    await expectInvalid(page, ['一発']);
    await page.locator('#resetBtn').click();
    await choose(page, 'inputMode', 'yaku');
    await expect(page.locator('#yakuValidationErrors')).toBeHidden();
    await expect(page.locator('#yakuValidationFeedback')).toBeHidden();
    await expect(page.locator('.yaku-checkbox input:checked')).toHaveCount(0);
    await expect(page.locator('#totalHan')).toHaveText('0翻');
    await expect(page.locator('#fuYakuInput')).toHaveValue('30');
    await select(page, '七対子');
    await select(page, '対々和');
    await expect(page.locator('#yakuValidationFeedback')).toBeVisible();
    await page.locator('#resetBtn').click();
    await choose(page, 'inputMode', 'yaku');
    await expect(page.locator('#yakuValidationFeedback')).toBeHidden();
    await select(page, '対々和');
    await expect(checkbox(page, '対々和')).toBeChecked();
  });

  test('一括更新された七対子＋平和を符数優先順や和了方法で隠さない', async ({ page }) => {
    await installStateHarness(page);
    await page.evaluate(() => window.validationHarness.stateManager.setSelectedYaku(new Set(['七対子', '平和'])));
    await expect(page.locator('#yakuValidationErrors')).toContainText('七対子');
    await expect(page.locator('#yakuValidationErrors')).toContainText('平和');
    await expect(page.locator('#fuYakuInput')).toHaveValue('');
    for (const winType of ['tsumo', 'ron']) {
      await page.evaluate(win => {
        const { stateManager, handlers } = window.validationHarness;
        stateManager.setWinType(win);
        handlers.calculateScore();
      }, winType);
      await expect(page.locator('#totalHan')).toHaveText('選択を確認');
      await expect(page.locator('#fuYakuInput')).toHaveValue('');
      await expect(page.locator('#resultSection')).toBeHidden();
    }
    await page.evaluate(() => {
      const { stateManager, handlers } = window.validationHarness;
      stateManager.removeYaku('平和');
      handlers.calculateScore();
    });
    await expect(page.locator('#yakuValidationErrors')).toBeHidden();
    await expect(page.locator('#fuYakuInput')).toHaveValue('25');
    await expect(page.locator('#mainResult .result-score')).toHaveText('1,600点');
  });

  test('StateManagerの直接更新でも以前の正常結果を消して計算を拒否する', async ({ page }) => {
    await installStateHarness(page);
    await page.evaluate(() => {
      const { stateManager, handlers } = window.validationHarness;
      stateManager.addYaku('七対子');
      handlers.calculateScore();
    });
    await expect(page.locator('#resultSection')).toBeVisible();
    await page.evaluate(() => {
      const { stateManager, handlers } = window.validationHarness;
      stateManager.updateState({ selectedYaku: new Set(['七対子', '対々和']) });
      handlers.calculateScore();
    });
    await expect(page.locator('#resultSection')).toBeHidden();
    await expect(page.locator('#yakuValidationErrors')).toContainText('対々和');
    await expect(checkbox(page, '七対子')).toBeChecked();
    await expect(checkbox(page, '対々和')).toBeChecked();
  });

  test('役・符数・モード・和了方法の一括変更でも固定符数の状態と表示が一致する', async ({ page }) => {
    await installStateHarness(page);
    const chiitoitsuFu = await page.evaluate(() => {
      const { stateManager } = window.validationHarness;
      stateManager.updateState({ selectedYaku: new Set(['七対子']), currentFu: 70 });
      return stateManager.getState().currentFu;
    });
    expect(chiitoitsuFu).toBe(25);
    await expect(page.locator('#fuYakuInput')).toHaveValue('25');
    const pinfuFu = await page.evaluate(() => {
      const { stateManager, handlers } = window.validationHarness;
      stateManager.setInputMode('manual');
      stateManager.updateState({
        selectedYaku: new Set(['平和', '門前清自摸和']),
        currentFu: 70, inputMode: 'yaku', winType: 'tsumo',
      });
      const fu = stateManager.getState().currentFu;
      handlers.calculateScore();
      return fu;
    });
    expect(pinfuFu).toBe(20);
    await expect(page.locator('#fuYakuInput')).toHaveValue('20');
    await expect(page.locator('#totalHan')).toHaveText('2翻');
    await expect(page.locator('#mainResult .result-score')).toHaveText('400/700');
  });

  test('購読を通らないSet変更も計算直前に共通検証で拒否する', async ({ page }) => {
    await installStateHarness(page);
    await page.evaluate(() => {
      const { stateManager, handlers } = window.validationHarness;
      stateManager.addYaku('七対子');
      handlers.calculateScore();
    });
    await expect(page.locator('#resultSection')).toBeVisible();
    await page.evaluate(() => {
      const { stateManager, handlers } = window.validationHarness;
      stateManager.getState().selectedYaku.add('対々和');
      handlers.calculateScore();
    });
    await expect(page.locator('#resultSection')).toBeHidden();
    await expect(page.locator('#yakuValidationErrors')).toContainText('対々和');
  });
});
