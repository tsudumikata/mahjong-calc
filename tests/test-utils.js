// テストユーティリティ関数

/**
 * 増減ボタンを使って値を設定する
 * @param {Page} page - Playwrightページオブジェクト
 * @param {string} target - 'han' または 'fu'
 * @param {number} targetValue - 設定したい値
 * @param {number} currentValue - 現在の値（デフォルト：han=1, fu=30）
 */
export async function setValueByButtons(page, target, targetValue, currentValue = null) {
  // デフォルト値を設定
  if (currentValue === null) {
    currentValue = target === 'han' ? 1 : 30;
  }
  
  if (targetValue > currentValue) {
    // 値を増やす
    for (let i = currentValue; i < targetValue; i++) {
      await page.locator(`[data-action="increase"][data-target="${target}"]`).click();
    }
  } else if (targetValue < currentValue) {
    // 値を減らす
    for (let i = currentValue; i > targetValue; i--) {
      await page.locator(`[data-action="decrease"][data-target="${target}"]`).click();
    }
  }
}

/**
 * 符数を10の倍数に設定する
 * @param {Page} page - Playwrightページオブジェクト
 * @param {number} targetValue - 設定したい符数（20, 30, 40, 50, 60, 70, 80, 90, 100, 110）
 */
export async function setFuValue(page, targetValue) {
  // 最大試行回数を設定（無限ループを防ぐ）
  const maxAttempts = 20;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    // 現在値を取得
    const currentValue = parseInt(await page.locator('#fuInput').inputValue());
    
    // 目標値に達していれば終了
    if (currentValue === targetValue) {
      break;
    }
    
    if (targetValue > currentValue) {
      // 増加の場合
      const increaseBtn = page.locator('[data-action="increase"][data-target="fu"]');
      if (await increaseBtn.isEnabled()) {
        await increaseBtn.click();
        // DOM更新を待つ
        await page.waitForTimeout(100);
      } else {
        console.warn(`符数増加ボタンが無効化されました。現在値: ${currentValue}, 目標値: ${targetValue}`);
        break;
      }
    } else if (targetValue < currentValue) {
      // 減少の場合
      const decreaseBtn = page.locator('[data-action="decrease"][data-target="fu"]');
      if (await decreaseBtn.isEnabled()) {
        await decreaseBtn.click();
        // DOM更新を待つ
        await page.waitForTimeout(100);
      } else {
        console.warn(`符数減少ボタンが無効化されました。現在値: ${currentValue}, 目標値: ${targetValue}`);
        break;
      }
    }
    
    attempts++;
  }
  
  // 最終確認
  const finalValue = parseInt(await page.locator('#fuInput').inputValue());
  if (finalValue !== targetValue) {
    console.warn(`符数設定に失敗しました。目標値: ${targetValue}, 実際の値: ${finalValue}`);
  }
}

/**
 * 翻数を設定する
 * @param {Page} page - Playwrightページオブジェクト
 * @param {number} targetValue - 設定したい翻数（1-13）
 */
export async function setHanValue(page, targetValue) {
  // 最大試行回数を設定（無限ループを防ぐ）
  const maxAttempts = 20;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    // 現在値を取得
    const currentValue = parseInt(await page.locator('#hanInput').inputValue());
    
    // 目標値に達していれば終了
    if (currentValue === targetValue) {
      break;
    }
    
    if (targetValue > currentValue) {
      // 増加の場合
      const increaseBtn = page.locator('[data-action="increase"][data-target="han"]');
      if (await increaseBtn.isEnabled()) {
        await increaseBtn.click();
        // DOM更新を待つ
        await page.waitForTimeout(100);
      } else {
        console.warn(`翻数増加ボタンが無効化されました。現在値: ${currentValue}, 目標値: ${targetValue}`);
        break;
      }
    } else {
      // 減少の場合
      const decreaseBtn = page.locator('[data-action="decrease"][data-target="han"]');
      if (await decreaseBtn.isEnabled()) {
        await decreaseBtn.click();
        // DOM更新を待つ
        await page.waitForTimeout(100);
      } else {
        console.warn(`翻数減少ボタンが無効化されました。現在値: ${currentValue}, 目標値: ${targetValue}`);
        break;
      }
    }
    
    attempts++;
  }
  
  // 最終確認
  const finalValue = parseInt(await page.locator('#hanInput').inputValue());
  if (finalValue !== targetValue) {
    console.warn(`翻数設定に失敗しました。目標値: ${targetValue}, 実際の値: ${finalValue}`);
  }
}

/**
 * 役選択モードで符数を設定する
 * @param {Page} page - Playwrightページオブジェクト
 * @param {number} targetValue - 設定したい符数（20, 30, 40, 50, 60, 70, 80, 90, 100, 110）
 */
export async function setFuValueForYakuMode(page, targetValue) {
  // 最大試行回数を設定（無限ループを防ぐ）
  const maxAttempts = 20;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    // 現在値を取得
    const currentValue = parseInt(await page.locator('#fuYakuInput').inputValue());
    
    // 目標値に達していれば終了
    if (currentValue === targetValue) {
      break;
    }
    
    if (targetValue > currentValue) {
      // 増加の場合
      const increaseBtn = page.locator('[data-action="increase"][data-target="fuYaku"]');
      if (await increaseBtn.isEnabled()) {
        await increaseBtn.click();
        // DOM更新を待つ
        await page.waitForTimeout(100);
      } else {
        console.warn(`符数増加ボタンが無効化されました。現在値: ${currentValue}, 目標値: ${targetValue}`);
        break;
      }
    } else if (targetValue < currentValue) {
      // 減少の場合
      const decreaseBtn = page.locator('[data-action="decrease"][data-target="fuYaku"]');
      if (await decreaseBtn.isEnabled()) {
        await decreaseBtn.click();
        // DOM更新を待つ
        await page.waitForTimeout(100);
      } else {
        console.warn(`符数減少ボタンが無効化されました。現在値: ${currentValue}, 目標値: ${targetValue}`);
        break;
      }
    }
    
    attempts++;
  }
  
  // 最終確認
  const finalValue = parseInt(await page.locator('#fuYakuInput').inputValue());
  if (finalValue !== targetValue) {
    console.warn(`符数設定に失敗しました。目標値: ${targetValue}, 実際の値: ${finalValue}`);
  }
}