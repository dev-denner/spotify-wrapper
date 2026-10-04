import { describe, expect, it, vi } from 'vitest';
import {
  createClient,
  search,
  searchAlbums,
  searchArtists,
  searchPlaylists,
  searchTracks,
  type FetchLike,
  type SpotifyApiError,
} from '../src/index.js';

const jsonResponse = (body: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

const createFetchMock = (response: Response): FetchLike =>
  vi.fn<FetchLike>().mockResolvedValue(response);

describe('Spotify Wrapper', () => {
  describe('search', () => {
    it('builds an authenticated Spotify search request', async () => {
      const fetchMock = createFetchMock(
        jsonResponse({ artists: { items: [] } }),
      );

      await search('Miles Davis', 'artist', {
        accessToken: 'abc123',
        fetch: fetchMock,
        market: 'br',
        limit: 10,
        offset: 5,
        includeExternal: 'audio',
      });

      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/search?q=Miles+%20Davis&type=artist&market=BR&limit=10&offset=5&include_external=audio'
          .replace('+%20', '+'),
        expect.objectContaining({
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: 'Bearer abc123',
          },
        }),
      );
    });

    it('supports multiple search types', async () => {
      const fetchMock = createFetchMock(jsonResponse({}));

      await search('Kind of Blue', ['album', 'track'], {
        accessToken: 'token',
        fetch: fetchMock,
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/search?q=Kind+of+Blue&type=album%2Ctrack',
        expect.any(Object),
      );
    });

    it('preserves an existing Bearer prefix', async () => {
      const fetchMock = createFetchMock(jsonResponse({}));

      await searchTracks('Doxy', {
        accessToken: 'Bearer abc123',
        fetch: fetchMock,
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer abc123',
          }),
        }),
      );
    });

    it('rejects an invalid search type at runtime', async () => {
      const fetchMock = createFetchMock(jsonResponse({}));

      await expect(
        search('query', 'concert' as never, {
          accessToken: 'token',
          fetch: fetchMock,
        }),
      ).rejects.toThrow('Unsupported Spotify search type: concert.');

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('validates Spotify search limits before making a request', async () => {
      const fetchMock = createFetchMock(jsonResponse({}));

      await expect(
        search('query', 'track', {
          accessToken: 'token',
          fetch: fetchMock,
          limit: 11,
        }),
      ).rejects.toThrow('limit must be an integer between 1 and 10.');

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('surfaces Spotify API errors with status and response body', async () => {
      const body = {
        error: {
          status: 401,
          message: 'The access token expired',
        },
      };
      const fetchMock = createFetchMock(jsonResponse(body, { status: 401 }));

      await expect(
        searchTracks('Doxy', {
          accessToken: 'token',
          fetch: fetchMock,
        }),
      ).rejects.toMatchObject<Partial<SpotifyApiError>>({
        name: 'SpotifyApiError',
        message: 'The access token expired',
        status: 401,
        body,
      });
    });
  });

  describe('specific search helpers', () => {
    const cases = [
      { method: searchArtists, type: 'artist' },
      { method: searchAlbums, type: 'album' },
      { method: searchTracks, type: 'track' },
      { method: searchPlaylists, type: 'playlist' },
    ] as const;

    it.each(cases)('searches the $type resource', async ({ method, type }) => {
      const fetchMock = createFetchMock(jsonResponse({}));

      await method('test query', {
        accessToken: 'token',
        fetch: fetchMock,
      });

      expect(fetchMock).toHaveBeenCalledWith(
        `https://api.spotify.com/v1/search?q=test+query&type=${type}`,
        expect.any(Object),
      );
    });
  });

  describe('createClient', () => {
    it('reuses token and default options', async () => {
      const fetchMock = createFetchMock(
        jsonResponse({ tracks: { items: [] } }),
      );
      const client = createClient('client-token', {
        fetch: fetchMock,
        market: 'BR',
        limit: 5,
      });

      await client.searchTracks('Doxy');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/search?q=Doxy&type=track&market=BR&limit=5',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer client-token',
          }),
        }),
      );
    });

    it('allows per-call options to override client defaults', async () => {
      const fetchMock = createFetchMock(jsonResponse({}));
      const client = createClient('client-token', {
        fetch: fetchMock,
        market: 'BR',
        limit: 5,
      });

      await client.searchAlbums('Blue', {
        market: 'US',
        limit: 2,
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/search?q=Blue&type=album&market=US&limit=2',
        expect.any(Object),
      );
    });
  });
});
