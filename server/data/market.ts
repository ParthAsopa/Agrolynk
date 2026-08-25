import { MarketInsight, ChartData } from "@shared/types";

// Price history data for different crops
const priceHistory: Record<string, Record<string, ChartData[]>> = {
  wheat: {
    punjab: [
      { month: "Jul", price: 2050 },
      { month: "Aug", price: 2120 },
      { month: "Sep", price: 2180 },
      { month: "Oct", price: 2260 },
      { month: "Nov", price: 2380 },
      { month: "Dec", price: 2450 },
    ],
    andhra: [
      { month: "Jul", price: 2100 },
      { month: "Aug", price: 2150 },
      { month: "Sep", price: 2200 },
      { month: "Oct", price: 2300 },
      { month: "Nov", price: 2400 },
      { month: "Dec", price: 2500 },
    ],
  },
  corn: {
    punjab: [
      { month: "Jul", price: 1800 },
      { month: "Aug", price: 1820 },
      { month: "Sep", price: 1850 },
      { month: "Oct", price: 1880 },
      { month: "Nov", price: 1910 },
      { month: "Dec", price: 1950 },
    ],
    andhra: [
      { month: "Jul", price: 1750 },
      { month: "Aug", price: 1800 },
      { month: "Sep", price: 1830 },
      { month: "Oct", price: 1860 },
      { month: "Nov", price: 1900 },
      { month: "Dec", price: 1940 },
    ],
  },
  coconut: {
    punjab: [
      { month: "Jul", price: 3100 },
      { month: "Aug", price: 3050 },
      { month: "Sep", price: 3000 },
      { month: "Oct", price: 2980 },
      { month: "Nov", price: 3050 },
      { month: "Dec", price: 3200 },
    ],
    andhra: [
      { month: "Jul", price: 2800 },
      { month: "Aug", price: 2750 },
      { month: "Sep", price: 2780 },
      { month: "Oct", price: 2830 },
      { month: "Nov", price: 2900 },
      { month: "Dec", price: 3000 },
    ],
  },
};

// Static market insights for different crop and location combinations
const marketInsights: Record<string, Record<string, MarketInsight>> = {
  wheat: {
    punjab: {
      currentPrice: 2450,
      demand: {
        status: "High",
        description: "Current market conditions favor sellers",
      },
      priceHistory: priceHistory.wheat.punjab,
      alternatives: [
        {
          name: "Wheat Flour Direct Sales",
          valueIncrease: 15,
          description: "Process wheat into flour and sell directly to bakeries and food processors",
        },
        {
          name: "Wheat Straw Packaging",
          valueIncrease: 12,
          description: "Convert wheat straw into eco-friendly packaging materials",
        },
      ],
      potentialBuyers: [
        {
          name: "Punjab Flour Mills Ltd.",
          distance: 15,
          pricePerQuintal: 2550,
          tag: "Verified Buyer",
          note: "Looking for 200+ quintals",
        },
        {
          name: "Organic Food Co-op",
          distance: 32,
          pricePerQuintal: 2650,
          tag: "Fair Trade",
          note: "Smaller quantities accepted",
        },
      ],
    },
    andhra: {
      currentPrice: 2500,
      demand: {
        status: "Medium",
        description: "Steady demand with moderate competition",
      },
      priceHistory: priceHistory.wheat.andhra,
      alternatives: [
        {
          name: "Specialty Grain Markets",
          valueIncrease: 18,
          description: "Target health food stores with premium wheat varieties",
        },
        {
          name: "Wheat Seed Production",
          valueIncrease: 25,
          description: "Partner with seed companies to produce certified wheat seeds",
        },
      ],
      potentialBuyers: [
        {
          name: "Andhra Bakeries Association",
          distance: 20,
          pricePerQuintal: 2600,
          tag: "Bulk Buyer",
          note: "Weekly purchase contract available",
        },
        {
          name: "South India Grains Ltd.",
          distance: 45,
          pricePerQuintal: 2550,
          tag: "Direct Export",
          note: "Premium for consistent quality",
        },
      ],
    },
  },
  corn: {
    punjab: {
      currentPrice: 1950,
      demand: {
        status: "Medium",
        description: "Demand expected to increase in coming months",
      },
      priceHistory: priceHistory.corn.punjab,
      alternatives: [
        {
          name: "Sweet Corn Direct Marketing",
          valueIncrease: 30,
          description: "Sell premium sweet corn varieties directly to consumers or restaurants",
        },
        {
          name: "Corn Silage for Dairy Farms",
          valueIncrease: 15,
          description: "Process corn into silage for nearby dairy operations",
        },
      ],
      potentialBuyers: [
        {
          name: "Punjab Poultry Feeds",
          distance: 25,
          pricePerQuintal: 2050,
          tag: "Regular Buyer",
          note: "Long-term contracts available",
        },
        {
          name: "North India Starch Products",
          distance: 40,
          pricePerQuintal: 2000,
          tag: "Industry Buyer",
          note: "Premium for high starch content",
        },
      ],
    },
    andhra: {
      currentPrice: 1940,
      demand: {
        status: "High",
        description: "Strong demand from poultry and food processing sectors",
      },
      priceHistory: priceHistory.corn.andhra,
      alternatives: [
        {
          name: "Specialty Corn Products",
          valueIncrease: 25,
          description: "Process into corn flour, grits, or specialty snack products",
        },
        {
          name: "Baby Corn Production",
          valueIncrease: 40,
          description: "Switch to baby corn varieties for premium export markets",
        },
      ],
      potentialBuyers: [
        {
          name: "Andhra Food Processors",
          distance: 18,
          pricePerQuintal: 2000,
          tag: "Premium Buyer",
          note: "Seeking non-GMO varieties",
        },
        {
          name: "Southern Poultry Federation",
          distance: 30,
          pricePerQuintal: 1980,
          tag: "Bulk Contract",
          note: "Guaranteed minimum purchase",
        },
      ],
    },
  },
  coconut: {
    punjab: {
      currentPrice: 3200,
      demand: {
        status: "Low",
        description: "Limited market in non-traditional growing region",
      },
      priceHistory: priceHistory.coconut.punjab,
      alternatives: [
        {
          name: "Specialty Coconut Products",
          valueIncrease: 25,
          description: "Focus on niche products for health food markets",
        },
        {
          name: "Direct Consumer Marketing",
          valueIncrease: 35,
          description: "Sell directly to consumers as exotic regional produce",
        },
      ],
      potentialBuyers: [
        {
          name: "Northern Exotic Fruits",
          distance: 35,
          pricePerQuintal: 3300,
          tag: "Specialty Buyer",
          note: "Small quantities accepted",
        },
        {
          name: "Punjab Health Foods",
          distance: 28,
          pricePerQuintal: 3250,
          tag: "Organic Premium",
          note: "Pays extra for organic certification",
        },
      ],
    },
    andhra: {
      currentPrice: 3000,
      demand: {
        status: "High",
        description: "Strong local and export demand for quality coconuts",
      },
      priceHistory: priceHistory.coconut.andhra,
      alternatives: [
        {
          name: "Coconut Husk Fiber",
          valueIncrease: 18,
          description: "Process coconut husks into fiber for erosion control products and garden supplies",
        },
        {
          name: "Coconut Shell Charcoal",
          valueIncrease: 22,
          description: "Convert coconut shells into premium activated charcoal for water filtration and cooking",
        },
      ],
      potentialBuyers: [
        {
          name: "Coconut Processing Ltd.",
          distance: 15,
          pricePerQuintal: 3100,
          tag: "Verified Buyer",
          note: "Looking for 200+ quintals",
        },
        {
          name: "South Indian Exports",
          distance: 25,
          pricePerQuintal: 3050,
          tag: "Export Quality",
          note: "Premium for uniform size",
        },
      ],
    },
  },
};

export const getMarketInsights = (
  crop: string, 
  location: string, 
  quantity: number
): MarketInsight => {
  // In a real app, we might adjust insights based on quantity
  // For this demo, we'll return static data
  
  const cropData = marketInsights[crop] || {};
  return cropData[location] || {
    currentPrice: 2000,
    demand: {
      status: "Medium",
      description: "Standard market conditions",
    },
    priceHistory: [
      { month: "Jul", price: 1900 },
      { month: "Aug", price: 1950 },
      { month: "Sep", price: 2000 },
      { month: "Oct", price: 2050 },
      { month: "Nov", price: 2100 },
      { month: "Dec", price: 2000 },
    ],
    alternatives: [
      {
        name: "Basic Processing",
        valueIncrease: 10,
        description: "Simple processing to increase value",
      }
    ],
    potentialBuyers: [
      {
        name: "Local Market",
        distance: 20,
        pricePerQuintal: 2000,
        tag: "General Buyer",
        note: "Standard market rates",
      }
    ]
  };
};
