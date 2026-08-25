import { Link } from "wouter";
import { ShoppingCart, DollarSign, ArrowRight, Leaf, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CompanyOptions() {
  return (
    <div className="min-h-screen agrarian-pattern">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Agricultural Trading Platform
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
            Buy crops directly from farmers or sell agricultural supplies to meet market demands
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Buy Card */}
          <div className="card-agrarian overflow-hidden transition-all duration-300 hover:translate-y-[-5px]">
            <div className="p-8">
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                <ShoppingCart className="h-12 w-12 text-primary" />
              </div>
              <div className="mt-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Buy Crops</h3>
                <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
                  Purchase high-quality crops directly from farmers with transparent pricing, 
                  verified quality standards, and traceable supply chain information.
                </p>
                <div className="flex mt-8 justify-center gap-3">
                  <div className="flex items-center justify-center rounded-full bg-primary/10 p-2">
                    <Leaf className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Source from over 10,000 verified farmers
                  </div>
                </div>
                <div className="mt-6">
                  <Link href="/company/buy">
                    <Button 
                      variant="agrarian" 
                      size="lg"
                      className="btn-glow inline-flex items-center"
                    >
                      Start Buying
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Sell Card */}
          <div className="card-agrarian overflow-hidden transition-all duration-300 hover:translate-y-[-5px]">
            <div className="p-8">
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-secondary/20 to-secondary/5">
                <DollarSign className="h-12 w-12 text-secondary" />
              </div>
              <div className="mt-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Sell Supplies</h3>
                <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
                  List your agricultural products including seeds, fertilizers, pesticides, and equipment
                  to reach thousands of farmers looking for quality supplies.
                </p>
                <div className="flex mt-8 justify-center gap-3">
                  <div className="flex items-center justify-center rounded-full bg-secondary/10 p-2">
                    <Sprout className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Connect with farmers in over 500 districts
                  </div>
                </div>
                <div className="mt-6">
                  <Link href="/company/sell">
                    <Button 
                      className="btn-glow inline-flex items-center" 
                      variant="outline"
                      size="lg"
                    >
                      Start Selling
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
