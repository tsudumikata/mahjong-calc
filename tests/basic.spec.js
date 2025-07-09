import { test, expect } from '@playwright/test';
import { setHanValue, setFuValue } from './test-utils.js';

test.describe('麻雀点数計算機 基本機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ページが正常に読み込まれる', async ({ page }) => {
    // ページタイトルの確認
    await expect(page).toHaveTitle(/麻雀点数計算機/);
    
    // メインヘッダーの確認
    await expect(page.locator('h1')).toContainText('麻雀点数計算機');
    
    // サブタイトルの確認
    await expect(page.locator('.subtitle')).toContainText('リーチ麻雀の点数を素早く計算');
  });

  test('入力方式の切り替えが動作する', async ({ page }) => {
    // 手動入力モードがデフォルトで選択されている
    await expect(page.locator('input[name="inputMode"][value="manual"]')).toBeChecked();
    
    // 役選択モードに切り替え（ラベルをクリック）
    await page.locator('label:has(input[name="inputMode"][value="yaku"])').click();
    
    // 役選択セクションが表示される
    await expect(page.locator('.yaku-input-section')).toBeVisible();
    
    // 手動入力セクションが非表示になる
    await expect(page.locator('.manual-input-section')).toBeHidden();
  });

  test('手動入力モードでの基本操作', async ({ page }) => {
    // 手動入力モードが選択されている
    await page.locator('label:has(input[name="inputMode"][value="manual"])').click();
    
    // 翻数の増減ボタンが動作する
    const hanInput = page.locator('#hanInput');
    await expect(hanInput).toHaveValue('1');
    
    await page.locator('[data-action="increase"][data-target="han"]').click();
    await expect(hanInput).toHaveValue('2');
    
    await page.locator('[data-action="decrease"][data-target="han"]').click();
    await expect(hanInput).toHaveValue('1');
    
    // 符数の増減ボタンが動作する
    const fuInput = page.locator('#fuInput');
    await expect(fuInput).toHaveValue('30');
    
    await page.locator('[data-action="increase"][data-target="fu"]').click();
    await expect(fuInput).toHaveValue('40');
    
    await page.locator('[data-action="decrease"][data-target="fu"]').click();
    await expect(fuInput).toHaveValue('30');
  });

  test('和了方法の切り替えが動作する', async ({ page }) => {
    // ロンがデフォルトで選択されている
    await expect(page.locator('input[name="winType"][value="ron"]')).toBeChecked();
    
    // ツモに切り替え
    await page.locator('label:has(input[name="winType"][value="tsumo"])').click();
    await expect(page.locator('input[name="winType"][value="tsumo"]')).toBeChecked();
    
    // ロンに戻す
    await page.locator('label:has(input[name="winType"][value="ron"])').click();
    await expect(page.locator('input[name="winType"][value="ron"]')).toBeChecked();
  });

  test('親子の切り替えが動作する', async ({ page }) => {
    // 親がデフォルトで選択されている
    await expect(page.locator('input[name="playerType"][value="parent"]')).toBeChecked();
    
    // 子に切り替え
    await page.locator('label:has(input[name="playerType"][value="child"])').click();
    await expect(page.locator('input[name="playerType"][value="child"]')).toBeChecked();
    
    // 親に戻す
    await page.locator('label:has(input[name="playerType"][value="parent"])').click();
    await expect(page.locator('input[name="playerType"][value="parent"]')).toBeChecked();
  });

  test('計算機能の基本動作', async ({ page }) => {
    // 手動入力モードで計算を実行
    await page.locator('label:has(input[name="inputMode"][value="manual"])').click();
    
    // 1翻30符の親ロンを設定
    await setHanValue(page, 1);
    await setFuValue(page, 30);
    await page.locator('label:has(input[name="winType"][value="ron"])').click();
    await page.locator('label:has(input[name="playerType"][value="parent"])').click();
    
    // 計算ボタンをクリック
    await page.locator('#calculateBtn').click();
    
    // 結果が表示される
    await expect(page.locator('#resultSection')).toBeVisible();
    await expect(page.locator('#mainResult')).toContainText('1,500点');
  });

  test('参考情報タブの切り替え', async ({ page }) => {
    // 点数表タブがデフォルトで選択されている
    await expect(page.locator('.tab-btn[data-tab="score-table"]')).toHaveClass(/active/);
    await expect(page.locator('#score-table')).toBeVisible();
    
    // 役一覧タブに切り替え
    await page.locator('.tab-btn[data-tab="yaku-list"]').click();
    await expect(page.locator('.tab-btn[data-tab="yaku-list"]')).toHaveClass(/active/);
    await expect(page.locator('#yaku-list')).toBeVisible();
    
    // 点数表タブに戻す
    await page.locator('.tab-btn[data-tab="score-table"]').click();
    await expect(page.locator('.tab-btn[data-tab="score-table"]')).toHaveClass(/active/);
    await expect(page.locator('#score-table')).toBeVisible();
  });

  test('点数表が正しく表示される', async ({ page }) => {
    // 点数表タブを選択
    await page.locator('.tab-btn[data-tab="score-table"]').click();
    
    // 点数表のヘッダーが表示される
    await expect(page.locator('.score-table thead')).toBeVisible();
    await expect(page.locator('.score-table thead tr th')).toContainText(['翻数', '符数', '子・ロン', '子・ツモ', '親・ロン', '親・ツモ']);
    
    // 点数表のボディが表示される
    await expect(page.locator('.score-table tbody')).toBeVisible();
  });
});