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
    expect(errors, 'ドラ入力の購読処理が例外なく完了する').toEqual([]);
  }, { auto: true }],
});

const selectYaku = (page, name) => page.locator(`label.yaku-checkbox:has(input[value="${name}"])`).click();
const selectMode = (page, mode) => page.locator(`label:has(input[name="inputMode"][value="${mode}"])`).click();
const doraButton = (page, target, action) => page.locator(`[data-target="${target}"][data-action="${action}"]`);
async function addDora(page, target, times) {
  for (let i = 0; i < times; i++) await doraButton(page, target, 'increase').click();
}

test.describe('ドラ・赤ドラ・裏ドラ（Issue #7）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await selectMode(page, 'yaku');
  });

  test('ドラを役の翻数に加算して点数を計算する', async ({ page }) => {
    await selectYaku(page, '立直');
    await expect(page.locator('#totalHan')).toHaveText('1翻');
    await expect(page.locator('#hanBreakdown')).toBeHidden();

    await addDora(page, 'dora', 1);
    await addDora(page, 'redDora', 1);
    await expect(page.locator('#doraInput')).toHaveValue('1');
    await expect(page.locator('#redDoraInput')).toHaveValue('1');
    await expect(page.locator('#totalHan')).toHaveText('3翻');
    await expect(page.locator('#hanBreakdown')).toHaveText('役 1翻 + ドラ 2翻');

    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-score')).toHaveText('5,800点');
    await expect(page.locator('#mainResult .result-name')).toHaveText('3翻30符');
    await page.locator('#toggleDetailBtn').click();
    await expect(page.locator('#detailResult')).toContainText('翻数: 3翻');
    await expect(page.locator('#detailResult')).toContainText('ドラ: 2翻 (ドラ1・赤ドラ1)');

    // ドラの変更で古い計算結果を残さない
    await doraButton(page, 'dora', 'decrease').click();
    await expect(page.locator('#resultSection')).toBeHidden();
    await expect(page.locator('#totalHan')).toHaveText('2翻');
  });

  test('裏ドラは立直時だけ増やせ、立直解除時は矛盾として計算を止める', async ({ page }) => {
    await selectYaku(page, '断幺九');
    await expect(doraButton(page, 'uraDora', 'increase')).toBeDisabled();
    await expect(doraButton(page, 'uraDora', 'decrease')).toBeDisabled();

    await selectYaku(page, '立直');
    await expect(doraButton(page, 'uraDora', 'increase')).toBeEnabled();
    await addDora(page, 'uraDora', 2);
    await expect(page.locator('#totalHan')).toHaveText('4翻');

    await selectYaku(page, '立直');
    await expect(page.locator('#totalHan')).toHaveText('選択を確認');
    await expect(page.locator('#yakuValidationErrors')).toContainText('裏ドラは立直またはダブル立直');
    await expect(doraButton(page, 'uraDora', 'increase')).toBeDisabled();
    await expect(doraButton(page, 'uraDora', 'decrease')).toBeEnabled();

    await doraButton(page, 'uraDora', 'decrease').click();
    await doraButton(page, 'uraDora', 'decrease').click();
    await expect(page.locator('#yakuValidationErrors')).toBeHidden();
    await expect(page.locator('#totalHan')).toHaveText('1翻');
  });

  test('赤ドラは3枚まで', async ({ page }) => {
    await addDora(page, 'redDora', 3);
    await expect(page.locator('#redDoraInput')).toHaveValue('3');
    await expect(doraButton(page, 'redDora', 'increase')).toBeDisabled();
  });

  test('ドラだけでは和了にならない', async ({ page }) => {
    await addDora(page, 'dora', 2);
    await expect(page.locator('#totalHan')).toHaveText('0翻');
    await expect(page.locator('#hanBreakdown')).toHaveText('ドラ2翻は役がないため加算しません。');
    const messages = [];
    page.once('dialog', dialog => {
      messages.push(dialog.message());
      dialog.dismiss();
    });
    await page.locator('#calculateBtn').click();
    await expect.poll(() => messages).toEqual(['役が選択されていません。']);
    await expect(page.locator('#resultSection')).toBeHidden();
  });

  test('役満にはドラを加算しない', async ({ page }) => {
    await selectYaku(page, '国士無双');
    await addDora(page, 'dora', 2);
    await expect(page.locator('#totalHan')).toHaveText('役満');
    await expect(page.locator('#hanBreakdown')).toHaveText('役満のためドラ2翻は加算しません。');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-score')).toHaveText('48,000点');
  });

  test('通常役とドラで13翻に達すると数え役満として計算する', async ({ page }) => {
    await selectYaku(page, '立直');
    await selectYaku(page, '清一色');
    await addDora(page, 'dora', 4);
    await addDora(page, 'redDora', 2);
    await expect(page.locator('#totalHan')).toHaveText('役満');
    await expect(page.locator('#hanBreakdown')).toHaveText('役 7翻 + ドラ 6翻');
    await expect(page.locator('#yakumanScoringNote')).toBeHidden();
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-score')).toHaveText('48,000点');
  });

  test('ドラで翻数が上がると符数制限も追従する', async ({ page }) => {
    await selectYaku(page, '立直');
    await addDora(page, 'dora', 4);
    await expect(page.locator('#totalHan')).toHaveText('5翻');
    await expect(page.locator('[data-target="fuYaku"][data-action="increase"]')).toBeDisabled();
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-name')).toHaveText('満貫');
  });

  test('リセットでドラ枚数を0に戻す', async ({ page }) => {
    await selectYaku(page, '立直');
    await addDora(page, 'dora', 2);
    await addDora(page, 'redDora', 1);
    await addDora(page, 'uraDora', 1);
    await page.locator('#resetBtn').click();
    await selectMode(page, 'yaku');
    for (const id of ['doraInput', 'redDoraInput', 'uraDoraInput']) {
      await expect(page.locator(`#${id}`)).toHaveValue('0');
    }
    await expect(page.locator('#hanBreakdown')).toBeHidden();
    await selectYaku(page, '立直');
    await expect(page.locator('#totalHan')).toHaveText('1翻');
  });
});
