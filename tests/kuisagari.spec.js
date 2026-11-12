import { test as base, expect } from '@playwright/test';

// Issue #49: 役選択モードで副露なら喰い下がりを適用し、門前限定役を選べなくする。
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
    expect(errors, '門前／副露の購読処理が例外なく完了する').toEqual([]);
  }, { auto: true }],
});

const label = (page, name) => page.locator(`label.yaku-checkbox:has(input[value="${name}"])`);
const choose = (page, name, value) => page.locator(`label:has(input[name="${name}"][value="${value}"])`).click();

test.describe('喰い下がりと門前限定役 #49', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await choose(page, 'playerType', 'child');
    await choose(page, 'inputMode', 'yaku');
  });

  test('初期値は門前で、副露にすると混一色を2翻で数える', async ({ page }) => {
    await expect(page.locator('input[name="menzen"][value="menzen"]')).toBeChecked();
    await label(page, '混一色').click();
    await expect(page.locator('#totalHan')).toHaveText('3翻');
    await expect(page.locator('#selectedYakuList')).toHaveText('混一色 (3翻)');
    await expect(page.locator('#hanBreakdown')).toBeHidden();

    await choose(page, 'menzen', 'open');
    await expect(page.locator('#totalHan')).toHaveText('2翻');
    await expect(page.locator('#selectedYakuList')).toHaveText('混一色 (2翻・喰い下がり)');
    await expect(page.locator('#hanBreakdown')).toHaveText('副露のため喰い下がり: 混一色 3→2翻');

    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-score')).toHaveText('2,000点');
    await expect(page.locator('#mainResult .result-name')).toHaveText('2翻30符');
    await page.locator('#toggleDetailBtn').click();
    await expect(page.locator('#detailResult')).toContainText('門前／副露: 副露');
    await expect(page.locator('#detailResult')).toContainText('・混一色 (2翻・喰い下がり)');

    // 門前に戻すと古い結果を隠し、3翻に戻す
    await choose(page, 'menzen', 'menzen');
    await expect(page.locator('#resultSection')).toBeHidden();
    await expect(page.locator('#totalHan')).toHaveText('3翻');
  });

  test('副露の清一色は5翻で、ドラは喰い下がり後の翻数に足す', async ({ page }) => {
    await choose(page, 'menzen', 'open');
    await label(page, '清一色').click();
    await page.locator('[data-target="dora"][data-action="increase"]').click();
    await expect(page.locator('#totalHan')).toHaveText('6翻');
    await expect(page.locator('#hanBreakdown')).toContainText('役 5翻 + ドラ 1翻');
    await expect(page.locator('#hanBreakdown')).toContainText('副露のため喰い下がり: 清一色 6→5翻');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-name')).toHaveText('跳満');
  });

  test('副露では門前限定役を薄く表示し、押すと理由を出して選ばない', async ({ page }) => {
    await choose(page, 'menzen', 'open');
    for (const name of ['立直', '平和', '一盃口', '七対子', '国士無双', '四暗刻']) {
      await expect(label(page, name)).toHaveClass(/yaku-unavailable/);
    }
    await expect(label(page, '断幺九')).not.toHaveClass(/yaku-unavailable/);
    await expect(label(page, '混一色')).not.toHaveClass(/yaku-unavailable/);

    await label(page, '立直').click();
    await expect(page.locator('.yaku-checkbox input[value="立直"]')).not.toBeChecked();
    await expect(page.locator('#yakuValidationFeedback')).toContainText('立直は門前でのみ成立します');

    await choose(page, 'menzen', 'menzen');
    await expect(label(page, '立直')).not.toHaveClass(/yaku-unavailable/);
  });

  test('門前限定役を選んだまま副露にすると理由を表示して計算しない', async ({ page }) => {
    await label(page, '立直').click();
    await label(page, '断幺九').click();
    await choose(page, 'menzen', 'open');
    await expect(page.locator('#yakuValidationErrors')).toContainText('立直は門前でのみ成立します');
    await expect(page.locator('#totalHan')).toHaveText('選択を確認');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#resultSection')).toBeHidden();

    await label(page, '立直').click(); // 解除は常に許可
    await expect(page.locator('#yakuValidationErrors')).toBeHidden();
    await expect(page.locator('#totalHan')).toHaveText('1翻');
  });

  test('符の自動計算と門前／副露を共有する', async ({ page }) => {
    await page.locator('label.fu-calc-toggle').click();
    await expect(page.locator('input[name="fuMenzen"]')).toHaveCount(0); // 符計算パネルに別の選択を持たない
    await label(page, '混一色').click();
    await page.locator('#fuMeldType0').selectOption('anko');
    await page.locator('label:has(#fuMeldTerminal0)').click();
    // 門前ロン: 副底20 + 門前ロン10 + 暗刻（幺九牌）8 = 38 → 40符
    await expect(page.locator('#fuYakuInput')).toHaveValue('40');
    await expect(page.locator('#totalHan')).toHaveText('3翻');

    await choose(page, 'menzen', 'open');
    // 副露ロン: 副底20 + 暗刻（幺九牌）8 = 28 → 30符、混一色は2翻
    await expect(page.locator('#fuYakuInput')).toHaveValue('30');
    await expect(page.locator('#fuCalcResult')).toContainText('副底20 ＋ 暗刻（幺九牌）8 ＝ 28符 → 30符');
    await expect(page.locator('#totalHan')).toHaveText('2翻');
  });

  test('リセットで門前に戻す', async ({ page }) => {
    await choose(page, 'menzen', 'open');
    await label(page, '混一色').click();
    await page.locator('#resetBtn').click();
    await expect(page.locator('input[name="menzen"][value="menzen"]')).toBeChecked();
    await choose(page, 'inputMode', 'yaku');
    await label(page, '混一色').click();
    await expect(page.locator('#totalHan')).toHaveText('3翻');
  });
});
