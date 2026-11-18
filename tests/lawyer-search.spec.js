import { test, expect } from '@playwright/test';

test('Client can search for a lawyer by name', async ({ page }) => {
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

  await page.waitForLoadState('load');

  const nameInput = page.getByPlaceholder("Enter lawyer's name...", {
    exact: true,
  });

  const districtInput = page.getByPlaceholder('Enter district...', {
    exact: true,
  });

  // Use only the search form containing the name input.
  const searchForm = page.locator('form').filter({ has: nameInput });
  await expect(searchForm).toHaveCount(1);

  await districtInput.fill('');
  await nameInput.fill('hiruni parindi');

  await searchForm.getByRole('button', {
    name: /Search\s*$/i,
  }).click();

  await expect(
    page.getByText(/Found\s*1\s*lawyer\s*matching/i)
  ).toBeVisible();

  // The search result uses h5; appointment headings use h6.
  const resultHeading = page.locator('h5.text-white.mb-1')
  .filter({ hasText: /^hiruni parindi$/i });

await expect(resultHeading).toHaveCount(1);
await expect(resultHeading).toBeVisible();

  // Count lawyer booking triggers, excluding other page buttons.
  const bookingButtons = page.locator(
    'button[data-bs-target^="#bookLawyer"]'
  );

  await expect(bookingButtons).toHaveCount(1);

  // Confirm that the result belongs to Hiruni (lawyer ID 55).
  await expect(bookingButtons).toHaveAttribute(
    'data-bs-target',
    '#bookLawyer55'
  );
  await expect(bookingButtons).toBeVisible();
});
test('Client can search for lawyers by district', async ({ page }) => {
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

  await page.waitForLoadState('load');

  const nameInput = page.getByPlaceholder("Enter lawyer's name...", {
    exact: true,
  });

  const districtInput = page.getByPlaceholder('Enter district...', {
    exact: true,
  });

  const searchForm = page.locator('form').filter({ has: nameInput });

  await nameInput.fill('');
  await districtInput.fill('Kandy');

  await searchForm.getByRole('button', {
    name: /Search\s*$/i,
  }).click();

  const summary = page.getByText(
    /Found\s*\d+\s*lawyers?\s*in\s*Kandy\s*district/i
  );

  await expect(summary).toBeVisible();

  // Read the result count from the summary.
  const summaryText = await summary.innerText();
  const resultCount = Number(summaryText.match(/Found\s*(\d+)/i)[1]);

  expect(resultCount).toBeGreaterThan(0);

  const bookingButtons = page.locator(
    'button[data-bs-target^="#bookLawyer"]'
  );

  await expect(bookingButtons).toHaveCount(resultCount);

  // Check the district inside each lawyer's result card.
  for (let index = 0; index < resultCount; index++) {
    const card = bookingButtons.nth(index).locator(
      'xpath=ancestor::*[.//h5[contains(@class,"text-white")]][1]'
    );

    await expect(card).toHaveCount(1);

    await expect(
      card.getByText(/^(?:\s*[A-Za-z ]+\s*,)*\s*Kandy\s*(?:,\s*[A-Za-z ]+\s*)*$/i)
    ).toBeVisible();
  }
});
test('Client sees no results for an unknown lawyer name', async ({ page }) => {
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

  await page.waitForLoadState('load');

  const nameInput = page.getByPlaceholder(
    "Enter lawyer's name...",
    { exact: true }
  );

  const districtInput = page.getByPlaceholder(
    'Enter district...',
    { exact: true }
  );

  const searchForm = page.locator('form').filter({
    has: nameInput,
  });

  await expect(searchForm).toHaveCount(1);

  await nameInput.fill('NoSuchLawyerQA98765');
  await districtInput.fill('');

  await searchForm.getByRole('button', {
    name: /Search\s*$/i,
  }).click();

  await expect(
    page.getByText(
      /Found\s*0\s*lawyers?\s*matching\s*"NoSuchLawyerQA98765"/i
    )
  ).toBeVisible();

  await expect(
    page.locator('button[data-bs-target^="#bookLawyer"]')
  ).toHaveCount(0);
});