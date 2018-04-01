import React from 'react'
import qs from 'query-string'
import { storeToken } from './auth'

export default () => {
  const hash = window.location.hash
  let hasToken = hash.includes('access_token')

  const parsed = qs.parse(hash)

  if (hasToken) {
    const { access_token: token, expires_in: expiry } = parsed
    window.addEventListener('message', event => {
      var message = event.data
      if (message === 'login') {
        event.source.postMessage(
          JSON.stringify({
            token,
            expiry
          }),
          event.origin
        )
        window.close()
      }
    })
    window.setTimeout(() => {
      storeToken(token, expiry)
      window.close()
    }, 1500)
  }
  return <div>Logging in...</div>
}
