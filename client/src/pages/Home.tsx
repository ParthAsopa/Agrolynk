import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Leaf, TrendingUp, Sprout, BarChart3, CreditCard, SendToBack } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  imageSrc: string;
}

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: FeatureItem[] = [
  {
    icon: <Leaf className="h-10 w-10 text-primary" />,
    title: "Sustainable Farming",
    description: "Get personalized recommendations for sustainable farming practices that benefit both your crops and the environment."
  },
  {
    icon: <TrendingUp className="h-10 w-10 text-primary" />,
    title: "Market Insights",
    description: "Access real-time market data and price trends to make informed decisions about when to sell your crops."
  },
  {
    icon: <Sprout className="h-10 w-10 text-primary" />,
    title: "Crop Recommendations",
    description: "Discover which crops will thrive in your specific soil conditions and climate for maximum yield."
  },
  {
    icon: <BarChart3 className="h-10 w-10 text-primary" />,
    title: "Byproduct Opportunities",
    description: "Find new revenue streams by selling crop byproducts that would otherwise go to waste."
  },
  {
    icon: <CreditCard className="h-10 w-10 text-primary" />,
    title: "Fair Pricing",
    description: "Connect directly with companies for fair pricing without middlemen taking a cut of your profits."
  },
  {
    icon: <SendToBack className="h-10 w-10 text-primary" />,
    title: "Supply Chain Visibility",
    description: "Track your products from farm to market with complete transparency throughout the supply chain."
  }
];

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Raj Singh",
    role: "Wheat Farmer, Punjab",
    content: "AgroLynk helped me increase my crop yield by 30% and get better prices for my wheat. The market insights are incredibly valuable!",
    imageSrc: "https://randomuser.me/api/portraits/men/1.jpg"
  },
  {
    id: 2,
    name: "Lakshmi Reddy",
    role: "Coconut Grower, Kerala",
    content: "The alternative product suggestions for coconut husks opened up new revenue streams I hadn't considered before. Now I sell both coconuts and their byproducts!",
    imageSrc: "https://randomuser.me/api/portraits/women/2.jpg"
  },
  {
    id: 3,
    name: "Vikram Patel",
    role: "Agricultural Supplier",
    content: "As a company, we've been able to better forecast demand and connect directly with farmers who need our products at the right time.",
    imageSrc: "https://randomuser.me/api/portraits/men/3.jpg"
  }
];

export default function Home() {
  return (
    <div className="min-h-screen agrarian-pattern">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30 z-10" />
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/20 to-neutral-900"></div>
        <div className="relative z-20 max-w-7xl mx-auto px-4 py-32 sm:px-6 sm:py-40 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-lg">
              <span className="block">Empowering Farmers</span>
              <span className="block text-primary">with AI-Powered Insights</span>
            </h1>
            <p className="mt-6 text-xl text-gray-300 max-w-lg drop-shadow">
              AgroLynk connects farmers with cutting-edge technology to optimize crop yields, access fair markets, and make data-driven decisions.
            </p>
            <div className="mt-10">
              <Link href="/role-selection">
                <Button
                  variant="agrarian"
                  size="lg" 
                  className="shadow-xl"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base font-semibold text-primary uppercase tracking-wide">Features</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              How AgroLynk Works For You
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 mx-auto">
              Our platform provides everything you need to maximize your agricultural success
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div key={index} className="card-agrarian p-8 transition-all duration-300 hover:translate-y-[-5px]">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 rounded-full bg-primary/10 p-3">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Byproduct Opportunity Highlight */}
      <section className="py-16 bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div className="lg:col-span-1">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                Unlock New Revenue Streams with Crop Byproducts
              </h2>
              <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                Don't let valuable byproducts go to waste. AgroLynk helps you identify and sell:
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-base text-gray-700 dark:text-gray-300">
                    <strong>Coconut Husks</strong> - Used in erosion control, garden mulch, and plant pots
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-base text-gray-700 dark:text-gray-300">
                    <strong>Rice Straw</strong> - Valuable for animal feed, mushroom cultivation, and biofuel
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-base text-gray-700 dark:text-gray-300">
                    <strong>Sugarcane Bagasse</strong> - Sought after for paper production and as a renewable energy source
                  </p>
                </li>
              </ul>
              <div className="mt-10">
                <Link href="/farmer/sell">
                  <Button variant="outline" className="btn-glow">
                    Explore Byproduct Markets
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mt-10 lg:mt-0 lg:col-span-1">
              <div className="card-agrarian overflow-hidden shadow-2xl rounded-2xl">
                <div className="p-8 bg-card flex items-center justify-center">
                  <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/5 rounded-lg"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-6">
                      <div className="w-16 h-16 mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                        <Leaf className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Sustainable Agriculture</h3>
                      <p className="text-gray-500 dark:text-gray-400 max-w-md">
                        Our platform helps reduce agricultural waste by connecting farmers with buyers 
                        interested in crop byproducts, promoting sustainability in farming practices.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials section */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-primary uppercase tracking-wide">Testimonials</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Trusted by farmers across the country
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="card-agrarian p-6">
                  <div className="flex items-center mb-6">
                    <img
                      className="h-14 w-14 rounded-full border-2 border-primary/20"
                      src={testimonial.imageSrc}
                      alt={`${testimonial.name}'s profile`}
                    />
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{testimonial.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 italic">
                    "{testimonial.content}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-white">Join AgroLynk today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link href="/role-selection">
                <Button
                  variant="default"
                  size="lg"
                  className="btn-glow bg-white text-primary hover:bg-gray-100"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
