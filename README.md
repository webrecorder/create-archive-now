# Create Archive Now (CAN) - In Browser Archiving + Replay Demo

This tool provides an in-browser archiving + replay via a CORS proxy.

It uses the new ArchiveWeb.page embed <archive-web-page> to provide the archiving,
and `<replay-web-page>` to provide the replay.

It requires the ArchiveWeb.page 0.13.0+ and a CORS proxy.

## Development

### Prerequisites

- Node >=20
- Yarn Classic (v1)

### Installation

Get dependencies:

```sh
yarn
```

Start dev server:

```sh
yarn start
```

### CORS Proxy

Using this service requires a CORS proxy.

We recommend running your own version of a CORS proxy, or our version of: https://github.com/webrecorder/wabac-cors-proxy
which is designed to be run as a Cloudflare Worker. See that repo for configuring allowed origins.

### Using with local AWP

This repo works with the latest release of ArchiveWeb.page NPM package, [@webrecorder/archivewebpage](https://npmjs.com/package/@webrecorder/archivewebpage).

For development, it may be useful to test with a local version of AWP, which does all the archiving / replay.

1) Ensure that you have a locally checked out version of [webrecorder/archiveweb.page](https://github.com/webrecorder/archiveweb.page) built. Run `yarn run build` in that repo.

2) Run `yarn link "@webrecorder/archivewebpage"` in this repo

3) Run `yarn run update-awp` to copy the built dist files from AWP for testing.

4) Run `yarn start`.

