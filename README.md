# ArchiveNow - In Browser Archiving + Replay Demo

This tool provides an in-browser archiving + replay.

It uses the new ArchiveWeb.page embed <archive-web-page> to provide the archiving,
and `<replay-web-page>` to provide the replay.

It requires the AWP 0.13.0+ version, currently available in `ts` branch of ArchiveWeb.page.

## Development

### Prerequisites

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

### Updating AWP

This includes a bundled version of AWP 0.13.0 from https://github.com/webrecorder/archiveweb.page/tree/ts-work

To update AWP:

1) Ensure you have https://github.com/webrecorder/archiveweb.page/tree/ts-work checked out, do `yarn link`

2) yarn link "@webrecorder/archivewebpage"

3) Run `yarn run update-awp`

This is only needed for bug fixes in AWP at the moment.
