import React from "react";
import { Language } from "@storyteller/components/src/i18n/Language";
import { DiscordLink } from "@storyteller/components/src/elements/DiscordLink";

interface Props {
  clearLanguageNotice: () => void;
  displayLanguage: Language;
}

/* Template:

  Welcome!

  We have {LANGUAGE} speaking models. 
  Take a look at the "{LANGUAGE}" category ("Category Filters").

  We can help you make your own voices. Join our Discord chat. 
  We will pay for the first fifty {LANGUAGE} models uploaded.
*/

function LanguageNotice(props: Props) {
  let title = "¡Bienvenidos!";
  let weHaveModels = (
    <>
      Tenemos modelos de habla hispana. Echa un vistazo a la categoría "Español"
      ("Category Filters").
    </>
  );
  let joinUs = (
    <>
      Podemos ayudarte a hacer tus propias voces.&nbsp;
      <DiscordLink text="Únete a nuestro chat Discord" iconAfterText={true} />.
      Pagaremos por los primeros cincuenta modelos subidos.
    </>
  );

  if (props.displayLanguage === Language.Portuguese) {
    title = "Bem vinda!";
    weHaveModels = (
      <>
        Temos modelos que falam português. Dê uma olhada na categoria
        "Português" ("Filtros de Categoria").
      </>
    );
    joinUs = (
      <>
        Nós podemos ajudá-lo a fazer suas próprias vozes.&nbsp;
        <DiscordLink
          text="Participe do nosso bate-papo no Discord"
          iconAfterText={true}
        />
        . Pagaremos os primeiros cinquenta modelos portugueses carregados.
      </>
    );
  } else if (props.displayLanguage === Language.Turkish) {
    title = "Hoş geldin!";
    weHaveModels = <></>;
    joinUs = (
      <>
        Kendi sesinizi çıkarmanıza yardımcı olabiliriz.&nbsp;
        <DiscordLink text="Discord sohbetimize katılın" iconAfterText={true} />.
        Yüklenen ilk elli Türk modelinin ücretini biz ödeyeceğiz.
      </>
    );
  }

  return (
    <>
      <div className="container">
        <div
          className="alert alert-secondary alert-dismissible fade show"
          role="alert"
        >
          <button
            className="btn-close"
            onClick={() => props.clearLanguageNotice()}
            data-bs-dismiss="alert"
            aria-label="Close"
          ></button>
          <strong>{title}</strong> {weHaveModels}
          {joinUs}
        </div>
      </div>
    </>
  );
}

export { LanguageNotice };
