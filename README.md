# Tuesday

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```

### Trakt Setup

To enable Trakt integration:

1. Create a Trakt.tv account at https://trakt.tv/
2. Go to https://trakt.tv/oauth/applications and create a new application
3. Set the redirect URI to `urn:ietf:wg:oauth:2.0:oob` (for desktop applications)
4. Copy the Client ID and Client Secret
5. In the application, go to Settings > Trakt and enter your credentials
6. Authorize the application to access your Trakt account

### IPTV Playlist Setup

To add IPTV playlists:

1. Obtain an M3U playlist URL from your IPTV provider
2. In the application, go to Settings > IPTV > Playlists
3. Click "Add Playlist" and enter:
   - Playlist name
   - M3U URL
   - Optional: EPG (XMLTV) URL for program guide
4. Save the playlist and wait for channels to load
5. You can organize channels into categories and add favorites
# tuesday
