import netlifyIdentity from 'netlify-identity-widget'

let initialized = false

export function initAuth(onChange) {
  if (!initialized) {
    netlifyIdentity.init()
    initialized = true
  }

  const sync = () => onChange(netlifyIdentity.currentUser())
  netlifyIdentity.on('login', sync)
  netlifyIdentity.on('logout', sync)
  sync()

  return () => {
    netlifyIdentity.off('login', sync)
    netlifyIdentity.off('logout', sync)
  }
}

export function openLogin() {
  netlifyIdentity.open('login')
}

export function logout() {
  netlifyIdentity.logout()
}

export function getToken(user) {
  return user?.token?.access_token || user?.token?.accessToken || null
}
