import { expect } from 'chai';
import sinon from 'sinon';
import {
  SpotifyApiError,
  createClient,
  search,
  searchAlbums,
  searchArtists,
  searchPlaylists,
  searchTracks,
} from '../src/main';

const response = body => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve(body),
});

const optionsWith = fetchStub => ({
  accessToken: 'test-token',
  fetch: fetchStub,
});

describe('Spotify Wrapper', () => {
  describe('smoke tests', () => {
    it('should expose the public search methods', () => {
      expect(search).to.be.a('function');
      expect(searchAlbums).to.be.a('function');
      expect(searchArtists).to.be.a('function');
      expect(searchTracks).to.be.a('function');
      expect(searchPlaylists).to.be.a('function');
      expect(createClient).to.be.a('function');
    });
  });

  describe('search', () => {
    it('should call the Spotify search endpoint with encoded parameters', () => {
      const fetchStub = sinon.stub().returns(Promise.resolve(response({ artists: { items: [] } })));

      return search('Miles Davis', 'artist', {
        accessToken: 'abc123',
        fetch: fetchStub,
        market: 'br',
        limit: 10,
        offset: 5,
        includeExternal: 'audio',
      }).then(() => {
        expect(fetchStub.calledOnce).to.equal(true);

        const url = fetchStub.firstCall.args[0];
        const requestOptions = fetchStub.firstCall.args[1];

        expect(url).to.equal(
          'https://api.spotify.com/v1/search?q=Miles%20Davis&type=artist&market=BR&limit=10&offset=5&include_external=audio',
        );
        expect(requestOptions.method).to.equal('GET');
        expect(requestOptions.headers.Authorization).to.equal('Bearer abc123');
        expect(requestOptions.headers.Accept).to.equal('application/json');
      });
    });

    it('should accept multiple search types', () => {
      const fetchStub = sinon.stub().returns(Promise.resolve(response({})));

      return search('Kind of Blue', ['album', 'track'], optionsWith(fetchStub)).then(() => {
        expect(fetchStub.firstCall.args[0]).to.equal(
          'https://api.spotify.com/v1/search?q=Kind%20of%20Blue&type=album%2Ctrack',
        );
      });
    });

    it('should preserve an already-prefixed Bearer token', () => {
      const fetchStub = sinon.stub().returns(Promise.resolve(response({})));

      return search('Doxy', 'track', {
        accessToken: 'Bearer abc123',
        fetch: fetchStub,
      }).then(() => {
        expect(fetchStub.firstCall.args[1].headers.Authorization).to.equal('Bearer abc123');
      });
    });

    it('should reject unsupported search types before making a request', () => {
      const fetchStub = sinon.stub();

      expect(() => search('query', 'concert', optionsWith(fetchStub)))
        .to.throw(RangeError, 'Unsupported Spotify search type: concert.');
      expect(fetchStub.called).to.equal(false);
    });

    it('should validate the current Spotify search limit', () => {
      const fetchStub = sinon.stub();

      expect(() => search('query', 'track', {
        accessToken: 'token',
        fetch: fetchStub,
        limit: 11,
      })).to.throw(RangeError, 'limit must be an integer between 1 and 10.');
      expect(fetchStub.called).to.equal(false);
    });

    it('should surface Spotify API errors with status and response body', () => {
      const body = {
        error: {
          status: 401,
          message: 'The access token expired',
        },
      };
      const fetchStub = sinon.stub().returns(Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve(body),
      }));

      return searchTracks('Doxy', optionsWith(fetchStub))
        .then(() => {
          throw new Error('Expected searchTracks to reject.');
        })
        .catch((error) => {
          expect(error).to.be.instanceof(SpotifyApiError);
          expect(error.message).to.equal('The access token expired');
          expect(error.status).to.equal(401);
          expect(error.body).to.deep.equal(body);
        });
    });
  });

  describe('specific search helpers', () => {
    const cases = [
      { name: 'artists', method: searchArtists, type: 'artist' },
      { name: 'albums', method: searchAlbums, type: 'album' },
      { name: 'tracks', method: searchTracks, type: 'track' },
      { name: 'playlists', method: searchPlaylists, type: 'playlist' },
    ];

    cases.forEach((testCase) => {
      it(`should search ${testCase.name}`, () => {
        const fetchStub = sinon.stub().returns(Promise.resolve(response({})));

        return testCase.method('test query', optionsWith(fetchStub)).then(() => {
          expect(fetchStub.firstCall.args[0]).to.equal(
            `https://api.spotify.com/v1/search?q=test%20query&type=${testCase.type}`,
          );
        });
      });
    });
  });

  describe('createClient', () => {
    it('should reuse the configured token and default options', () => {
      const fetchStub = sinon.stub().returns(Promise.resolve(response({ tracks: { items: [] } })));
      const client = createClient('client-token', {
        fetch: fetchStub,
        market: 'BR',
        limit: 5,
      });

      return client.searchTracks('Doxy').then(() => {
        expect(fetchStub.firstCall.args[0]).to.equal(
          'https://api.spotify.com/v1/search?q=Doxy&type=track&market=BR&limit=5',
        );
        expect(fetchStub.firstCall.args[1].headers.Authorization).to.equal('Bearer client-token');
      });
    });

    it('should allow call options to override client defaults', () => {
      const fetchStub = sinon.stub().returns(Promise.resolve(response({})));
      const client = createClient('client-token', {
        fetch: fetchStub,
        market: 'BR',
        limit: 5,
      });

      return client.searchAlbums('Blue', { market: 'US', limit: 2 }).then(() => {
        expect(fetchStub.firstCall.args[0]).to.equal(
          'https://api.spotify.com/v1/search?q=Blue&type=album&market=US&limit=2',
        );
      });
    });
  });
});
