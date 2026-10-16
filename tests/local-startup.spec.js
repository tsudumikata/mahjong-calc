import { test as base, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const test = base.extend({
  appErrors: [async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && message.text().startsWith('StateManager: Error in listener')) {
        errors.push(message.text());
      }
    });
    await use(errors);
    expect(errors, '起動時と操作中に例外が発生しない').toEqual([]);
  }, { auto: true }],
});

function recordAppRequests(page) {
  const requests = [];
  page.on('request', request => {
    if (request.resourceType() === 'script' || new URL(request.url()).pathname.endsWith('/manifest.json')) {
      requests.push(request.url());
    }
  });
  return requests;
}

async function expectStartupGuide(page, appRequests) {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ローカル起動のご案内');
  await expect(page.locator('pre')).toHaveText('npm ci\nnpm run serve');
  await expect(page.getByText('file://', { exact: false })).toBeVisible();
  await expect(page.locator('#calculateBtn, #hanInput, #resetBtn')).toHaveCount(0);
  await expect(page.locator('script, link[rel="manifest"]')).toHaveCount(0);
  expect(appRequests).toEqual([]);
}

async function expectWorkingCalculator(page) {
  await expect(page.locator('#hanInput')).toHaveValue('1');
  await expect(page.locator('#fuInput')).toHaveValue('30');
  await expect(page.locator('#scoreTableBody tr')).not.toHaveCount(0);
  await expect(page.locator('#yaku1Han input')).not.toHaveCount(0);
  await expect(page.locator('#resetBtn')).toBeEnabled();
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#mainResult .result-score')).toHaveText('1,500点');
  await page.locator('[data-target="han"][data-action="increase"]').click();
  await page.locator('[data-target="fu"][data-action="increase"]').click();
  await expect(page.locator('#hanInput')).toHaveValue('2');
  await expect(page.locator('#fuInput')).toHaveValue('40');
  await page.locator('#resetBtn').click();
  await expect(page.locator('#hanInput')).toHaveValue('1');
  await expect(page.locator('#fuInput')).toHaveValue('30');
  await expect(page.locator('#resultSection')).toBeHidden();
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#mainResult .result-score')).toHaveText('1,500点');
}

test('案内どおり通常版をサーバー経由で起動し、計算とリセットができる', async ({ page }) => {
  await page.goto('/index.html');
  await expectWorkingCalculator(page);
});

test('古いHTTP入口は案内を表示し、同じサーバーの通常版へ進める', async ({ page }) => {
  const appRequests = recordAppRequests(page);
  await page.goto('/index-local.html');
  await expectStartupGuide(page, appRequests);
  const link = page.getByRole('link', { name: '同じサーバーの計算機を開く' });
  await expect(link).toHaveJSProperty('href', new URL('index.html', page.url()).href);
  await link.click();
  await expectWorkingCalculator(page);
});

test('古い入口をfileで直接開いてもエラーなく起動手順を読める', async ({ page }) => {
  const appRequests = recordAppRequests(page);
  const fileUrl = pathToFileURL(resolve(test.info().project.testDir, '..', 'index-local.html')).href;
  await page.goto(fileUrl);
  await expect(page).toHaveURL(fileUrl);
  await expectStartupGuide(page, appRequests);
  const link = page.getByRole('link', { name: 'http://localhost:3000/ で計算機を開く' });
  await expect(link).toHaveAttribute('href', 'http://localhost:3000/');
  await link.click();
  await expectWorkingCalculator(page);
});
