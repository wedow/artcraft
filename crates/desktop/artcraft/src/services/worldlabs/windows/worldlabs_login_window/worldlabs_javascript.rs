


pub (super) const WORLDLABS_JAVASCRIPT_EXPORT_BEARER_TOKENS : &str = r#"
    (async () => {
      if (window.tokensExported) {
        console.error(">>> Tokens already gotten !");
        return;
      }

      console.error(">>> Getting tokens...");

      const request = indexedDB.open("firebaseLocalStorageDb");

      request.onerror = (event) => {};

      request.onsuccess = (event) => {
        const db = event.target.result;

        console.error(">>> Start transaction...");

        const tx = db.transaction("firebaseLocalStorage", "readonly");

        console.error(">>> Object store open ...");

        const store = tx.objectStore("firebaseLocalStorage");

        console.error(">>> key request...");

        const keysRequest = store.getAllKeys();

        keysRequest.onerror = (event) => {};

        keysRequest.onsuccess = () => {
          console.error(">>> keys array...");

          const keys = keysRequest.result; // array of keys
          const key = keys[0];

          console.error(">>> get key...");

          const getKeyRequest = store.getKey(key);

          getKeyRequest.onsuccess = () => {};

          store.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
              let tokens = cursor.value?.value?.stsTokenManager;

              if (tokens?.accessToken && tokens?.refreshToken) {
                // Send to Tauri
                let result = await window.__TAURI__.core.invoke("worldlabs_receive_bearer_command", {
                  request: {
                    bearer_token: window.tokens.accessToken,
                    refresh_token: window.tokens.refreshToken,
                  }
                });

                window.tokens = tokens;
                window.tokensExported = true;
              }
              cursor.continue();
            }
          }; // end cursor
        }; // end keyRequest
      }; // end DB
    })();
  "#;


/// Take the Bearer tokens and send them to Tauri
pub (super) const WORLDLABS_JAVASCRIPT_SEND_BEARER_TO_TAURI : &str = r#"
    (async () => {
      if (!(window.tokens?.accessToken && window.tokens?.refreshToken)) {
        console.error(">>> No tokens to export");
        return;
      }

      console.error(">>> Sending to Tauri");

      let result = await window.__TAURI__.core.invoke("worldlabs_receive_bearer_command", {
        request: {
          bearer_token: window.tokens.accessToken,
          refresh_token: window.tokens.refreshToken,
        }
      });

      error.log('>>> result', result);

    })();
  "#;


/// See if the pricing button exists.
/// This is only for the logged-in state.
/// We can use redirection to detect completion.
pub (super) const WORLDLABS_JAVASCRIPT_SEE_IF_PRICING_EXISTS : &str = r#"
    (() => {
      let pricing = document.querySelectorAll("a[href='/pricing']");
      if (pricing.length > 0) {
        window.location.href = "https://www.worldlabs.ai/about";
      }
    })();
  "#;
