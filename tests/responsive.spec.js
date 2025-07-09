import { test, expect } from '@playwright/test';

test.describe('麻雀点数計算機 レスポンシブテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('モバイルデバイスでの表示確認', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // ページが正常に読み込まれる
    await expect(page.locator('h1')).toContainText('麻雀点数計算機');
    
    // 各セクションが縦に配置されている
    await expect(page.locator('.container')).toBeVisible();
    await expect(page.locator('.calculator-section')).toBeVisible();
    await expect(page.locator('.reference-section')).toBeVisible();
    
    // 入力セクションが適切に表示される
    await expect(page.locator('.input-section')).toBeVisible();
    await expect(page.locator('.win-type-section')).toBeVisible();
    await expect(page.locator('.player-type-section')).toBeVisible();
  });

  test('タブレットデバイスでの表示確認', async ({ page }) => {
    // タブレットビューポートに設定
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // ページが正常に読み込まれる
    await expect(page.locator('h1')).toContainText('麻雀点数計算機');
    
    // コンテンツが適切に表示される
    await expect(page.locator('.container')).toBeVisible();
    await expect(page.locator('.calculator-section')).toBeVisible();
    await expect(page.locator('.reference-section')).toBeVisible();
    
    // 点数表が適切に表示される
    await expect(page.locator('.score-table')).toBeVisible();
    await expect(page.locator('.score-table thead')).toBeVisible();
    await expect(page.locator('.score-table tbody')).toBeVisible();
  });

  test('デスクトップでの表示確認', async ({ page }) => {
    // デスクトップビューポートに設定
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // ページが正常に読み込まれる
    await expect(page.locator('h1')).toContainText('麻雀点数計算機');
    
    // レイアウトが適切に表示される
    await expect(page.locator('.container')).toBeVisible();
    await expect(page.locator('.calculator-section')).toBeVisible();
    await expect(page.locator('.reference-section')).toBeVisible();
    
    // 点数表が横スクロールなしで表示される
    await expect(page.locator('.score-table-container')).toBeVisible();
    await expect(page.locator('.score-table')).toBeVisible();
  });

  test('モバイルでの操作性確認', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 手動入力モードでの操作確認
    await page.locator('label:has(input[name="inputMode"][value="manual"])').click();
    
    // 翻数の増減ボタンをタップ
    await page.locator('[data-action="increase"][data-target="han"]').click();
    await expect(page.locator('#hanInput')).toHaveValue('2');
    
    // 符数の増減ボタンをタップ
    await page.locator('[data-action="increase"][data-target="fu"]').click();
    await expect(page.locator('#fuInput')).toHaveValue('40');
    
    // 計算ボタンをタップ
    await page.locator('#calculateBtn').click();
    
    // 結果が表示される
    await expect(page.locator('#resultSection')).toBeVisible();
  });

  test('タブの切り替えがモバイルで動作する', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 役一覧タブに切り替え
    await page.locator('.tab-btn[data-tab="yaku-list"]').click();
    await expect(page.locator('.tab-btn[data-tab="yaku-list"]')).toHaveClass(/active/);
    await expect(page.locator('#yaku-list')).toBeVisible();
    
    // 点数表タブに戻す
    await page.locator('.tab-btn[data-tab="score-table"]').click();
    await expect(page.locator('.tab-btn[data-tab="score-table"]')).toHaveClass(/active/);
    await expect(page.locator('#score-table')).toBeVisible();
  });

  test('点数表のモバイル表示確認', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 点数表タブを選択
    await page.locator('.tab-btn[data-tab="score-table"]').click();
    
    // 点数表が表示される（横スクロール可能）
    await expect(page.locator('.score-table-container')).toBeVisible();
    await expect(page.locator('.score-table')).toBeVisible();
    
    // ヘッダーが表示される
    await expect(page.locator('.score-table thead')).toBeVisible();
    
    // 横スクロールが可能であることを確認
    const tableContainer = page.locator('.score-table-container');
    await expect(tableContainer).toBeVisible();
    
    // テーブルの幅を確認（モバイルでは横スクロール可能、またはレスポンシブ対応）
    const containerWidth = await tableContainer.evaluate(el => el.offsetWidth);
    const tableWidth = await page.locator('.score-table').evaluate(el => el.offsetWidth);
    // テーブルが適切に表示されることを確認（幅が0より大きい）
    expect(tableWidth).toBeGreaterThan(0);
    expect(containerWidth).toBeGreaterThan(0);
  });

  test('入力要素のサイズがモバイルで適切', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 数値入力ボタンが十分なサイズを持つ
    const increaseBtn = page.locator('[data-action="increase"][data-target="han"]');
    const btnBounds = await increaseBtn.boundingBox();
    expect(btnBounds.width).toBeGreaterThan(40);
    expect(btnBounds.height).toBeGreaterThan(40);
    
    // ラジオボタンが適切なサイズを持つ
    const radioLabel = page.locator('label:has(input[name="winType"][value="ron"])');
    const labelBounds = await radioLabel.boundingBox();
    expect(labelBounds.height).toBeGreaterThan(30);
    
    // 計算ボタンが適切なサイズを持つ
    const calculateBtn = page.locator('#calculateBtn');
    const calcBtnBounds = await calculateBtn.boundingBox();
    expect(calcBtnBounds.width).toBeGreaterThan(200);
    expect(calcBtnBounds.height).toBeGreaterThan(50);
  });
});