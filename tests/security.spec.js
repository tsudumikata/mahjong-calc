import { test, expect } from '@playwright/test';

test.describe('セキュリティ', () => {
  test('表示データをHTMLとして解釈しない', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(async () => {
      const { generateYakuList, displayResult, updateSelectedYakuDisplay } =
        await import('/js/modules/display.js');
      const payload = '<img src=x onerror="window.__xss = true">';
      const yaku = [{ name: payload, hanText: payload, description: payload }];
      const list = document.createElement('div');
      const main = document.createElement('div');
      const detail = document.createElement('div');
      const selected = document.createElement('div');
      document.body.append(list, main, detail, selected);

      generateYakuList(yaku, list);
      displayResult(
        { score: 1000, name: payload }, 1, 30, 'ron', 'child',
        'yaku', new Set([payload]), yaku, main, detail
      );
      updateSelectedYakuDisplay(new Set([payload]), yaku, selected);

      return {
        injectedElements: [list, main, detail, selected]
          .reduce((count, element) => count + element.querySelectorAll('img').length, 0),
        payloadIsVisibleAsText: [list, main, detail, selected]
          .every(element => element.textContent.includes(payload)),
        handlerRan: window.__xss === true
      };
    });

    expect(result.injectedElements).toBe(0);
    expect(result.payloadIsVisibleAsText).toBe(true);
    expect(result.handlerRan).toBe(false);
  });
});
