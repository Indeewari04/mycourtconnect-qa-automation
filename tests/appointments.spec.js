import { test, expect } from '@playwright/test';
import { randomInt } from 'node:crypto';

const BASE_URL = 'http://localhost/mycourtconnect';
const MODAL = '#bookLawyer55';
const CLIENT_NAME = 'indeewari Thennakoon';

// Validate credentials before starting each test.
test.beforeEach(() => {
  for (const name of [
    'QA_EMAIL',
    'QA_PASSWORD',
    'QA_LAWYER_EMAIL',
    'QA_LAWYER_PASSWORD',
  ]) {
    expect(process.env[name], `Set ${name} before running`).toBeTruthy();
  }
});

async function login(page, role) {
  const isLawyer = role === 'lawyer';

  await page.goto(`${BASE_URL}/login.php`);

  await page.getByPlaceholder('you@example.com', { exact: true })
    .fill(process.env[isLawyer ? 'QA_LAWYER_EMAIL' : 'QA_EMAIL']);

  await page.getByPlaceholder('Enter your password', { exact: true })
    .fill(process.env[isLawyer ? 'QA_LAWYER_PASSWORD' : 'QA_PASSWORD']);

  await page.getByRole('button', {
    name: 'Login',
    exact: true,
  }).click();

  await expect(page).toHaveURL(
    `${BASE_URL}/${isLawyer ? 'lawyer' : 'client'}_dashboard.php`
  );
}

async function openBookingForm(page) {
  
  // Wait until the dashboard and Bootstrap scripts finish loading.
  await page.waitForLoadState('load');

  await page.waitForFunction(() =>
    typeof window.bootstrap?.Modal === 'function'
  );

  await page.locator(
    `button[data-bs-target="${MODAL}"]`
  ).click();

  const form = page.locator(MODAL);

  await expect(form).toBeVisible();
  await expect(form.locator('input[name="book_date"]')).toBeVisible();
  await expect(form.locator('input[name="book_time"]')).toBeVisible();
  await expect(
    form.getByRole('button', { name: /Confirm Booking/i })
  ).toBeVisible();

  return form;
}


// Choose a future date and a time between 09:00 and 16:59.
function createSlot() {
  const slot = new Date();
  slot.setUTCDate(slot.getUTCDate() + randomInt(30, 731));

  const date = slot.toISOString().slice(0, 10);
  const hour = randomInt(9, 17);
  const minute = randomInt(0, 60);

  const time = [
    String(hour).padStart(2, '0'),
    String(minute).padStart(2, '0'),
  ].join(':');

  const displayDate = new Date(`${date}T12:00:00Z`)
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });

  const displayTime =
    `${String(hour % 12 || 12).padStart(2, '0')}:` +
    `${String(minute).padStart(2, '0')} ` +
    `${hour >= 12 ? 'PM' : 'AM'}`;

  return { date, time, displayDate, displayTime };
}

async function bookAppointment(page) {
  await login(page, 'client');

  const form = await openBookingForm(page);
  const slot = createSlot();

  console.log(`Booking Hiruni: ${slot.date} ${slot.time}`);

  await form.locator('input[name="book_date"]').fill(slot.date);
  await form.locator('input[name="book_time"]').fill(slot.time);

  await form.getByRole('button', {
    name: /Confirm Booking/i,
  }).click();

  const confirmation = page.getByText(
    /Appointment booked with hiruni parindi/i
  );

  await expect(confirmation).toBeVisible();
  await expect(confirmation).toContainText(
    `on ${slot.date} at ${slot.time}`
  );

  return slot;
}

function findAppointment(page, slot) {
  // Select the nearest container containing this date, time and client.
  return page.getByText(slot.displayDate, { exact: true })
    .locator(
      `xpath=ancestor::*[` +
      `contains(., "${slot.displayTime}") and ` +
      `contains(., "${CLIENT_NAME}")][1]`
    );
}

async function withLawyerAppointment(browser, slot, action) {
  // Separate browser context keeps client and lawyer sessions apart.
  const context = await browser.newContext();

  try {
    const lawyerPage = await context.newPage();
    await login(lawyerPage, 'lawyer');

    const appointment = findAppointment(lawyerPage, slot);

    await expect(appointment).toHaveCount(1);
    await expect(
      appointment.getByText('Pending', { exact: true })
    ).toBeVisible();

    await action(lawyerPage, appointment);
  } finally {
    await context.close();
  }
}

test('Client can open the appointment booking form', async ({ page }) => {
  await login(page, 'client');
  await openBookingForm(page);
});

test('Client can book an appointment with Hiruni', async ({
  page,
  browser,
}) => {
  const slot = await bookAppointment(page);

  await withLawyerAppointment(browser, slot, async (_, appointment) => {
    await expect(
      appointment.getByText('Pending', { exact: true })
    ).toBeVisible();
  });
});

test('Lawyer can accept a pending appointment', async ({
  page,
  browser,
}) => {
  const slot = await bookAppointment(page);

  await withLawyerAppointment(
    browser,
    slot,
    async (lawyerPage, appointment) => {
      lawyerPage.once('dialog', dialog => dialog.accept());

      await appointment.getByText('Accept', { exact: true }).click();

      await expect(
        appointment.getByText('Accepted', { exact: true })
      ).toBeVisible();

      // Verify the accepted status remains after refreshing.
      await lawyerPage.reload();

      await expect(
        findAppointment(lawyerPage, slot)
          .getByText('Accepted', { exact: true })
      ).toBeVisible();
    }
  );
});

test('Lawyer can reject a pending appointment', async ({
  page,
  browser,
}) => {
  const slot = await bookAppointment(page);

  await withLawyerAppointment(
    browser,
    slot,
    async (lawyerPage, appointment) => {
      lawyerPage.once('dialog', dialog => dialog.accept());

      await appointment.getByText('Reject', { exact: true }).click();
      await expect(appointment).toBeHidden();

      // Verify the rejected card stays absent after refreshing.
      await lawyerPage.reload();
      await expect(findAppointment(lawyerPage, slot)).toHaveCount(0);
    }
  );
});
test('Booking blocks empty date and time', async ({ page }) => {
  await login(page, 'client');
  const form = await openBookingForm(page);

  const date = form.locator('input[name="book_date"]');
  const time = form.locator('input[name="book_time"]');

  await date.fill('');
  await time.fill('');

  // Track whether clicking Confirm sends a booking request.
  const bookingRequests = [];

  const trackBooking = request => {
    if (request.method() !== 'POST') return;

    const data = new URLSearchParams(request.postData() || '');

    if (data.has('book_date') && data.has('book_time')) {
      bookingRequests.push(request.url());
    }
  };

  page.on('request', trackBooking);

  try {
    await form.getByRole('button', {
      name: /Confirm Booking/i,
    }).click();

    expect(
      await date.evaluate(el => el.validity.valueMissing)
    ).toBe(true);

    expect(
      await time.evaluate(el => el.validity.valueMissing)
    ).toBe(true);

    await expect(form).toBeVisible();
    expect(bookingRequests).toHaveLength(0);
  } finally {
    page.off('request', trackBooking);
  }
});
test('Booking blocks an empty time', async ({ page }) => {
  await login(page, 'client');
  const form = await openBookingForm(page);

  const slot = createSlot();
  const date = form.locator('input[name="book_date"]');
  const time = form.locator('input[name="book_time"]');

  await date.fill(slot.date);
  await time.fill('');

  await form.getByRole('button', {
    name: /Confirm Booking/i,
  }).click();

  expect(
    await time.evaluate(el => el.validity.valueMissing)
  ).toBe(true);

  await expect(date).toHaveValue(slot.date);
  await expect(form).toBeVisible();
});
test('Booking blocks an empty date', async ({ page }) => {
  await login(page, 'client');
  const form = await openBookingForm(page);

  const date = form.locator('input[name="book_date"]');
  const time = form.locator('input[name="book_time"]');

  await date.fill('');
  await time.fill('14:30');

  await form.getByRole('button', {
    name: /Confirm Booking/i,
  }).click();

  expect(
    await date.evaluate(el => el.validity.valueMissing)
  ).toBe(true);

  await expect(time).toHaveValue('14:30');
  await expect(form).toBeVisible();
});
test('Booking blocks a past date', async ({ page }) => {
  await login(page, 'client');
  const form = await openBookingForm(page);

  const date = form.locator('input[name="book_date"]');
  const time = form.locator('input[name="book_time"]');

  // Choose the day before the minimum allowed date.
  const minDate = await date.getAttribute('min');
  expect(minDate, 'Date field should have a minimum date').toBeTruthy();

  const past = new Date(`${minDate}T12:00:00Z`);
  past.setUTCDate(past.getUTCDate() - 1);

  const pastDate = past.toISOString().slice(0, 10);

  await date.fill(pastDate);
  await time.fill('14:30');

  await form.getByRole('button', {
    name: /Confirm Booking/i,
  }).click();

  expect(
    await date.evaluate(el => el.validity.rangeUnderflow)
  ).toBe(true);

  await expect(date).toHaveValue(pastDate);
  await expect(form).toBeVisible();
});
test('Booking blocks an exact duplicate appointment', async ({ page }) => {
  // Create the first booking.
  const slot = await bookAppointment(page);

  // Try booking the same lawyer, date and time again.
  const form = await openBookingForm(page);

  await form.locator('input[name="book_date"]').fill(slot.date);
  await form.locator('input[name="book_time"]').fill(slot.time);

  await form.getByRole('button', {
    name: /Confirm Booking/i,
  }).click();

  await expect(
    page.getByText('You already have this exact appointment.', {
      exact: true,
    })
  ).toBeVisible();
});