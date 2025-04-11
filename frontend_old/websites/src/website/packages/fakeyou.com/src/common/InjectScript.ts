// https://developers.google.com/identity/gsi/web/guides/client-library
export const GOOGLE_AUTH_SIGN_IN_SCRIPT =
  "https://accounts.google.com/gsi/client";

// DEPRECATED: https://developers.google.com/identity/gsi/web/guides/gis-migration
// // https://developers.google.com/identity/sign-in/web/sign-in
// const GOOGLE_AUTH_SIGN_IN_SCRIPT_2 = "https://apis.google.com/js/platform.js";

enum AddTo {
  Head,
  Body,
}

export class InjectScript {
  public static addGoogleAuthLogin() {
    InjectScript.addScriptOnce(GOOGLE_AUTH_SIGN_IN_SCRIPT, AddTo.Body);
  }

  private static addScriptOnce(srcUrl: string, addTo: AddTo) {
    let maybeScript = InjectScript.findScript(srcUrl);
    if (!maybeScript) {
      let maybeScript = InjectScript.createScript(srcUrl, true);
      switch (addTo) {
        case AddTo.Head:
          document.head.appendChild(maybeScript);
          break;
        case AddTo.Body:
          document.body.appendChild(maybeScript);
          break;
      }
    }
  }

  private static findScript(srcUrl: string): Element | null {
    const selector = `script[src="${srcUrl}"]`;
    return document.querySelector(selector);
  }

  private static createScript(srcUrl: string, async: boolean): Element {
    const tag = document.createElement("script");
    tag.setAttribute("src", srcUrl);
    if (async) {
      tag.setAttribute("async", "async");
    }
    return tag;
  }
}
