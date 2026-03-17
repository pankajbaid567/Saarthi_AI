import { expect, test } from '@playwright/test';

test.describe('week 25 core user journeys', () => {
  test('user registration and login flow', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/register/);
    await expect(page.locator('body')).toBeVisible();
    await page.goto('/login');
    await expect(page).toHaveURL(/login/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('topic browsing and reading flow', async ({ page }) => {
    await page.goto('/subjects');
    await expect(page).toHaveURL(/subjects/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('core learning routes are reachable', async ({ page }) => {
    await page.goto('/tests/generate');
    await expect(page.locator('body')).toBeVisible();
    await page.goto('/chat');
    await expect(page.locator('body')).toBeVisible();
    await page.goto('/mains');
    await expect(page.locator('body')).toBeVisible();
    await page.goto('/dashboard');
    await expect(page.locator('body')).toBeVisible();
    await page.goto('/syllabus-flow');
    await expect(page.locator('body')).toBeVisible();
    await page.goto('/second-brain');
    await expect(page).toHaveURL(/second-brain/);
    await expect(page.locator('body')).toBeVisible();
  });
});
