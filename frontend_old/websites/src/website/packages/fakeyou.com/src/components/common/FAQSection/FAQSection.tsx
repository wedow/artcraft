import React from "react";
import { Container, Panel } from "components/common";
import "./FAQSection.scss";
import { Helmet } from "react-helmet-async";
import { AdHorizontal } from "../AdBanner";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title?: string;
  faqItems: FAQItem[];
  className?: string;
}

const FAQSection: React.FC<FAQSectionProps> = ({
  title = "Frequently Asked Questions",
  faqItems,
  className,
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      <Container type="panel" className={className}>
        <AdHorizontal format="horizontal" className="mb-5" />
        <Panel padding={true} className="p-4 faq-section">
          <h2 className="fw-bold mb-5">{title}</h2>
          <section aria-label="FAQ Section">
            {faqItems.map((item, index) => (
              <React.Fragment key={index}>
                <div className="faq-item">
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </div>
                {index < faqItems.length - 1 && <hr className="my-5" />}
              </React.Fragment>
            ))}
          </section>
        </Panel>
      </Container>
    </>
  );
};

export default FAQSection;
