import { html, LitElement, nothing, PropertyValues } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import type { SlAnimation } from "@shoelace-style/shoelace";

import themeCSS from "./archive-now.stylesheet.css";
import linkySrc from "./assets/linky-2.avif";

import "./shoelace";

const PAGE_COUNT_MIN = 10;

type PageUrl = {
  url: string;
  ts: number;
};

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
  private showHint = true;

  @state()
  private pageCount = 0;

  @state()
  private pageUrls: string[] = [];

  @query("#linkyAnimation")
  private linkyAnimation?: SlAnimation;

  @query("#hintAnimation")
  private hintAnimation?: SlAnimation;

  private currUrl = "";
  private shownForUrl = false;

  connectedCallback(): void {
    super.connectedCallback();

    const theme = new CSSStyleSheet();
    theme.replaceSync(themeCSS as string);
    this.shadowRoot?.adoptedStyleSheets.push(theme);
  }

  protected willUpdate(_changedProperties: PropertyValues): void {
    if (
      (_changedProperties.has("hintMessage") && this.hintMessage) ||
      (_changedProperties.has("pageCount") && this.pageCount > PAGE_COUNT_MIN)
    ) {
      if (!this.showHint) {
        this.showHint = true;
      }

      this.shakeLinky();
    }

    if (
      _changedProperties.has("showHint") &&
      _changedProperties.get("showHint") !== undefined
    ) {
      if (this.showHint) {
        this.fadeInHint();
      } else {
        this.fadeOutHint();
      }
    }
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
              "It looks like you're been rate limited (by this site, not by us!)";
          } else {
            this.hintMessage = "It looks like this page could not be loaded.";
          }
          this.pageCount--;
          // const inx = this.pageUrls.indexOf(this.currUrl);
          // if (inx >= 0) {
          //   this.pageUrls = [...this.pageUrls.splice(inx)];
          //   this.pageCount--;
          // }
          break;

        case "rate-limited":
          this.hintMessage =
            "It looks like you're been rate limited (by this site, not by us!)";
          break;

        case "post-request-failed":
          this.hintMessage =
            "It looks like you're trying to log in to a site or access social media.";
          break;

        case "page-loading":
          if (!event.data.loading) {
            this.pageCount++;
            void this.updatePages();
          }
          break;

        case "urlchange":
          // if (this.currUrl) {
          //   this.pageUrls = [this.currUrl, ...this.pageUrls];
          // }
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
      }
    });
  }

  async updatePages() {
    const win = (
      this.renderRoot?.querySelector("archive-web-page") as any | null
    )?.renderRoot?.querySelector("iframe")?.contentWindow;
    if (!win) {
      return;
    }

    const resp = await win.fetch(`./w/api/c/${this.collId}?all=1`);
    try {
      const { pages } = await resp.json();
      this.pageUrls = pages.map((page: { url: string }) => page.url);
    } catch (e) {
      // ignore
    }
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
      <div
        class="w-full max-w-sm overflow-auto border-l-2 border-cyan-100/80 p-4"
      >
        ${this.isFinished ? this.renderFinished() : this.renderPageUrls()}
      </div>
      ${this.pageUrls.length > 0 ? this.renderHint() : ""}
    `;
  }

  private renderFinished() {
    return html`
      <h2>Replaying Archives</h2>

      <p>
        Now, everything you see on the left is being loaded from the archive you
        just created.
      </p>

      <p>
        <sl-button href="${this.downloadUrl}" target="_blank"
          >Download your archive</sl-button
        >
      </p>
    `;
  }

  private renderPageUrls() {
    return html`<h2 class="mb-3 font-semibold text-stone-700">
        Archived ${this.pageUrls.length.toLocaleString()}
        ${this.pageUrls.length === 1 ? "page" : "pages"}
      </h2>
      <ul class="divide-y font-monospace text-sm text-stone-600">
        ${Array.from(this.pageUrls.values()).map(
          (url) => html`
            <li
              class="cursor-pointer truncate py-1 hover:overflow-visible hover:whitespace-normal hover:break-all"
            >
              ${url}
            </li>
          `,
        )}
      </ul> `;
  }

  private renderHint() {
    const overPageMin = this.pageCount > PAGE_COUNT_MIN;
    let title = "Let’s archive this website!";
    let message = html`<p class="mb-3">
        Browse with the website like you would normally. Everything you see
        loaded is being archived.
      </p>
      <p>When you're done, click <strong>Finish</strong>.</p> `;

    if (this.hintMessage) {
      title = "Issues archiving this page?";
      message = html`
        <p class="mb-3">${this.hintMessage}</p>
        <p class="mb-3">
          This page may not work as expected in this limited demo.
        </p>
        <p>
          For more comprehensive archiving, try using our
          <a
            class="font-medium text-cyan-500 transition-colors hover:text-cyan-400"
            href="http://webrecorder.net/archivewebpage"
            target="_blank"
            >ArchiveWeb.page</a
          >
          browser extension instead (it's free too!)
        </p>
      `;
    } else if (overPageMin) {
      title = "Archiving a lot of pages?";
      message = html`
        <p class="mb-3">
          You can automatically archive multiple pages and entire websites with
          <strong class="font-semibold">Browsertrix</strong>, our browser-based
          crawling service.
        </p>
        <div>
          <a
            class="font-medium text-cyan-500 transition-colors hover:text-cyan-400"
            href="http://webrecorder.net/browsertrix"
            target="_blank"
            >Learn more</a
          >
          about how automated crawling can supplement a manual archiving
          workflow.
        </div>
      `;
    }

    return html`
      <div
        class="pointer-events-none fixed bottom-0 right-0 flex items-end p-3"
      >
        <div>
          <sl-animation
            id="hintAnimation"
            name="fadeIn"
            easing="ease-in-out"
            duration="200"
            delay="1200"
            iterations="1"
            fill="both"
            play
          >
            <div
              class="mb-16 max-w-sm translate-x-1 rounded-lg border border-cyan-100/80 bg-white/80 shadow-lg backdrop-blur-md transition-all"
            >
              <div
                class="flex items-center justify-between border-b border-cyan-100/80 p-4 px-4 leading-none"
                aria-live="polite"
              >
                <p class="font-semibold">${title}</p>
                <sl-icon name="gear"></sl-icon>
                <button
                  class=${this.showHint
                    ? "pointer-events-auto"
                    : "pointer-events-none"}
                  @click=${() => {
                    this.showHint = false;

                    if (this.hintMessage) {
                      this.hintMessage = "";
                    } else if (overPageMin) {
                      this.pageCount = 0;
                    }
                  }}
                >
                  X
                </button>
              </div>
              <div class="text-pretty p-4">${message}</div>
            </div>
          </sl-animation>
        </div>
        <sl-animation
          id="linkyAnimation"
          name="lightSpeedInRight"
          easing="ease-in-out"
          duration="1200"
          delay="200"
          iterations="1"
          fill="backwards"
          play
        >
          <button
            class="pointer-events-auto origin-bottom transition-transform hover:-rotate-3 hover:skew-x-3"
            @click=${() => (this.showHint = !this.showHint)}
            title="Toggle hint"
          >
            <img class="h-auto w-24" src=${linkySrc} />
          </button>
        </sl-animation>
      </div>
    `;
  }

  private fadeInHint() {
    if (!this.hintAnimation || this.hintAnimation.play) return;

    this.hintAnimation.delay = 0;
    this.hintAnimation.name = "fadeIn";
    this.hintAnimation.play = true;
  }

  private fadeOutHint() {
    if (!this.hintAnimation || this.hintAnimation.play) return;

    this.hintAnimation.delay = 0;
    this.hintAnimation.name = "fadeOut";
    this.hintAnimation.play = true;
  }

  private shakeLinky() {
    if (!this.linkyAnimation || this.linkyAnimation.play) return;

    this.linkyAnimation.delay = 0;
    this.linkyAnimation.duration = 2000;
    this.linkyAnimation.iterations = 2;
    this.linkyAnimation.name = "jello";
    this.linkyAnimation.play = true;
  }
}

function randomId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

//customElements.define("archive-now", ArchiveNow);
