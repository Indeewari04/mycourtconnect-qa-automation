import { test, expect } from '@playwright/test';

test('Client cannot access the lawyer dashboard', async ({ page }) => {
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

  // Confirm this account logs in as a client.
  await expect(page).toHaveURL(
    'http://localhost/mycourtconnect/client_dashboard.php'
  );

  // Try opening the lawyer dashboard with the client session.
  await page.goto(
    'http://localhost/mycourtconnect/lawyer_dashboard.php'
  );

  await expect(page).toHaveURL(
    'http://localhost/mycourtconnect/login.php'
  );

  await expect(
    page.getByRole('button', { name: 'Login', exact: true })
  ).toBeVisible();
});
test('Lawyer cannot access the client dashboard', async ({ page }) => {
  expect(
    process.env.QA_LAWYER_EMAIL,
    'Set QA_LAWYER_EMAIL before running'
  ).toBeTruthy();

  expect(
    process.env.QA_LAWYER_PASSWORD,
    'Set QA_LAWYER_PASSWORD before running'
  ).toBeTruthy();

  await page.goto('http://localhost/mycourtconnect/login.php');

  await page.getByPlaceholder('you@example.com', { exact: true })
    .fill(process.env.QA_LAWYER_EMAIL);

  await page.getByPlaceholder('Enter your password', { exact: true })
    .fill(process.env.QA_LAWYER_PASSWORD);

  await page.getByRole('button', {
    name: 'Login',
    exact: true,
  }).click();

  await expect(page).toHaveURL(
    'http://localhost/mycourtconnect/lawyer_dashboard.php'
  );

   await page.goto(
    'http://localhost/mycourtconnect/client_dashboard.php'
  );

  await expect(page).toHaveURL(
    'http://localhost/mycourtconnect/lawyer_dashboard.php'
  );

  await expect(
    page.getByRole('heading', {
      name: 'Your Appointments',
      exact: true,
    })
  ).toBeVisible();
});