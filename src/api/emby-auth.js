import { embyClient } from './emby-client'

export function fetchSystemInfo() {
  return embyClient.get('/System/Info')
}

export function authenticateByName(username, password) {
  return embyClient.post(
    '/Users/AuthenticateByName',
    {
      Username: username,
      Pw: password || '',
    },
    { params: { format: 'json' } }
  )
}
