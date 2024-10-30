import {
  html,
  LitElement,
  nothing,
  type PropertyValues,
  type TemplateResult,
} from "lit";
import { customElement, query, state } from "lit/decorators.js";
import type { SlAnimation, SlInput } from "@shoelace-style/shoelace";
import { getFormControls } from "@shoelace-style/shoelace/dist/utilities/form.js";

import themeCSS from "./archive-now.stylesheet.css";
import linkyHelloSrc from "./assets/Linky-Hello.avif";
import linkyConcernedSrc from "./assets/Linky-Concerned.avif";
// TODO Replace icon
import faListIconSrc from "./assets/fa-list-icon.svg";

import "./shoelace";

const PAGE_COUNT_MIN = 10;
const DEFAULT_URL = "https://example.com/";

type Hint = "first-load" | "page-load" | "error" | "over-page-min" | "finished";

@customElement("archive-now")
class ArchiveNow extends LitElement {
  @state()
  private isFinished = false;

  @state()
  private collId = randomId();

  @state()
  private downloadUrl = "";

  @state()
  private errorMessage = "";

  @state()
  private showCreateDialog = false;

  @state()
  private showHint = true;

  @state()
  private hint: Hint = "first-load";

  @state()
  private pageCount = 0;

  @state()
  private pageUrls: string[] = [];

  @query("#hintContainer")
  private hintContainer?: HTMLDivElement;

  @query("#hintBackdrop")
  private hintBackdrop?: HTMLDivElement;

  @query("#linkyAnimation")
  private linkyAnimation?: SlAnimation;

  @query("#hintAnimation")
  private hintAnimation?: SlAnimation;

  private currUrl = "";
  private shownForUrl = false;

  private hintMessages: Record<Hint, TemplateResult> = {
    "first-load": html`<p class="mb-3">
        Browse and interact with the website like you would normally. Every link
        you follow will be archived.
      </p>
      <p>
        When you’re done, click the
        <strong
          class="plausible-event-name=fake+finish+button cursor-default rounded-md bg-lime-500 px-2 py-1.5 font-normal text-white ring-1 ring-inset ring-lime-700"
          >Finish</strong
        >
        button.
      </p>`,
    "page-load": html`<p class="mb-3">
        All pages visited so far will be included in your archive.
      </p>
      <p class="mb-3">
        You can also enter a new URL to load any page that’s not linked from the
        page you’re currently viewing.
      </p>
      <p>
        Click
        <strong
          class="plausible-event-name=fake+finish+button cursor-default rounded-md bg-lime-500 px-2 py-1.5 font-normal text-white ring-1 ring-inset ring-lime-700"
          >Finish</strong
        >
        to finalize your archive.
      </p>`,
    error: html`
      <p class="mb-3">
        This is a limited demo, and some pages may not work as expected. For
        more comprehensive archiving, try our
        <a
          class="font-medium text-cyan-500 transition-colors hover:text-cyan-400"
          href="http://webrecorder.net/archivewebpage"
          target="_blank"
          >ArchiveWeb.page</a
        >
        browser extension (it’s free, too!)
      </p>
      <p>Or try another page by entering a different URL.</p>
    `,
    "over-page-min": html`
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
        about how automated crawling can supplement a manual archiving workflow.
      </div>
    `,
    finished: html`
      <p class="mb-3">
        Click a page under <strong class="font-medium">Page Title</strong> to
        load it directly from your web archive!
      </p>
      <p class="mb-3">
        Once a page is loaded, you can click the
        <img
          class="inline-block size-5 align-[-0.3rem] opacity-70"
          src=${faListIconSrc}
          alt="Browse Contents"
        />
        icon to view a list of all archived pages.
      </p>
    `,
  };

  connectedCallback(): void {
    super.connectedCallback();

    const theme = new CSSStyleSheet();
    theme.replaceSync(themeCSS);
    this.shadowRoot?.adoptedStyleSheets.push(theme);

    this.addEventListener("click", this.hideHintOnClickOutside);
  }

  disconnectedCallback(): void {
    this.removeEventListener("click", this.hideHintOnClickOutside);
  }

  protected willUpdate(_changedProperties: PropertyValues): void {
    if (
      (_changedProperties.has("errorMessage") && this.errorMessage) ||
      (_changedProperties.has("pageCount") && this.pageCount > PAGE_COUNT_MIN)
    ) {
      if (this.errorMessage) {
        this.hint = "error";
      } else if (this.pageCount > PAGE_COUNT_MIN) {
        this.hint = "over-page-min";
      }

      if (!this.showHint) {
        this.showHint = true;
      }

      this.shakeLinky();
    }

    if (_changedProperties.has("isFinished") && this.isFinished) {
      this.hint = "finished";

      if (!this.showHint) {
        this.showHint = true;
      }

      window.requestAnimationFrame(() => {
        this.showBackdrop();
      });

      // this.removeLinky();
    }

    if (
      _changedProperties.has("showHint") &&
      _changedProperties.get("showHint") !== undefined
    ) {
      if (this.showHint) {
        this.fadeInHint();
      } else {
        this.hideBackdrop();
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
            // Since https://example is a valid URL, manually check for basic domain syntax
            if (event.data.url.indexOf(".") > 0) {
              this.errorMessage =
                "It looks like this site is blocking us from loading it.";
            } else {
              this.errorMessage =
                "It looks like this might not be a valid URL, or the site is blocking us from loading it.";
            }
          } else if (event.data.status > 500) {
            this.errorMessage =
              "It looks like this might not be a valid URL, or the site is down.";
          } else if (event.data.status === 429) {
            this.errorMessage =
              "It looks like this site is rate limiting or blocking you.";
          } else {
            this.errorMessage = "It looks like this page could not be loaded.";
          }
          this.pageCount--;
          // const inx = this.pageUrls.indexOf(this.currUrl);
          // if (inx >= 0) {
          //   this.pageUrls = [...this.pageUrls.splice(inx)];
          //   this.pageCount--;
          // }
          break;

        case "rate-limited":
          this.errorMessage =
            "It looks like this site is rate limiting or blocking you.";
          break;

        case "post-request-failed":
          this.errorMessage =
            "It looks like you’re trying to log in to a site or access social media.";
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
          this.errorMessage = "";
          if (this.currUrl !== event.data.url) {
            this.shownForUrl = false;
            this.currUrl = event.data.url;
          }
          break;
      }

      if (
        (this.errorMessage || this.pageCount > PAGE_COUNT_MIN) &&
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
      <header class="flex items-center justify-between [grid-area:header]">
        <a
          class="flex items-center gap-2 leading-none text-stone-400 transition-colors hover:text-stone-600"
          href="https://webrecorder.net"
        >
          <sl-icon name="arrow-left" class="text-lg"></sl-icon>
          <span class="text-sm">Back to Webrecorder.net</span>
        </a>
      </header>
      <div
        class="${this.showHint || this.showCreateDialog
          ? "shadow shadow-earth-800/10 ring-1 ring-earth-300/50"
          : "shadow-lg shadow-cyan-800/10 ring-2 ring-cyan-300/50"} overflow-hidden rounded-lg bg-white transition-all [grid-area:archive]"
      >
        ${!this.isFinished
          ? html` <archive-web-page
              proxyPrefix="https://archive-now.webrecorder.workers.dev/proxy/"
              sandbox="true"
              coll=${this.collId}
              deepLink="true"
              url=${DEFAULT_URL}
            ></archive-web-page>`
          : html` <replay-web-page coll=${this.collId}></replay-web-page>`}
      </div>
      <div
        class="mr-16 overflow-auto [grid-area:detail] lg:mr-0 lg:px-4 2xl:px-6"
      >
        <h2
          class="my-4 font-display text-xl font-semibold leading-none lg:text-2xl"
        >
          Your Web Archive
        </h2>
        ${this.isFinished ? this.renderFinished() : this.renderPageUrls()}
      </div>

      ${this.renderBackdrop()}

      <div
        class="pointer-events-none absolute bottom-0 right-0 size-32 opacity-50 transition-opacity delay-75 [background:radial-gradient(farthest-side_at_bottom_right,white,transparent)]"
      ></div>
      ${this.renderLinky()} ${this.renderUrlDialog()}
    `;
  }

  private renderFinished() {
    return html`
      <div class="text-pretty leading-relaxed">
        <p class="mb-4">
          Download your archive and view it at any time with
          <a
            class="font-medium text-cyan-500 transition-colors hover:text-cyan-400"
            href="http://replayweb.page"
            target="_blank"
            >ReplayWeb.page</a
          >.
        </p>
        <sl-button
          class="plausible-event-name=download+archive block w-full"
          href="${this.downloadUrl}"
          target="_blank"
          size="large"
          variant="primary"
        >
          <sl-icon slot="prefix" name="download"></sl-icon>
          Download Archive (.wacz)
        </sl-button>

        <hr class="my-6 border-brand-green/20" />

        <h3 class="mb-3 text-lg font-semibold leading-none">
          Share your archive
        </h3>
        <p class="mb-3">
          To share your archive, create a public web archive collection with
          <strong class="font-semibold">Browsertrix</strong>, our complete
          archiving platform.
        </p>
        <ol class="list-inside list-decimal">
          <li>
            Log in or
            <a
              class="font-medium text-cyan-500 transition-colors hover:text-cyan-400"
              href="http://webrecorder.net/browsertrix#getting-started"
              target="_blank"
              >sign up for Browsertrix</a
            >
          </li>
          <li>
            <a
              class="font-medium text-cyan-500 transition-colors hover:text-cyan-400"
              href="https://docs.browsertrix.com/user-guide/archived-items/#uploading-web-archives"
              target="_blank"
              >Import your archive</a
            >
          </li>
          <li>
            <a
              class="font-medium text-cyan-500 transition-colors hover:text-cyan-400"
              href="https://docs.browsertrix.com/user-guide/collection/"
              target="_blank"
              >Create a public collection</a
            >
          </li>
        </ol>

        <hr class="my-6 border-brand-green/20" />

        <div>
          <button
            class="flex items-center gap-2 leading-none text-stone-400 transition-colors hover:text-stone-600"
            @click=${() => (this.showCreateDialog = true)}
          >
            <sl-icon name="arrow-clockwise" class="text-lg"></sl-icon>
            <span class="text-sm">Create another archive</span>
          </button>
        </div>
      </div>
    `;
  }

  private renderPageUrls() {
    const pageCount = this.pageUrls.length;

    if (pageCount < 1) return;

    return html`
      <h3 class="mb-3 font-semibold leading-none">
        Archiving ${pageCount.toLocaleString()}
        ${pageCount === 1 ? "page" : "pages"}
      </h3>
      <ul class="divide-y divide-brand-green/20 font-monospace text-sm">
        ${Array.from(this.pageUrls.values()).map(
          (url) => html`
            <li
              class="cursor-default truncate py-1 hover:overflow-visible hover:whitespace-normal hover:break-all"
            >
              ${url}
            </li>
          `,
        )}
      </ul>
    `;
  }

  private renderLinky() {
    let title = "Let’s archive this website!";
    let message = this.hintMessages[this.hint];
    let linkySrc = linkyHelloSrc;

    switch (this.hint) {
      case "error": {
        title = "Issues archiving this page?";
        message = html`
          ${this.errorMessage
            ? html`<p class="mb-3">${this.errorMessage}</p>`
            : nothing}
          ${message}
        `;
        linkySrc = linkyConcernedSrc;
        break;
      }
      case "page-load": {
        title = "Interact to archive";
        break;
      }
      case "over-page-min": {
        title = "Archiving a lot of pages?";
        break;
      }
      case "finished": {
        title = "Archive created! 🎉";
        break;
      }
      default:
        break;
    }

    return html`
      <div
        id="hintContainer"
        class="pointer-events-none fixed bottom-0 right-0 flex flex-col items-end lg:flex-row"
      >
        <div>
          <sl-animation
            id="hintAnimation"
            name="fadeIn"
            easing="ease-in-out"
            duration="200"
            delay="900"
            iterations="1"
            fill="both"
            play
            @sl-finish=${() => {
              if (this.showHint === false) {
                this.onFinishFadeOut();
              }
            }}
          >
            <div
              class="${this.showHint
                ? "pointer-events-auto"
                : "pointer-events-none"} max-w-sm -translate-x-3 rounded-lg bg-white/80 shadow-lg shadow-cyan-800/20 ring-2 ring-cyan-300/50 backdrop-blur-md transition-all lg:mb-16 lg:translate-x-1"
            >
              <div
                class="flex items-center justify-between p-2 leading-none"
                aria-live="polite"
              >
                <p class="p-2 font-semibold">${title}</p>
                <sl-icon-button
                  name="x-lg"
                  @click=${() => {
                    this.showHint = false;
                  }}
                ></sl-icon-button>
              </div>
              <div class="text-pretty px-4 pb-4 pt-2 leading-relaxed">
                ${message}
              </div>
            </div>
          </sl-animation>
        </div>
        <div>
          <sl-animation
            id="linkyAnimation"
            name="lightSpeedInRight"
            easing="ease-in-out"
            delay="100"
            duration="1000"
            iterations="1"
            fill="backwards"
            play
          >
            <button
              class="plausible-event-name=linky+toggle pointer-events-auto relative z-10 origin-bottom transition-transform hover:-rotate-3 hover:skew-x-3"
              @click=${() => (this.showHint = !this.showHint)}
              title="Toggle Linky's hint"
            >
              <img class="size-20 lg:size-32" src=${linkySrc} />
            </button>
          </sl-animation>
        </div>
      </div>
    `;
  }

  private renderUrlDialog() {
    return html`
      <sl-dialog
        label="Create New Archive"
        class="[--header-spacing:theme(spacing.3)] [--width:70ch]"
        ?open=${this.showCreateDialog}
        @sl-hide=${() => (this.showCreateDialog = false)}
      >
        <form
          @submit=${async (e: SubmitEvent) => {
            e.preventDefault();

            const form = e.currentTarget as HTMLFormElement;
            const input = getFormControls(form)[0] as SlInput;

            if ("invalid" in input.dataset) {
              return;
            }

            await this.startNewArchive(input.value);

            input.value = "";
            this.showCreateDialog = false;
          }}
        >
          <div class="flex items-end gap-3 px-3 pb-3">
            <sl-input
              name="url"
              class="flex-1"
              label="Enter a URL"
              placeholder=${DEFAULT_URL.replace(/\/$/, "")}
              type="url"
              autocomplete="off"
              required
            ></sl-input>
            <sl-button type="submit" variant="primary"
              >Start Archiving</sl-button
            >
          </div>
        </form>
      </sl-dialog>
    `;
  }

  private renderBackdrop() {
    return html`<div
      id="hintBackdrop"
      class="fixed inset-0 bg-[var(--sl-overlay-background-color)] transition-opacity"
    ></div>`;
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

  private onFinishFadeOut() {
    switch (this.hint) {
      case "first-load": {
        this.hint = "page-load";
        break;
      }
      case "error": {
        this.errorMessage = "";
        this.hint = "page-load";
        break;
      }
      case "over-page-min": {
        this.pageCount = 0;
        this.hint = "page-load";
        break;
      }
      default:
        break;
    }
  }

  private showBackdrop() {
    if (!this.hintBackdrop || this.hintBackdrop.style.display === "block")
      return;

    this.hintBackdrop.style.display = "block";

    window.requestAnimationFrame(() => {
      this.hintBackdrop!.style.opacity = "1";
    });
  }

  private hideBackdrop() {
    if (!this.hintBackdrop || this.hintBackdrop.style.display === "none")
      return;

    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName === "opacity" && this.hintBackdrop) {
        this.hintBackdrop.style.display = "none";
        this.hintBackdrop.removeEventListener("transitionend", onTransitionEnd);
      }
    };
    this.hintBackdrop.addEventListener("transitionend", onTransitionEnd);
    this.hintBackdrop.style.opacity = "0";
  }

  private removeLinky() {
    if (!this.linkyAnimation || this.linkyAnimation.play) return;

    this.linkyAnimation.delay = 0;
    this.linkyAnimation.duration = 300;
    this.linkyAnimation.name = "fadeOut";
    this.linkyAnimation.fill = "both";
    this.linkyAnimation.play = true;
  }

  private shakeLinky() {
    if (!this.linkyAnimation || this.linkyAnimation.play) return;

    this.linkyAnimation.delay = 0;
    this.linkyAnimation.duration = 1800;
    this.linkyAnimation.name = "jello";
    this.linkyAnimation.play = true;
  }

  private hideHintOnClickOutside(e: MouseEvent) {
    const el = e.composedPath()[0];

    if (el instanceof Element) {
      if (el === this.hintContainer || this.hintContainer?.contains(el)) {
        return false;
      }
    }

    // Disable click outside on page load
    if (
      this.linkyAnimation?.name === "lightSpeedInRight" &&
      this.linkyAnimation.play
    ) {
      return false;
    }

    this.showHint = false;
  }

  private async startNewArchive(archiveUrl: string) {
    this.hint = "first-load";
    this.isFinished = false;
    this.downloadUrl = "";
    this.collId = randomId();
    this.pageCount = 0;
    this.pageUrls = [];

    await this.updateComplete;

    window.location.hash = `url=${window.encodeURIComponent(archiveUrl)}`;
  }
}

function randomId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

//customElements.define("archive-now", ArchiveNow);
