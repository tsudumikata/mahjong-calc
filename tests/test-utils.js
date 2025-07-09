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
  const currentValue = 30; // デフォルト値
  const step = 10; // 符数は10ずつ増減
  
  if (targetValue > currentValue) {
    const clicks = (targetValue - currentValue) / step;
    for (let i = 0; i < clicks; i++) {
      await page.locator('[data-action="increase"][data-target="fu"]').click();
    }
  } else if (targetValue < currentValue) {
    const clicks = (currentValue - targetValue) / step;
    for (let i = 0; i < clicks; i++) {
      await page.locator('[data-action="decrease"][data-target="fu"]').click();
    }
  }
}

/**
 * 翻数を設定する
 * @param {Page} page - Playwrightページオブジェクト
 * @param {number} targetValue - 設定したい翻数（1-13）
 */
export async function setHanValue(page, targetValue) {
  const currentValue = 1; // デフォルト値
  
  if (targetValue > currentValue) {
    for (let i = currentValue; i < targetValue; i++) {
      await page.locator('[data-action="increase"][data-target="han"]').click();
    }
  } else if (targetValue < currentValue) {
    for (let i = currentValue; i > targetValue; i--) {
      await page.locator('[data-action="decrease"][data-target="han"]').click();
    }
  }
}