import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  ShoppingCart,
  Truck,
  Calendar,
  ArrowRight,
  Check,
  Wheat,
  ChevronsRight,
  Sparkles,
} from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

// --------------------------------------------------
// FORM SCHEMA
// --------------------------------------------------

const formSchema = z.object({
  crop: z.string().min(1, {
    message: "Please select a crop",
  }),

  quantity: z.coerce.number().min(10, {
    message: "Minimum order is 10 quintals",
  }),

  gradeQuality: z.enum(["premium", "standard", "economy"], {
    required_error: "Please select a quality grade",
  }),
});

type FormValues = z.infer<typeof formSchema>;

// --------------------------------------------------
// CROP DATA
// --------------------------------------------------

interface CropInfo {
  name: string;
  averagePrice: number;
  availableStock: number;
  description: string;
  deliveryEstimate: string;
  regions: string[];
  image: string;
}

const cropsData: Record<string, CropInfo> = {
  wheat: {
    name: "Wheat",
    averagePrice: 2200,
    availableStock: 5000,
    description:
      "High-quality wheat grain suitable for flour production and various food applications.",
    deliveryEstimate: "3-5 business days",
    regions: ["Punjab", "Haryana", "Uttar Pradesh"],
    image:
      "https://images.unsplash.com/photo-1631898039260-3be2215da208?auto=format&fit=crop&w=800&q=80",
  },

  corn: {
    name: "Corn",
    averagePrice: 1850,
    availableStock: 3500,
    description:
      "Fresh corn suitable for both human consumption and animal feed.",
    deliveryEstimate: "4-6 business days",
    regions: ["Karnataka", "Andhra Pradesh", "Maharashtra"],
    image:
      "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80",
  },

  coconut: {
    name: "Coconut",
    averagePrice: 2500,
    availableStock: 2800,
    description:
      "Fresh coconuts with thick white flesh and sweet coconut water.",
    deliveryEstimate: "5-7 business days",
    regions: ["Kerala", "Tamil Nadu", "Andhra Pradesh"],
    image:
      "https://images.unsplash.com/photo-1546815670-5c603dcb6766?auto=format&fit=crop&w=800&q=80",
  },
};

// --------------------------------------------------
// QUALITY GRADES
// --------------------------------------------------

type QualityGrade = "premium" | "standard" | "economy";

const qualityGrades: Record<
  QualityGrade,
  {
    name: string;
    priceMultiplier: number;
    description: string;
  }
> = {
  premium: {
    name: "Premium",
    priceMultiplier: 1.15,
    description: "Top-tier quality, meeting international standards",
  },

  standard: {
    name: "Standard",
    priceMultiplier: 1.0,
    description: "Regular quality, suitable for most applications",
  },

  economy: {
    name: "Economy",
    priceMultiplier: 0.85,
    description: "Basic quality, ideal for processing and animal feed",
  },
};

// --------------------------------------------------
// AI RESPONSE TYPE
// --------------------------------------------------

interface AIMatchResult {
  matchScore: number;
  reasons: string[];
  summary: string;
}

// --------------------------------------------------
// COMPONENT
// --------------------------------------------------

export default function CompanyBuy() {
  const [selectedCrop, setSelectedCrop] = useState<CropInfo | null>(null);

  const [selectedGrade, setSelectedGrade] =
    useState<QualityGrade | null>(null);

  const [isOrdering, setIsOrdering] = useState(false);

  const [orderPlaced, setOrderPlaced] = useState(false);

  const [aiMatch, setAiMatch] = useState<AIMatchResult | null>(null);

  const [aiError, setAiError] = useState<string | null>(null);

  // --------------------------------------------------
  // FORM
  // --------------------------------------------------

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),

    defaultValues: {
      crop: "",
      quantity: undefined,
      gradeQuality: undefined,
    },
  });

  // --------------------------------------------------
  // WATCH VALUES
  // --------------------------------------------------

  const watchedCrop = form.watch("crop");
  const watchedGrade = form.watch("gradeQuality");
  const watchedQuantity = form.watch("quantity");

  // --------------------------------------------------
  // UPDATE SELECTED CROP
  // --------------------------------------------------

  const currentCrop =
    watchedCrop && cropsData[watchedCrop]
      ? cropsData[watchedCrop]
      : null;

  const currentGrade =
    watchedGrade && qualityGrades[watchedGrade]
      ? qualityGrades[watchedGrade]
      : null;

  // --------------------------------------------------
  // CALCULATE TOTAL
  // --------------------------------------------------

  const calculateTotal = () => {
    if (!currentCrop || !currentGrade || !watchedQuantity) {
      return 0;
    }

    return (
      currentCrop.averagePrice *
      watchedQuantity *
      currentGrade.priceMultiplier
    );
  };

  const orderTotal = calculateTotal();

  // --------------------------------------------------
  // SUBMIT + AI MATCH
  // --------------------------------------------------

  async function onSubmit(values: FormValues) {
    setIsOrdering(true);
    setAiError(null);
    setAiMatch(null);

    try {
      /*
       * Frontend quantity = quintals
       *
       * Backend AI API expects quantity in kg.
       *
       * 1 quintal = 100 kg
       */

      const quantityInKg = values.quantity * 100;

      const response = await apiRequest(
        "POST",
        "/api/ai/match",
        {
          listing: {
            crop: values.crop,
            quantity: quantityInKg,
            quality: values.gradeQuality,
            location: "Punjab",
          },

          company: {
            name: "Agrolynk Buyer",
            requiredCrop: values.crop,
            requiredQuantity: quantityInKg,
            requiredQuality: values.gradeQuality,
          },
        }
      );

      const result = await response.json();

      console.log("AI Match Response:", result);

      setAiMatch(result);
    } catch (error) {
      console.error("AI Match Error:", error);

      setAiError(
        "Unable to generate AI match analysis. Please try again."
      );
    } finally {
      setIsOrdering(false);
    }
  }

  // --------------------------------------------------
  // PLACE ORDER
  // --------------------------------------------------

  function placeOrder() {
    setOrderPlaced(true);
  }

  // --------------------------------------------------
  // RESET
  // --------------------------------------------------

  function placeAnotherOrder() {
    setOrderPlaced(false);
    setAiMatch(null);
    setAiError(null);

    form.reset({
      crop: "",
      quantity: undefined,
      gradeQuality: undefined,
    });
  }

  // --------------------------------------------------
  // SUCCESS SCREEN
  // --------------------------------------------------

  if (orderPlaced) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="max-w-2xl mx-auto card-agrarian">

          <CardHeader className="bg-primary/10 text-center">

            <div className="mx-auto rounded-full bg-primary/20 p-3 w-16 h-16 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-primary" />
            </div>

            <CardTitle className="text-2xl">
              Order Placed Successfully!
            </CardTitle>

            <CardDescription className="text-base">
              Your crop purchase order has been submitted
            </CardDescription>

          </CardHeader>

          <CardContent className="pt-6">

            <div className="space-y-4">

              <div className="bg-card p-4 rounded-lg">

                <h3 className="font-medium flex items-center mb-4">
                  <Wheat className="mr-2 h-5 w-5 text-primary" />
                  Order Details
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">

                  <div>
                    <p className="text-muted-foreground">
                      Crop:
                    </p>

                    <p className="font-medium">
                      {currentCrop?.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">
                      Quantity:
                    </p>

                    <p className="font-medium">
                      {watchedQuantity} quintals
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">
                      Quality Grade:
                    </p>

                    <p className="font-medium">
                      {currentGrade?.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">
                      Total Cost:
                    </p>

                    <p className="font-medium text-primary">
                      {formatCurrency(orderTotal)}
                    </p>
                  </div>

                </div>

              </div>

              <div className="bg-card p-4 rounded-lg">

                <h3 className="font-medium mb-3">
                  Next Steps
                </h3>

                <div className="space-y-3 text-sm">

                  <div className="flex">
                    <ChevronsRight className="h-5 w-5 mr-2 text-primary flex-shrink-0" />

                    <p>
                      Our team will review your order and contact you for confirmation.
                    </p>
                  </div>

                  <div className="flex">
                    <ChevronsRight className="h-5 w-5 mr-2 text-primary flex-shrink-0" />

                    <p>
                      Quality verification will be conducted before shipment.
                    </p>
                  </div>

                  <div className="flex">
                    <ChevronsRight className="h-5 w-5 mr-2 text-primary flex-shrink-0" />

                    <p>
                      You'll receive tracking information once your order is shipped.
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </CardContent>

          <CardFooter className="flex justify-end">

            <Button
              variant="outline"
              className="mr-2"
              onClick={placeAnotherOrder}
            >
              Place Another Order
            </Button>

            <Button variant="agrarian">
              View Order Status

              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

          </CardFooter>

        </Card>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN PAGE
  // --------------------------------------------------

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* PAGE HEADER */}

      <div className="text-center mb-8">

        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
          Purchase Crops
        </h1>

        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
          Buy high-quality crops directly from verified farmers
        </p>

      </div>

      {/* MAIN GRID */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT SIDE */}

        <div className="lg:col-span-2">

          <Card className="card-agrarian">

            <CardHeader>

              <CardTitle>
                Crop Order Details
              </CardTitle>

              <CardDescription>
                Please provide details about the crops you wish to purchase
              </CardDescription>

            </CardHeader>

            <CardContent>

              <Form {...form}>

                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >

                  {/* CROP */}

                  <FormField
                    control={form.control}
                    name="crop"
                    render={({ field }) => (
                      <FormItem>

                        <FormLabel>
                          Select Crop
                        </FormLabel>

                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);

                            setSelectedCrop(
                              cropsData[value] || null
                            );
                          }}
                          value={field.value}
                        >

                          <FormControl>

                            <SelectTrigger>
                              <SelectValue placeholder="Choose a crop to purchase" />
                            </SelectTrigger>

                          </FormControl>

                          <SelectContent>

                            <SelectItem value="wheat">
                              Wheat
                            </SelectItem>

                            <SelectItem value="corn">
                              Corn
                            </SelectItem>

                            <SelectItem value="coconut">
                              Coconut
                            </SelectItem>

                          </SelectContent>

                        </Select>

                        <FormMessage />

                      </FormItem>
                    )}
                  />

                  {/* QUANTITY + QUALITY */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* QUANTITY */}

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>

                          <FormLabel>
                            Quantity (in quintals)
                          </FormLabel>

                          <FormControl>

                            <Input
                              type="number"
                              min={10}
                              placeholder="Enter quantity"
                              {...field}
                            />

                          </FormControl>

                          <FormMessage />

                        </FormItem>
                      )}
                    />

                    {/* QUALITY */}

                    <FormField
                      control={form.control}
                      name="gradeQuality"
                      render={({ field }) => (
                        <FormItem>

                          <FormLabel>
                            Quality Grade
                          </FormLabel>

                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);

                              setSelectedGrade(
                                value as QualityGrade
                              );
                            }}
                            value={field.value}
                          >

                            <FormControl>

                              <SelectTrigger>
                                <SelectValue placeholder="Select quality grade" />
                              </SelectTrigger>

                            </FormControl>

                            <SelectContent>

                              <SelectItem value="premium">
                                Premium
                              </SelectItem>

                              <SelectItem value="standard">
                                Standard
                              </SelectItem>

                              <SelectItem value="economy">
                                Economy
                              </SelectItem>

                            </SelectContent>

                          </Select>

                          <FormMessage />

                        </FormItem>
                      )}
                    />

                  </div>

                  {/* CROP INFORMATION */}

                  {selectedCrop && (

                    <div className="bg-card/50 p-4 rounded-lg mt-6">

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

                        <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden">

                          <img
                            src={selectedCrop.image}
                            alt={selectedCrop.name}
                            className="w-full h-full object-cover"
                          />

                        </div>

                        <div className="flex-grow">

                          <h3 className="font-medium text-lg">
                            {selectedCrop.name}
                          </h3>

                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedCrop.description}
                          </p>

                          <div className="flex flex-wrap gap-2 mt-2">

                            {selectedCrop.regions.map(
                              (region) => (
                                <Badge
                                  key={region}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {region}
                                </Badge>
                              )
                            )}

                          </div>

                        </div>

                      </div>

                    </div>

                  )}

                  {/* AI MATCH RESULT */}

                  {aiMatch && (

                    <div className="rounded-lg border p-5 bg-green-50 dark:bg-green-900/20">

                      <div className="flex items-center gap-2 mb-4">

                        <Sparkles className="h-5 w-5 text-primary" />

                        <h3 className="font-bold text-lg">
                          AI Match Analysis
                        </h3>

                      </div>

                      {/* SCORE */}

                      <div className="flex items-center justify-between mb-4">

                        <div>

                          <p className="text-sm text-muted-foreground">
                            Match Score
                          </p>

                          <p className="text-3xl font-bold text-primary">
                            {aiMatch.matchScore}%
                          </p>

                        </div>

                        <Badge
                          variant="outline"
                          className="text-primary"
                        >
                          AI Generated
                        </Badge>

                      </div>

                      {/* REASONS */}

                      <div className="mb-4">

                        <p className="font-medium mb-2">
                          Why this is a good match:
                        </p>

                        <ul className="space-y-2">

                          {aiMatch.reasons.map(
                            (reason, index) => (

                              <li
                                key={index}
                                className="flex items-start gap-2 text-sm"
                              >

                                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />

                                <span>
                                  {reason}
                                </span>

                              </li>

                            )
                          )}

                        </ul>

                      </div>

                      {/* SUMMARY */}

                      <div>

                        <p className="font-medium mb-1">
                          AI Summary
                        </p>

                        <p className="text-sm text-muted-foreground">
                          {aiMatch.summary}
                        </p>

                      </div>

                    </div>

                  )}

                  {/* AI ERROR */}

                  {aiError && (

                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">

                      <p className="text-sm text-red-600">
                        {aiError}
                      </p>

                    </div>

                  )}

                  {/* BUTTON */}

                  <div className="mt-6">

                    <Button
                      type="submit"
                      variant="agrarian"
                      size="lg"
                      className="w-full"
                      disabled={isOrdering}
                    >

                      {isOrdering ? (

                        <>
                          <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                          Analyzing with AI...
                        </>

                      ) : (

                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Get AI Match Analysis
                        </>

                      )}

                    </Button>

                  </div>

                  {/* PLACE ORDER BUTTON */}

                  {aiMatch && (

                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={placeOrder}
                    >

                      <ShoppingCart className="mr-2 h-4 w-4" />

                      Place Order

                    </Button>

                  )}

                </form>

              </Form>

            </CardContent>

          </Card>

        </div>

        {/* RIGHT SIDE - ORDER SUMMARY */}

        <div className="lg:col-span-1">

          <Card className="card-agrarian sticky top-8">

            <CardHeader>

              <CardTitle>
                Order Summary
              </CardTitle>

            </CardHeader>

            <CardContent>

              <div className="space-y-4">

                {/* CROP */}

                {selectedCrop && (

                  <div className="flex justify-between items-center">

                    <span className="text-sm">
                      Selected Crop:
                    </span>

                    <span className="font-medium">
                      {selectedCrop.name}
                    </span>

                  </div>

                )}

                {/* QUANTITY */}

                {selectedCrop && watchedQuantity && (

                  <div className="flex justify-between items-center">

                    <span className="text-sm">
                      Quantity:
                    </span>

                    <span className="font-medium">
                      {watchedQuantity} quintals
                    </span>

                  </div>

                )}

                {/* QUALITY */}

                {selectedGrade && (

                  <div className="flex justify-between items-center">

                    <span className="text-sm">
                      Quality Grade:
                    </span>

                    <span className="font-medium">
                      {qualityGrades[selectedGrade].name}
                    </span>

                  </div>

                )}

                <Separator />

                {/* BASE PRICE */}

                {selectedCrop && (

                  <div className="flex justify-between items-center">

                    <span className="text-sm">
                      Base Price:
                    </span>

                    <span className="font-medium">
                      {formatCurrency(
                        selectedCrop.averagePrice
                      )}
                      /quintal
                    </span>

                  </div>

                )}

                {/* QUALITY ADJUSTMENT */}

                {selectedGrade && (

                  <div className="flex justify-between items-center">

                    <span className="text-sm">
                      Quality Adjustment:
                    </span>

                    <span
                      className={`font-medium ${
                        qualityGrades[selectedGrade]
                          .priceMultiplier > 1
                          ? "text-green-500"
                          : qualityGrades[selectedGrade]
                              .priceMultiplier < 1
                            ? "text-orange-500"
                            : ""
                      }`}
                    >

                      {qualityGrades[selectedGrade]
                        .priceMultiplier > 1
                        ? "+"
                        : ""}

                      {(
                        (qualityGrades[selectedGrade]
                          .priceMultiplier -
                          1) *
                        100
                      ).toFixed(0)}
                      %

                    </span>

                  </div>

                )}

                <Separator />

                {/* TOTAL */}

                <div className="flex justify-between items-center font-bold text-lg">

                  <span>
                    Total:
                  </span>

                  <span className="text-primary">
                    {formatCurrency(orderTotal)}
                  </span>

                </div>

                {/* DELIVERY */}

                {selectedCrop && (

                  <div className="mt-6 space-y-3">

                    <div className="flex items-center text-sm">

                      <Truck className="mr-2 h-4 w-4 text-primary" />

                      <span>
                        Estimated delivery:{" "}
                        {selectedCrop.deliveryEstimate}
                      </span>

                    </div>

                    <div className="flex items-center text-sm">

                      <Calendar className="mr-2 h-4 w-4 text-primary" />

                      <span>
                        Payment terms: Net 30 days
                      </span>

                    </div>

                  </div>

                )}

              </div>

            </CardContent>

          </Card>

        </div>

      </div>

    </div>
  );
}