import { Link } from "wouter";
import { ShoppingCart, DollarSign, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FarmerOptions() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            What would you like to do?
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
            Choose an option to proceed
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Buy Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900">
                <ShoppingCart className="h-10 w-10 text-primary" />
              </div>
              <div className="mt-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">BUY</h3>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                  Get AI recommendations for fertilizers, pesticides, and expected prices for your crops.
                </p>
                <div className="mt-6">
                  <Link href="/farmer/buy">
                    <Button className="inline-flex items-center">
                      Select
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Sell Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-100 dark:bg-yellow-900">
                <DollarSign className="h-10 w-10 text-secondary" />
              </div>
              <div className="mt-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">SELL</h3>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                  View real-time market prices, demand-supply alerts, and alternative product suggestions.
                </p>
                <div className="mt-6">
                  <Link href="/farmer/sell">
                    <Button 
                      className="inline-flex items-center" 
                      variant="secondary"
                    >
                      Select
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
