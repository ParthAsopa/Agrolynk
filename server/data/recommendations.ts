import { Recommendation } from "@shared/types";

// Static recommendation data for different crop and location combinations
// In a real application, this would be generated dynamically based on AI algorithms

const recommendations: Record<string, Record<string, Recommendation>> = {
  wheat: {
    punjab: {
      seeds: [
        {
          name: "HD-291 (High Yield Variety)",
          rating: "★★★★★",
          description: "Best suited for Punjab climate zone, resistant to common pests",
        },
        {
          name: "PBW-343 (Drought Resistant)",
          rating: "★★★★☆",
          description: "Good alternative with water conservation properties",
        },
      ],
      fertilizers: [
        {
          name: "NPK 14-35-14 (Growth Stage)",
          price: 1200,
          description: "Apply during initial growth stage, 25kg per acre",
        },
        {
          name: "Urea (46-0-0)",
          price: 800,
          description: "Apply before flowering, 20kg per acre",
        },
      ],
      equipment: [
        {
          name: "Rotary Tiller",
          availability: "Rental Available",
          description: "Ideal for your soil type, increases aeration and nutrient absorption",
        },
        {
          name: "Precision Seed Drill",
          availability: "Community Sharing",
          description: "Ensures optimal seed spacing and depth for maximum yield",
        },
      ],
    },
    andhra: {
      seeds: [
        {
          name: "HD-2967 (Heat Resistant)",
          rating: "★★★★☆",
          description: "Suitable for warmer southern climate, good disease resistance",
        },
        {
          name: "PBW-550 (Early Maturing)",
          rating: "★★★★★",
          description: "Excellent for Andhra conditions, matures in 120-125 days",
        },
      ],
      fertilizers: [
        {
          name: "NPK 20-20-20 (Balanced Formula)",
          price: 1350,
          description: "Well-balanced formula suitable for Andhra soil conditions, 30kg per acre",
        },
        {
          name: "DAP (18-46-0)",
          price: 1100,
          description: "Apply at sowing time, 25kg per acre",
        },
      ],
      equipment: [
        {
          name: "Zero-Till Drill",
          availability: "Subsidy Available",
          description: "Conserves soil moisture, reduces erosion risk in Andhra conditions",
        },
        {
          name: "Power Weeder",
          availability: "Rental Available",
          description: "Effective for weed control in sandy loam soils",
        },
      ],
    },
  },
  corn: {
    punjab: {
      seeds: [
        {
          name: "PMH-1 (High Yield Hybrid)",
          rating: "★★★★★",
          description: "Punjab's favorite corn variety, excellent yield potential",
        },
        {
          name: "Dekalb DKC7074 (Insect Resistant)",
          rating: "★★★★☆",
          description: "Built-in protection against stem borer and other pests",
        },
      ],
      fertilizers: [
        {
          name: "NPK 10-26-26 (Pre-planting)",
          price: 1450,
          description: "Apply before planting, 40kg per acre",
        },
        {
          name: "Zinc Sulphate",
          price: 750,
          description: "Essential micronutrient for corn, 5kg per acre",
        },
      ],
      equipment: [
        {
          name: "Ridge Planter",
          availability: "Purchase Recommended",
          description: "Creates optimal seed bed for corn in Punjab conditions",
        },
        {
          name: "Boom Sprayer",
          availability: "Rental Available",
          description: "Efficient for pesticide application in large corn fields",
        },
      ],
    },
    andhra: {
      seeds: [
        {
          name: "NAH-1137 (Heat Tolerant)",
          rating: "★★★★☆",
          description: "Developed for southern regions, withstands high temperatures",
        },
        {
          name: "PAC 740 (Disease Resistant)",
          rating: "★★★★★",
          description: "Excellent resistance to common Andhra fungal diseases",
        },
      ],
      fertilizers: [
        {
          name: "NPK 12-32-16 (Starter)",
          price: 1300,
          description: "Excellent starter fertilizer for rapid establishment, 35kg per acre",
        },
        {
          name: "Calcium Nitrate",
          price: 900,
          description: "Apply mid-season for improved stalk quality, 15kg per acre",
        },
      ],
      equipment: [
        {
          name: "Drip Irrigation System",
          availability: "Subsidy Available",
          description: "Water-efficient solution perfect for Andhra's climate",
        },
        {
          name: "Inter-row Cultivator",
          availability: "Community Sharing",
          description: "Ideal for weed management in Andhra corn fields",
        },
      ],
    },
  },
  coconut: {
    punjab: {
      seeds: [
        {
          name: "West Coast Tall (Adaptable)",
          rating: "★★★☆☆",
          description: "Can adapt to Punjab conditions with proper care",
        },
        {
          name: "Chowghat Orange Dwarf",
          rating: "★★★★☆",
          description: "Shorter variety suitable for non-traditional growing areas",
        },
      ],
      fertilizers: [
        {
          name: "NPK 14-14-14 (Balanced)",
          price: 1200,
          description: "Apply quarterly, 1.5kg per palm per year",
        },
        {
          name: "Magnesium Sulphate",
          price: 600,
          description: "Essential for chlorophyll production, 0.5kg per palm per year",
        },
      ],
      equipment: [
        {
          name: "Coconut Climber",
          availability: "Purchase Recommended",
          description: "Safe harvesting equipment for tall palms",
        },
        {
          name: "Basin Irrigation System",
          availability: "Custom Installation",
          description: "Efficient watering solution for Punjab's drier climate",
        },
      ],
    },
    andhra: {
      seeds: [
        {
          name: "East Coast Tall (Regional)",
          rating: "★★★★★",
          description: "Perfectly suited for Andhra coastal conditions",
        },
        {
          name: "Hybrid D×T (High Yield)",
          rating: "★★★★★",
          description: "Produces up to 150 nuts per palm per year in ideal conditions",
        },
      ],
      fertilizers: [
        {
          name: "Organic Compost Mix",
          price: 850,
          description: "Apply 25kg per palm biannually for optimal growth",
        },
        {
          name: "NPK 15-15-15 (Balanced)",
          price: 1100,
          description: "Apply 2kg per palm per year, split into quarterly applications",
        },
      ],
      equipment: [
        {
          name: "Coconut Dehusker",
          availability: "Village Level",
          description: "Essential processing equipment for large harvests",
        },
        {
          name: "Sprinkler Irrigation System",
          availability: "Subsidy Available",
          description: "Ensures optimal water distribution in Andhra soil types",
        },
      ],
    },
  },
};

export const getRecommendations = (
  crop: string, 
  location: string, 
  farmSize: number
): Recommendation => {
  // In a real app, we might adjust recommendations based on farm size
  // For this demo, we'll return static data
  
  const cropData = recommendations[crop] || {};
  return cropData[location] || {
    seeds: [
      {
        name: "Generic Seed Variety",
        rating: "★★★☆☆",
        description: "Basic variety suitable for most conditions",
      }
    ],
    fertilizers: [
      {
        name: "Standard NPK Mix",
        price: 1000,
        description: "General purpose fertilizer for most crops",
      }
    ],
    equipment: [
      {
        name: "Standard Tractor",
        availability: "Rental Available",
        description: "All-purpose farming equipment",
      }
    ]
  };
};
