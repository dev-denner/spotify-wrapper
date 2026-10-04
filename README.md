<div align="center">

# Spotify Wrapper

**A small JavaScript client for the Spotify Web API, built as a library with tests, linting and coverage.**

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=111)
![Mocha](https://img.shields.io/badge/Mocha-8D6748?logo=mocha&logoColor=white)
![NYC Coverage](https://img.shields.io/badge/Coverage-NYC-informational)
![License](https://img.shields.io/badge/License-MIT-green)

[![Coverage Status](https://coveralls.io/repos/github/dev-denner/spotify-wrapper/badge.svg?branch=master)](https://coveralls.io/github/dev-denner/spotify-wrapper?branch=master)

</div>

---

## Overview

Spotify Wrapper is a lightweight JavaScript library that encapsulates Spotify Web API search calls behind a small client surface.

The implementation focuses on the original scope of the repository:

- generic search across supported Spotify resource types;
- dedicated helpers for artists, albums, tracks and playlists;
- Bearer token authentication;
- market, pagination and external-audio search options;
- consistent API error handling;
- injectable `fetch` for deterministic tests and non-browser environments.

## Usage

### Create a reusable client

```js
import { createClient } from 'spotify-wrapper';

const spotify = createClient(process.env.SPOTIFY_ACCESS_TOKEN);

spotify.searchArtists('Miles Davis', {
  market: 'BR',
  limit: 5,
}).then((result) => {
  console.log(result.artists.items);
});
```

### Search directly

```js
import { searchTracks } from 'spotify-wrapper';

searchTracks('Doxy', {
  accessToken: process.env.SPOTIFY_ACCESS_TOKEN,
  market: 'BR',
}).then((result) => {
  console.log(result.tracks.items);
});
```

### Generic search

```js
import { search } from 'spotify-wrapper';

search('Kind of Blue', ['album', 'track'], {
  accessToken: process.env.SPOTIFY_ACCESS_TOKEN,
  limit: 10,
}).then((result) => {
  console.log(result);
});
```

The generic search supports Spotify's current search types:

`album` · `artist` · `playlist` · `track` · `show` · `episode` · `audiobook`

## API

### `createClient(accessToken, defaultOptions?)`

Creates a client that reuses an access token and optional defaults.

```js
const spotify = createClient(token, {
  market: 'BR',
  limit: 5,
  fetch: customFetch,
});
```

The returned client exposes:

- `search(query, types, options?)`
- `searchArtists(query, options?)`
- `searchAlbums(query, options?)`
- `searchTracks(query, options?)`
- `searchPlaylists(query, options?)`

### Search options

| Option | Description |
| --- | --- |
| `accessToken` | Spotify OAuth access token. Required when using the standalone functions. |
| `market` | Two-letter ISO country code such as `BR` or `US`. |
| `limit` | Results per resource type. Current Spotify search maximum: `10`. |
| `offset` | Pagination offset from `0` to `1000`. |
| `includeExternal` | Set to `audio` to include externally hosted playable audio. |
| `fetch` | Optional Fetch API-compatible implementation, useful for Node.js/polyfills and tests. |

## Error handling

Non-successful Spotify responses reject with `SpotifyApiError`, preserving the HTTP status and Spotify response body.

```js
import { SpotifyApiError, searchAlbums } from 'spotify-wrapper';

searchAlbums('Blue', {
  accessToken: token,
}).catch((error) => {
  if (error instanceof SpotifyApiError) {
    console.error(error.status, error.message);
  }
});
```

Input is validated before the HTTP request. Invalid resource types, market codes, limits and offsets fail early instead of sending malformed requests.

## Engineering practices

- test suite with **Mocha + Chai**;
- mocks/stubs with **Sinon**;
- coverage through **NYC** and Coveralls;
- linting based on ESLint;
- Babel build step;
- injected HTTP dependency for isolated tests;
- Git pre-push quality check;
- MIT licensed library structure.

## Project structure

```text
.
├── src/
│   └── main.js
├── tests/
│   └── main.spec.js
├── .babelrc
├── .eslintrc.json
├── CONTRIBUTING.md
└── package.json
```

## Requirements

The client relies on the Fetch API. Modern browsers and recent Node.js versions provide it natively. Other environments can pass a compatible implementation through `options.fetch`.

A Spotify access token must be obtained separately. This library intentionally does not implement the OAuth authorization flow.

## Development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Lint:

```bash
npm run lint
```

Build:

```bash
npm run build
```

The compiled package entry point is `lib/main.js`.

## Why it remains in my portfolio

This is a historical project that I completed around its original API-client idea instead of replacing it with a different application. Its dependency versions reflect the period in which the repository was started and are not intended as current dependency recommendations.

It demonstrates:

- HTTP API-client design;
- input and API-error handling;
- dependency injection;
- automated testing and mocking;
- coverage and linting discipline;
- packaging/build concerns;
- maintaining a reusable library rather than only application code.

## License

MIT — see [LICENSE.md](LICENSE.md).

---

<div align="center">

**Denner Fernandes** · [GitHub profile](https://github.com/dev-denner)

</div>
