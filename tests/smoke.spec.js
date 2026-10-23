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
    await use();
    expect(errors, '起動と操作で例外が発生しない').toEqual([]);
  }, { auto: true }],
});

test.describe('ブラウザースモークテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('起動して点数表と役選択を初期化する', async ({ page }) => {
    await expect(page).toHaveTitle(/麻雀点数計算機/);
    await expect(page.locator('#hanInput')).toHaveValue('1');
    await expect(page.locator('#fuInput')).toHaveValue('30');
    await expect(page.locator('#scoreTableBody tr')).not.toHaveCount(0);
    await expect(page.locator('#yaku1Han input')).not.toHaveCount(0);
    await expect(page.locator('#calculateBtn')).toBeEnabled();
  });

  test('入力を変更して2翻40符の親ロンを計算する', async ({ page }) => {
    await page.locator('[data-target="han"][data-action="increase"]').click();
    await page.locator('[data-target="fu"][data-action="increase"]').click();
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#resultSection')).toBeVisible();
    await expect(page.locator('#mainResult .result-score')).toHaveText('3,900点');
  });

  test('計算後にリセットして初期値で再計算する', async ({ page }) => {
    await page.locator('[data-target="han"][data-action="increase"]').click();
    await page.locator('[data-target="fu"][data-action="increase"]').click();
    await page.locator('label:has(input[name="winType"][value="tsumo"])').click();
    await page.locator('label:has(input[name="playerType"][value="child"])').click();
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#resultSection')).toBeVisible();
    await page.locator('#resetBtn').click();
    await expect(page.locator('#hanInput')).toHaveValue('1');
    await expect(page.locator('#fuInput')).toHaveValue('30');
    await expect(page.locator('input[name="inputMode"][value="manual"]')).toBeChecked();
    await expect(page.locator('input[name="winType"][value="ron"]')).toBeChecked();
    await expect(page.locator('input[name="playerType"][value="parent"]')).toBeChecked();
    await expect(page.locator('#resultSection')).toBeHidden();
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-score')).toHaveText('1,500点');
  });
});
