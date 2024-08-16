import { invariant } from '@epic-web/invariant'
import { faker } from '@faker-js/faker'
import { prisma } from '#app/utils/db.server.ts'
import {
  normalizeEmail,
  normalizeUsername,
} from '#app/utils/providers/provider'
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '#app/utils/user-validation'
import { readEmail } from '#tests/mocks/utils.ts'
import { createUser, expect, test as base } from '#tests/playwright-utils.ts'

const URL_REGEX = /(?<url>https?:\/\/[^\s$.?#].[^\s]*)/
const CODE_REGEX = /Here's your verification code: (?<code>[\d\w]+)/
function extractUrl(text: string) {
  const match = text.match(URL_REGEX)
  return match?.groups?.url
}

const test = base.extend<{
  getOnboardingData(): {
    username: string
    name: string
    email: string
    password: string
  }
}>({
  getOnboardingData: async ({}, use) => {
    const userData = createUser()
    await use(() => {
      const onboardingData = {
        ...userData,
        password: faker.internet.password(),
      }
      return onboardingData
    })
    await prisma.user.deleteMany({ where: { username: userData.username } })
  },
})

test('onboarding with link', async ({ page, getOnboardingData }) => {
  const onboardingData = getOnboardingData()

  await page.goto('/')

  await page.getByRole('link', { name: /log in/i }).click()
  await expect(page).toHaveURL(`/login`)

  const createAccountLink = page.getByRole('link', {
    name: /înregistrează-te/i,
  })
  await createAccountLink.click()

  await expect(page).toHaveURL(`/signup`)

  const emailTextbox = page.getByRole('textbox', { name: /email/i })
  await emailTextbox.click()
  await emailTextbox.fill(onboardingData.email)

  await page.getByRole('button', { name: /submit/i }).click()
  await expect(
    page.getByRole('button', { name: /submit/i, disabled: true }),
  ).toBeVisible()
  await expect(page.getByText(/check your email/i)).toBeVisible()

  const email = await readEmail(onboardingData.email)
  invariant(email, 'Email not found')
  expect(email.to).toBe(onboardingData.email.toLowerCase())
  expect(email.from).toBe('hello@rs.mindle.ro')
  expect(email.subject).toMatch(/welcome/i)
  const onboardingUrl = extractUrl(email.text)
  invariant(onboardingUrl, 'Onboarding URL not found')
  await page.goto(onboardingUrl)

  await expect(page).toHaveURL(/\/verify/)

  await page
    .getByRole('main')
    .getByRole('button', { name: /submit/i })
    .click()

  await expect(page).toHaveURL(`/onboarding`)
  await page
    .getByRole('textbox', { name: /^username/i })
    .fill(onboardingData.username)

  await page.getByRole('textbox', { name: /^nume/i }).fill(onboardingData.name)

  await page.getByLabel(/^parola/i).fill(onboardingData.password)

  await page.getByLabel(/^confirmă parola/i).fill(onboardingData.password)

  await page.getByLabel(/termenii de serviciu/i).check()

  await page.getByLabel(/ține-mă minte/i).check()

  await page.getByRole('button', { name: /Create an account/i }).click()

  await expect(page).toHaveURL(`/home`)

  await page.getByRole('link', { name: onboardingData.name }).click()
  await page.getByRole('menuitem', { name: /profilul tău/i }).click()

  await expect(page).toHaveURL(`/users/${onboardingData.username}`)

  await page.getByRole('link', { name: onboardingData.name }).click()
  await page.getByRole('menuitem', { name: /logout/i }).click()
  await expect(page).toHaveURL(`/`)
})

test('onboarding with a short code', async ({ page, getOnboardingData }) => {
  const onboardingData = getOnboardingData()

  await page.goto('/signup')

  const emailTextbox = page.getByRole('textbox', { name: /email/i })
  await emailTextbox.click()
  await emailTextbox.fill(onboardingData.email)

  await page.getByRole('button', { name: /submit/i }).click()
  await expect(
    page.getByRole('button', { name: /submit/i, disabled: true }),
  ).toBeVisible()
  await expect(page.getByText(/check your email/i)).toBeVisible()

  const email = await readEmail(onboardingData.email)
  invariant(email, 'Email not found')
  expect(email.to).toBe(onboardingData.email.toLowerCase())
  expect(email.from).toBe('hello@rs.mindle.ro')
  expect(email.subject).toMatch(/welcome/i)
  const codeMatch = email.text.match(CODE_REGEX)
  const code = codeMatch?.groups?.code
  invariant(code, 'Onboarding code not found')
  await page.getByRole('textbox', { name: /code/i }).fill(code)
  await page.getByRole('button', { name: /submit/i }).click()

  await expect(page).toHaveURL(`/onboarding`)
})

test('completes onboarding after Google OAuth given valid user details', async ({
  page,
  prepareGoogleUser,
}) => {
  const user = await prepareGoogleUser()

  // let's verify we do not have user with that email in our system:
  expect(
    await prisma.user.findUnique({
      where: { email: normalizeEmail(user.email) },
    }),
  ).toBeNull()

  await page.goto('/signup')
  await page.getByRole('button', { name: /signup cu google/i }).click()

  await expect(page).toHaveURL(/\/onboarding\/google/)
  await expect(
    page.getByText(new RegExp(`welcome aboard ${user.email}`, 'i')),
  ).toBeVisible()

  const usernameInput = page.getByRole('textbox', { name: /username/i })
  const nameInput = page.getByRole('textbox', { name: /^nume/i })
  await usernameInput.fill(user.username)
  await nameInput.fill(user.name)
  const createAccountButton = page.getByRole('button', {
    name: /create an account/i,
  })

  await page
    .getByLabel(
      /ești de acord cu termenii de serviciu și politica de confidențialitate/i,
    )
    .check()
  await createAccountButton.click()
  await expect(page).toHaveURL(/signup/i)

  // we are still on the 'signup' route since that
  // was the referrer and no 'redirectTo' has been specified
  await expect(page).toHaveURL('/signup')
  await expect(page.getByText(/thanks for signing up/i)).toBeVisible()

  // internally, a user has been created:
  await prisma.user.findUniqueOrThrow({
    where: { email: normalizeEmail(user.email) },
  })
})

test.skip('logs user in after Google OAuth if they are already registered', async ({
  page,
  prepareGoogleUser,
}) => {
  const googleUser = await prepareGoogleUser()

  // let's verify we do not have user with that email in our system ...
  expect(
    await prisma.user.findUnique({
      where: { email: normalizeEmail(googleUser.email) },
    }),
  ).toBeNull()
  // ... and create one:
  const name = faker.person.fullName()
  const user = await prisma.user.create({
    select: { id: true, name: true },
    data: {
      email: normalizeEmail(googleUser.email),
      username: normalizeUsername(googleUser.username),
      name,
    },
  })

  // let's verify there is no connection between the GitHub user
  // and out app's user:
  const connection = await prisma.connection.findFirst({
    where: { providerName: 'google', userId: user.id },
  })
  expect(connection).toBeNull()

  await page.goto('/signup')
  await page.getByRole('button', { name: /signup cu google/i }).click()

  await expect(page).toHaveURL(`/home`)
  await expect(
    page.getByText(
      new RegExp(
        `your "${googleUser!.username}" google account has been connected`,
        'i',
      ),
    ),
  ).toBeVisible()

  // internally, a connection (rather than a new user) has been created:
  await prisma.connection.findFirstOrThrow({
    where: { providerName: 'google', userId: user.id },
  })
})

test('shows help texts on entering invalid details on onboarding page after Google OAuth', async ({
  page,
  prepareGoogleUser,
}) => {
  const googleUser = await prepareGoogleUser()

  await page.goto('/signup')
  await page.getByRole('button', { name: /signup cu google/i }).click()

  await expect(page).toHaveURL(/\/onboarding\/google/)
  await expect(
    page.getByText(new RegExp(`welcome aboard ${googleUser.email}`, 'i')),
  ).toBeVisible()

  const usernameInput = page.getByRole('textbox', { name: /username/i })

  // notice, how button is currently in 'idle' (neutral) state and so has got no companion
  const createAccountButton = page.getByRole('button', {
    name: /create an account/i,
  })
  await expect(createAccountButton.getByRole('status')).not.toBeVisible()
  await expect(createAccountButton.getByText('error')).not.toBeAttached()

  // invalid chars in username
  await usernameInput.fill('U$er_name') // $ is invalid char, see app/utils/user-validation.ts.
  await createAccountButton.click()

  await expect(createAccountButton.getByRole('status')).toBeVisible()
  await expect(createAccountButton.getByText('error')).toBeAttached()
  await expect(
    page.getByText(
      /username can only include letters, numbers, and underscores/i,
    ),
  ).toBeVisible()
  // but we also never checked that privacy consent box
  await expect(
    page.getByText(
      /you must agree to the terms of service and privacy policy/i,
    ),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/onboarding\/google/)

  // empty username
  await usernameInput.fill('')
  await createAccountButton.click()
  await expect(page.getByText(/username is required/i)).toBeVisible()
  await expect(page).toHaveURL(/\/onboarding\/google/)

  // too short username
  await usernameInput.fill(
    faker.string.alphanumeric({ length: USERNAME_MIN_LENGTH - 1 }),
  )
  await createAccountButton.click()
  await expect(page.getByText(/username is too short/i)).toBeVisible()

  // too long username
  await usernameInput.fill(
    faker.string.alphanumeric({
      length: USERNAME_MAX_LENGTH + 1,
    }),
  )
  // we are truncating the user's input
  expect((await usernameInput.inputValue()).length).toBe(USERNAME_MAX_LENGTH)
  await createAccountButton.click()
  await expect(page.getByText(/username is too long/i)).not.toBeVisible()

  // still unchecked 'terms of service' checkbox
  await usernameInput.fill(
    normalizeUsername(`U5er_name_0k_${faker.person.lastName()}`),
  )
  await createAccountButton.click()
  await expect(
    page.getByText(/must agree to the terms of service and privacy policy/i),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/onboarding\/google/)

  // we are all set up and ...
  await page
    .getByLabel(
      /ești de acord cu termenii de serviciu și politica de confidențialitate/i,
    )
    .check()
  await createAccountButton.click()
  await expect(createAccountButton.getByText('error')).not.toBeAttached()

  // ... sign up is successful!
  await expect(page.getByText(/thanks for signing up/i)).toBeVisible()
})

test('login as existing user', async ({ page, insertNewUser }) => {
  const password = faker.internet.password()
  const user = await insertNewUser({ password })
  invariant(user.name, 'User name not found')
  await page.goto('/login')
  await page.getByRole('textbox', { name: /username/i }).fill(user.username)
  await page.getByLabel(/^parola$/i).fill(password)
  await page.getByRole('button', { name: /log in/i }).click()
  await expect(page).toHaveURL(`/home`)

  await expect(page.getByRole('link', { name: user.name })).toBeVisible()
})

test('reset password with a link', async ({ page, insertNewUser }) => {
  const originalPassword = faker.internet.password()
  const user = await insertNewUser({ password: originalPassword })
  invariant(user.name, 'User name not found')
  await page.goto('/login')

  await page.getByRole('link', { name: /ai uitat parola/i }).click()
  await expect(page).toHaveURL('/forgot-password')

  await expect(
    page.getByRole('heading', { name: /forgot password/i }),
  ).toBeVisible()
  await page.getByRole('textbox', { name: /username/i }).fill(user.username)
  await page.getByRole('button', { name: /recover password/i }).click()
  await expect(
    page.getByRole('button', { name: /recover password/i, disabled: true }),
  ).toBeVisible()
  await expect(page.getByText(/check your email/i)).toBeVisible()

  const email = await readEmail(user.email)
  invariant(email, 'Email not found')
  expect(email.subject).toMatch(/password reset/i)
  expect(email.to).toBe(user.email.toLowerCase())
  expect(email.from).toBe('hello@rs.mindle.ro')
  const resetPasswordUrl = extractUrl(email.text)
  invariant(resetPasswordUrl, 'Reset password URL not found')
  await page.goto(resetPasswordUrl)

  await expect(page).toHaveURL(/\/verify/)

  await page
    .getByRole('main')
    .getByRole('button', { name: /submit/i })
    .click()

  await expect(page).toHaveURL(`/reset-password`)
  const newPassword = faker.internet.password()
  await page.getByLabel(/^new password$/i).fill(newPassword)
  await page.getByLabel(/^confirm password$/i).fill(newPassword)

  await page.getByRole('button', { name: /reset password/i }).click()
  await expect(
    page.getByRole('button', { name: /reset password/i, disabled: true }),
  ).toBeVisible()

  await expect(page).toHaveURL('/login')
  await page.getByRole('textbox', { name: /username/i }).fill(user.username)
  await page.getByLabel(/^parola$/i).fill(originalPassword)
  await page.getByRole('button', { name: /log in/i }).click()

  await expect(page.getByText(/invalid username or password/i)).toBeVisible()

  await page.getByLabel(/^parola$/i).fill(newPassword)
  await page.getByRole('button', { name: /log in/i }).click()

  await expect(page).toHaveURL(`/home`)

  await expect(page.getByRole('link', { name: user.name })).toBeVisible()
})

test('reset password with a short code', async ({ page, insertNewUser }) => {
  const user = await insertNewUser()
  await page.goto('/login')

  await page.getByRole('link', { name: /ai uitat parola/i }).click()
  await expect(page).toHaveURL('/forgot-password')

  await expect(
    page.getByRole('heading', { name: /forgot password/i }),
  ).toBeVisible()
  await page.getByRole('textbox', { name: /username/i }).fill(user.username)
  await page.getByRole('button', { name: /recover password/i }).click()
  await expect(
    page.getByRole('button', { name: /recover password/i, disabled: true }),
  ).toBeVisible()
  await expect(page.getByText(/check your email/i)).toBeVisible()

  const email = await readEmail(user.email)
  invariant(email, 'Email not found')
  expect(email.subject).toMatch(/password reset/i)
  expect(email.to).toBe(user.email)
  expect(email.from).toBe('hello@rs.mindle.ro')
  const codeMatch = email.text.match(CODE_REGEX)
  const code = codeMatch?.groups?.code
  invariant(code, 'Reset Password code not found')
  await page.getByRole('textbox', { name: /code/i }).fill(code)
  await page.getByRole('button', { name: /submit/i }).click()

  await expect(page).toHaveURL(`/reset-password`)
})
