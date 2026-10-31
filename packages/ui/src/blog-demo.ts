import { LitElement, html, type PropertyValues } from "lit";
import { waitForDemo, type DemoProps } from "./registry";

/**
 * `<blog-demo name="throttle" min-height="262">`
 *
 * 글 본문에 들어가는 인터랙티브 데모의 자리. 서버는 이 태그와 높이만 내보내고,
 * 브라우저에서 리모트가 렌더러를 등록하면 그때 안을 채운다.
 *
 * - light DOM 을 쓴다. 데모가 호스트의 Tailwind 토큰(CSS 변수)을 그대로 읽어야 해서다.
 * - `name` 이 아닌 속성은 전부 렌더러에 props 로 넘긴다.
 * - 이벤트: `blog-demo:mounted`, `blog-demo:error` (bubbles, composed)
 */
export class BlogDemo extends LitElement {
  static properties = {
    name: { type: String },
    minHeight: { type: Number, attribute: "min-height" },
    state: { type: String, state: true },
  };

  declare name: string;
  declare minHeight: number;
  declare state: "waiting" | "mounted" | "error";

  private cleanup: (() => void) | null = null;
  private abort: AbortController | null = null;

  constructor() {
    super();
    this.name = "";
    this.minHeight = 0;
    this.state = "waiting";
  }

  protected createRenderRoot() {
    return this;
  }

  protected render() {
    const style = this.minHeight > 0 ? `min-height:${this.minHeight}px` : "";
    return html`<div class="blog-demo__mount" data-state=${this.state} style=${style}></div>`;
  }

  protected firstUpdated() {
    void this.mount();
  }

  protected updated(changed: PropertyValues<this>) {
    if (changed.has("name") && changed.get("name") !== undefined) {
      this.unmount();
      void this.mount();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unmount();
  }

  private collectProps(): DemoProps {
    const props: Record<string, string> = {};
    for (const attr of this.attributes) {
      if (attr.name === "name" || attr.name === "min-height" || attr.name === "class") continue;
      props[attr.name] = attr.value;
    }
    return props;
  }

  private async mount() {
    if (!this.name) return;
    const container = this.querySelector<HTMLElement>(".blog-demo__mount");
    if (!container) return;

    this.abort = new AbortController();
    try {
      const renderer = await waitForDemo(this.name, this.abort.signal);
      this.cleanup = renderer(container, this.collectProps());
      this.state = "mounted";
      this.dispatchEvent(
        new CustomEvent("blog-demo:mounted", {
          bubbles: true,
          composed: true,
          detail: { name: this.name },
        }),
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      this.state = "error";
      this.dispatchEvent(
        new CustomEvent("blog-demo:error", {
          bubbles: true,
          composed: true,
          detail: { name: this.name, error },
        }),
      );
    }
  }

  private unmount() {
    this.abort?.abort();
    this.abort = null;
    this.cleanup?.();
    this.cleanup = null;
    this.state = "waiting";
  }
}

export const BLOG_DEMO_TAG = "blog-demo";

/** 호스트·리모트 어느 쪽이 먼저 불러도 한 번만 등록된다. */
export function defineBlogDemo(): void {
  if (typeof customElements === "undefined") return;
  if (customElements.get(BLOG_DEMO_TAG)) return;
  customElements.define(BLOG_DEMO_TAG, BlogDemo);
}
