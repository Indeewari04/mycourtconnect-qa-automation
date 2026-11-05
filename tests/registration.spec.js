import { test, expect } from '@playwright/test';

test('Client registration page displays the register button', async ({ page }) => {
  await page.goto('http://localhost/mycourtconnect/register.php');

  await expect(
    page.getByRole('button', {
     name: /Register as Client/i
    })
  ).toBeVisible();
});
test('Client registration blocks empty required fields', async ({ page }) => {
  await page.goto('http://localhost/mycourtconnect/register.php');

  const fullName = page.locator('input[placeholder="John Doe"]:visible');

  await fullName.fill('');

  await page.getByRole('button', {
    name: /Register as Client/i
  }).click();

  expect(
    await fullName.evaluate(input => input.validity.valueMissing)
  ).toBe(true);

  await expect(page).toHaveURL(
    'http://localhost/mycourtconnect/register.php'
  );
});
test('Registration page Login link opens the login page', async ({ page }) => {
  await page.goto('http://localhost/mycourtconnect/register.php');

  await page.getByRole('link', {
    name: 'Login',
    exact: true
  }).click();

  await expect(page).toHaveURL(
    'http://localhost/mycourtconnect/login.php'
  );

  await expect(
    page.getByRole('button', { name: 'Login', exact: true })
  ).toBeVisible();
});
test('Client email field rejects an invalid email format', async ({ page }) => {
  await page.goto('http://localhost/mycourtconnect/register.php');

  const email = page.locator(
    'input[placeholder="you@example.com"]:visible'
  );

  await email.fill('invalid-email');

  expect(
    await email.evaluate(input => input.validity.typeMismatch)
  ).toBe(true);
});
test('Client registration password fields hide typed characters', async ({ page }) => {
  await page.goto('http://localhost/mycourtconnect/register.php');

  const password = page.locator(
    'input[placeholder="At least 6 characters"]:visible'
  );
  const confirmPassword = page.locator(
    'input[placeholder="Re-enter password"]:visible'
  );

  await password.fill('TestOnly123!');
  await confirmPassword.fill('TestOnly123!');

  await expect(password).toHaveAttribute('type', 'password');
  await expect(confirmPassword).toHaveAttribute('type', 'password');
});
test('Client registration shows a password mismatch message', async ({ page }) => {
  await page.goto('http://localhost/mycourtconnect/register.php');

  await page.locator(
    'input[placeholder="At least 6 characters"]:visible'
  ).fill('TestOnly123!');

  const confirmPassword = page.locator(
    'input[placeholder="Re-enter password"]:visible'
  );

  await confirmPassword.fill('Different123!');
  await confirmPassword.blur();

  await expect(
    page.getByText('Passwords do not match', { exact: true })
  ).toBeVisible();
});test('Password mismatch message clears when passwords match', async ({ page }) => {
  await page.goto('http://localhost/mycourtconnect/register.php');

  const password = page.locator(
    'input[placeholder="At least 6 characters"]:visible'
  );
  const confirmPassword = page.locator(
    'input[placeholder="Re-enter password"]:visible'
  );
  const mismatchMessage = page.getByText(
    'Passwords do not match',
    { exact: true }
  );

  await password.fill('TestOnly123!');
  await confirmPassword.fill('Different123!');
  await confirmPassword.blur();

  await expect(mismatchMessage).toBeVisible();

  await confirmPassword.fill('TestOnly123!');
  await confirmPassword.blur();

  await expect(mismatchMessage).toBeHidden();
});
test('Client registration shows a message for a short password', async ({ page }) => {
  await page.goto('http://localhost/mycourtconnect/register.php');

  const password = page.locator(
    'input[placeholder="At least 6 characters"]:visible'
  );

  await password.fill('Ab1!');
  await password.blur();

  await expect(
    page.getByText(
      'Password must be at least 6 characters long',
      { exact: true }
    )
  ).toBeVisible();
});
test('Short password message clears at six characters', async ({ page }) => {
  await page.goto('http://localhost/mycourtconnect/register.php');

  const password = page.locator(
    'input[placeholder="At least 6 characters"]:visible'
  );

  const shortPasswordMessage = page.getByText(
    'Password must be at least 6 characters long',
    { exact: true }
  );

  await password.fill('Ab1!');
  await password.blur();
  await expect(shortPasswordMessage).toBeVisible();

  await password.fill('Ab12!x');
  await password.blur();
  await expect(shortPasswordMessage).toBeHidden();
});
test('Client can register with valid details', async ({ page }) => {
  await page.goto('http://localhost/mycourtconnect/register.php');

  const form = page.locator('#customerForm');
  const uniqueId = Date.now().toString();
  const email = `qa.client.${uniqueId}@example.com`;
  const nic = `1990${uniqueId.slice(-8)}`;

  await form.getByPlaceholder('John Doe', { exact: true })
    .fill('QA Test Client');

  await form.locator('select[name="gender"]')
    .selectOption('Female');

  await form.getByPlaceholder(
    '123456789V or 12345678901',
    { exact: true }
  ).fill(nic);

  await form.locator('input[name="dob"]').fill('1990-05-15');

  await form.getByPlaceholder('0771234567', { exact: true })
    .fill('0771234567');

  await form.getByPlaceholder('you@example.com', { exact: true })
    .fill(email);

  await form.getByPlaceholder('123 Main St, City', { exact: true })
    .fill('123 Test Street');

  await form.getByPlaceholder('Colombo', { exact: true })
    .fill('Colombo');

  await form.getByPlaceholder('At least 6 characters', { exact: true })
    .fill('TestOnly123!');

  await form.getByPlaceholder('Re-enter password', { exact: true })
    .fill('TestOnly123!');

  await form.getByRole('button', {
    name: /Register as Client/i
  }).click();

  await expect(page).toHaveURL(
    'http://localhost/mycourtconnect/login.php'
  );

  await expect(
    page.getByText(
      'Client registration successful! You can now login to access your dashboard.',
      { exact: true }
    )
  ).toBeVisible();
});