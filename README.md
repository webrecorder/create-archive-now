# Webrecorder CAN! (Create Archive Now!)

<h1>
    <div align="center">
        <img alt="Create Archive Now" src="assets/screenshot.png" width="90%">
    </div>
</h1>

This tool provides a demo of in-browser archiving + replay via a CORS proxy.

It uses the new ArchiveWeb.page embed <archive-web-page> to provide the archiving,
and `<replay-web-page>` to provide the replay. Archived data can be expored as a WACZ
file, or cleared when the page is closed.

It requires the ArchiveWeb.page 0.13.0+ and a CORS proxy.

Since it uses a CORS proxy, the capabilities are more limited than through a direct-browser
based archiving via [ArchiveWeb.page](https://webrecorder.net/archiveweb.page).
Nevetheless, this tool serves as a demo of the archiving capabilities of Webrecorder tools.

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

