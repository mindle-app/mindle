import { HttpResponse, http, passthrough, type HttpHandler } from 'msw'

const { text } = HttpResponse

export const handlers: Array<HttpHandler> = [
  http.post(
    `https://mail.mindle.ro/api/subscribers/subscription-status.php`,
    async ({ request }) => {
      if (process.env.SENDY_API_KEY) return passthrough()
      const formData = await request.formData()
      console.info(
        '🔶 Check newsletter subscription status for:',
        formData.get('email'),
      )
      return text('Subscribed')
    },
  ),
]
