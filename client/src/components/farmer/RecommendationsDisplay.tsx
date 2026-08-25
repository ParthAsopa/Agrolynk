import { 
  Leaf, 
  FlaskConical, 
  Settings,
} from "lucide-react";
import { Recommendation } from "@shared/types";

interface RecommendationsDisplayProps {
  recommendations: Recommendation | null;
  isLoading: boolean;
}

export default function RecommendationsDisplay({ 
  recommendations, 
  isLoading 
}: RecommendationsDisplayProps) {
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

  if (!recommendations) {
    return null;
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Our Recommendations</h2>
      
      {/* Seeds */}
      <div className="mb-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <Leaf className="h-5 w-5 mr-2 text-primary" />
          Recommended Seeds
        </h3>
        <div className="mt-3 divide-y divide-gray-200 dark:divide-gray-700">
          {recommendations.seeds.map((seed, index) => (
            <div key={index} className="py-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-800 dark:text-gray-200">{seed.name}</span>
                <span className="text-primary">{seed.rating}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{seed.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Fertilizers */}
      <div className="mb-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <FlaskConical className="h-5 w-5 mr-2 text-primary" />
          Recommended Fertilizers
        </h3>
        <div className="mt-3 divide-y divide-gray-200 dark:divide-gray-700">
          {recommendations.fertilizers.map((fertilizer, index) => (
            <div key={index} className="py-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-800 dark:text-gray-200">{fertilizer.name}</span>
                <span className="text-green-600 dark:text-green-400">₹{fertilizer.price}/bag</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{fertilizer.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Equipment */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <Settings className="h-5 w-5 mr-2 text-primary" />
          Recommended Equipment
        </h3>
        <div className="mt-3 divide-y divide-gray-200 dark:divide-gray-700">
          {recommendations.equipment.map((equipment, index) => (
            <div key={index} className="py-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-800 dark:text-gray-200">{equipment.name}</span>
                <span className="text-blue-600 dark:text-blue-400">{equipment.availability}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{equipment.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
