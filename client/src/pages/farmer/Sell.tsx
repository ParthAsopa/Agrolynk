import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";

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

const formSchema = z.object({
  crop: z.string().min(1, { message: "Please select a crop" }),
  location: z.string().min(1, { message: "Please select a location" }),
  quantity: z.coerce.number().min(1, { message: "Quantity must be at least 1 quintal" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function FarmerSell() {
  const [queryParams, setQueryParams] = useState<FormValues | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      crop: "",
      location: "",
      quantity: undefined,
    },
  });

  const { data: insights, isLoading } = useQuery<MarketInsight>({
    queryKey: queryParams ? [`/api/farmer/sell?crop=${queryParams.crop}&location=${queryParams.location}&quantity=${queryParams.quantity}`] : [],
    enabled: !!queryParams,
  });

  function onSubmit(values: FormValues) {
    setQueryParams(values);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity (in quintals)</FormLabel>
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
            </div>

            <Button 
              type="submit" 
              variant="agrarian" 
              size="lg" 
              className="w-full mt-6"
            >
              <TrendingUp className="mr-2 h-4 w-4" /> 
              Get Market Insights
            </Button>
          </form>
        </Form>

        <MarketInsightsDisplay 
          insights={insights || null}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
