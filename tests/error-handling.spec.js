import { test as base, expect } from '@playwright/test';

// Issue #41: DOM要素の欠落や処理中の例外があっても、アプリが止まらずに使い続けられること。
// 未捕捉の例外（pageerror）は失敗扱い。ErrorHandler のログは別に集めて、想定どおり記録されたかを確かめる。
const test = base.extend({
  handledErrors: [async ({ page }, use) => {
    const uncaught = [];
    const handled = [];
    page.on('pageerror', error => uncaught.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && message.text().startsWith('[ErrorHandler]')) {
        handled.push(message.text());
      }
    });
    await use(handled);
    expect(uncaught, '未捕捉の例外が発生しない').toEqual([]);
  }, { auto: true }],
});

/** トップページの HTML を書き換えて読み込む */
async function gotoWithHtml(page, transform) {
  await page.route(url => url.pathname === '/' || url.pathname === '/index.html', async route => {
    const response = await route.fetch();
    const body = transform(await response.text());
    await route.fulfill({ response, body });
  });
  await page.goto('/');
}

async function expectCalculates1500(page) {
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#resultSection')).toBeVisible();
  await expect(page.locator('#mainResult .result-score')).toHaveText('1,500点');
}

test.describe('エラーハンドリング', () => {
  test('リセットボタンが無くても残りの初期化と計算は動く', async ({ page, handledErrors }) => {
    await gotoWithHtml(page, html => {
      const removed = html.replace('<button class="reset-btn" id="resetBtn">リセット</button>', '');
      expect(removed).not.toBe(html);
      return removed;
    });

    // リセットボタンより後に初期化していた点数表・役一覧・役選択・タブ切り替えも動く
    await expect(page.locator('#scoreTableBody tr')).not.toHaveCount(0);
    await expect(page.locator('#yakuListContainer *')).not.toHaveCount(0);
    await expect(page.locator('#yaku1Han input')).not.toHaveCount(0);
    await page.locator('.tab-btn[data-tab="yaku-list"]').click();
    await expect(page.locator('#yaku-list')).toHaveClass(/active/);
    await expectCalculates1500(page);

    expect(handledErrors.some(message => message.includes('#resetBtn'))).toBe(true);
  });

  test('役選択の欄が1つ欠けても他の翻数の役は選べる', async ({ page, handledErrors }) => {
    await gotoWithHtml(page, html => {
      const removed = html.replace('id="yaku1Han"', 'id="yaku1HanMissing"');
      expect(removed).not.toBe(html);
      return removed;
    });

    await expect(page.locator('#yaku2Han input')).not.toHaveCount(0);
    await expect(page.locator('#yakuYakuman input')).not.toHaveCount(0);
    await page.locator('label:has(input[name="inputMode"][value="yaku"])').click();
    await page.locator('#yaku2Han label:has(input[value="七対子"])').click();
    await expect(page.locator('#totalHan')).toHaveText('2翻');

    expect(handledErrors.some(message => message.includes('#yaku1Han'))).toBe(true);
  });

  test('操作中に入力欄が消えても止まらず、他の操作を続けられる', async ({ page, handledErrors }) => {
    await page.goto('/');
    await page.evaluate(() => document.getElementById('hanInput').remove());

    await page.locator('[data-target="han"][data-action="increase"]').click();
    expect(handledErrors.some(message => message.includes('#hanInput'))).toBe(true);

    // 符数の増減と計算は引き続き動く
    await page.locator('[data-target="fu"][data-action="increase"]').click();
    await expect(page.locator('#fuInput')).toHaveValue('40');
    await page.locator('[data-target="fu"][data-action="decrease"]').click();
    await expectCalculates1500(page);
  });

  test('計算中に例外が起きたら結果を消してメッセージを出し、次の計算はできる', async ({ page, handledErrors }) => {
    await page.goto('/');
    const dialogs = [];
    page.on('dialog', dialog => {
      dialogs.push(dialog.message());
      dialog.accept();
    });

    // 結果表示の最後の処理を一度だけ失敗させる
    await page.evaluate(() => {
      const original = HTMLElement.prototype.scrollIntoView;
      HTMLElement.prototype.scrollIntoView = function () {
        HTMLElement.prototype.scrollIntoView = original;
        throw new Error('injected failure');
      };
    });
    await page.locator('#calculateBtn').click();
    await expect.poll(() => dialogs).toEqual(['計算中にエラーが発生しました。入力を確認して、もう一度お試しください。']);
    await expect(page.locator('#resultSection')).toBeHidden();
    expect(handledErrors.some(message => message.startsWith('[ErrorHandler] calculateScore'))).toBe(true);

    await expectCalculates1500(page);
  });
});
