import { test, expect } from '@playwright/test';
import { setHanValue, setFuValue, setFuValueForYakuMode } from './test-utils.js';

test.describe('麻雀点数計算機 計算機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('手動入力モード: 子のロン計算', async ({ page }) => {
    // 手動入力モードを選択
    await page.locator('label:has(input[name="inputMode"][value="manual"])').click();
    
    // 子・ロンを選択
    await page.locator('label:has(input[name="winType"][value="ron"])').click();
    await page.locator('label:has(input[name="playerType"][value="child"])').click();
    
    // 1翻30符の計算
    await setHanValue(page, 1);
    await setFuValue(page, 30);
    await page.locator('#calculateBtn').click();
    
    await expect(page.locator('#resultSection')).toBeVisible();
    await expect(page.locator('#mainResult')).toContainText('1,000点');
  });

  test('手動入力モード: 子のツモ計算', async ({ page }) => {
    // 手動入力モードを選択
    await page.locator('label:has(input[name="inputMode"][value="manual"])').click();
    
    // 子・ツモを選択
    await page.locator('label:has(input[name="winType"][value="tsumo"])').click();
    await page.locator('label:has(input[name="playerType"][value="child"])').click();
    
    // 1翻30符の計算
    await setHanValue(page, 1);
    await setFuValue(page, 30);
    await page.locator('#calculateBtn').click();
    
    await expect(page.locator('#resultSection')).toBeVisible();
    await expect(page.locator('#mainResult')).toContainText('300/500');
  });

  test('手動入力モード: 親のロン計算', async ({ page }) => {
    // 手動入力モードを選択
    await page.locator('label:has(input[name="inputMode"][value="manual"])').click();
    
    // 親・ロンを選択
    await page.locator('label:has(input[name="winType"][value="ron"])').click();
    await page.locator('label:has(input[name="playerType"][value="parent"])').click();
    
    // 1翻30符の計算
    await setHanValue(page, 1);
    await setFuValue(page, 30);
    await page.locator('#calculateBtn').click();
    
    await expect(page.locator('#resultSection')).toBeVisible();
    await expect(page.locator('#mainResult')).toContainText('1,500点');
  });

  test('手動入力モード: 親のツモ計算', async ({ page }) => {
    // 手動入力モードを選択
    await page.locator('label:has(input[name="inputMode"][value="manual"])').click();
    
    // 親・ツモを選択
    await page.locator('label:has(input[name="winType"][value="tsumo"])').click();
    await page.locator('label:has(input[name="playerType"][value="parent"])').click();
    
    // 1翻30符の計算
    await setHanValue(page, 1);
    await setFuValue(page, 30);
    await page.locator('#calculateBtn').click();
    
    await expect(page.locator('#resultSection')).toBeVisible();
    await expect(page.locator('#mainResult')).toContainText('500');
  });

  test('手動入力モード: 満貫計算', async ({ page }) => {
    // 手動入力モードを選択
    await page.locator('label:has(input[name="inputMode"][value="manual"])').click();
    
    // 子・ロンを選択
    await page.locator('label:has(input[name="winType"][value="ron"])').click();
    await page.locator('label:has(input[name="playerType"][value="child"])').click();
    
    // 5翻の計算（満貫）
    await setHanValue(page, 5);
    await setFuValue(page, 30);
    await page.locator('#calculateBtn').click();
    
    await expect(page.locator('#resultSection')).toBeVisible();
    await expect(page.locator('#mainResult')).toContainText('8,000点');
  });

  test('手動入力モード: 跳満計算', async ({ page }) => {
    // 手動入力モードを選択
    await page.locator('label:has(input[name="inputMode"][value="manual"])').click();
    
    // 子・ロンを選択
    await page.locator('label:has(input[name="winType"][value="ron"])').click();
    await page.locator('label:has(input[name="playerType"][value="child"])').click();
    
    // 6翻の計算（跳満）
    await setHanValue(page, 6);
    await setFuValue(page, 30);
    await page.locator('#calculateBtn').click();
    
    await expect(page.locator('#resultSection')).toBeVisible();
    await expect(page.locator('#mainResult')).toContainText('12,000点');
  });

  test('手動入力モード: 倍満計算', async ({ page }) => {
    // 手動入力モードを選択
    await page.locator('label:has(input[name="inputMode"][value="manual"])').click();
    
    // 子・ロンを選択
    await page.locator('label:has(input[name="winType"][value="ron"])').click();
    await page.locator('label:has(input[name="playerType"][value="child"])').click();
    
    // 8翻の計算（倍満）
    await setHanValue(page, 8);
    await setFuValue(page, 30);
    await page.locator('#calculateBtn').click();
    
    await expect(page.locator('#resultSection')).toBeVisible();
    await expect(page.locator('#mainResult')).toContainText('16,000点');
  });

  test('手動入力モード: 三倍満計算', async ({ page }) => {
    // 手動入力モードを選択
    await page.locator('label:has(input[name="inputMode"][value="manual"])').click();
    
    // 子・ロンを選択
    await page.locator('label:has(input[name="winType"][value="ron"])').click();
    await page.locator('label:has(input[name="playerType"][value="child"])').click();
    
    // 11翻の計算（三倍満）
    await setHanValue(page, 11);
    await setFuValue(page, 30);
    await page.locator('#calculateBtn').click();
    
    await expect(page.locator('#resultSection')).toBeVisible();
    await expect(page.locator('#mainResult')).toContainText('24,000点');
  });

  test('手動入力モード: 役満計算', async ({ page }) => {
    // 手動入力モードを選択
    await page.locator('label:has(input[name="inputMode"][value="manual"])').click();
    
    // 子・ロンを選択
    await page.locator('label:has(input[name="winType"][value="ron"])').click();
    await page.locator('label:has(input[name="playerType"][value="child"])').click();
    
    // 13翻の計算（役満）
    await setHanValue(page, 13);
    await setFuValue(page, 30);
    await page.locator('#calculateBtn').click();
    
    await expect(page.locator('#resultSection')).toBeVisible();
    await expect(page.locator('#mainResult')).toContainText('32,000点');
  });

  test('符数の境界値テスト', async ({ page }) => {
    // 手動入力モードを選択
    await page.locator('label:has(input[name="inputMode"][value="manual"])').click();
    
    // 子・ロンを選択
    await page.locator('label:has(input[name="winType"][value="ron"])').click();
    await page.locator('label:has(input[name="playerType"][value="child"])').click();
    
    // 1翻110符の計算（翻数を先に設定）
    await setHanValue(page, 1);
    await setFuValue(page, 110);
    await page.locator('#calculateBtn').click();
    
    await expect(page.locator('#resultSection')).toBeVisible();
    await expect(page.locator('#mainResult')).toContainText('3,600点');
    
    // 翻数を2翻に変更してから20符をテスト（2翻では20符が有効）
    await setHanValue(page, 2);
    await setFuValue(page, 20);
    await page.locator('#calculateBtn').click();
    
    await expect(page.locator('#resultSection')).toBeVisible();
    await expect(page.locator('#mainResult')).toContainText('1,300点');
  });

  test('詳細表示の切り替え', async ({ page }) => {
    // 手動入力モードを選択
    await page.locator('label:has(input[name="inputMode"][value="manual"])').click();
    
    // 計算を実行
    await setHanValue(page, 2);
    await setFuValue(page, 40);
    await page.locator('#calculateBtn').click();
    
    // 結果が表示される
    await expect(page.locator('#resultSection')).toBeVisible();
    
    // 詳細表示ボタンをクリック
    await page.locator('#toggleDetailBtn').click();
    
    // 詳細結果が表示される
    await expect(page.locator('#detailResult')).toBeVisible();
    
    // 詳細表示ボタンをもう一度クリック
    await page.locator('#toggleDetailBtn').click();
    
    // 詳細結果が非表示になる
    await expect(page.locator('#detailResult')).toBeHidden();
  });

  test('役選択モードでの計算', async ({ page }) => {
    // 役選択モードを選択
    await page.locator('label:has(input[name="inputMode"][value="yaku"])').click();
    
    // 役選択セクションが表示される
    await expect(page.locator('.yaku-input-section')).toBeVisible();
    
    // 子・ロンを選択
    await page.locator('label:has(input[name="winType"][value="ron"])').click();
    await page.locator('label:has(input[name="playerType"][value="child"])').click();
    
    // 符数を設定（役選択モード用）
    await setFuValueForYakuMode(page, 30);
    
    // 役を選択（立直） - ラベル要素をクリック
    const reachLabel = page.locator('label.yaku-checkbox:has(input[value="立直"])');
    await expect(reachLabel).toBeVisible();
    await reachLabel.click();
    
    // 役が選択されたことを確認
    await expect(page.locator('#totalHan')).toContainText('1翻');
    
    // 計算を実行
    await page.locator('#calculateBtn').click();
    
    // 結果が表示される
    await expect(page.locator('#resultSection')).toBeVisible();
  });

  test('入力値の境界値チェック', async ({ page }) => {
    // 手動入力モードを選択
    await page.locator('label:has(input[name="inputMode"][value="manual"])').click();
    
    // 翻数を1翻に設定（符数変更が可能な状態にする）
    await setHanValue(page, 1);
    await expect(page.locator('#hanInput')).toHaveValue('1');
    
    // 符数の最大値テスト（1翻で110符）
    await setFuValue(page, 110);
    await expect(page.locator('#fuInput')).toHaveValue('110');
    
    // 符数を30符に戻す
    await setFuValue(page, 30);
    await expect(page.locator('#fuInput')).toHaveValue('30');
    
    // 翻数の最大値テスト（符数設定後に翻数を変更）
    await setHanValue(page, 13);
    await expect(page.locator('#hanInput')).toHaveValue('13');
  });
});