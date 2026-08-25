import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";

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
import RecommendationsDisplay from "@/components/farmer/RecommendationsDisplay";
import { Recommendation } from "@shared/types";

const formSchema = z.object({
  crop: z.string().min(1, { message: "Please select a crop" }),
  location: z.string().min(1, { message: "Please select a location" }),
  farmSize: z.coerce.number().min(1, { message: "Farm size must be at least 1 acre" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function FarmerBuy() {
  const [queryParams, setQueryParams] = useState<FormValues | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      crop: "",
      location: "",
      farmSize: undefined,
    },
  });

  const { data: recommendations, isLoading } = useQuery<Recommendation>({
    queryKey: queryParams ? [`/api/farmer/buy?crop=${queryParams.crop}&location=${queryParams.location}&farmSize=${queryParams.farmSize}`] : [],
    enabled: !!queryParams,
  });

  function onSubmit(values: FormValues) {
    setQueryParams(values);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
          Get Recommendations
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
          Select your crop and location to receive AI-powered farming insights
        </p>
      </div>

      <div className="max-w-3xl mx-auto bg-green-50 dark:bg-green-900/20 p-8 rounded-lg shadow-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <SelectItem value="wheat">Wheat</SelectItem>
                      <SelectItem value="corn">Corn</SelectItem>
                      <SelectItem value="coconut">Coconut</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      <SelectItem value="punjab">Punjab</SelectItem>
                      <SelectItem value="andhra">Andhra Pradesh</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="farmSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Farm Area (in acres)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Enter farm area"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Get Recommendations
            </Button>
          </form>
        </Form>

        <RecommendationsDisplay 
          recommendations={recommendations || null}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
