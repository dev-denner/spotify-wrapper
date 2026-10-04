const API_BASE_URL = 'https://api.spotify.com/v1';

export const SEARCH_TYPES = [
  'album',
  'artist',
  'playlist',
  'track',
  'show',
  'episode',
  'audiobook',
] as const;

export type SearchType = (typeof SEARCH_TYPES)[number];
export type SpotifyEntity = Record<string, unknown>;

export interface SpotifyPaging<T = SpotifyEntity> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

export interface SpotifySearchResponse {
  albums?: SpotifyPaging;
  artists?: SpotifyPaging;
  playlists?: SpotifyPaging;
  tracks?: SpotifyPaging;
  shows?: SpotifyPaging;
  episodes?: SpotifyPaging;
  audiobooks?: SpotifyPaging;
}

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface SearchOptions {
  accessToken: string;
  market?: string;
  limit?: number;
  offset?: number;
  includeExternal?: 'audio';
  fetch?: FetchLike;
}

export type ClientSearchOptions = Omit<Partial<SearchOptions>, 'accessToken'>;

export interface SpotifyClient {
  search(
    query: string,
    types: SearchType | readonly SearchType[],
    options?: ClientSearchOptions,
  ): Promise<SpotifySearchResponse>;
  searchArtists(
    query: string,
    options?: ClientSearchOptions,
  ): Promise<SpotifySearchResponse>;
  searchAlbums(
    query: string,
    options?: ClientSearchOptions,
  ): Promise<SpotifySearchResponse>;
  searchTracks(
    query: string,
    options?: ClientSearchOptions,
  ): Promise<SpotifySearchResponse>;
  searchPlaylists(
    query: string,
    options?: ClientSearchOptions,
  ): Promise<SpotifySearchResponse>;
}

interface SpotifyErrorBody {
  error?: {
    message?: string;
    status?: number;
  };
}

const ensureString = (value: unknown, fieldName: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${fieldName} must be a non-empty string.`);
  }

  return value.trim();
};

const ensureIntegerInRange = (
  value: number | undefined,
  fieldName: string,
  min: number,
  max: number,
): void => {
  if (value === undefined) {
    return;
  }

  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(
      `${fieldName} must be an integer between ${min} and ${max}.`,
    );
  }
};

const isSearchType = (value: string): value is SearchType =>
  SEARCH_TYPES.some((type) => type === value);

const normalizeTypes = (
  types: SearchType | readonly SearchType[],
): SearchType[] => {
  const values = Array.isArray(types) ? types : [types];
  const normalized = values.map((type) =>
    ensureString(type, 'type').toLowerCase(),
  );

  normalized.forEach((type) => {
    if (!isSearchType(type)) {
      throw new RangeError(`Unsupported Spotify search type: ${type}.`);
    }
  });

  return [...new Set(normalized as SearchType[])];
};

const getFetch = (customFetch?: FetchLike): FetchLike => {
  if (customFetch) {
    return customFetch;
  }

  if (typeof globalThis.fetch === 'function') {
    return globalThis.fetch.bind(globalThis);
  }

  throw new Error(
    'No Fetch API implementation is available. Pass one through options.fetch.',
  );
};

const buildQuery = (
  query: string,
  types: SearchType | readonly SearchType[],
  options: Omit<SearchOptions, 'accessToken' | 'fetch'>,
): URLSearchParams => {
  const params = new URLSearchParams({
    q: ensureString(query, 'query'),
    type: normalizeTypes(types).join(','),
  });

  if (options.market !== undefined) {
    const market = ensureString(options.market, 'market').toUpperCase();

    if (!/^[A-Z]{2}$/.test(market)) {
      throw new RangeError(
        'market must be a two-letter ISO 3166-1 alpha-2 country code.',
      );
    }

    params.set('market', market);
  }

  ensureIntegerInRange(options.limit, 'limit', 1, 10);
  if (options.limit !== undefined) {
    params.set('limit', String(options.limit));
  }

  ensureIntegerInRange(options.offset, 'offset', 0, 1000);
  if (options.offset !== undefined) {
    params.set('offset', String(options.offset));
  }

  if (options.includeExternal !== undefined) {
    if (options.includeExternal !== 'audio') {
      throw new RangeError('includeExternal must be "audio" when provided.');
    }

    params.set('include_external', 'audio');
  }

  return params;
};

const parseErrorBody = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getSpotifyErrorMessage = (body: unknown): string => {
  if (
    typeof body === 'object'
    && body !== null
    && 'error' in body
  ) {
    const candidate = body as SpotifyErrorBody;

    if (typeof candidate.error?.message === 'string') {
      return candidate.error.message;
    }
  }

  return 'Spotify API request failed.';
};

export class SpotifyApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'SpotifyApiError';
    this.status = status;
    this.body = body;
  }
}

export const search = async (
  query: string,
  types: SearchType | readonly SearchType[],
  options: SearchOptions,
): Promise<SpotifySearchResponse> => {
  const accessToken = ensureString(options.accessToken, 'accessToken');
  const request = getFetch(options.fetch);
  const queryString = buildQuery(query, types, options);
  const authorization = /^Bearer\s+/i.test(accessToken)
    ? accessToken
    : `Bearer ${accessToken}`;

  const response = await request(
    `${API_BASE_URL}/search?${queryString.toString()}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: authorization,
      },
    },
  );

  if (!response.ok) {
    const body = await parseErrorBody(response);
    throw new SpotifyApiError(
      getSpotifyErrorMessage(body),
      response.status,
      body,
    );
  }

  return response.json() as Promise<SpotifySearchResponse>;
};

export const searchArtists = (
  query: string,
  options: SearchOptions,
): Promise<SpotifySearchResponse> => search(query, 'artist', options);

export const searchAlbums = (
  query: string,
  options: SearchOptions,
): Promise<SpotifySearchResponse> => search(query, 'album', options);

export const searchTracks = (
  query: string,
  options: SearchOptions,
): Promise<SpotifySearchResponse> => search(query, 'track', options);

export const searchPlaylists = (
  query: string,
  options: SearchOptions,
): Promise<SpotifySearchResponse> => search(query, 'playlist', options);

export const createClient = (
  accessToken: string,
  defaultOptions: ClientSearchOptions = {},
): SpotifyClient => {
  const withDefaults = (
    options: ClientSearchOptions = {},
  ): SearchOptions => ({
    ...defaultOptions,
    ...options,
    accessToken,
  });

  return {
    search: (query, types, options) =>
      search(query, types, withDefaults(options)),
    searchArtists: (query, options) =>
      searchArtists(query, withDefaults(options)),
    searchAlbums: (query, options) =>
      searchAlbums(query, withDefaults(options)),
    searchTracks: (query, options) =>
      searchTracks(query, withDefaults(options)),
    searchPlaylists: (query, options) =>
      searchPlaylists(query, withDefaults(options)),
  };
};
