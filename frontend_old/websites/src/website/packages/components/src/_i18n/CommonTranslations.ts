
import { Resource } from 'i18next';

// Use \u{00a0} = &nbsp; character literal

const COMMON_TRANSLATIONS : any = {
  // English: 46.6% Twitch (#1), 30+% FakeYou (#1)
  en: {
    translation: {
      common: {
        aboutUs: 'About Us',
        logout: 'Logout',
        signUpLogin: 'Sign up / Login',
        termsOfUse: 'Terms of Use',
        textToSpeech: 'Text to Speech',
      },
    },
  },
  // Spanish: 10.5% Twitch (#2), 20+% FakeYou (#2)
  es: {
    translation: {
      common: {
        aboutUs: 'Sobre Nosotros',
        logout: 'Cerrar sesión',
        signUpLogin: 'Registrate e inicia secion',
        termsOfUse: 'Términos\u{00a0}de\u{00a0}Uso',
        textToSpeech: 'Texto a Voz',
      },
    },
  },

  // ---------- OTHER LANGUAGES ----------

  // German: 6.5% Twitch (#4)
  de: {
    translation: {
    }
  },
  // French: 5.6% Twitch (#6)
  fr: {
    translation: {
    }
  },
  // Indonesian 2% FakeYou
  id: {
    translation: {
    }
  },
  // Japanese: 2.5% Twitch (#8)
  ja: {
    translation: {
      common: {
        logout: 'ログアウト',
        signUpLogin: 'サインアップ / ログイン',
      },
    },
  },
  // Korean: 5.4% Twitch (#7)
  ko: {
    translation: {
    }
  },
  // Portuguese: 6.2% Twitch (#5)
  pt: {
    translation: {
      common: {
        logout: 'Sair',
        signUpLogin: 'Inscreva-se / Faça login',
      },
    },
  },
  // 6.5% Twitch (#3)
  ru: {
    translation: {
    }
  },
  // Turkish: 4% FakeYou (#3)
  tr: {
    translation: {
    }
  },
}

interface DeepDictionary {
  [key: string]: DeepDictionary | string
}

// Merge two deep dictionaries. 
// On ties, give preference to the first one.
function MergeDeepDictionary(dictA: DeepDictionary, dictB: DeepDictionary) : DeepDictionary {
  let output : DeepDictionary = {};

  let keys = new Set(Object.keys(dictA).concat(Object.keys(dictB)));

  keys.forEach((key : string) => {
    let vA = dictA[key];
    let vB = dictB[key];

    if (vA === undefined) {
      output[key] = vB;
    } else if (vB === undefined) {
      output[key] = vA;
    } else if (typeof vA !== 'string' && typeof vB !== 'string' ) {
      output[key] = MergeDeepDictionary(vA, vB);
    } else {
      output[key] = vA;
    }
  });

  return output;
}

// Modify all the string leaves of a dictionary to include a prefix string
// This is useful to test if translations were updated using i18next.
function DebugPrefixLeaves(obj: DeepDictionary, prefix: string) : DeepDictionary {
  let output : DeepDictionary = {};

  Object.keys(obj).forEach((key : string) => {
    const value = obj[key];
    if (typeof value === 'string') {
      output[key] = `${prefix}${value}`;
    } else {
      output[key] = DebugPrefixLeaves(value, prefix);
    }
  });

  return output;
}


export { COMMON_TRANSLATIONS, MergeDeepDictionary, DebugPrefixLeaves }
