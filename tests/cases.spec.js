import { test, expect } from '@playwright/test';

test('Client can see their assigned case', async ({ page }) => {
  expect(process.env.QA_EMAIL, 'Set QA_EMAIL before running').toBeTruthy();
  expect(process.env.QA_PASSWORD, 'Set QA_PASSWORD before running').toBeTruthy();

  await page.goto('http://localhost/mycourtconnect/login.php');

  await page.getByPlaceholder('you@example.com', { exact: true })
    .fill(process.env.QA_EMAIL);

  await page.getByPlaceholder('Enter your password', { exact: true })
    .fill(process.env.QA_PASSWORD);

  await page.getByRole('button', {
    name: 'Login',
    exact: true,
  }).click();

  await expect(page).toHaveURL(
    'http://localhost/mycourtconnect/client_dashboard.php'
  );

  const caseCard = page.locator('.card').filter({
    has: page.getByRole('heading', {
      name: 'Case #QA-CASE-001',
      exact: true,
    }),
  });

  await expect(caseCard).toHaveCount(1);
  await expect(caseCard).toBeVisible();

  await expect(
    caseCard.getByText('QA Test Plaintiff', { exact: true })
  ).toBeVisible();

  await expect(
    caseCard.getByText('QA Test Defendant', { exact: true })
  ).toBeVisible();

  await expect(
    caseCard.getByText('Active', { exact: true })
  ).toBeVisible();

  await expect(caseCard).not.toContainText('Undefined array key');
  await expect(caseCard).not.toContainText('Deprecated:');
});
test('Another client cannot see the assigned case', async ({ page }) => {
  expect(
    process.env.QA_OTHER_CLIENT_EMAIL,
    'Set QA_OTHER_CLIENT_EMAIL before running'
  ).toBeTruthy();

  expect(
    process.env.QA_OTHER_CLIENT_PASSWORD,
    'Set QA_OTHER_CLIENT_PASSWORD before running'
  ).toBeTruthy();

  expect(process.env.QA_OTHER_CLIENT_EMAIL.toLowerCase())
    .not.toBe(process.env.QA_EMAIL?.toLowerCase());

  await page.goto('http://localhost/mycourtconnect/login.php');

  await page.getByPlaceholder('you@example.com', { exact: true })
    .fill(process.env.QA_OTHER_CLIENT_EMAIL);

  await page.getByPlaceholder('Enter your password', { exact: true })
    .fill(process.env.QA_OTHER_CLIENT_PASSWORD);

  await page.getByRole('button', {
    name: 'Login',
    exact: true,
  }).click();

  await expect(page).toHaveURL(
    'http://localhost/mycourtconnect/client_dashboard.php'
  );

 await expect(
  page.getByRole('heading', {
    name: 'My Cases',
    exact: true,
    level: 3,
  })
).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Case #QA-CASE-001',
      exact: true,
    })
  ).toHaveCount(0);
});