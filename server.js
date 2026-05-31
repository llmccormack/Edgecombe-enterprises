const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const cron = require('node-cron')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOST ?? 'localhost'
const port = parseInt(process.env.PORT ?? '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error handling request:', err)
      res.statusCode = 500
      res.end('Internal server error')
    }
  }).listen(port, () => {
    console.log(`> Edgecombe Enterprises Invoice Manager running at http://${hostname}:${port}`)
  })

  // Daily cron: run at 9 AM every day
  // Marks overdue invoices and sends scheduled reminders
  cron.schedule('0 9 * * *', async () => {
    console.log('[cron] Running daily reminder check…')
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${port}`
      const secret = process.env.CRON_SECRET ?? ''

      const res = await fetch(`${baseUrl}/api/cron`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': secret,
        },
      })

      const json = await res.json()
      console.log('[cron] Done:', JSON.stringify(json))
    } catch (err) {
      console.error('[cron] Failed:', err)
    }
  }, {
    timezone: 'America/New_York',
  })

  console.log('[cron] Daily reminder job scheduled for 9:00 AM ET')
})
