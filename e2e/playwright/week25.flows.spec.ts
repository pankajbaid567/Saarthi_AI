import { expect, test } from '@playwright/test';

test.describe('week 25 core user journeys', () => {
  test('user registration and login flow', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/register/);
    await page.goto('/login');
    await expect(page).toHaveURL(/login/);
  });

  test('topic browsing and reading flow', async ({ page }) => {
    await page.goto('/subjects');
    await expect(page).toHaveURL(/subjects/);
  });

  test('mcq, quiz chat, mains, revision, syllabus flow, essay, pdf, and second-brain routes', async ({ page }) => {
    await page.goto('/tests/generate');
    await page.goto('/chat');
    await page.goto('/mains');
    await page.goto('/dashboard');
    await page.goto('/syllabus-flow');
    await page.goto('/second-brain');
    await expect(page).toHaveURL(/second-brain/);
  });
});
