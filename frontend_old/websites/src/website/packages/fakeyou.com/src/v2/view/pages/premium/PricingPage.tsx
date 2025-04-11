import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useHistory } from "react-router-dom";
import { faCheck, faHeart } from "@fortawesome/free-solid-svg-icons";
import { FAKEYOU_PRICES as FYP } from "../../../../data/PriceTiers";
import {
  CreateStripePortalRedirect,
  CreateStripePortalRedirectIsError,
  CreateStripePortalRedirectIsSuccess,
} from "@storyteller/components/src/api/premium/CreateStripePortalRedirect";

import { FakeYouFrontendEnvironment } from "@storyteller/components/src/env/FakeYouFrontendEnvironment";
import { Analytics } from "../../../../common/Analytics";
import { WebUrl } from "../../../../common/WebUrl";
import { BeginStripeCheckoutFlow } from "../../../../common/BeginStripeCheckoutFlow";
import { usePrefixedDocumentTitle } from "../../../../common/UsePrefixedDocumentTitle";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";
import { Badge, Container, Panel } from "components/common";
import MentionsSection from "components/common/MentionsSection";
import { faStar } from "@fortawesome/pro-solid-svg-icons";
import { useSession } from "hooks";
import { isVideoToolsEnabled } from "config/featureFlags";

export default function PricingPage() {
  const history = useHistory();
  const { sessionSubscriptions, sessionWrapper } = useSession();
  PosthogClient.recordPageview();

  const beginStripePortalFlow = async (): Promise<boolean> => {
    const response = await CreateStripePortalRedirect();
    if (CreateStripePortalRedirectIsSuccess(response)) {
      window.location.href = response.stripe_portal_redirect_url;
    } else if (CreateStripePortalRedirectIsError(response)) {
      // TODO
    }
    return false;
  };

  const beginStripeFlow = async (
    internal_plan_key: string,
    analyticsName: string
  ): Promise<boolean> => {
    switch (analyticsName) {
      case "plus":
        Analytics.premiumSelectPlanPlus();
        break;
      case "pro":
        Analytics.premiumSelectPlanPro();
        break;
      case "elite":
        Analytics.premiumSelectPlanElite();
        break;
      case "unsubscribe":
        Analytics.premiumSelectUnsubscribe();
        break;
    }

    if (!sessionWrapper.isLoggedIn()) {
      // TODO: This needs to bring the user back to purchase flow.
      Analytics.premiumBounceToSignup();

      const signupUrl = WebUrl.signupPageWithPurchaseIntent(internal_plan_key);
      history.push(signupUrl);

      return false;
    } else if (sessionSubscriptions?.hasPaidFeatures()) {
      Analytics.premiumForwardToStripePortal();
      return await beginStripePortalFlow(); // NB: This redirects the user to Stripe
    } else {
      Analytics.premiumForwardToStripeCheckout();
      return await BeginStripeCheckoutFlow(internal_plan_key); // NB: This redirects the user to Stripe
    }
  };

  usePrefixedDocumentTitle("Premium Deep Fake TTS");

  const environment = FakeYouFrontendEnvironment.getInstance();
  const planKey = environment.useProductionStripePlans()
    ? "production"
    : "development";

  const userHasPaidPremium = sessionSubscriptions?.hasPaidFeatures();

  let plusButtonText = "Buy Plus";
  let plusButtonDisabled = false;

  let proButtonText = "Buy Pro";
  let proButtonDisabled = false;
  let proBorderCss =
    "rounded panel padding h-100  pricing-border position-relative";

  let eliteButtonText = "Buy Elite";
  let eliteButtonDisabled = false;

  let unsubscribeSection = <></>;

  if (userHasPaidPremium) {
    let unsubscribeKey = FYP.plus.internal_plan_key[planKey]; // NB: Default to something (I don't think this matters to Stripe.)

    if (sessionSubscriptions?.hasActivePlusSubscription()) {
      plusButtonText = "Subscribed";
      plusButtonDisabled = true;
    } else {
      plusButtonText = "Switch to Plus";
    }

    if (sessionSubscriptions?.hasActiveProSubscription()) {
      unsubscribeKey = FYP.pro.internal_plan_key[planKey];
      proButtonText = "Subscribed";
      proButtonDisabled = true;
    } else {
      proButtonText = "Switch to Pro";
    }

    if (sessionSubscriptions?.hasActiveEliteSubscription()) {
      unsubscribeKey = FYP.elite.internal_plan_key[planKey];
      eliteButtonText = "Subscribed";
      eliteButtonDisabled = true;
    } else {
      eliteButtonText = "Switch to Elite";
    }

    unsubscribeSection = (
      <>
        <div className="panel p-4 mt-5 rounded">
          <h4 className="fw-semibold mb-3">Cancel My Subscription</h4>
          <p className="mb-4 fs-14">
            Upon cancellation, your subscription to FakeYou's premium features
            will be terminated at the end of your current term, which means you
            will no longer have access to these exclusive functionalities.
          </p>
          <button
            onClick={() => beginStripeFlow(unsubscribeKey, "unsubscribe")}
            className="btn btn-destructive"
          >
            Cancel Subscription
          </button>
        </div>
      </>
    );
  }

  // Highlight the mid-tier plan if nothing is subscribed
  if (!userHasPaidPremium) {
    proBorderCss = "rounded panel padding h-100 pricing-border";
  }

  return (
    <>
      <Container type="panel" className="mt-lg-3">
        <Panel clear={true} className="text-center my-5">
          <h1 className=" fw-bold">Pricing</h1>
          {/* <p className="fs-5">
          By purchasing FakeYou premium, you help us build more!
        </p> */}
          <div className="alert alert-warning mt-4 alert-pricing mb-2 d-flex flex-column">
            <div>
              <FontAwesomeIcon icon={faHeart} className="text-red me-3" />
              Our features are free to use, but premium users get even faster
              and better quality outputs. By purchasing premium, you help us
              build more!
            </div>
          </div>
          {/* <div className="fs-7 pt-2 opacity-75">
            Our features are free to use, but premium users get even faster and
            better quality outputs.
          </div> */}
        </Panel>

        <Panel clear={true}>
          <div className="row gx-3 gy-4">
            {/* Starter Tier */}
            {/*<div className="col-12 col-sm-6 col-lg-3" >
            <div className="rounded panel p-4 h-100">
              <h2 className="text-center my-2 fw-bold mb-4">
                {FYP.starter.tier}
              </h2>


              <h2 className=" fw-bold text-center my-5">
                ${FYP.starter.price}
                <span className="fs-5 opacity-75 fw-normal"> /month</span>
              </h2>
              <ul className="pricing-list d-flex flex-column gap-2">
                <li className="fw-semibold">{FYP.starter.priority.title}</li>
                {FYP.starter.priority.features.map((e: any) => {
                  return (
                    <li key={e}>
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="text-red me-3"
                      />
                      {e}
                    </li>
                  );
                })}

                <li className="fw-semibold">{FYP.starter.tts.title}</li>
                {FYP.starter.tts.features.map((e: any) => {
                  return (
                    <li key={e}>
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="text-red me-3"
                      />
                      {e}
                    </li>
                  );
                })}
                <li className="fw-semibold">{FYP.starter.w2l.title}</li>
                {FYP.starter.w2l.features.map((e: any) => {
                  return (
                    <li key={e}>
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="text-red me-3"
                      />
                      {e}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
              */}

            {/* Plus Tier */}
            <div className="col-12 col-md-6 col-lg-4 pt-lg-5 order-2 order-md-1">
              <div className="rounded panel padding h-100">
                <h2 className="text-center my-2 fw-bold mb-4">
                  {FYP.plus.tier}
                </h2>
                <button
                  onClick={() =>
                    beginStripeFlow(FYP.plus.internal_plan_key[planKey], "plus")
                  }
                  className="btn btn-primary w-100 fs-6"
                  disabled={plusButtonDisabled}
                >
                  {plusButtonText}
                </button>
                <h2 className="display-5 fw-bold text-center my-5">
                  ${FYP.plus.price}
                  <span className="fs-5 opacity-75 fw-normal"> /month</span>
                </h2>
                <ul className="pricing-list d-flex flex-column gap-2">
                  <li className="fw-semibold">{FYP.plus.priority.title}</li>
                  {FYP.plus.priority.features.map((e: any) => {
                    return (
                      <li key={e}>
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-red me-3"
                        />
                        {e}
                      </li>
                    );
                  })}

                  <li className="fw-semibold">{FYP.plus.tts.title}</li>
                  {FYP.plus.tts.features.map((e: any) => {
                    return (
                      <li key={e}>
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-red me-3"
                        />
                        {e}
                      </li>
                    );
                  })}
                  <li className="fw-semibold">{FYP.plus.vc.title}</li>
                  {FYP.plus.vc.features.map((e: any) => {
                    return (
                      <li key={e}>
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-red me-3"
                        />
                        {e}
                      </li>
                    );
                  })}

                  <li className="fw-semibold">{FYP.plus.ads.title}</li>
                  {FYP.plus.ads.features.map((e: any) => {
                    return (
                      <li key={e}>
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-red me-3"
                        />
                        {e}
                      </li>
                    );
                  })}

                  {isVideoToolsEnabled() && (
                    <>
                      {(FYP.plus as any).lipsync && (
                        <>
                          <li className="fw-semibold">
                            {(FYP.plus as any).lipsync.title}
                          </li>
                          {(FYP.plus as any).lipsync.features.map((e: any) => (
                            <li key={e}>
                              <FontAwesomeIcon
                                icon={faCheck}
                                className="text-red me-3"
                              />
                              {e}
                            </li>
                          ))}
                        </>
                      )}

                      {(FYP.plus as any).live_portrait && (
                        <>
                          <li className="fw-semibold">
                            {(FYP.plus as any).live_portrait.title}
                          </li>
                          {(FYP.plus as any).live_portrait.features.map(
                            (e: any) => (
                              <li key={e}>
                                <FontAwesomeIcon
                                  icon={faCheck}
                                  className="text-red me-3"
                                />
                                {e}
                              </li>
                            )
                          )}
                        </>
                      )}

                      {(FYP.plus as any).style_transfer && (
                        <>
                          <li className="fw-semibold">
                            {(FYP.plus as any).style_transfer.title}
                          </li>
                          {(FYP.plus as any).style_transfer.features.map(
                            (e: any) => (
                              <li key={e}>
                                <FontAwesomeIcon
                                  icon={faCheck}
                                  className="text-red me-3"
                                />
                                {e}
                              </li>
                            )
                          )}
                        </>
                      )}
                    </>
                  )}
                </ul>
                <hr className="my-4" />
                <h6 className="text-center fw-normal opacity-50">
                  + Future feature updates
                </h6>
              </div>
            </div>

            {/* Pro Tier */}
            <div className="col-12 col-md-6 col-lg-4 order-1 order-md-2">
              <div className={proBorderCss}>
                <div
                  className="d-flex justify-content-center mb-2 position-absolute"
                  style={{ top: "20px", right: "20px" }}
                >
                  <Badge
                    label="Recommended"
                    color="ultramarine"
                    icon={faStar}
                  />
                </div>

                <h2 className="text-center my-2 fw-bold mb-4">
                  {FYP.pro.tier}
                </h2>
                <button
                  onClick={() =>
                    beginStripeFlow(FYP.pro.internal_plan_key[planKey], "pro")
                  }
                  className="btn btn-primary w-100 fs-6"
                  disabled={proButtonDisabled}
                >
                  {proButtonText}
                </button>
                <h2 className="display-5 fw-bold text-center my-5">
                  ${FYP.pro.price}
                  <span className="fs-5 opacity-75 fw-normal"> /month</span>
                </h2>
                <ul className="pricing-list d-flex flex-column gap-2">
                  <li className="fw-semibold">{FYP.pro.priority.title}</li>
                  {FYP.pro.priority.features.map((e: any) => {
                    return (
                      <li key={e}>
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-red me-3"
                        />
                        {e}
                      </li>
                    );
                  })}

                  <li className="fw-semibold">{FYP.pro.tts.title}</li>
                  {FYP.pro.tts.features.map((e: any) => {
                    return (
                      <li key={e}>
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-red me-3"
                        />
                        {e}
                      </li>
                    );
                  })}

                  <li className="fw-semibold">{FYP.pro.vc.title}</li>
                  {FYP.pro.vc.features.map((e: any) => {
                    return (
                      <li key={e}>
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-red me-3"
                        />
                        {e}
                      </li>
                    );
                  })}

                  {isVideoToolsEnabled() && (
                    <>
                      {(FYP.pro as any).lipsync && (
                        <>
                          <li className="fw-semibold">
                            {(FYP.pro as any).lipsync.title}
                          </li>
                          {(FYP.pro as any).lipsync.features.map((e: any) => (
                            <li key={e}>
                              <FontAwesomeIcon
                                icon={faCheck}
                                className="text-red me-3"
                              />
                              {e}
                            </li>
                          ))}
                        </>
                      )}

                      {(FYP.pro as any).live_portrait && (
                        <>
                          <li className="fw-semibold">
                            {(FYP.pro as any).live_portrait.title}
                          </li>
                          {(FYP.pro as any).live_portrait.features.map(
                            (e: any) => (
                              <li key={e}>
                                <FontAwesomeIcon
                                  icon={faCheck}
                                  className="text-red me-3"
                                />
                                {e}
                              </li>
                            )
                          )}
                        </>
                      )}

                      {(FYP.pro as any).style_transfer && (
                        <>
                          <li className="fw-semibold">
                            {(FYP.pro as any).style_transfer.title}
                          </li>
                          {(FYP.pro as any).style_transfer.features.map(
                            (e: any) => (
                              <li key={e}>
                                <FontAwesomeIcon
                                  icon={faCheck}
                                  className="text-red me-3"
                                />
                                {e}
                              </li>
                            )
                          )}
                        </>
                      )}

                      <li className="fw-semibold">
                        {FYP.pro.storyteller.title}
                      </li>
                      {FYP.pro.storyteller.features.map((e: any) => {
                        return (
                          <li key={e}>
                            <FontAwesomeIcon
                              icon={faCheck}
                              className="text-red me-3"
                            />
                            {e}
                          </li>
                        );
                      })}
                    </>
                  )}

                  <li className="fw-semibold">{FYP.pro.ads.title}</li>
                  {FYP.pro.ads.features.map((e: any) => {
                    return (
                      <li key={e}>
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-red me-3"
                        />
                        {e}
                      </li>
                    );
                  })}
                </ul>
                <hr className="my-4" />
                <h6 className="text-center fw-normal opacity-50">
                  + Future feature updates
                </h6>
              </div>
            </div>

            {/* Elite Tier */}
            <div className="col-12 col-md-6 col-lg-4 pt-lg-5 order-3 order-md-3">
              <div className="rounded panel padding h-100">
                <h2 className="text-center my-2 fw-bold mb-4">
                  {FYP.elite.tier}
                </h2>
                <button
                  onClick={() =>
                    beginStripeFlow(
                      FYP.elite.internal_plan_key[planKey],
                      "elite"
                    )
                  }
                  className="btn btn-primary w-100 fs-6"
                  disabled={eliteButtonDisabled}
                >
                  {eliteButtonText}
                </button>
                <h2 className="display-5 fw-bold text-center my-5">
                  ${FYP.elite.price}
                  <span className="fs-5 opacity-75 fw-normal"> /month</span>
                </h2>
                <ul className="pricing-list d-flex flex-column gap-2">
                  <li className="fw-semibold">{FYP.elite.priority.title}</li>
                  {FYP.elite.priority.features.map((e: any) => {
                    return (
                      <li key={e}>
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-red me-3"
                        />
                        {e}
                      </li>
                    );
                  })}

                  <li className="fw-semibold">{FYP.elite.tts.title}</li>
                  {FYP.elite.tts.features.map((e: any) => {
                    return (
                      <li key={e}>
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-red me-3"
                        />
                        {e}
                      </li>
                    );
                  })}

                  <li className="fw-semibold">{FYP.elite.vc.title}</li>
                  {FYP.elite.vc.features.map((e: any) => {
                    return (
                      <li key={e}>
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-red me-3"
                        />
                        {e}
                      </li>
                    );
                  })}

                  {isVideoToolsEnabled() && (
                    <>
                      {(FYP.elite as any).lipsync && (
                        <>
                          <li className="fw-semibold">
                            {(FYP.elite as any).lipsync.title}
                          </li>
                          {(FYP.elite as any).lipsync.features.map((e: any) => (
                            <li key={e}>
                              <FontAwesomeIcon
                                icon={faCheck}
                                className="text-red me-3"
                              />
                              {e}
                            </li>
                          ))}
                        </>
                      )}

                      {(FYP.elite as any).live_portrait && (
                        <>
                          <li className="fw-semibold">
                            {(FYP.elite as any).live_portrait.title}
                          </li>
                          {(FYP.elite as any).live_portrait.features.map(
                            (e: any) => (
                              <li key={e}>
                                <FontAwesomeIcon
                                  icon={faCheck}
                                  className="text-red me-3"
                                />
                                {e}
                              </li>
                            )
                          )}
                        </>
                      )}

                      {(FYP.elite as any).style_transfer && (
                        <>
                          <li className="fw-semibold">
                            {(FYP.elite as any).style_transfer.title}
                          </li>
                          {(FYP.elite as any).style_transfer.features.map(
                            (e: any) => (
                              <li key={e}>
                                <FontAwesomeIcon
                                  icon={faCheck}
                                  className="text-red me-3"
                                />
                                {e}
                              </li>
                            )
                          )}
                        </>
                      )}

                      <li className="fw-semibold">
                        {FYP.elite.storyteller.title}
                      </li>
                      {FYP.elite.storyteller.features.map((e: any) => {
                        return (
                          <li key={e}>
                            <FontAwesomeIcon
                              icon={faCheck}
                              className="text-red me-3"
                            />
                            {e}
                          </li>
                        );
                      })}
                    </>
                  )}

                  <li className="fw-semibold">{FYP.elite.commercial.title}</li>
                  {FYP.elite.commercial.features.map((e: any) => {
                    return (
                      <li key={e}>
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-red me-3"
                        />
                        {e}
                      </li>
                    );
                  })}

                  <li className="fw-semibold">{FYP.elite.ads.title}</li>
                  {FYP.elite.ads.features.map((e: any) => {
                    return (
                      <li key={e}>
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-red me-3"
                        />
                        {e}
                      </li>
                    );
                  })}
                </ul>
                <hr className="my-4" />
                <h6 className="text-center fw-normal opacity-50">
                  + Future feature updates
                </h6>
              </div>
            </div>
          </div>

          {unsubscribeSection}

          {/* Starter Tier (to show for Latin American countries) */}
          {/* <div className="w-100 mt-4">
          <div className="rounded panel p-4 h-100">
            <div className="d-flex w-100">
              <h2 className="my-2 fw-bold mb-4 flex-grow-1">
                {FYP.starter.tier}
              </h2>

              <h2 className="display-6 fw-bold text-right">
                ${FYP.starter.price}
                <span className="fs-5 opacity-75 fw-normal"> /month</span>
              </h2>
            </div>

            <Link to="/" className="btn btn-secondary w-100 fs-6">
              Use for free
            </Link>

            <div className="row mt-5">
              <div className="col-4 d-flex flex-column gap-3">
                <ul className="pricing-list d-flex flex-column gap-2">
                  <li className="fw-semibold">{FYP.starter.tts.title}</li>
                  {FYP.starter.tts.features.map((e: any) => {
                    return (
                      <li key={e}>
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-red me-3"
                        />
                        {e}
                      </li>
                    );
                  })}
                </ul>
                <ul className="pricing-list d-flex flex-column gap-2">
                  <li className="fw-semibold">{FYP.starter.vcweb.title}</li>
                  {FYP.starter.vcweb.features.map((e: any) => {
                    return (
                      <li key={e}>
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-red me-3"
                        />
                        {e}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="col-4 d-flex flex-column gap-3">
                <ul className="pricing-list d-flex flex-column gap-2">
                  <li className="fw-semibold">
                    {FYP.starter.vcapp.title}{" "}
                    <span className="small-text">(registered users)</span>
                  </li>
                  {FYP.starter.vcapp.features.map((e: any) => {
                    return (
                      <li key={e}>
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-red me-3"
                        />
                        {e}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="col-4 d-flex flex-column gap-3">
                <ul className="pricing-list d-flex flex-column gap-2">
                  <li className="fw-semibold">{FYP.starter.w2l.title}</li>
                  {FYP.starter.w2l.features.map((e: any) => {
                    return (
                      <li key={e}>
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-red me-3"
                        />
                        {e}
                      </li>
                    );
                  })}
                </ul>
                <ul className="pricing-list d-flex flex-column gap-2">
                  <li className="fw-semibold">
                    {FYP.starter.priority.title}{" "}
                    <span className="small-text">(registered users)</span>
                  </li>
                  {FYP.starter.priority.features.map((e: any) => {
                    return (
                      <li key={e}>
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-red me-3"
                        />
                        {e}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div> */}
        </Panel>
      </Container>

      <Container type="panel" className="py-5 mt-5 d-flex flex-column gap-5">
        <MentionsSection />
        {/* <StorytellerStudioCTA /> */}
      </Container>
    </>
  );
}
