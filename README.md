<div align="center">

# Spotify Wrapper

**A small TypeScript client for Spotify Web API search, focused on a typed API, runtime validation and isolated tests.**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## Overview

Spotify Wrapper is a lightweight **TypeScript** library that encapsulates Spotify Web API search calls behind a small typed client.

The project started as a JavaScript wrapper and was later modernized without changing its original purpose. The current implementation keeps the library intentionally small while using a modern toolchain and stricter contracts.

It provides:

- typed generic search across Spotify resource types;
- dedicated helpers for artists, albums, tracks and playlists;
- Bearer token authentication;
- market and pagination options;
- Spotify API error handling;
- injectable `fetch` for isolated tests;
- generated TypeScript declarations for consumers;
- runtime validation for JavaScript consumers and external input.

## Installation

```bash
npm install
```

## Usage

### Reusable client

```ts
import { createClient } from 'spotify-wrapper';

const spotify = createClient(process.env.SPOTIFY_ACCESS_TOKEN!);

const result = await spotify.searchArtists('Miles Davis', {
  market: 'BR',
  limit: 5,
});

console.log(result.artists?.items);
```

### Standalone helper

```ts
import { searchTracks } from 'spotify-wrapper';

const result = await searchTracks('Doxy', {
  accessToken: process.env.SPOTIFY_ACCESS_TOKEN!,
  market: 'BR',
});

console.log(result.tracks?.items);
```

### Generic search

```ts
import { search } from 'spotify-wrapper';

const result = await search('Kind of Blue', ['album', 'track'], {
  accessToken: process.env.SPOTIFY_ACCESS_TOKEN!,
  limit: 10,
});

console.log(result);
```

The generic search accepts:

`album` · `artist` · `playlist` · `track` · `show` · `episode` · `audiobook`

Because `SearchType` is a TypeScript union, invalid resource types are rejected by the compiler. Runtime validation is still preserved for JavaScript consumers and untyped external input.

## API

### `createClient(accessToken, defaultOptions?)`

Creates a client that reuses an access token and optional defaults.

The returned client exposes:

- `search(query, types, options?)`
- `searchArtists(query, options?)`
- `searchAlbums(query, options?)`
- `searchTracks(query, options?)`
- `searchPlaylists(query, options?)`

### Search options

| Option | Description |
| --- | --- |
| `accessToken` | Spotify OAuth access token. Required by standalone functions. |
| `market` | Two-letter ISO country code such as `BR` or `US`. |
| `limit` | Results per resource type, from `1` to `10`. |
| `offset` | Pagination offset from `0` to `1000`. |
| `includeExternal` | `audio` when externally hosted playable audio should be included. |
| `fetch` | Optional Fetch API-compatible function for testing or custom runtimes. |

## Error handling

Spotify HTTP failures throw `SpotifyApiError`, preserving the status code and parsed response body.

```ts
import { SpotifyApiError, searchAlbums } from 'spotify-wrapper';

try {
  await searchAlbums('Blue', {
    accessToken: token,
  });
} catch (error) {
  if (error instanceof SpotifyApiError) {
    console.error(error.status, error.message);
  }
}
```

## TypeScript

The public API exports types including:

- `SearchType`
- `SearchOptions`
- `ClientSearchOptions`
- `SpotifyClient`
- `SpotifyPaging`
- `SpotifySearchResponse`
- `FetchLike`

The build emits JavaScript, declaration files and source maps to `dist/`.

## Engineering practices

- strict **TypeScript** configuration;
- **Vitest** for automated tests and mocking;
- V8 coverage support;
- **ESLint** flat configuration with typescript-eslint;
- zero runtime dependencies;
- injected HTTP dependency for deterministic tests;
- CI quality gate covering lint, typecheck, tests and build;
- ESM package exports with generated declarations.

## Project structure

```text
.
├── src/
│   └── index.ts
├── tests/
│   └── index.spec.ts
├── .github/
│   └── workflows/
│       └── ci.yml
├── eslint.config.mjs
├── tsconfig.json
├── CONTRIBUTING.md
└── package.json
```

## Requirements

- Node.js 20 or newer for development;
- a Spotify access token for real API calls.

The library uses the Fetch API available in modern runtimes. A compatible implementation can also be injected through `options.fetch`.

OAuth authorization itself is intentionally outside the scope of this package.

## Development

```bash
npm install
npm run check
```

Individual commands:

```bash
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
```

## Modernization

The repository originally used Babel 6, Mocha, Chai, Sinon and an older ESLint setup. The current version replaces that toolchain with TypeScript, Vitest and modern ESLint while preserving the original API-client concept.

This keeps the repository useful as both a working library and an example of incremental modernization: preserve the domain and public intent, replace obsolete infrastructure, strengthen contracts, and verify behavior through tests.

## License

MIT — see [LICENSE.md](LICENSE.md).

---

<div align="center">

**Denner Fernandes** · [GitHub profile](https://github.com/dev-denner)

</div>
