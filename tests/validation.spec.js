import { test as base, expect } from '@playwright/test';
import { setFuValue } from './test-utils.js';

// StateManager catches subscriber exceptions, so pageerror alone cannot detect them.
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
    expect(errors, 'ブラウザ例外と購読処理のエラーが発生しない').toEqual([]);
  }, { auto: true }],
});

async function expectFuButtons(page, target, disabled) {
  for (const action of ['decrease', 'increase']) {
    const button = page.locator(`[data-target="${target}"][data-action="${action}"]`);
    if (disabled) {
      await expect(button).toBeDisabled();
      await expect(button).toHaveClass(/disabled/);
    } else {
      await expect(button).toBeEnabled();
      await expect(button).not.toHaveClass(/disabled/);
    }
  }
}

test.describe('符数検証の回帰テスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('初期化が例外なく完了し、1翻30符で操作できる', async ({ page }) => {
    await expect(page.locator('#hanInput')).toHaveValue('1');
    await expect(page.locator('#fuInput')).toHaveValue('30');
    await expectFuButtons(page, 'fu', false);
    await page.locator('[data-target="fu"][data-action="increase"]').click();
    await expect(page.locator('#fuInput')).toHaveValue('40');
  });

  test('手動入力で満貫の符数を保持し、1翻の下限を補正する', async ({ page }) => {
    const increaseHan = page.locator('[data-target="han"][data-action="increase"]');
    const decreaseHan = page.locator('[data-target="han"][data-action="decrease"]');
    await setFuValue(page, 110);
    await increaseHan.click();
    await expect(page.locator('#fuInput')).toHaveValue('110'); // 2翻では有効
    await increaseHan.click();
    await expect(page.locator('#fuInput')).toHaveValue('110'); // 3翻でも満貫の符数を保持
    await increaseHan.click();
    await expect(page.locator('#fuInput')).toHaveValue('110'); // 4翻でも満貫の符数を保持
    await page.locator('[data-target="fu"][data-action="increase"]').click();
    await expect(page.locator('#fuInput')).toHaveValue('110');
    await decreaseHan.click();
    await decreaseHan.click();
    await setFuValue(page, 30);
    await page.locator('[data-target="fu"][data-action="decrease"]').click();
    await expect(page.locator('#fuInput')).toHaveValue('20'); // 2翻では有効
    await decreaseHan.click();
    await expect(page.locator('#hanInput')).toHaveValue('1');
    await expect(page.locator('#fuInput')).toHaveValue('30'); // 1翻の下限
  });

  test('手動入力で5〜13翻の符数ボタンを無効化し、4翻で戻す', async ({ page }) => {
    const increaseHan = page.locator('[data-target="han"][data-action="increase"]');
    const decreaseHan = page.locator('[data-target="han"][data-action="decrease"]');
    for (let han = 2; han <= 13; han++) {
      await increaseHan.click();
      await expect(page.locator('#hanInput')).toHaveValue(String(han));
      await expectFuButtons(page, 'fu', han >= 5);
      await expect(page.locator('#fuInput')).toHaveValue('30');
    }
    for (let han = 12; han >= 4; han--) {
      await decreaseHan.click();
    }
    await expect(page.locator('#hanInput')).toHaveValue('4');
    await expectFuButtons(page, 'fu', false);
    await page.locator('[data-target="fu"][data-action="decrease"]').click();
    await expect(page.locator('#fuInput')).toHaveValue('20');
  });

  test('役選択で合計翻数が増えても満貫の符数を保持する', async ({ page }) => {
    await setFuValue(page, 110);
    await page.locator('label:has(input[name="inputMode"][value="yaku"])').click();
    await expect(page.locator('#fuYakuInput')).toHaveValue('110');
    await page.locator('label.yaku-checkbox:has(input[value="混一色"])').click();
    await expect(page.locator('#totalHan')).toHaveText('3翻');
    await expect(page.locator('#fuYakuInput')).toHaveValue('110');
    await page.locator('label.yaku-checkbox:has(input[value="立直"])').click();
    await expect(page.locator('#totalHan')).toHaveText('4翻');
    await expect(page.locator('#fuYakuInput')).toHaveValue('110');
    await expectFuButtons(page, 'fuYaku', false);
  });

  test('役選択で5翻以上の符数ボタンを無効化し、3翻で戻す', async ({ page }) => {
    await page.locator('label:has(input[name="inputMode"][value="yaku"])').click();
    const selectYaku = name => page.locator(`label.yaku-checkbox:has(input[value="${name}"])`).click();
    await selectYaku('混一色');
    await selectYaku('一気通貫');
    await expect(page.locator('#totalHan')).toHaveText('5翻');
    await expectFuButtons(page, 'fuYaku', true);
    await selectYaku('立直');
    await expect(page.locator('#totalHan')).toHaveText('6翻');
    await expectFuButtons(page, 'fuYaku', true);
    await selectYaku('国士無双');
    await expect(page.locator('#totalHan')).toHaveText('役満');
    await expectFuButtons(page, 'fuYaku', true);
    await selectYaku('国士無双');
    await selectYaku('立直');
    await selectYaku('一気通貫');
    await expect(page.locator('#totalHan')).toHaveText('3翻');
    await expectFuButtons(page, 'fuYaku', false);
    await page.locator('[data-target="fuYaku"][data-action="increase"]').click();
    await expect(page.locator('#fuYakuInput')).toHaveValue('40');
  });
});
