import { test, expect } from '@playwright/test';
import { calculateScoreResult } from '../js/modules/calculator.js';
import { validFuByHan } from '../js/data/constants.js';
import { validateAndAdjustFu } from '../js/modules/validator.js';
import { setHanValue, setFuValue } from './test-utils.js';

const payments = [
  { playerType: 'child', winType: 'ron', title: '子・ロン', below: '7,700点', mangan: '8,000点', rawMangan: 8000 },
  { playerType: 'child', winType: 'tsumo', title: '子・ツモ', below: '2000/3900', mangan: '2000/4000', rawMangan: '2000/4000' },
  { playerType: 'parent', winType: 'ron', title: '親・ロン', below: '11,600点', mangan: '12,000点', rawMangan: 12000 },
  { playerType: 'parent', winType: 'tsumo', title: '親・ツモ', below: '3900', mangan: '4000', rawMangan: '4000' },
];

const boundaries = [
  { han: 3, fu: 60, mangan: false },
  { han: 3, fu: 70, mangan: true },
  { han: 3, fu: 110, mangan: true },
  { han: 4, fu: 30, mangan: false },
  { han: 4, fu: 40, mangan: true },
  { han: 4, fu: 110, mangan: true },
];

test.describe('満貫の翻・符境界の回帰テスト', () => {
  test('満貫になる全対応符数を保持し、親子・ロンツモの点数を返す', () => {
    const supportedManganFu = [
      { han: 3, values: [70, 80, 90, 100, 110] },
      { han: 4, values: [40, 50, 60, 70, 80, 90, 100, 110] },
    ];
    for (const { han, values } of supportedManganFu) {
      for (const fu of values) {
        expect(validateAndAdjustFu(han, fu, validFuByHan)).toBe(fu);
        for (const { playerType, winType, rawMangan } of payments) {
          expect(calculateScoreResult(han, fu, winType, playerType)).toEqual({
            score: rawMangan, name: '満貫', han, fu, winType, playerType,
          });
        }
      }
    }
  });

  for (const payment of payments) {
    test(`手動入力の翻数変更で符数を保持して満貫境界を計算する ${payment.title}`, async ({ page }) => {
      await page.goto('/');
      await page.locator(`label:has(input[name="playerType"][value="${payment.playerType}"])`).click();
      await page.locator(`label:has(input[name="winType"][value="${payment.winType}"])`).click();
      for (const { han, fu, mangan } of boundaries) {
        // 2翻で符数を設定してから翻数を上げる（以前の切り下げ経路）。
        await setHanValue(page, 2);
        await setFuValue(page, fu);
        await setHanValue(page, han);
        await expect(page.locator('#fuInput')).toHaveValue(String(fu));
        await page.locator('#calculateBtn').click();
        await expect(page.locator('#mainResult .result-title')).toHaveText(payment.title);
        await expect(page.locator('#mainResult .result-score')).toHaveText(mangan ? payment.mangan : payment.below);
        await expect(page.locator('#mainResult .result-name')).toHaveText(mangan ? '満貫' : `${han}翻${fu}符`);
      }
    });
  }

  for (const { han, fu, yaku } of [
    { han: 3, fu: 70, yaku: ['混一色'] },
    { han: 4, fu: 40, yaku: ['混一色', '立直'] },
  ]) {
    test(`役選択の合計翻数変更で${han}翻${fu}符を満貫として保持する`, async ({ page }) => {
      await page.goto('/');
      await setFuValue(page, fu);
      await page.locator('label:has(input[name="playerType"][value="child"])').click();
      await page.locator('label:has(input[name="inputMode"][value="yaku"])').click();
      for (const name of yaku) {
        await page.locator(`label.yaku-checkbox:has(input[value="${name}"])`).click();
      }
      await expect(page.locator('#totalHan')).toHaveText(`${han}翻`);
      await expect(page.locator('#fuYakuInput')).toHaveValue(String(fu));
      await page.locator('#calculateBtn').click();
      await expect(page.locator('#mainResult .result-score')).toHaveText('8,000点');
      await expect(page.locator('#mainResult .result-name')).toHaveText('満貫');
    });
  }
});
