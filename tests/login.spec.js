import { test, expect } from '@playwright/test';

test('Login page displays the Login button', async ({ page }) => {
  await page.goto('http://localhost/mycourtconnect/login.php');

  await expect(
    page.getByRole('button', { name: 'Login', exact: true })
  ).toBeVisible();
});

test('Client can log in with valid credentials', async ({ page }) => {
  await page.goto('http://localhost/mycourtconnect/login.php');

 await page.getByPlaceholder('you@example.com', { exact: true })
  .fill(process.env.QA_EMAIL);

await page.getByPlaceholder('Enter your password', { exact: true })
  .fill(process.env.QA_PASSWORD);
  await page.getByRole('button', {
    name: 'Login',
    exact: true
  }).click();

  await expect(page).toHaveURL(
    'http://localhost/mycourtconnect/client_dashboard.php'
  );
});
test('Login rejects an incorrect password', async ({ page }) => {
  await page.goto('http://localhost/mycourtconnect/login.php');

  await page.getByPlaceholder('you@example.com', { exact: true })
    .fill(process.env.QA_EMAIL);

  await page.getByPlaceholder('Enter your password', { exact: true })
    .fill(process.env.QA_PASSWORD + '_wrong');

  await page.getByRole('button', {
    name: 'Login',
    exact: true
  }).click();

  await expect(
    page.getByText('Invalid password.', { exact: true })
  ).toBeVisible();

  await expect(page).toHaveURL(
    'http://localhost/mycourtconnect/login.php'
  );
  
});
test('Login blocks empty required fields', async ({ page }) => {
  await page.goto('http://localhost/mycourtconnect/login.php');

  const email = page.getByPlaceholder('you@example.com', {
    exact: true
  });

  const password = page.getByPlaceholder('Enter your password', {
    exact: true
  });

  await email.fill('');
  await password.fill('');

  await page.getByRole('button', {
    name: 'Login',
    exact: true
  }).click();

   expect(await email.evaluate(el => el.validity.valueMissing)).toBe(true);
  expect(await password.evaluate(el => el.validity.valueMissing)).toBe(true);

  await expect(page).toHaveURL(
    'http://localhost/mycourtconnect/login.php'
  );;
});
test('Dashboard requires login', async ({ page }) => {
  await page.goto(
    'http://localhost/mycourtconnect/client_dashboard.php'
  );

  await expect(page).toHaveURL(
    'http://localhost/mycourtconnect/login.php'
  );

  await expect(
    page.getByRole('button', { name: 'Login', exact: true })
  ).toBeVisible();
});
test('Logout prevents dashboard access', async ({ page }) => {
  await page.goto('http://localhost/mycourtconnect/login.php');

  await page.getByPlaceholder('you@example.com', { exact: true })
    .fill(process.env.QA_EMAIL);

  await page.getByPlaceholder('Enter your password', { exact: true })
    .fill(process.env.QA_PASSWORD);

  await page.getByRole('button', {
    name: 'Login',
    exact: true
  }).click();

  await expect(page).toHaveURL(
    'http://localhost/mycourtconnect/client_dashboard.php'
  );

  await page.goto('http://localhost/mycourtconnect/logout.php');

  await page.goto(
    'http://localhost/mycourtconnect/client_dashboard.php'
  );

  await expect(page).toHaveURL(
    'http://localhost/mycourtconnect/login.php'
  );

  await expect(
    page.getByRole('button', { name: 'Login', exact: true })
  ).toBeVisible();
});