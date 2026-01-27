import Footer from "../../components/footer";
import Seo from "../../components/seo";
import { PricingTable } from "../../components/pricing-table";

const Pricing = () => {
  return (
    <div className="relative min-h-screen bg-[#101014] text-white bg-dots">
      <Seo
        title="Pricing - ArtCraft"
        description="Simple, transparent pricing for ArtCraft. Start for free and scale as you grow."
      />
      <div className="dotted-pattern absolute inset-0 z-[0] opacity-50" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[900px] h-[900px] rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-20 blur-[120px]"></div>
      </div>

      <main className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <PricingTable
          title="Invest in ArtCraft"
          subtitle="Support open-source development. Your subscription makes ArtCraft better and gets you tons of generations."
        />
      </main>

      <p className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        Note: Pricing table is wrong, but we'll fix this shortly.
      </p>

      <Footer />
    </div>
  );
};

export default Pricing;
