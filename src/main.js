const API_BASE_URL = 'https://api.spotify.com/v1';
const SEARCH_TYPES = [
  'album',
  'artist',
  'playlist',
  'track',
  'show',
  'episode',
  'audiobook',
];

const ensureString = (value, fieldName) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${fieldName} must be a non-empty string.`);
  }

  return value.trim();
};

const ensureIntegerInRange = (value, fieldName, min, max) => {
  if (value === undefined) {
    return;
  }

  if (typeof value !== 'number' || Math.floor(value) !== value || value < min || value > max) {
    throw new RangeError(`${fieldName} must be an integer between ${min} and ${max}.`);
  }
};

const normalizeTypes = (types) => {
  const values = Array.isArray(types) ? types : ensureString(types, 'type').split(',');
  const normalized = values.map(type => ensureString(type, 'type').toLowerCase());

  normalized.forEach((type) => {
    if (SEARCH_TYPES.indexOf(type) === -1) {
      throw new RangeError(`Unsupported Spotify search type: ${type}.`);
    }
  });

  return normalized.filter((type, index) => normalized.indexOf(type) === index);
};

const getFetch = (options) => {
  if (options.fetch) {
    return options.fetch;
  }

  if (typeof fetch !== 'undefined') {
    return fetch;
  }

  throw new Error('No Fetch API implementation is available. Pass one through options.fetch.');
};

const buildQuery = (query, types, options) => {
  const params = [
    `q=${encodeURIComponent(ensureString(query, 'query'))}`,
    `type=${encodeURIComponent(normalizeTypes(types).join(','))}`,
  ];

  if (options.market !== undefined) {
    const market = ensureString(options.market, 'market').toUpperCase();

    if (!/^[A-Z]{2}$/.test(market)) {
      throw new RangeError('market must be a two-letter ISO 3166-1 alpha-2 country code.');
    }

    params.push(`market=${encodeURIComponent(market)}`);
  }

  ensureIntegerInRange(options.limit, 'limit', 1, 10);
  if (options.limit !== undefined) {
    params.push(`limit=${options.limit}`);
  }

  ensureIntegerInRange(options.offset, 'offset', 0, 1000);
  if (options.offset !== undefined) {
    params.push(`offset=${options.offset}`);
  }

  if (options.includeExternal !== undefined) {
    if (options.includeExternal !== 'audio') {
      throw new RangeError('includeExternal must be "audio" when provided.');
    }

    params.push('include_external=audio');
  }

  return params.join('&');
};

const parseErrorBody = response => (
  typeof response.json === 'function'
    ? response.json().catch(() => null)
    : Promise.resolve(null)
);

export class SpotifyApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'SpotifyApiError';
    this.status = status;
    this.body = body;
  }
}

export const search = (query, types, options = {}) => {
  const accessToken = ensureString(options.accessToken, 'accessToken');
  const request = getFetch(options);
  const queryString = buildQuery(query, types, options);
  const authorization = /^Bearer\s+/i.test(accessToken)
    ? accessToken
    : `Bearer ${accessToken}`;

  return request(`${API_BASE_URL}/search?${queryString}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: authorization,
    },
  }).then((response) => {
    if (!response || typeof response.ok !== 'boolean') {
      throw new TypeError('Fetch implementation returned an invalid response object.');
    }

    if (!response.ok) {
      return parseErrorBody(response).then((body) => {
        const spotifyMessage = body
          && body.error
          && body.error.message
          ? body.error.message
          : 'Spotify API request failed.';

        throw new SpotifyApiError(spotifyMessage, response.status, body);
      });
    }

    return response.json();
  });
};

export const searchArtists = (query, options = {}) => search(query, 'artist', options);
export const searchAlbums = (query, options = {}) => search(query, 'album', options);
export const searchTracks = (query, options = {}) => search(query, 'track', options);
export const searchPlaylists = (query, options = {}) => search(query, 'playlist', options);

export const createClient = (accessToken, defaultOptions = {}) => {
  const withDefaults = options => Object.assign({}, defaultOptions, options, { accessToken });

  return {
    search: (query, types, options = {}) => search(query, types, withDefaults(options)),
    searchArtists: (query, options = {}) => searchArtists(query, withDefaults(options)),
    searchAlbums: (query, options = {}) => searchAlbums(query, withDefaults(options)),
    searchTracks: (query, options = {}) => searchTracks(query, withDefaults(options)),
    searchPlaylists: (query, options = {}) => searchPlaylists(query, withDefaults(options)),
  };
};
