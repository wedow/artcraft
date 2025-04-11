import {
  COMMON_TRANSLATIONS,
  MergeDeepDictionary,
} from "@storyteller/components/src/_i18n/CommonTranslations";

// Use \u{00a0} = &nbsp; character literal

// NB: This is the new translation system design. Multiple, per-page or per-module files are easier
// to navigate and maintain than singular monolithic files. We'll gradually phase out the old system.
import * as ar from "./locales/ar";
import * as de from "./locales/de";
import * as en from "./locales/en";
import * as es from "./locales/es";
import * as fr from "./locales/fr";
import * as hi from "./locales/hi";
import * as id from "./locales/id";
import * as it from "./locales/it";
import * as ja from "./locales/ja";
import * as ko from "./locales/ko";
import * as pt from "./locales/pt";
import * as tr from "./locales/tr";
import * as vi from "./locales/vi";
import * as zh from "./locales/zh";

const NEW_TRANSLATIONS: any = {
  ar: { translation: ar },
  de: { translation: de },
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  hi: { translation: hi },
  id: { translation: id },
  it: { translation: it },
  ja: { translation: ja },
  ko: { translation: ko },
  pt: { translation: pt },
  tr: { translation: tr },
  vi: { translation: vi },
  zh: { translation: zh },
};

// Make it easy to "see" new translations. Comment out when not developing.
// NEW_TRANSLATIONS = DebugPrefixLeaves(NEW_TRANSLATIONS, '\u{2705} ');

// NB: These are the old translations. They should be phased out.
const FAKEYOU_TRANSLATIONS: any = {
  // English: 46.6% Twitch (#1), 30+% FakeYou (#1)
  en: {
    translation: {
      coreUi: {
        footerNav: {
          apiDocs: "API Docs",
          aboutUs: "About Us",
          builtBy: "Built by <1>echelon</1> in Atlanta.",
          feed: "Feed",
          leaderboard: "Leaderboard",
          patrons: "Patrons",
          termsOfUse: "Terms of Use",
          textToSpeech: "Text to Speech",
          upload: "Upload",
          video: "Video",
          pricing: "Pricing",
        },
        topNav: {
          aboutUs: "About Us",
          community: "Community",
          contributeUpload: "Contribute / Upload",
          create: "Create",
          developers: "Developers",
          feed: "Feed",
          leaderboard: "Leaderboard",
          logout: "Logout",
          myData: "My Data",
          patrons: "Patrons",
          signUpLogin: "Sign up / Login",
          terms: "Terms of Use",
          video: "Video",
        },
      },
      notices: {
        pleaseFollow: {
          title: "Sorry our site is so slow!",
          body: "I am so sorry the website is slow. We're getting millions of requests. <1>Please follow us on Twitter</1> and also <3>join our Discord</3>. I'm going to introduce faster processing (less than one minute) for those that follow us and help support our work. So please follow our Twitter and join our Discord.",
        },
      },
      pages: {
        // Index page
        ttsList: {
          buttonClear: "Clear",
          buttonSpeak: "Speak",
          errorTooManyRequests:
            "<strong>You're sending too many requests!</strong> Slow down a little. We have to slow things down a little when the server gets busy.",
          heroSubtitle:
            "Use <strong>FakeYou</strong> deep fake tech to say stuff with your favorite characters",
          heroTitle: "Text to Speech",
          placeholderTextGoesHere: "Textual shenanigans go here...",
        },
        // Other pages
        contributeIndex: {
          buttonCreateCategory: "Create category",
          buttonSuggestCategory: "Suggest category",
          buttonUploadVoice: "Upload voice (TTS model)",
          buttonUploadW2lPhoto: "Upload lipsync photo (w2l)",
          buttonUploadW2lVideo: "Upload lipsync video (w2l)",
          describeMore:
            "Want to contribute code, design, or data science? <1 />",
          describeSuggest: "Help us organize the models!",
          describeUploadModels:
            "Create new voices and video templates for FakeYou. <1 /> to learn how.",
          discordLink1: "Join our Discord",
          discordLink2: "Say hi in Discord",
          headingCreateCategory: "Create categories",
          headingMore: "More Ways to Contribute",
          headingSuggestCategory: "Suggest categories",
          headingUploadModels: "Upload Models",
          heroSubtitle:
            "You make FakeYou <strong>better</strong> by contributing",
          heroTitle: "Contribute to FakeYou!",
          introText:
            "You'll get credited for everything you contribute. You'll also get queue priority, be eligible to win prizes, and help us become a Hollywood-killing deepfake tooling, streaming, and filmmaking powerhouse.",
        },
      },
      ttsListPage: {
        by: "by",
        categoryFilters: "Category Filters", // "Category / Language" in other locales
        loading: "Loading...",
        search: "Search",
        searchTerm: "Search Term",
        seeModelDetails:
          'See more details about the "<1>{{modelName}}</1>" model by <3>{{userName}}</3>\u{00a0}',
        voiceCount: "Voice ({{count}} to choose from)",
      },
    },
  },
  // Spanish: 10.5% Twitch (#2), 20+% FakeYou (#2)
  es: {
    translation: {
      coreUi: {
        footerNav: {
          apiDocs: "Documentos de la API",
          aboutUs: "Sobre Nosotros",
          builtBy: "Construido por <1>echelon</1> en Atlanta.",
          feed: "Transmisión en Vivo",
          leaderboard: "Tabla\u{00a0}de\u{00a0}Clasificación",
          patrons: "Mecenas",
          termsOfUse: "Términos\u{00a0}de\u{00a0}Uso",
          textToSpeech: "Texto a Voz",
          upload: "Subir",
          video: "Video", // NB: This *is* translated
        },
        topNav: {
          aboutUs: "Sobre Nosotros",
          community: "Comunidad",
          contributeUpload: "Contribuir / Subir",
          developers: "Desarrollador",
          feed: "Transmisión en Vivo",
          leaderboard: "Tabla de Clasificación",
          logout: "Cerrar sesión",
          myData: "Mis datos",
          patrons: "Mecenas",
          signUpLogin: "Registrate e inicia secion",
          terms: "Términos de Uso",
          video: "Video", // NB: This *is* translated
        },
      },
      notices: {
        pleaseFollow: {
          title: "¡Lo sentimos, nuestro sitio es tan lento!",
          body: "Lamento mucho que el sitio web sea lento. Estamos recibiendo millones de solicitudes. <1>Síganos en Twitter</1> y también únase a nuestro <3>Discord</3>. Voy a presentar un procesamiento más rápido (menos de un minuto) para aquellos que nos siguen y ayudan a respaldar nuestro trabajo. Así que sigue nuestro Twitter y únete a nuestro Discord. <5>Nuestra nueva tecnología de videos falsos profundos debutará en Twitch</5>, así que síganos allí también.",
        },
      },
      pages: {
        // Index page
        ttsList: {
          buttonClear: "Borrar",
          buttonSpeak: "Hablar",
          errorTooManyRequests:
            "<strong>¡Estás enviando demasiadas solicitudes!</strong> Reduzca la velocidad un poco. Tenemos que ralentizar un poco las cosas cuando el servidor está ocupado. ",
          heroSubtitle:
            "Usa <strong>FakeYou</strong> tecnología falsa profunda para decir cosas con tus personajes favoritos",
          heroTitle: "Texto a Voz",
          placeholderTextGoesHere: "Las travesuras textuales van aquí...",
        },
        // Other pages
        contributeIndex: {
          buttonCreateCategory: "Crear categoría",
          buttonSuggestCategory: "Sugerir categoría",
          buttonUploadVoice: "Subir voz (modelo TTS)",
          buttonUploadW2lPhoto: "Foto de sincronización de labios (w2l)", // NB: Remove 'Subdir' ~= upload
          buttonUploadW2lVideo: "Video de sincronización de labios (w2l)", // NB: Remove 'Subdir' ~= upload
          describeMore:
            "¿Quiere contribuir con código, diseño o ciencia de datos? <1 />",
          describeSuggest: "¡Ayúdanos a organizar los modelos!",
          describeUploadModels:
            "Crea nuevas voces y plantillas de video para FakeYou. <1 /> para aprender cómo.",
          discordLink1: "Únase a nuestro Discord",
          discordLink2: "¡Saluda en Discord!",
          headingCreateCategory: "Crear categorías",
          headingMore: "Más Formas de Contribuir",
          headingSuggestCategory: "Sugerir categorías",
          headingUploadModels: "Subir Modelos",
          heroSubtitle: "Haces FakeYou <strong>mejor</strong> contribuyendo",
          heroTitle: "Contribuir a FakeYou",
          introText:
            "Recibirás crédito por todo lo que contribuyas. También obtendrá prioridad en la cola, será elegible para ganar premios y nos ayudará a convertirnos en una potencia de herramientas, transmisión y cine de deepfake que acaba con Hollywood.",
        },
      },
      ttsListPage: {
        by: "de",
        categoryFilters: "Categoría / Idioma",
        loading: "Cargando...",
        search: "Búsqueda",
        searchTerm: "Término de búsqueda",
        seeModelDetails:
          'Ver más detalles sobre el modelo "<1>{{modelName}}</1>" de <3>{{userName}}</3>\u{00a0}',
        voiceCount: "Voz ({{count}} para elegir)",
      },
    },
  },

  // ---------- OTHER LANGUAGES ----------

  // German: 6.5% Twitch (#4)
  de: {
    translation: {},
  },
  // French: 5.6% Twitch (#6)
  fr: {
    translation: {},
  },
  // Indonesian 2% FakeYou
  id: {
    translation: {},
  },
  // Japanese: 2.5% Twitch (#8)
  ja: {
    translation: {
      coreUi: {
        topNav: {
          community: "コミュニティ",
          contributeUpload: "投稿 / アップロード",
          logout: "ログアウト",
          myData: "私のデータ",
          signUpLogin: "サインアップ / ログイン",
          video: "Video", // NB: Katakana here gets forced horizontal for some reason
        },
      },
      pages: {
        ttsList: {
          heroTitle: "テキスト読み上げ",
          heroSubtitle:
            "<strong>FakeYou</strong>ディープフェイクテックを使用して、お気に入りのキャラクターと何かを言いましょう。",
        },
      },
      ttsListPage: {
        categoryFilters: "カテゴリ / 言語",
        loading: "読み込んでいます...",
        search: "検索",
        searchTerm: "検索語",
        speakButton: "話す",
        clearButton: "クリア",
      },
    },
  },
  // Korean: 5.4% Twitch (#7)
  ko: {
    translation: {},
  },
  // Portuguese: 6.2% Twitch (#5)
  pt: {
    translation: {
      coreUi: {
        topNav: {
          community: "Comunidade",
          contributeUpload: "Contribuir / Carregar",
          logout: "Sair",
          myData: "Meus dados",
          signUpLogin: "Inscreva-se / Faça login",
          video: "Vídeo",
        },
      },
      notices: {
        pleaseFollow: {
          title: "Desculpe, nosso site é tão lento!",
          body: "Sinto muito que o site esteja lento. Estamos recebendo milhões de solicitações. <1>Por favor, siga-nos no Twitter</1> e também <3>entre no nosso Discord</3>. Vou apresentar um processamento mais rápido (menos de um minuto) para aqueles que nos seguem e ajudam a apoiar nosso trabalho. Então, por favor, siga nosso Twitter e participe do nosso Discord. <5>Nossa nova tecnologia de deepfake de vídeo será lançada no Twitch</5>, então siga-nos lá também.",
        },
      },
      pages: {
        ttsList: {
          heroTitle: "Texto para Fala",
          heroSubtitle:
            "Use a tecnologia deepfake do <strong>FakeYou</strong> para dizer coisas com seus personagens favoritos.",
          errorTooManyRequests:
            "<strong>Você está enviando muitos pedidos!</strong> Desacelere um pouco. Temos que desacelerar um pouco as coisas quando o servidor fica ocupado.",
        },
      },
      ttsListPage: {
        categoryFilters: "Categoria / Idioma",
        loading: "Carregando...",
        search: "Procurar",
        searchTerm: "Termo de pesquisa",
        speakButton: "Falar",
        clearButton: "Borrar",
      },
    },
  },
  // 6.5% Twitch (#3)
  ru: {
    translation: {},
  },
  // Turkish: 4% FakeYou (#3)
  tr: {
    translation: {
      pages: {
        ttsList: {
          heroTitle: "Konuşma Metni",
          heroSubtitle:
            "En sevdiğiniz karakterlerle bir şeyler söylemek için <strong>FakeYou</strong> derin sahte teknolojisini kullanın.",
        },
      },
    },
  },
};

// TODO: Type these as i18next dictionaries
const FAKEYOU_MERGED_TRANSLATIONS: any = MergeDeepDictionary(
  NEW_TRANSLATIONS,
  MergeDeepDictionary(FAKEYOU_TRANSLATIONS, COMMON_TRANSLATIONS)
);

export { FAKEYOU_MERGED_TRANSLATIONS };
