import { TrendingUp, BadgePercent, Users } from "lucide-react";
import { MarketInsight } from "@shared/types";
import PriceChart from "@/components/PriceChart";
import { getDemandClass } from "@/lib/utils";

interface MarketInsightsDisplayProps {
  insights: MarketInsight | null;
  isLoading: boolean;
}

export default function MarketInsightsDisplay({ 
  insights, 
  isLoading 
}: MarketInsightsDisplayProps) {
  if (isLoading) {
    return (
      <div className="mt-10">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="space-y-4">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <div className="mt-10">
      {/* Market Overview */}
      <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Market Overview</h2>
        
        {/* Current Price */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Market Price</h3>
          <div className="mt-1 flex items-baseline">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
              ₹{insights.currentPrice}
            </span>
            <span className="ml-2 text-sm font-medium text-green-600 dark:text-green-400">
              per quintal
            </span>
          </div>
        </div>
        
        {/* Demand Status */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Demand Status</h3>
          <div className="mt-1 flex items-center">
            <div className="flex-shrink-0">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDemandClass(insights.demand.status)}`}>
                {insights.demand.status} Demand
              </span>
            </div>
            <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              {insights.demand.description}
            </p>
          </div>
        </div>
        
        {/* Price Trend Chart */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Price Trend (Last 6 Months)
          </h3>
          <PriceChart data={insights.priceHistory} />
        </div>
      </div>
      
      {/* Alternative Options */}
      <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-secondary" />
          Alternative Options
        </h2>
        
        <div className="space-y-4">
          {insights.alternatives.map((option, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{option.name}</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  +{option.valueIncrease}% Value
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {option.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Buyer Recommendations */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-secondary" />
          Potential Buyers
        </h2>
        
        <div className="mt-3 divide-y divide-gray-200 dark:divide-gray-700">
          {insights.potentialBuyers.map((buyer, index) => (
            <div key={index} className="py-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">{buyer.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Distance: {buyer.distance} km</p>
                </div>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">₹{buyer.pricePerQuintal}/quintal</span>
              </div>
              <div className="mt-1 flex items-center">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    {buyer.tag}
                  </span>
                </div>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  {buyer.note}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
