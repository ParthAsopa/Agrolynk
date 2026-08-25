/**
 * Static crop data used by the application
 */

export interface Crop {
  id: string;
  name: string;
  description: string;
  growingRegions: string[];
  growingSeason: {
    start: string;
    end: string;
  };
  idealConditions: {
    soilType: string;
    temperature: string;
    rainfall: string;
  };
}

export const crops: Record<string, Crop> = {
  wheat: {
    id: "wheat",
    name: "Wheat",
    description: "A cereal grain that is a staple food worldwide",
    growingRegions: ["punjab", "haryana", "uttar-pradesh"],
    growingSeason: {
      start: "November",
      end: "March",
    },
    idealConditions: {
      soilType: "Loamy or Clay Loam",
      temperature: "15-24°C",
      rainfall: "75-100 cm annually",
    },
  },
  corn: {
    id: "corn",
    name: "Corn",
    description: "A cereal grain first domesticated by indigenous peoples in southern Mexico",
    growingRegions: ["karnataka", "andhra", "tamil-nadu"],
    growingSeason: {
      start: "June",
      end: "September",
    },
    idealConditions: {
      soilType: "Well-drained fertile soils",
      temperature: "21-27°C",
      rainfall: "50-80 cm during growing season",
    },
  },
  coconut: {
    id: "coconut",
    name: "Coconut",
    description: "A member of the palm tree family with a large seed known as a coconut",
    growingRegions: ["kerala", "tamil-nadu", "andhra"],
    growingSeason: {
      start: "Year-round",
      end: "Year-round",
    },
    idealConditions: {
      soilType: "Sandy loam or clay loam",
      temperature: "27-30°C",
      rainfall: "130-230 cm annually",
    },
  },
};

export const regions = {
  punjab: {
    id: "punjab",
    name: "Punjab",
    topCrops: ["wheat", "rice", "cotton"],
    climate: "Semi-arid to sub-humid",
  },
  andhra: {
    id: "andhra",
    name: "Andhra Pradesh",
    topCrops: ["rice", "coconut", "sugarcane"],
    climate: "Tropical",
  },
};
