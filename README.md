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

Spotify Wrapper is a lightweight JavaScript library created to encapsulate calls to the Spotify Web API behind a small client surface.

The project is kept in my portfolio mainly because it shows the engineering practices around the code as much as the wrapper itself: automated tests, coverage, linting, build/transpilation and a library-oriented repository structure.

## Engineering practices

- test suite with **Mocha + Chai**;
- mocks/stubs with **Sinon**;
- coverage through **NYC** and Coveralls;
- linting based on ESLint;
- Babel build step;
- Git pre-push quality check;
- MIT licensed library structure.

## Project structure

```text
.
├── src/
│   └── main.js
├── tests/
├── .babelrc
├── .eslintrc.json
├── CONTRIBUTING.md
└── package.json
```

## Requirements

The client relies on the Fetch API. Environments without native `fetch` need a compatible polyfill.

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

## Why it remains in my portfolio

This is a historical project, so its dependencies are intentionally not treated as current recommendations. It remains useful as evidence of:

- API-client design;
- automated testing;
- coverage discipline;
- packaging/build concerns;
- maintaining a reusable library rather than only application code.

## License

MIT — see [LICENSE.md](LICENSE.md).

---

<div align="center">

**Denner Fernandes** · [GitHub profile](https://github.com/dev-denner)

</div>
