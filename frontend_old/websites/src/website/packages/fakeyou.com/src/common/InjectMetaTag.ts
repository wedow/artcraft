const GOOGLE_CLIENT_ID = "788843034237-uqcg8tbgofrcf1to37e1bqphd924jaf6.apps.googleusercontent.com";

export class InjectMetaTag {
  
  public static addGoogleSignInClientId() {
    InjectMetaTag.addMetaTagOnce("google-signin-client_id", GOOGLE_CLIENT_ID);
  }

  private static addMetaTagOnce(name: string, content: string) {
    let maybeTag = InjectMetaTag.findScript(name);
    if (!maybeTag) {
      let maybeTag = InjectMetaTag.createMetaTag(name, content);
      document.head.appendChild(maybeTag);
    }
  }

  private static findScript(name: string) : Element | null {
    const selector = `meta[name="${name}"]`;
    return document.head.querySelector(selector);
  }

  private static createMetaTag(name: string, content: string) : Element {
    // <meta name="google-signin-client_id" content="YOUR_CLIENT_ID.apps.googleusercontent.com">
    const tag = document.createElement('meta');
    tag.setAttribute('name', name);
    tag.setAttribute('content', content);
    return tag;
  }
}
