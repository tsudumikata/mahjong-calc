import { test as base, expect } from '@playwright/test';

const test = base.extend({
  appErrors: [async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && /^(StateManager: Error in listener|\[ErrorHandler\])/.test(message.text())) {
        errors.push(message.text());
      }
    });
    await use(errors);
    expect(errors, '符数・役満の計算で例外が発生しない').toEqual([]);
  }, { auto: true }],
});

const choose = (page, name, value) => page.locator(`label:has(input[name="${name}"][value="${value}"])`).click();
const selectYaku = (page, name) => page.locator(`label.yaku-checkbox:has(input[value="${name}"])`).click();
const button = (page, target, action) => page.locator(`[data-target="${target}"][data-action="${action}"]`);

test.describe('手動入力の25符（Issue #22）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await choose(page, 'inputMode', 'manual');
  });

  test('2翻では 30→25→20 と下げられ、2翻25符を計算できる', async ({ page }) => {
    await choose(page, 'playerType', 'child');
    await button(page, 'han', 'increase').click();
    await expect(page.locator('#hanInput')).toHaveValue('2');
    await expect(page.locator('#fuInput')).toHaveValue('30');

    await button(page, 'fu', 'decrease').click();
    await expect(page.locator('#fuInput')).toHaveValue('25');
    await button(page, 'fu', 'decrease').click();
    await expect(page.locator('#fuInput')).toHaveValue('20');
    await button(page, 'fu', 'increase').click();
    await expect(page.locator('#fuInput')).toHaveValue('25');

    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-score')).toHaveText('1,600点');
    await expect(page.locator('#mainResult .result-name')).toHaveText('2翻25符');

    await button(page, 'fu', 'increase').click();
    await expect(page.locator('#fuInput')).toHaveValue('30');
    await button(page, 'fu', 'increase').click();
    await expect(page.locator('#fuInput')).toHaveValue('40');
  });

  test('1翻では25符を選べず、25符のまま1翻に下げると30符に補正する', async ({ page }) => {
    await button(page, 'fu', 'decrease').click();
    await expect(page.locator('#fuInput')).toHaveValue('30');

    await button(page, 'han', 'increase').click();
    await button(page, 'fu', 'decrease').click();
    await expect(page.locator('#fuInput')).toHaveValue('25');
    await button(page, 'han', 'decrease').click();
    await expect(page.locator('#hanInput')).toHaveValue('1');
    await expect(page.locator('#fuInput')).toHaveValue('30');
  });

  test('役選択の七対子25符を引き継いでも、手動入力の1翻では30符にする', async ({ page }) => {
    await choose(page, 'inputMode', 'yaku');
    await selectYaku(page, '七対子');
    await expect(page.locator('#fuYakuInput')).toHaveValue('25');
    await choose(page, 'inputMode', 'manual');
    await expect(page.locator('#hanInput')).toHaveValue('1');
    await expect(page.locator('#fuInput')).toHaveValue('30');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-name')).toHaveText('1翻30符');
  });

  test('役選択モードの符数ボタンは25符を飛ばす', async ({ page }) => {
    await choose(page, 'inputMode', 'yaku');
    await selectYaku(page, '立直');
    await selectYaku(page, '断幺九');
    await expect(page.locator('#totalHan')).toHaveText('2翻');
    await expect(page.locator('#fuYakuInput')).toHaveValue('30');
    await button(page, 'fuYaku', 'decrease').click();
    await expect(page.locator('#fuYakuInput')).toHaveValue('20');
    await button(page, 'fuYaku', 'increase').click();
    await expect(page.locator('#fuYakuInput')).toHaveValue('30');
  });
});

test.describe('複数役満（Issue #8）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await choose(page, 'inputMode', 'yaku');
  });

  const cases = [
    { playerType: 'child', winType: 'ron', score: '64,000点' },
    { playerType: 'child', winType: 'tsumo', score: '16000/32000' },
    { playerType: 'parent', winType: 'ron', score: '96,000点' },
    { playerType: 'parent', winType: 'tsumo', score: '32000' },
  ];
  for (const { playerType, winType, score } of cases) {
    test(`大三元＋字一色はダブル役満 ${playerType}・${winType}`, async ({ page }) => {
      await choose(page, 'playerType', playerType);
      await choose(page, 'winType', winType);
      await selectYaku(page, '大三元');
      await expect(page.locator('#totalHan')).toHaveText('役満');
      await selectYaku(page, '字一色');
      await expect(page.locator('#totalHan')).toHaveText('ダブル役満');
      await expect(page.locator('#yakumanScoringNote')).toBeVisible();
      await page.locator('#calculateBtn').click();
      await expect(page.locator('#mainResult .result-score')).toHaveText(score);
      await expect(page.locator('#mainResult .result-name')).toHaveText('ダブル役満');
    });
  }

  test('役満3つはトリプル役満、ドラは加算せず、1つ外すとダブル役満に戻る', async ({ page }) => {
    await choose(page, 'playerType', 'child');
    for (const name of ['大四喜', '字一色', '四暗刻']) await selectYaku(page, name);
    await button(page, 'dora', 'increase').click();
    await expect(page.locator('#totalHan')).toHaveText('トリプル役満');
    await expect(page.locator('#hanBreakdown')).toHaveText('役満のためドラ1翻は加算しません。');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-score')).toHaveText('96,000点');
    await page.locator('#toggleDetailBtn').click();
    await expect(page.locator('#detailResult')).toContainText('翻数: 役満×3');

    await selectYaku(page, '四暗刻');
    await expect(page.locator('#totalHan')).toHaveText('ダブル役満');
    await expect(page.locator('#resultSection')).toBeHidden();
  });

  test('数え役満は翻数が大きくても1倍の役満', async ({ page }) => {
    await choose(page, 'playerType', 'child');
    await selectYaku(page, '立直');
    await selectYaku(page, '清一色');
    for (let i = 0; i < 13; i++) await button(page, 'dora', 'increase').click();
    await expect(page.locator('#hanBreakdown')).toHaveText('役 7翻 + ドラ 13翻');
    await expect(page.locator('#totalHan')).toHaveText('役満');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-score')).toHaveText('32,000点');
    await expect(page.locator('#mainResult .result-name')).toHaveText('役満');
  });
});
