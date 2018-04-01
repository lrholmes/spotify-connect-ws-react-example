const CLIENT_ID = '582d27d30e174a0ba8343e52b440ab09'
const LS_KEYS = {
  TOKEN: 'spotifyToken',
  TOKEN_EXPIRES: 'spotifyTokenExpiry',
  USERNAME: 'spotifyUsername'
}
const REDIRECT_URI = window.location.origin + '/callback/'

const scope = ['user-read-playback-state', 'user-modify-playback-state']

export const LOGIN_URL = `https://accounts.spotify.com/authorize/?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(
  REDIRECT_URI
)}&scope=${encodeURIComponent(scope.join(' '))}`

export const login = () => {
  return new Promise((resolve, reject) => {
    const popup = window.open(
      LOGIN_URL,
      '_blank',
      'width=600,height=600,toolbar=0,menubar=0,location=0,status=1,scrollbars=0,resizable=0,left=0,top=0'
    )

    const listener = setInterval(() => {
      if (popup) {
        popup.postMessage('login', window.location)
      } else {
        if (checkToken()) {
          resolve()
          window.onmessage = null
        }
      }
    }, 1000)

    window.onmessage = event => {
      const { token, expiry } = JSON.parse(event.data)
      storeToken(token, expiry)
      clearInterval(listener)
      window.onmessage = null
      return resolve(token)
    }
  })
}

export const logout = () => {
  localStorage.removeItem(LS_KEYS.USERNAME)
  localStorage.removeItem(LS_KEYS.TOKEN)
  localStorage.removeItem(LS_KEYS.TOKEN_EXPIRES)
}

export const storeToken = (token, expiry = 3600) => {
  localStorage.setItem(LS_KEYS.TOKEN, token)
  localStorage.setItem(
    LS_KEYS.TOKEN_EXPIRES,
    new Date().getTime() + expiry * 1000
  )
}

export const getToken = () => {
  const token = localStorage.getItem(LS_KEYS.TOKEN)
  return token
}

export const checkToken = () => {
  const token = localStorage.getItem(LS_KEYS.TOKEN)
  const expiry = localStorage.getItem(LS_KEYS.TOKEN_EXPIRES)

  if (!token || !expiry) {
    return false
  }

  const timeNow = new Date().getTime()
  const expired = expiry - timeNow < 1000 * 60 * 5
  if (expired) {
    return false
  }

  return true
}
