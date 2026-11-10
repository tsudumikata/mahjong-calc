import { test as base, expect } from '@playwright/test';

// 符の自動計算（Issue #9）: 和了形を選ぶと符数欄と計算結果に反映する。
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
    expect(errors, '符の自動計算の購読処理が例外なく完了する').toEqual([]);
  }, { auto: true }],
});

const radio = (page, name, value) => page.locator(`label:has(input[name="${name}"][value="${value}"])`).click();
const selectYaku = (page, name) => page.locator(`label.yaku-checkbox:has(input[value="${name}"])`).click();
const enableAutoFu = page => page.locator('label.fu-calc-toggle').click();
const setMeld = async (page, index, type, terminal = false) => {
  await page.locator(`#fuMeldType${index}`).selectOption(type);
  if (terminal !== await page.locator(`#fuMeldTerminal${index}`).isChecked()) {
    await page.locator(`label:has(#fuMeldTerminal${index})`).click();
  }
};
const fuButtons = (page, target) => ['increase', 'decrease']
  .map(action => page.locator(`[data-target="${target}"][data-action="${action}"]`));

test.describe('符の自動計算 #9', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('オフのときは入力欄を隠し、オンにすると平和形の30符を入れて±ボタンを止める', async ({ page }) => {
    await expect(page.locator('#fuCalcFields')).toBeHidden();
    await expect(page.locator('#fuAutoToggle')).not.toBeChecked();
    await enableAutoFu(page);
    await expect(page.locator('#fuCalcFields')).toBeVisible();
    await expect(page.locator('#fuInput')).toHaveValue('30');
    await expect(page.locator('#fuCalcResult')).toHaveText('副底20 ＋ 門前ロン10 ＝ 30符');
    for (const button of fuButtons(page, 'fu')) await expect(button).toBeDisabled();

    await enableAutoFu(page);
    await expect(page.locator('#fuCalcFields')).toBeHidden();
    for (const button of fuButtons(page, 'fu')) await expect(button).toBeEnabled();
  });

  test('手動入力: 和了形の変更で符を計算し、結果と内訳を表示する', async ({ page }) => {
    await enableAutoFu(page);
    await page.locator('[data-target="han"][data-action="increase"]').click(); // 2翻
    await setMeld(page, 0, 'anko', true);
    await page.locator('#fuWait').selectOption('tanki');
    await expect(page.locator('#fuInput')).toHaveValue('40');
    await expect(page.locator('#fuCalcResult')).toContainText('暗刻（幺九牌）8 ＋ 待ち（単騎）2 ＝ 40符');

    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-score')).toHaveText('3,900点');
    await expect(page.locator('#mainResult .result-name')).toHaveText('2翻40符');
    await page.locator('#toggleDetailBtn').click();
    await expect(page.locator('#detailResult')).toContainText('符の内訳:');
    await expect(page.locator('#detailResult')).toContainText('・暗刻（幺九牌） 8符');
    await expect(page.locator('#detailResult')).toContainText('・合計 40符');

    // 入力を変えたら古い結果を隠す
    await radio(page, 'fuMenzen', 'open');
    await expect(page.locator('#resultSection')).toBeHidden();
    await expect(page.locator('#fuInput')).toHaveValue('30');
    await expect(page.locator('#fuCalcResult')).toContainText('＝ 30符');
  });

  test('副露ロンで加符がない形は30符、32符は40符に切り上げる', async ({ page }) => {
    await enableAutoFu(page);
    await radio(page, 'fuMenzen', 'open');
    await expect(page.locator('#fuInput')).toHaveValue('30');
    await expect(page.locator('#fuCalcResult')).toContainText('副露で加符のない形は30符として扱います。');

    await radio(page, 'fuMenzen', 'menzen');
    await page.locator('#fuWait').selectOption('kanchan');
    await expect(page.locator('#fuCalcResult')).toContainText('＝ 32符 → 40符');
    await expect(page.locator('#fuInput')).toHaveValue('40');
  });

  test('和了形の矛盾は理由を表示し、符を空欄にして計算しない', async ({ page }) => {
    await enableAutoFu(page);
    await setMeld(page, 0, 'minkan');
    await expect(page.locator('#fuCalcIssues')).toBeVisible();
    await expect(page.locator('#fuCalcIssues')).toContainText('明槓は鳴いて作る面子のため、門前では選べません。');
    await expect(page.locator('#fuInput')).toHaveValue('');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#resultSection')).toBeHidden();

    await radio(page, 'fuMenzen', 'open');
    await expect(page.locator('#fuCalcIssues')).toBeHidden();
    await expect(page.locator('#fuInput')).toHaveValue('30'); // 20 + 明槓（中張）8 = 28 → 30
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-name')).toHaveText('1翻30符');
  });

  test('1翻で20符になる和了形は計算を止め、2翻にすると20符で計算する', async ({ page }) => {
    await enableAutoFu(page);
    await radio(page, 'winType', 'tsumo');
    await expect(page.locator('#fuCalcIssues')).toContainText('1翻20符の和了はありません。');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#resultSection')).toBeHidden();

    await page.locator('[data-target="han"][data-action="increase"]').click();
    await expect(page.locator('#fuCalcIssues')).toBeHidden();
    await expect(page.locator('#fuInput')).toHaveValue('20');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-score')).toHaveText('700');
  });

  test('自動計算中に1翻へ下げてからオフにすると、符を1翻の有効な値に直す', async ({ page }) => {
    await enableAutoFu(page);
    await page.locator('[data-target="han"][data-action="increase"]').click(); // 2翻
    await radio(page, 'winType', 'tsumo');
    await expect(page.locator('#fuInput')).toHaveValue('20');
    await page.locator('[data-target="han"][data-action="decrease"]').click(); // 1翻
    await expect(page.locator('#fuCalcIssues')).toContainText('1翻20符の和了はありません。');
    await enableAutoFu(page); // オフ
    await expect(page.locator('#fuInput')).toHaveValue('30');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-name')).toHaveText('1翻30符');
  });

  test('手動入力で和了形が矛盾したまま役選択へ切り替え、自動計算をオフにすると符が戻る', async ({ page }) => {
    const warnings = [];
    page.on('console', message => { if (message.type() === 'warning') warnings.push(message.text()); });
    await enableAutoFu(page);
    await setMeld(page, 0, 'minkan');
    await expect(page.locator('#fuInput')).toHaveValue('');
    await radio(page, 'inputMode', 'yaku');
    await selectYaku(page, '立直');
    await expect(page.locator('#fuYakuInput')).toHaveValue('');
    await enableAutoFu(page); // オフ
    await expect(page.locator('#fuYakuInput')).toHaveValue('30');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-name')).toHaveText('1翻30符');
    expect(warnings.filter(text => text.includes('Invalid fu value'))).toEqual([]);
  });

  test('5翻以上は符を使わないので、和了形に矛盾があっても計算できる', async ({ page }) => {
    await enableAutoFu(page);
    for (let i = 0; i < 4; i++) await page.locator('[data-target="han"][data-action="increase"]').click();
    await setMeld(page, 0, 'minkan');
    await expect(page.locator('#fuCalcIssues')).toBeHidden();
    await expect(page.locator('#fuCalcResult')).toHaveText('5翻以上は符を使わないため、自動計算の符は使いません。');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-name')).toHaveText('満貫');
  });

  test('役選択: 自動符を使い、七対子・平和を選んだときは固定符を優先する', async ({ page }) => {
    await enableAutoFu(page);
    await radio(page, 'inputMode', 'yaku');
    await selectYaku(page, '立直');
    await page.locator('#fuPair').selectOption('yakuhai');
    await expect(page.locator('#fuYakuInput')).toHaveValue('40'); // 20 + 10 + 2 = 32 → 40
    for (const button of fuButtons(page, 'fuYaku')) await expect(button).toBeDisabled();

    await selectYaku(page, '七対子');
    await expect(page.locator('#fuYakuInput')).toHaveValue('25');
    await expect(page.locator('#fuCalcResult')).toHaveText('七対子を選んでいるため、符は25符に固定します（自動計算は使いません）。');
    await selectYaku(page, '七対子');
    await expect(page.locator('#fuYakuInput')).toHaveValue('40');

    await page.locator('#fuPair').selectOption('plain');
    await radio(page, 'winType', 'tsumo');
    await selectYaku(page, '平和');
    await selectYaku(page, '門前清自摸和');
    await expect(page.locator('#fuYakuInput')).toHaveValue('20');
    await expect(page.locator('#fuCalcResult')).toContainText('平和を選んでいるため');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-name')).toHaveText('3翻20符');
  });

  test('役選択: 役の選択が無効なあいだは自動符を入れず、計算もしない', async ({ page }) => {
    await enableAutoFu(page);
    await radio(page, 'inputMode', 'yaku');
    await selectYaku(page, '立直');
    await page.locator('#fuWait').selectOption('tanki');
    await expect(page.locator('#fuYakuInput')).toHaveValue('40');
    await page.locator('[data-target="uraDora"][data-action="increase"]').click();
    await selectYaku(page, '立直'); // 立直を外すと裏ドラが残り、役の選択が無効になる
    await expect(page.locator('#yakuValidationErrors')).toBeVisible();
    await expect(page.locator('#fuYakuInput')).toHaveValue('');
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#resultSection')).toBeHidden();
  });

  test('リセットで自動計算をオフにして和了形を初期値に戻す', async ({ page }) => {
    await enableAutoFu(page);
    await setMeld(page, 2, 'ankan', true);
    await page.locator('#fuPair').selectOption('doubleWind');
    await expect(page.locator('#fuInput')).toHaveValue('70'); // 20 + 10 + 32 + 2 = 64 → 70
    await page.locator('#resetBtn').click();
    await expect(page.locator('#fuAutoToggle')).not.toBeChecked();
    await expect(page.locator('#fuCalcFields')).toBeHidden();
    await expect(page.locator('#fuInput')).toHaveValue('30');
    for (const button of fuButtons(page, 'fu')) await expect(button).toBeEnabled();
    await enableAutoFu(page);
    await expect(page.locator('#fuMeldType2')).toHaveValue('shuntsu');
    await expect(page.locator('#fuMeldTerminal2')).not.toBeChecked();
    await expect(page.locator('#fuPair')).toHaveValue('plain');
    await expect(page.locator('#fuInput')).toHaveValue('30');
  });

  test('スマホ幅でパネルを開いても横スクロールが出ず、選択欄は44px以上', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await enableAutoFu(page);
    await expect(page.locator('#fuCalcFields')).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);
    for (const id of ['#fuWait', '#fuPair', '#fuMeldType0']) {
      const box = await page.locator(id).boundingBox();
      expect(box.height, id).toBeGreaterThanOrEqual(44);
    }
  });
});
