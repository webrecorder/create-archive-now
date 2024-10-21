import { html, LitElement, nothing, PropertyValues } from "lit";

import { customElement, query, state } from "lit/decorators.js";

import { SlDialog } from "@shoelace-style/shoelace";

import themeCSS from "./theme.stylesheet.css";
import linkySrc from "./assets/linky-2.avif";

import "./shoelace";

const PAGE_COUNT_MIN = 4;

@customElement("archive-now")
class ArchiveNow extends LitElement {
  @state()
  private isFinished = false;

  @state()
  private collId = randomId();

  @state()
  private downloadUrl = "";

  @state()
  private hintMessage = "";

  @state()
  private pageCount = 0;

  @query("sl-dialog")
  private dialog?: SlDialog;

  private currUrl = "";
  private shownForUrl = false;

  connectedCallback(): void {
    super.connectedCallback();

    const theme = new CSSStyleSheet();
    theme.replaceSync(themeCSS as string);
    this.shadowRoot?.adoptedStyleSheets.push(theme);
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    window.addEventListener("message", (event) => {
      switch (event.data.type) {
        case "awp-finish":
          this.isFinished = true;
          this.downloadUrl = event.data.downloadUrl;
          window.location.hash = "";
          break;

        case "live-proxy-url-error":
          if (event.data.status === 403) {
            this.hintMessage =
              "It looks like this site is blocking us from loading it.";
          } else if (event.data.status > 500) {
            this.hintMessage =
              "It looks like this might not be a valid URL or the site is down.";
          } else if (event.data.status === 429) {
            this.hintMessage =
              "It looks like you're been rate limited (by this site, not by us!).";
          } else {
            this.hintMessage = "It looks like this page could not be loaded.";
          }
          break;

        case "rate-limited":
          this.hintMessage =
            "It looks like you're been rate limited (by this site, not by us!).";
          break;

        case "post-request-failed":
          this.hintMessage =
            "It looks like you're trying to log in to a site or access social media.";
          break;

        case "page-loading":
          if (!event.data.loading) {
            this.pageCount++;
          }
          break;

        case "urlchange":
          this.hintMessage = "";
          if (this.currUrl !== event.data.url) {
            this.shownForUrl = false;
            this.currUrl = event.data.url;
          }
          break;
      }

      if (
        (this.hintMessage || this.pageCount > PAGE_COUNT_MIN) &&
        !this.shownForUrl
      ) {
        this.shownForUrl = true;
        this.dialog?.show();
      }
    });
  }

  render() {
    return html`
      ${!this.isFinished
        ? html` <archive-web-page
            proxyPrefix="https://archive-now.webrecorder.workers.dev/proxy/"
            sandbox="true"
            coll=${this.collId}
            deepLink="true"
            url="https://example.com/"
          ></archive-web-page>`
        : html` <replay-web-page coll=${this.collId}></replay-web-page>`}
      <div class="w-96 p-4">
        ${!this.isFinished
          ? html`
              <h2>High-Fidelity Archiving in your Browser</h2>
              <p>Everything you see loaded on the left is being archived!</p>

              <p>When you're done, click <b>Finish</b></p>
            `
          : html`
              <h2>Replaying Archives</h2>

              <p>
                Now, everything you see on the left is being loaded from the
                archive you just created.
              </p>

              <p>
                <sl-button href="${this.downloadUrl}" target="_blank"
                  >Download your archive</sl-button
                >
              </p>
            `}
      </div>
      ${this.renderSuggestion()}
    `;
  }

  private renderSuggestion() {
    return html`
      <div class="fixed bottom-8 right-3 flex items-end gap-4">
        <div>
          <div
            class="mb-16 max-w-sm rounded-lg border border-cyan-200/40 bg-white shadow-lg"
            role="alert"
            aria-live="polite"
          >
            <div
              class="flex items-center justify-between border-b border-cyan-200/40 p-4 px-4 leading-none"
            >
              <p>Having issues with this page?</p>
              <button @click=${() => (this.hintMessage = "")}>X</button>
            </div>
            <div class="text-pretty p-4">
              ${this.hintMessage
                ? html`<p class="mb-3">${this.hintMessage}</p>`
                : nothing}
              <p class="mb-3">
                This page may not work as expected with
                <strong class="font-semibold">archivepage.now</strong>, which is
                a demo with reduced features.
              </p>
              <p>
                Try using
                <a
                  class="font-medium text-cyan-500 transition-colors hover:text-cyan-400"
                  href="#"
                  target="_blank"
                  >ArchiveWeb.page</a
                >
                instead!
              </p>
            </div>
          </div>
        </div>
        <img class="h-32 w-auto" src=${linkySrc} />
      </div>
    `;
  }

  renderDialogs() {
    return html`
      <sl-dialog label="Suggestion" class="dialog-width" style="--width: 50vw;">
        ${this.hintMessage
          ? html` <p>${this.hintMessage}</p>
              <p>
                This is an archiving demo that runs through a proxy and many
                things don't quite work.
              </p>
              <p>For better results, try our ArchiveWeb.page extension.</p>`
          : ``}
        ${this.pageCount > PAGE_COUNT_MIN
          ? html`
              <p>
                It looks like you're trying to archive multiple pages. While
                it's possible to do it with this demo, the Browsertrix service
                will make this a lot easier!
              </p>
            `
          : ``}
        <sl-button
          slot="footer"
          variant="primary"
          @click="${this.onCloseDialog}"
          >Close</sl-button
        >
      </sl-dialog>
    `;
  }

  onCloseDialog() {
    this.dialog?.hide();
    this.pageCount = 0;
    this.hintMessage = "";
  }
}

function randomId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

//customElements.define("archive-now", ArchiveNow);
