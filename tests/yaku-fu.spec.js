import { test as base, expect } from '@playwright/test';
import { setFuValue } from './test-utils.js';

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
    expect(errors, '役と符数の購読処理が例外なく完了する').toEqual([]);
  }, { auto: true }],
});

const selectYaku = (page, name) => page.locator(`label.yaku-checkbox:has(input[value="${name}"])`).click();
const selectMode = (page, mode) => page.locator(`label:has(input[name="inputMode"][value="${mode}"])`).click();

async function expectFu(page, fu, disabled) {
  await expect(page.locator('#fuYakuInput')).toHaveValue(String(fu));
  for (const action of ['increase', 'decrease']) {
    const button = page.locator(`[data-target="fuYaku"][data-action="${action}"]`);
    if (disabled) {
      await expect(button).toBeDisabled();
      await expect(button).toHaveClass(/disabled/);
    } else {
      await expect(button).toBeEnabled();
      await expect(button).not.toHaveClass(/disabled/);
    }
  }
}

async function expectScore(page, han, score) {
  await expect(page.locator('#totalHan')).toHaveText(`${han}翻`);
  await expectFu(page, 25, true);
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#resultSection')).toBeVisible();
  await expect(page.locator('#mainResult .result-score')).toHaveText(score);
  await expect(page.locator('#mainResult .result-name')).toHaveText(han >= 5 ? '満貫' : `${han}翻25符`);
}

test.describe('役選択の固定符数の回帰テスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  const paymentCases = [
    { player: 'child', win: 'ron', initialFu: 30, han: 2, scores: ['1,600点', '3,200点', '6,400点'] },
    { player: 'parent', win: 'ron', initialFu: 70, han: 2, scores: ['2,400点', '4,800点', '9,600点'] },
    { player: 'child', win: 'tsumo', initialFu: 30, han: 3, scores: ['800/1600', '1600/3200', '2000/4000'] },
    { player: 'parent', win: 'tsumo', initialFu: 30, han: 3, scores: ['1600', '3200', '4000'] },
  ];

  for (const { player, win, initialFu, han, scores } of paymentCases) {
    test(`七対子の25符で計算し、両立役の追加・解除でも保持する ${player}/${win}`, async ({ page }) => {
      await setFuValue(page, initialFu);
      await page.locator(`label:has(input[name="playerType"][value="${player}"])`).click();
      await page.locator(`label:has(input[name="winType"][value="${win}"])`).click();
      await selectMode(page, 'yaku');
      await expect(page.locator('#fuYakuInput')).toHaveValue(String(initialFu));
      if (win === 'tsumo') await selectYaku(page, '門前清自摸和');
      await selectYaku(page, '七対子');
      await expectScore(page, han, scores[0]);
      await selectYaku(page, '立直');
      await expectScore(page, han + 1, scores[1]);
      await selectYaku(page, '一発');
      await expectScore(page, han + 2, scores[2]);
      await selectYaku(page, '一発');
      await expectScore(page, han + 1, scores[1]);
      await selectYaku(page, '立直');
      await expectScore(page, han, scores[0]);
    });
  }

  test('七対子の解除で通常の符数に戻り、再選択で25符に固定する', async ({ page }) => {
    const normalYaku = ['立直', '一発', '断幺九', '河底撈魚'];
    for (let remainingHan = 0; remainingHan <= 4; remainingHan++) {
      await page.locator('#resetBtn').click();
      await selectMode(page, 'yaku');
      for (const name of normalYaku.slice(0, remainingHan)) await selectYaku(page, name);
      await selectYaku(page, '七対子');
      await expectFu(page, 25, true);
      await selectYaku(page, '七対子');
      await expect(page.locator('#totalHan')).toHaveText(`${remainingHan}翻`);
      await expectFu(page, 30, false);
      await page.locator('[data-target="fuYaku"][data-action="increase"]').click();
      await expectFu(page, 40, false);
      await page.locator('[data-target="fuYaku"][data-action="decrease"]').click();
      await expectFu(page, 30, false);
      await selectYaku(page, '七対子');
      await expectFu(page, 25, true);
    }

    await selectMode(page, 'manual');
    await expect(page.locator('#fuInput')).toHaveValue('25');
    await selectMode(page, 'yaku');
    await expectFu(page, 25, true);
    // 河底撈魚はロン限定。固定符数の切り替え確認は矛盾のない選択で行う。
    await selectYaku(page, '河底撈魚');
    await page.locator('label:has(input[name="winType"][value="tsumo"])').click();
    await expectFu(page, 25, true);
    await page.locator('label:has(input[name="winType"][value="ron"])').click();
    await expectFu(page, 25, true);
  });

  test('七対子解除後も5翻以上の制限を維持し、モード変更とリセットができる', async ({ page }) => {
    await selectMode(page, 'yaku');
    for (const name of ['七対子', '混一色', '立直', '一発']) await selectYaku(page, name);
    await expectFu(page, 25, true);
    await selectYaku(page, '七対子');
    await expect(page.locator('#totalHan')).toHaveText('5翻');
    await expectFu(page, 25, true);
    await selectMode(page, 'manual');
    await selectMode(page, 'yaku');
    await expectFu(page, 25, true);
    await selectYaku(page, '一発');
    await expect(page.locator('#totalHan')).toHaveText('4翻');
    await expectFu(page, 30, false);
    await page.locator('[data-target="fuYaku"][data-action="increase"]').click();
    await expectFu(page, 40, false);
    await selectYaku(page, '七対子');
    await expectFu(page, 25, true);
    await page.locator('#resetBtn').click();
    await expect(page.locator('#fuInput')).toHaveValue('30');
    await expect(page.locator('#fuYakuInput')).toHaveValue('30');
    await expect(page.locator('input[name="inputMode"][value="manual"]')).toBeChecked();
    await selectMode(page, 'yaku');
    await expectFu(page, 30, false);
    await expect(page.locator('#totalHan')).toHaveText('0翻');
    await expect(page.locator('.yaku-checkbox input:checked')).toHaveCount(0);
  });

  test('平和の固定符数はロン30符・ツモ20符で、解除時に通常入力へ戻る', async ({ page }) => {
    await setFuValue(page, 70);
    await selectMode(page, 'yaku');
    await selectYaku(page, '平和');
    await expectFu(page, 30, true);
    await page.locator('label:has(input[name="winType"][value="tsumo"])').click();
    await selectYaku(page, '門前清自摸和');
    await expectFu(page, 20, true);
    await page.locator('#calculateBtn').click();
    await expect(page.locator('#mainResult .result-score')).toHaveText('700');
    await selectYaku(page, '門前清自摸和');
    await page.locator('label:has(input[name="winType"][value="ron"])').click();
    await expectFu(page, 30, true);
    await selectYaku(page, '平和');
    await expectFu(page, 30, false);
  });

  test('選択役が変われば合計翻数が同じでもStateManagerと表示に固定符数を適用する', async ({ page }) => {
    // 実際の購読処理に独立したStateManagerを接続し、DOMだけでなく状態値も検証する。
    const states = await page.evaluate(async () => {
      const { createStateManager } = await import('/js/modules/stateManager.js');
      const { setupStateSubscriptions, unsubscribeAll } = await import('/js/modules/stateSubscriptions.js');
      const { yakuData } = await import('/js/data/yakuData.js');
      const stateManager = createStateManager({ currentFu: 30 });
      const domElements = Object.fromEntries(
        ['fuInput', 'fuYakuInput', 'totalHan', 'selectedYakuList'].map(id => [id, document.getElementById(id)])
      );
      const subscriptions = setupStateSubscriptions(stateManager, domElements, yakuData);
      const snapshots = [];
      const capture = () => snapshots.push({
        fu: stateManager.getState().currentFu,
        display: domElements.fuYakuInput.value,
        disabled: [...document.querySelectorAll('[data-target="fuYaku"]')].every(btn => btn.disabled),
      });
      stateManager.setInputMode('yaku');
      stateManager.setSelectedYaku(new Set(['ダブル立直']));
      stateManager.setSelectedYaku(new Set(['七対子'])); // 合計は2翻のまま
      capture();
      stateManager.setSelectedYaku(new Set(['立直']));
      capture();
      stateManager.setFu(70);
      stateManager.addYaku('七対子');
      capture();
      stateManager.setInputMode('manual');
      stateManager.setFu(70);
      stateManager.setInputMode('yaku');
      capture();
      unsubscribeAll(subscriptions);
      return snapshots;
    });
    expect(states).toEqual([
      { fu: 25, display: '25', disabled: true },
      { fu: 30, display: '30', disabled: false },
      { fu: 25, display: '25', disabled: true },
      { fu: 25, display: '25', disabled: true },
    ]);
  });
});
