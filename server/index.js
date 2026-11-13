import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import Stripe from 'stripe'

const port = process.env.PORT || 4242
const secretKey = process.env.STRIPE_SECRET_KEY

if (!secretKey) {
  console.warn('Missing STRIPE_SECRET_KEY. Add it to your .env file before donating.')
}

const stripe = secretKey ? new Stripe(secretKey) : null
const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, stripeConfigured: Boolean(stripe) })
})

app.get('/api/donations/total', async (_req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured on the server.' })
  }

  try {
    let totalCents = 0
    let startingAfter

    do {
      const page = await stripe.paymentIntents.list({
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      })

      for (const paymentIntent of page.data) {
        if (
          paymentIntent.status === 'succeeded' &&
          paymentIntent.metadata.campaign === 'pawly-donations' &&
          paymentIntent.currency === 'usd'
        ) {
          totalCents += paymentIntent.amount_received
        }
      }

      startingAfter = page.has_more ? page.data[page.data.length - 1]?.id : undefined
    } while (startingAfter)

    res.json({ totalCents })
  } catch (error) {
    console.error('Unable to fetch donation total:', error.message)
    res.status(500).json({ error: 'Unable to load the donation total.' })
  }
})

app.post('/api/create-payment-intent', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured on the server.' })
  }

  const amount = Number(req.body?.amount)

  if (!Number.isFinite(amount) || amount < 1 || amount > 10000) {
    return res.status(400).json({ error: 'Amount must be between $1 and $10,000.' })
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      description: 'Pawly dog rescue donation',
      metadata: { campaign: 'pawly-donations' },
    })

    res.json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error('Unable to create PaymentIntent:', error.message)
    res.status(500).json({ error: 'Unable to start the payment. Please try again.' })
  }
})

app.listen(port, () => {
  console.log(`Stripe server listening on http://localhost:${port}`)
})
