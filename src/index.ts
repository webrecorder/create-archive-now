import { html, LitElement, PropertyValues } from "lit";

import { customElement, state } from "lit/decorators.js";


@customElement("archive-now")
class ArchiveNow extends LitElement
{
  @state()
  private isFinished = false; 

  @state()
  private collId = randomId();

  @state()
  private downloadUrl = "";

  protected firstUpdated(_changedProperties: PropertyValues): void {
    window.addEventListener("message", (event) => {
      switch (event.data.type) {
        case "awp-finish":
          this.isFinished = true;
          this.downloadUrl = event.data.downloadUrl;
          break;

        case "":
          break;
      }
    });
  }

  render() {
    return html`
    ${!this.isFinished ? html`
    <archive-web-page
      coll=${this.collId}
      deepLink="true"
      url="https://example.com/"
    ></archive-web-page>` : html`
    <replay-web-page
      coll=${this.collId}
      deepLink="true"
      url="",
      >`}
    <div style="width: 300px">
    ${!this.isFinished ? html`
    <h2>High-Fidelity Archiving in your Browser</h2>
    <p>Everything you see loaded on the left is being archived!</p>

    <p>When you're done, click <b>Finish</b></p>
    ` : html`
    <h2>Replaying Archives</h2>

    <p>Now, everything you see on the left is being loaded from the archive you just created.</p>

    <p><a href="${this.downloadUrl}" target="_blank">Download your archive</a></p>
    `}
    </div>`;
  }
}

function randomId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

//customElements.define("archive-now", ArchiveNow);