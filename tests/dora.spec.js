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

test.describe('混老頭と赤ドラの整合性（Issue #39）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('label:has(input[name="playerType"][value="child"])').click();
    await selectMode(page, 'yaku');
    await selectYaku(page, '七対子');
  });

  for (const recovery of ['赤ドラを0枚に戻す', '混老頭を解除する']) {
    test(`混老頭選択後の赤ドラを拒否し、${recovery}と再計算できる`, async ({ page }) => {
      await selectYaku(page, '混老頭');
      await expect(page.locator('#totalHan')).toHaveText('4翻');
      await expect(page.locator('#fuYakuInput')).toHaveValue('25');
      await page.locator('#calculateBtn').click();
      await expect(page.locator('#mainResult .result-score')).toHaveText('6,400点');
      await page.locator('#toggleDetailBtn').click();
      await expect(page.locator('#detailResult')).toBeVisible();

      await addDora(page, 'redDora', 1);
      await expect(page.locator('#yakuValidationErrors')).toContainText('混老頭');
      await expect(page.locator('#yakuValidationErrors')).toContainText('赤ドラ');
      await expect(page.locator('#totalHan')).toHaveText('選択を確認');
      await expect(page.locator('#fuYakuInput')).toHaveValue('');
      await expect(page.locator('#hanBreakdown')).toBeHidden();
      await expect(page.locator('#resultSection')).toBeHidden();
      await expect(page.locator('#mainResult')).toBeEmpty();
      await expect(page.locator('#detailResult')).toBeEmpty();
      await page.locator('#calculateBtn').click();
      await expect(page.locator('#resultSection')).toBeHidden();

      if (recovery === '赤ドラを0枚に戻す') {
        await doraButton(page, 'redDora', 'decrease').click();
      } else {
        await selectYaku(page, '混老頭');
      }
      await expect(page.locator('#yakuValidationErrors')).toBeHidden();
      await expect(page.locator('#fuYakuInput')).toHaveValue('25');
      await page.locator('#calculateBtn').click();
      await expect(page.locator('#resultSection')).toBeVisible();
      await expect(page.locator('#mainResult .result-score')).toHaveText(
        recovery === '赤ドラを0枚に戻す' ? '6,400点' : '3,200点'
      );
    });
  }

  test('赤ドラ入力後は混老頭をグレー表示し、追加拒否の理由を示す', async ({ page }) => {
    await addDora(page, 'redDora', 1);
    const honroutou = page.locator('label.yaku-checkbox:has(input[value="混老頭"])');
    await expect(honroutou).toHaveClass(/yaku-unavailable/);
    await honroutou.click();
    await expect(honroutou.locator('input')).not.toBeChecked();
    await expect(page.locator('#yakuValidationFeedback')).toContainText('混老頭');
    await expect(page.locator('#yakuValidationFeedback')).toContainText('赤ドラ');
    await expect(page.locator('#yakuValidationErrors')).toBeHidden();
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-score')).toHaveText('3,200点');

    await doraButton(page, 'redDora', 'decrease').click();
    await expect(honroutou).not.toHaveClass(/yaku-unavailable/);
    await expect(page.locator('#yakuValidationFeedback')).toBeHidden();
    await honroutou.click();
    await expect(honroutou.locator('input')).toBeChecked();
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-score')).toHaveText('6,400点');
  });

  test('混老頭でも通常ドラと立直時の裏ドラは計算できる', async ({ page }) => {
    await selectYaku(page, '混老頭');
    await addDora(page, 'dora', 1);
    await expect(page.locator('#yakuValidationErrors')).toBeHidden();
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-score')).toHaveText('8,000点');

    await selectYaku(page, '立直');
    await addDora(page, 'uraDora', 1);
    await expect(page.locator('#totalHan')).toHaveText('7翻');
    await expect(page.locator('#yakuValidationErrors')).toBeHidden();
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-score')).toHaveText('12,000点');
  });
});

test.describe('赤ドラと両立しない役の拡張（Issue #44）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('label:has(input[name="playerType"][value="child"])').click();
    await selectMode(page, 'yaku');
  });

  // 通常役（純全帯幺九: 3翻30符・子ロン3,900点）と役満（国士無双: 子ロン32,000点）の代表例。
  for (const { name, han, score } of [
    { name: '純全帯幺九', han: '3翻', score: '3,900点' },
    { name: '国士無双', han: '役満', score: '32,000点' },
  ]) {
    for (const recovery of ['赤ドラを0枚に戻す', `${name}を解除する`]) {
      test(`${name}選択後の赤ドラを拒否し、${recovery}と正常に戻る`, async ({ page }) => {
        await selectYaku(page, name);
        await expect(page.locator('#totalHan')).toContainText(han);
        await page.locator('#calculateBtn').click();
        await expect(page.locator('#mainResult .result-score')).toHaveText(score);

        await addDora(page, 'redDora', 1);
        await expect(page.locator('#yakuValidationErrors')).toContainText(name);
        await expect(page.locator('#yakuValidationErrors')).toContainText('赤ドラ');
        await expect(page.locator('#totalHan')).toHaveText('選択を確認');
        await expect(page.locator('#resultSection')).toBeHidden();
        await expect(page.locator('#mainResult')).toBeEmpty();
        await page.locator('#calculateBtn').click();
        await expect(page.locator('#resultSection')).toBeHidden();

        if (recovery === '赤ドラを0枚に戻す') {
          await doraButton(page, 'redDora', 'decrease').click();
          await expect(page.locator('#yakuValidationErrors')).toBeHidden();
          await page.locator('#calculateBtn').click();
          await expect(page.locator('#mainResult .result-score')).toHaveText(score);
        } else {
          await selectYaku(page, name);
          await expect(page.locator('#yakuValidationErrors')).toBeHidden();
          await selectYaku(page, '断幺九');
          await page.locator('#calculateBtn').click();
          // 断幺九1翻＋赤ドラ1 = 2翻30符・子ロン2,000点
          await expect(page.locator('#mainResult .result-score')).toHaveText('2,000点');
        }
      });
    }

    test(`赤ドラ入力後は${name}をグレー表示し、追加拒否の理由を示す`, async ({ page }) => {
      await addDora(page, 'redDora', 1);
      const target = page.locator(`label.yaku-checkbox:has(input[value="${name}"])`);
      await expect(target).toHaveClass(/yaku-unavailable/);
      await target.click();
      await expect(target.locator('input')).not.toBeChecked();
      await expect(page.locator('#yakuValidationFeedback')).toContainText(name);
      await expect(page.locator('#yakuValidationFeedback')).toContainText('赤ドラ');
      await expect(page.locator('#yakuValidationErrors')).toBeHidden();

      await doraButton(page, 'redDora', 'decrease').click();
      await expect(target).not.toHaveClass(/yaku-unavailable/);
      await target.click();
      await expect(target.locator('input')).toBeChecked();
      await page.locator('#calculateBtn').click();
      await expect(page.locator('#mainResult .result-score')).toHaveText(score);
    });
  }

  test('赤ドラ入力後も5牌を含められる役はグレー表示しない', async ({ page }) => {
    await addDora(page, 'redDora', 1);
    for (const name of ['断幺九', '対々和', '混一色', '七対子', '大三元', '九蓮宝燈']) {
      await expect(page.locator(`label.yaku-checkbox:has(input[value="${name}"])`)).not.toHaveClass(/yaku-unavailable/);
    }
    for (const name of ['混全帯幺九', '純全帯幺九', '混老頭', '国士無双', '字一色', '緑一色', '清老頭']) {
      await expect(page.locator(`label.yaku-checkbox:has(input[value="${name}"])`)).toHaveClass(/yaku-unavailable/);
    }
  });

  test('純全帯幺九でも通常ドラと立直時の裏ドラは計算できる', async ({ page }) => {
    await selectYaku(page, '純全帯幺九');
    await addDora(page, 'dora', 1);
    await expect(page.locator('#yakuValidationErrors')).toBeHidden();
    await page.locator('#calculateBtn').click();
    // 4翻30符・子ロン
    await expect(page.locator('#mainResult .result-score')).toHaveText('7,700点');

    await selectYaku(page, '立直');
    await addDora(page, 'uraDora', 1);
    await expect(page.locator('#totalHan')).toHaveText('6翻');
    await expect(page.locator('#yakuValidationErrors')).toBeHidden();
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-score')).toHaveText('12,000点');
  });
});
