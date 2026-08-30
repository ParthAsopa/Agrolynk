import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { TrendingUp } from "lucide-react";

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

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import MarketInsightsDisplay from "@/components/farmer/MarketInsightsDisplay";
import { MarketInsight } from "@shared/types";
import { apiRequest } from "@/lib/queryClient";

const formSchema = z.object({
  crop: z.string().min(1, {
    message: "Please select a crop",
  }),

  location: z.string().min(1, {
    message: "Please select a location",
  }),

  quantity: z.coerce.number().min(1, {
    message: "Quantity must be at least 1 quintal",
  }),

  quality: z.string().min(1, {
    message: "Please select quality",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface PriceRecommendation {
  recommendedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  reason: string;
}

export default function FarmerSell() {
  const [queryParams, setQueryParams] = useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),

    defaultValues: {
      crop: "",
      location: "",
      quantity: undefined,
      quality: "",
    },
  });

  // Existing Market Insights API
  const { data: insights, isLoading } = useQuery<MarketInsight>({
    queryKey: queryParams
      ? [
          `/api/farmer/sell?crop=${queryParams.crop}&location=${queryParams.location}&quantity=${queryParams.quantity}`,
        ]
      : [],

    enabled: !!queryParams,
  });

  // AI Price Recommendation API
  const priceMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await apiRequest(
        "POST",
        "/api/ai/price",
        {
          crop: values.crop,
          quantity: values.quantity,
          location: values.location,
          quality: values.quality,
        }
      );

      return response.json() as Promise<PriceRecommendation>;
    },
  });

  function onSubmit(values: FormValues) {
    console.log("Farmer Listing:", values);

    // Existing market insights
    setQueryParams(values);

    // AI price recommendation
    priceMutation.mutate(values);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Page Heading */}
      <div className="text-center mb-8">

        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
          Sell Your Agricultural Products
        </h1>

        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
          Get market insights for your crops and make informed selling decisions
        </p>

      </div>

      <div className="card-agrarian p-8">

        <Form {...form}>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Crop */}
              <FormField
                control={form.control}
                name="crop"
                render={({ field }) => (
                  <FormItem>

                    <FormLabel>Select Crop</FormLabel>

                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >

                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a crop" />
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

              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>

                    <FormLabel>Select Location</FormLabel>

                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >

                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a location" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>

                        <SelectItem value="punjab">
                          Punjab
                        </SelectItem>

                        <SelectItem value="andhra">
                          Andhra Pradesh
                        </SelectItem>

                      </SelectContent>

                    </Select>

                    <FormMessage />

                  </FormItem>
                )}
              />

              {/* Quantity */}
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
                        min={1}
                        placeholder="Enter quantity"
                        {...field}
                      />

                    </FormControl>

                    <FormMessage />

                  </FormItem>
                )}
              />

              {/* Quality */}
              <FormField
                control={form.control}
                name="quality"
                render={({ field }) => (
                  <FormItem>

                    <FormLabel>
                      Crop Quality
                    </FormLabel>

                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >

                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>

                        <SelectItem value="Grade A">
                          Grade A
                        </SelectItem>

                        <SelectItem value="Grade B">
                          Grade B
                        </SelectItem>

                        <SelectItem value="Grade C">
                          Grade C
                        </SelectItem>

                      </SelectContent>

                    </Select>

                    <FormMessage />

                  </FormItem>
                )}
              />

            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="agrarian"
              size="lg"
              className="w-full mt-6"
              disabled={priceMutation.isPending}
            >

              <TrendingUp className="mr-2 h-4 w-4" />

              {priceMutation.isPending
                ? "AI Analyzing..."
                : "Get Market Insights"}

            </Button>

          </form>

        </Form>

        {/* AI Loading */}
        {priceMutation.isPending && (
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              🤖 AI Price Recommendation
            </h2>

            <p className="mt-2 text-gray-600 dark:text-gray-300">
              AI is analyzing your crop, quantity, location and quality...
            </p>

          </div>
        )}

        {/* AI Error */}
        {priceMutation.isError && (
          <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">

            <h2 className="text-xl font-bold text-red-700 dark:text-red-300">
              AI Recommendation Error
            </h2>

            <p className="mt-2 text-red-600 dark:text-red-300">
              Failed to generate AI price recommendation.
              Please try again.
            </p>

          </div>
        )}

        {/* AI Price Recommendation */}
        {priceMutation.data && (
          <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              🤖 AI Price Recommendation
            </h2>

            {/* Recommended Price */}
            <div className="mt-5">

              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Recommended Price
              </p>

              <p className="text-3xl font-extrabold text-green-600 dark:text-green-400">
                ₹{priceMutation.data.recommendedPrice}
              </p>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                per quintal
              </p>

            </div>

            {/* Price Range */}
            <div className="mt-5">

              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Suggested Price Range
              </p>

              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                ₹{priceMutation.data.priceRange.min}
                {" - "}
                ₹{priceMutation.data.priceRange.max}
              </p>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                per quintal
              </p>

            </div>

            {/* Reason */}
            <div className="mt-5">

              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Why this price?
              </p>

              <p className="mt-1 text-gray-700 dark:text-gray-300">
                {priceMutation.data.reason}
              </p>

            </div>

          </div>
        )}

        {/* Existing Market Insights */}
        <MarketInsightsDisplay
          insights={insights || null}
          isLoading={isLoading}
        />

      </div>

    </div>
  );
}