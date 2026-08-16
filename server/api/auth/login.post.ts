import bcrypt from 'bcryptjs'

/**
 * Login a utente singolo.
 *
 * Nessuna tabella utenti: email e hash della password vivono nelle variabili
 * d'ambiente. Lo stesso messaggio d'errore per email sbagliata e password
 * sbagliata evita di rivelare quale delle due non corrispondeva.
 */
export default defineEventHandler(async (event) => {
  const { email, password } = await readBody<{ email: string, password: string }>(event)

  const expectedEmail = process.env.AUTH_EMAIL ?? ''
  const passwordHash = process.env.AUTH_PASSWORD_HASH ?? ''

  const emailMatches = typeof email === 'string' && email.trim().toLowerCase() === expectedEmail.trim().toLowerCase()
  const passwordMatches = emailMatches && typeof password === 'string' && await bcrypt.compare(password, passwordHash)

  if (!emailMatches || !passwordMatches) {
    throw createError({ statusCode: 401, statusMessage: 'Credenziali non valide.' })
  }

  const user = {
    id: 'owner',
    email: expectedEmail,
    displayName: process.env.AUTH_DISPLAY_NAME ?? 'Titolare',
  }

  await setUserSession(event, { user })
  return user
})
