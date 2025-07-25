import { test, expect } from '@playwright/test';
import { setHanValue, setFuValue, setFuValueForYakuMode } from './test-utils.js';

// デフォルト値定数
const DEFAULT_VALUES = {
  han: '1',
  fu: '30',
  winType: 'ron',
  playerType: 'parent',
  inputMode: 'manual'
};

// テスト用役データ定数（実際のアプリケーションデータと一致）
const TEST_YAKU = {
  RIICHI: '立直',           // "リーチ"ではなく"立直"
  TANYAO: '断幺九',         // "断ヤオ九"ではなく"断幺九" 
  IPPEIKO: '一盃口',
  MENZEN_TSUMO: '門前清自摸和',
  YAKUHAI: '役牌',          // "ドラ"の代替として実在する役を使用
  PINFU: '平和'             // 追加のテスト用役
};

test.describe('リセット機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('リセットボタンが存在し、クリック可能である', async ({ page }) => {
    // リセットボタンの存在確認
    const resetBtn = page.locator('#resetBtn');
    await expect(resetBtn).toBeVisible();
    await expect(resetBtn).toBeEnabled();
    await expect(resetBtn).toContainText('リセット');
  });

  test('手動入力モードでのリセット動作 - 翻数と符数の初期化', async ({ page }) => {
    // 手動入力モードを確認
    await page.locator('label:has(input[name="inputMode"][value="manual"])').click();
    
    // 翻数を3、符数を50に変更
    await setHanValue(page, 3);
    await setFuValue(page, 50);
    
    // 変更が正しく反映されているか確認
    await expect(page.locator('#hanInput')).toHaveValue('3');
    await expect(page.locator('#fuInput')).toHaveValue('50');
    
    // リセットボタンをクリック
    await page.locator('#resetBtn').click();
    
    // 初期値に戻っているか確認
    await expect(page.locator('#hanInput')).toHaveValue(DEFAULT_VALUES.han);
    await expect(page.locator('#fuInput')).toHaveValue(DEFAULT_VALUES.fu);
  });

  test('手動入力モードでのリセット動作 - 和了方法と親子の初期化', async ({ page }) => {
    // 手動入力モードを確認
    await page.locator('label:has(input[name="inputMode"][value="manual"])').click();
    
    // ツモと子に変更
    await page.locator('label:has(input[name="winType"][value="tsumo"])').click();
    await page.locator('label:has(input[name="playerType"][value="child"])').click();
    
    // 変更が正しく反映されているか確認
    await expect(page.locator('input[name="winType"][value="tsumo"]')).toBeChecked();
    await expect(page.locator('input[name="playerType"][value="child"]')).toBeChecked();
    
    // リセットボタンをクリック
    await page.locator('#resetBtn').click();
    
    // 初期値に戻っているか確認
    await expect(page.locator(`input[name="winType"][value="${DEFAULT_VALUES.winType}"]`)).toBeChecked();
    await expect(page.locator(`input[name="playerType"][value="${DEFAULT_VALUES.playerType}"]`)).toBeChecked();
  });

  test('役選択モードでのリセット動作 - 入力モードの初期化', async ({ page }) => {
    // 役選択モードに切り替え
    await page.locator('label:has(input[name="inputMode"][value="yaku"])').click();
    
    // 役選択セクションが表示されているか確認
    await expect(page.locator('.yaku-input-section')).toBeVisible();
    await expect(page.locator('.manual-input-section')).toBeHidden();
    
    // リセットボタンをクリック
    await page.locator('#resetBtn').click();
    
    // 手動入力モードに戻っているか確認
    await expect(page.locator(`input[name="inputMode"][value="${DEFAULT_VALUES.inputMode}"]`)).toBeChecked();
    await expect(page.locator('.manual-input-section')).toBeVisible();
    await expect(page.locator('.yaku-input-section')).toBeHidden();
  });

  test('役選択モードでのリセット動作 - 役選択のクリア', async ({ page }) => {
    // 役選択モードに切り替え
    await page.locator('label:has(input[name="inputMode"][value="yaku"])').click();
    
    // 役選択セクションの表示を待機
    await expect(page.locator('.yaku-input-section')).toBeVisible();
    
    // いくつかの役を選択（推奨セレクタでアクセス）
    const riichiCheckbox = page.locator(`label.yaku-checkbox:has(input[value="${TEST_YAKU.RIICHI}"])`);
    const ippeikoCheckbox = page.locator(`label.yaku-checkbox:has(input[value="${TEST_YAKU.IPPEIKO}"])`);
    
    // 役要素をクリックして選択
    await riichiCheckbox.click();
    await expect(riichiCheckbox.locator('input')).toBeChecked();
    
    await ippeikoCheckbox.click();
    await expect(ippeikoCheckbox.locator('input')).toBeChecked();
    
    // 符数も変更
    await setFuValueForYakuMode(page, 40);
    await expect(page.locator('#fuYakuInput')).toHaveValue('40');
    
    // リセットボタンをクリック
    await page.locator('#resetBtn').click();
    
    // 手動入力モードに戻り、すべてが初期化されているか確認
    await expect(page.locator(`input[name="inputMode"][value="${DEFAULT_VALUES.inputMode}"]`)).toBeChecked();
    await expect(page.locator('#fuInput')).toHaveValue(DEFAULT_VALUES.fu);
    
    // 選択された役の表示も初期化されているか確認（役選択モードに戻って確認）
    await page.locator('label:has(input[name="inputMode"][value="yaku"])').click();
    await expect(page.locator('#selectedYakuList')).toContainText('役を選択してください');
    await expect(page.locator('#totalHan')).toContainText('0翻');
  });

  test('計算結果表示後のリセット動作', async ({ page }) => {
    // 手動入力モードで計算を実行
    await page.locator('label:has(input[name="inputMode"][value="manual"])').click();
    
    // 2翻40符の親ロンを設定
    await setHanValue(page, 2);
    await setFuValue(page, 40);
    await page.locator('label:has(input[name="winType"][value="ron"])').click();
    await page.locator('label:has(input[name="playerType"][value="parent"])').click();
    
    // 計算ボタンをクリック
    await page.locator('#calculateBtn').click();
    
    // 結果が表示されることを確認
    await expect(page.locator('#resultSection')).toBeVisible();
    await expect(page.locator('#mainResult')).toContainText('3,900点');
    
    // リセットボタンをクリック
    await page.locator('#resetBtn').click();
    
    // 計算結果が非表示になり、入力値が初期化されることを確認
    await expect(page.locator('#resultSection')).toBeHidden();
    await expect(page.locator('#hanInput')).toHaveValue(DEFAULT_VALUES.han);
    await expect(page.locator('#fuInput')).toHaveValue(DEFAULT_VALUES.fu);
    await expect(page.locator(`input[name="winType"][value="${DEFAULT_VALUES.winType}"]`)).toBeChecked();
    await expect(page.locator(`input[name="playerType"][value="${DEFAULT_VALUES.playerType}"]`)).toBeChecked();
  });

  test('包括的なリセットテスト - 複数項目変更後の一括初期化', async ({ page }) => {
    // 手動入力モードで複数の項目を変更
    await page.locator('label:has(input[name="inputMode"][value="manual"])').click();
    await setHanValue(page, 5);
    await setFuValue(page, 60);
    await page.locator('label:has(input[name="winType"][value="tsumo"])').click();
    await page.locator('label:has(input[name="playerType"][value="child"])').click();
    
    // 役選択モードに切り替えて役を選択
    await page.locator('label:has(input[name="inputMode"][value="yaku"])').click();
    
    // 役選択セクションの表示を待機
    await expect(page.locator('.yaku-input-section')).toBeVisible();
    
    // 役を選択（推奨セレクタでアクセス）
    const tanyaoCheckbox = page.locator(`label.yaku-checkbox:has(input[value="${TEST_YAKU.TANYAO}"])`);
    await tanyaoCheckbox.click();
    
    // 符数も変更
    await setFuValueForYakuMode(page, 80);
    
    // 計算を実行
    await page.locator('#calculateBtn').click();
    
    // リセットボタンをクリック
    await page.locator('#resetBtn').click();
    
    // すべてが完全に初期化されていることを確認
    await expect(page.locator(`input[name="inputMode"][value="${DEFAULT_VALUES.inputMode}"]`)).toBeChecked();
    await expect(page.locator('#hanInput')).toHaveValue(DEFAULT_VALUES.han);
    await expect(page.locator('#fuInput')).toHaveValue(DEFAULT_VALUES.fu);
    await expect(page.locator(`input[name="winType"][value="${DEFAULT_VALUES.winType}"]`)).toBeChecked();
    await expect(page.locator(`input[name="playerType"][value="${DEFAULT_VALUES.playerType}"]`)).toBeChecked();
    await expect(page.locator('#resultSection')).toBeHidden();
    await expect(page.locator('.manual-input-section')).toBeVisible();
    await expect(page.locator('.yaku-input-section')).toBeHidden();
  });

  test('リセット後の各種ボタンの有効化状態確認', async ({ page }) => {
    // 役選択モードで特殊な状態を作成（5翻以上で符数ボタン無効化など）
    await page.locator('label:has(input[name="inputMode"][value="yaku"])').click();
    
    // 役選択セクションの表示を待機
    await expect(page.locator('.yaku-input-section')).toBeVisible();
    
    // 高翻数の役を選択（推奨セレクタでアクセス）
    const menzenchintsumoCheckbox = page.locator(`label.yaku-checkbox:has(input[value="${TEST_YAKU.MENZEN_TSUMO}"])`);
    const riichiCheckbox = page.locator(`label.yaku-checkbox:has(input[value="${TEST_YAKU.RIICHI}"])`);
    const tanyaoCheckbox = page.locator(`label.yaku-checkbox:has(input[value="${TEST_YAKU.TANYAO}"])`);
    const ippeikoCheckbox = page.locator(`label.yaku-checkbox:has(input[value="${TEST_YAKU.IPPEIKO}"])`);
    const yakuhaiCheckbox = page.locator(`label.yaku-checkbox:has(input[value="${TEST_YAKU.YAKUHAI}"])`);
    
    // 複数の役を選択して高翻数にする（ラベルクリック）
    await riichiCheckbox.click();
    await menzenchintsumoCheckbox.click();
    await tanyaoCheckbox.click();
    await ippeikoCheckbox.click();
    await yakuhaiCheckbox.click();
    
    // リセットボタンをクリック
    await page.locator('#resetBtn').click();
    
    // 手動入力モードに戻り、すべてのボタンが有効化されていることを確認
    await expect(page.locator(`input[name="inputMode"][value="${DEFAULT_VALUES.inputMode}"]`)).toBeChecked();
    
    // 翻数ボタンの有効化確認
    await expect(page.locator('[data-action="increase"][data-target="han"]')).toBeEnabled();
    await expect(page.locator('[data-action="decrease"][data-target="han"]')).toBeEnabled();
    
    // 符数ボタンの有効化確認
    await expect(page.locator('[data-action="increase"][data-target="fu"]')).toBeEnabled();
    await expect(page.locator('[data-action="decrease"][data-target="fu"]')).toBeEnabled();
  });

  test('リセット機能の連続実行テスト', async ({ page }) => {
    // 複数回のリセットが正常に動作することを確認
    for (let i = 0; i < 3; i++) {
      // 値を変更（翻数とそれに対応する有効な符数）
      await setHanValue(page, 2 + i);
      await setFuValue(page, 30); // 安全な符数値を使用
      
      // リセット
      await page.locator('#resetBtn').click();
      
      // 初期化確認
      await expect(page.locator('#hanInput')).toHaveValue(DEFAULT_VALUES.han);
      await expect(page.locator('#fuInput')).toHaveValue(DEFAULT_VALUES.fu);
    }
  });
});