import { test, expect } from '@playwright/test';

test('Client can open the edit profile form', async ({ page }) => {
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

  await page.locator(
  'a.nav-link[href="edit_client_profile.php"]'
).click();

  await expect(page).toHaveURL(
    'http://localhost/mycourtconnect/edit_client_profile.php'
  );

  await expect(
    page.getByRole('heading', { name: /Edit Profile/i })
  ).toBeVisible();

  const fields = [
    /Full Name/i,
    /Email Address/i,
    /Phone Number/i,
    /^City$/i,
    /^Address$/i,
    /Gender/i,
  ];

  for (const label of fields) {
    await expect(page.getByLabel(label)).toBeVisible();
  }

  await expect(
    page.getByRole('button', { name: /Save Changes/i })
  ).toBeVisible();
});
test('Client can update city and the change persists', async ({ page }) => {
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

  const profileURL =
    'http://localhost/mycourtconnect/edit_client_profile.php';

  await page.goto(profileURL);

  const city = page.getByLabel(/^City$/i);
  const originalCity = await city.inputValue();
  const updatedCity = originalCity.trim().toLowerCase() === 'kandy'
    ? 'Colombo'
    : 'Kandy';

  const saveButton = page.getByRole('button', {
    name: /Save Changes/i,
  });

  const successMessage = page.getByText(
    'Profile updated successfully.',
    { exact: true }
  );

  try {
    await city.fill(updatedCity);
    await saveButton.click();

    await expect(successMessage).toBeVisible();
    await expect(page).toHaveURL(profileURL);
    await expect(city).toHaveValue(updatedCity);

    // Open a fresh GET request to check the saved value.
    await page.goto(profileURL);
    await expect(city).toHaveValue(updatedCity);
  } finally {
    // Restore the value that existed before this test.
    await page.goto(profileURL);
    await city.fill(originalCity);
    await saveButton.click();

    await expect(successMessage).toBeVisible();

    await page.goto(profileURL);
    await expect(city).toHaveValue(originalCity);
  }
});
test('Client cannot save an empty full name', async ({ page }) => {
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

  const profileURL =
    'http://localhost/mycourtconnect/edit_client_profile.php';

  await page.goto(profileURL);

  const fullName = page.getByLabel(/Full Name/i);
  const originalName = await fullName.inputValue();

  expect(originalName.trim()).not.toBe('');

  await fullName.fill('');

  await page.getByRole('button', {
    name: /Save Changes/i,
  }).click();

  await expect(
    page.getByText('Please fill in all required fields', {
      exact: true,
    })
  ).toBeVisible();

  await expect(page).toHaveURL(profileURL);
  await expect(fullName).toHaveValue('');

  // Check the stored name using a fresh page request.
  await page.goto(profileURL);
  await expect(fullName).toHaveValue(originalName);
});
test('Client cannot save an invalid email format', async ({ page }) => {
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

  const profileURL =
    'http://localhost/mycourtconnect/edit_client_profile.php';

  await page.goto(profileURL);

  const email = page.getByLabel(/Email Address/i);
  const originalEmail = await email.inputValue();

  expect(originalEmail.trim()).not.toBe('');

  await email.fill('invalid-email');

  await page.getByRole('button', {
    name: /Save Changes/i,
  }).click();

  await expect(
    page.getByText('Invalid email format.', { exact: true })
  ).toBeVisible();

  await expect(page).toHaveURL(profileURL);

  // Check that the stored email has not changed.
  await page.goto(profileURL);
  await expect(email).toHaveValue(originalEmail);
});