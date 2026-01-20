import { faCheck } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import Footer from "../../components/footer";

const Pricing = () => {
  return (
    <div className="relative min-h-screen bg-[#101014] text-white bg-dots">
      <div className="dotted-pattern absolute inset-0 z-[0] opacity-50" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[900px] h-[900px] rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-20 blur-[120px]"></div>
      </div>

      <main className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-white/70 leading-relaxed">
            Start for free and scale as you grow. No hidden fees.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 flex flex-col hover:border-white/20 transition-all duration-300">
            <h3 className="text-2xl font-bold mb-2">Hobbyist</h3>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-white/60">/month</span>
            </div>
            <p className="text-white/60 mb-8 h-12">
              Perfect for getting started and learning the basics of ArtCraft.
            </p>
            <Button
              className="w-full justify-center bg-white/10 hover:bg-white/20 border-transparent mb-8"
              as="link"
              href="/download"
            >
              Get Started
            </Button>
            <ul className="space-y-4 flex-1">
               <Feature text="Unlimited local generations" />
               <Feature text="Acccess to basic models" />
               <Feature text="Community support" />
               <Feature text="Non-commercial use" />
            </ul>
          </div>

          {/* Pro Tier (Highlighted) */}
          <div className="bg-[#1C1C20] backdrop-blur-md rounded-3xl p-8 border-2 border-primary shadow-2xl shadow-primary/20 flex flex-col relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary px-4 py-1 rounded-full text-sm font-bold shadow-lg">
               MOST POPULAR
            </div>
            <h3 className="text-2xl font-bold mb-2 text-primary">Pro</h3>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold">$20</span>
              <span className="text-white/60">/month</span>
            </div>
            <p className="text-white/60 mb-8 h-12">
              For professional artists and creators who need more power.
            </p>
            <Button
              className="w-full justify-center bg-primary hover:bg-primary-600 border-transparent mb-8"
              as="link"
              href="/signup"
            >
              Start Free Trial
            </Button>
            <ul className="space-y-4 flex-1">
               <Feature text="Everything in Hobbyist" highlighted />
               <Feature text="Cloud sync & backup" highlighted />
               <Feature text="Priority rendering queue" highlighted />
               <Feature text="Commercial license" highlighted />
               <Feature text="Access to latest models" highlighted />
               <Feature text="4K resolution support" highlighted />
            </ul>
          </div>

           {/* Studio Tier */}
           <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 flex flex-col hover:border-white/20 transition-all duration-300">
            <h3 className="text-2xl font-bold mb-2">Studio</h3>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold">$100</span>
              <span className="text-white/60">/month</span>
            </div>
            <p className="text-white/60 mb-8 h-12">
              For teams and studios requiring collaboration tools.
            </p>
            <Button
              className="w-full justify-center bg-white/10 hover:bg-white/20 border-transparent mb-8"
              as="link"
              href="/contact"
            >
              Contact Sales
            </Button>
            <ul className="space-y-4 flex-1">
               <Feature text="Everything in Pro" />
               <Feature text="Team collaboration" />
               <Feature text="Dedicated support manager" />
               <Feature text="Custom model fine-tuning" />
               <Feature text="SSO & Advanced Security" />
            </ul>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

const Feature = ({ text, highlighted = false }: { text: string; highlighted?: boolean }) => (
  <li className="flex items-start gap-3">
    <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center ${highlighted ? "bg-primary/20 text-primary" : "bg-white/10 text-white/50"}`}>
        <FontAwesomeIcon icon={faCheck} className="text-xs" />
    </div>
    <span className={`text-sm ${highlighted ? "text-white" : "text-white/70"}`}>{text}</span>
  </li>
);

export default Pricing;
