import { test, expect } from '@playwright/test';

// Issue #6: 今の選択・和了条件に追加できない役をグレー表示する。
const label = (page, name) => page.locator(`label.yaku-checkbox:has(input[value="${name}"])`);
const choose = (page, name, value) => page.locator(`label:has(input[name="${name}"][value="${value}"])`).click();

test.describe('役のフィルタ #6', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await choose(page, 'playerType', 'child');
    await choose(page, 'inputMode', 'yaku');
    await choose(page, 'winType', 'ron');
  });

  test('和了条件で選べない役をグレー表示し、条件を変えると戻す', async ({ page }) => {
    await expect(label(page, '門前清自摸和')).toHaveClass(/yaku-unavailable/);
    await expect(label(page, '一発')).toHaveClass(/yaku-unavailable/);
    await expect(label(page, '河底撈魚')).not.toHaveClass(/yaku-unavailable/);
    await expect(page.locator('.yaku-checkbox input[value="門前清自摸和"]')).toHaveAttribute('aria-describedby', 'yakuUnavailableHint');

    await choose(page, 'winType', 'tsumo');
    await expect(label(page, '門前清自摸和')).not.toHaveClass(/yaku-unavailable/);
    await expect(label(page, '河底撈魚')).toHaveClass(/yaku-unavailable/);

    await label(page, '立直').click();
    await expect(label(page, '一発')).not.toHaveClass(/yaku-unavailable/);
  });

  test('選んだ役と両立しない役をグレー表示し、解除すると戻す', async ({ page }) => {
    await label(page, '七対子').click();
    await expect(label(page, '七対子')).not.toHaveClass(/yaku-unavailable/);
    await expect(label(page, '対々和')).toHaveClass(/yaku-unavailable/);
    await expect(label(page, '平和')).toHaveClass(/yaku-unavailable/);
    await expect(label(page, '断幺九')).not.toHaveClass(/yaku-unavailable/);

    await label(page, '七対子').click();
    await expect(label(page, '対々和')).not.toHaveClass(/yaku-unavailable/);
    await expect(label(page, '平和')).not.toHaveClass(/yaku-unavailable/);
  });

  test('グレー表示の役を押すと選択せずに理由を表示する', async ({ page }) => {
    await label(page, '七対子').click();
    await label(page, '対々和').click();
    await expect(page.locator('.yaku-checkbox input[value="対々和"]')).not.toBeChecked();
    await expect(page.locator('#yakuValidationFeedback')).toBeVisible();
    await expect(page.locator('#yakuValidationFeedback')).toContainText('七対子');
    await expect(page.locator('#totalHan')).toHaveText('2翻');
  });

  test('リセットでグレー表示を解除する', async ({ page }) => {
    await label(page, '七対子').click();
    await expect(label(page, '対々和')).toHaveClass(/yaku-unavailable/);
    await page.locator('#resetBtn').click();
    await expect(label(page, '対々和')).not.toHaveClass(/yaku-unavailable/);
  });
});
