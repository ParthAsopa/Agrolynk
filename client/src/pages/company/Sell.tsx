import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Truck,
  Leaf,
  Zap,
  Droplets,
  Hammer,
  ArrowRight,
  Plus,
  X,
  Check,
} from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// =========================
// Form Schema
// =========================

const formSchema = z.object({
  category: z.string().min(1, {
    message: "Please select a category",
  }),

  name: z.string().min(3, {
    message: "Name must be at least 3 characters",
  }),

  price: z.coerce.number().min(1, {
    message: "Price must be at least 1",
  }),

  quantity: z.coerce.number().min(1, {
    message: "Quantity must be at least 1",
  }),

  description: z.string().min(10, {
    message: "Description must be at least 10 characters",
  }),

  manufacturer: z
    .string()
    .min(2, {
      message: "Manufacturer name is required",
    })
    .optional(),

  specifications: z.string().optional(),

  imageUrl: z
    .string()
    .url({
      message: "Please enter a valid URL",
    })
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

// =========================
// Product Categories
// =========================

type ProductCategory =
  | "seeds"
  | "fertilizers"
  | "pesticides"
  | "instruments";

interface CategoryInfo {
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const categoryData: Record<ProductCategory, CategoryInfo> = {
  seeds: {
    name: "Seeds",
    icon: <Leaf className="h-5 w-5" />,
    description: "High-quality seeds for various crops",
    color: "text-green-500",
  },

  fertilizers: {
    name: "Fertilizers",
    icon: <Droplets className="h-5 w-5" />,
    description: "Organic and inorganic fertilizers",
    color: "text-blue-500",
  },

  pesticides: {
    name: "Pesticides",
    icon: <Zap className="h-5 w-5" />,
    description: "Pest control solutions",
    color: "text-red-500",
  },

  instruments: {
    name: "Instruments",
    icon: <Hammer className="h-5 w-5" />,
    description: "Farming tools and equipment",
    color: "text-orange-500",
  },
};

// =========================
// Component
// =========================

export default function CompanySell() {
  const [activeTab, setActiveTab] =
    useState<ProductCategory>("seeds");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isSuccess, setIsSuccess] =
    useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),

    defaultValues: {
      category: activeTab,
      name: "",
      price: undefined,
      quantity: undefined,
      description: "",
      manufacturer: "",
      specifications: "",
      imageUrl: "",
    },
  });

  // =========================
  // Tab Change
  // =========================

  const handleTabChange = (value: string) => {
    const category = value as ProductCategory;

    setActiveTab(category);

    form.setValue("category", category);
  };

  // =========================
  // Submit Product
  // =========================

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      const response = await fetch(
        "/api/company/products",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            // Temporary company ID for testing
            companyId: 1,

            category: values.category,

            name: values.name,

            price: values.price,

            quantity: values.quantity,

            description: values.description,

            manufacturer:
              values.manufacturer || null,

            specifications:
              values.specifications || null,

            imageUrl:
              values.imageUrl || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to list product",
        );
      }

      console.log(
        "Product successfully created:",
        data,
      );

      setIsSubmitting(false);

      setIsSuccess(true);

      // Reset form after success
      setTimeout(() => {
        setIsSuccess(false);

        form.reset({
          category: activeTab,
          name: "",
          price: undefined,
          quantity: undefined,
          description: "",
          manufacturer: "",
          specifications: "",
          imageUrl: "",
        });
      }, 3000);
    } catch (error) {
      console.error(
        "Error listing product:",
        error,
      );

      setIsSubmitting(false);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to list product",
      );
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* =========================
          Page Header
      ========================= */}

      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
          List Agricultural Supplies
        </h1>

        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
          Sell your seeds, fertilizers, pesticides,
          and farming instruments to farmers
        </p>
      </div>

      {/* =========================
          Category Tabs
      ========================= */}

      <Tabs
        defaultValue="seeds"
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 mb-8">
          {Object.entries(categoryData).map(
            ([key, category]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="text-sm sm:text-base py-3"
              >
                <div className="flex items-center">
                  <div
                    className={`mr-2 ${category.color}`}
                  >
                    {category.icon}
                  </div>

                  <span className="hidden sm:inline">
                    {category.name}
                  </span>
                </div>
              </TabsTrigger>
            ),
          )}
        </TabsList>

        {/* =========================
            Category Content
        ========================= */}

        {Object.entries(categoryData).map(
          ([key, category]) => (
            <TabsContent
              key={key}
              value={key}
            >
              <Card className="card-agrarian">
                <CardHeader>
                  <div className="flex items-center">
                    <div
                      className={`mr-3 rounded-full bg-primary/10 p-2 ${category.color}`}
                    >
                      {category.icon}
                    </div>

                    <div>
                      <CardTitle>
                        List {category.name}
                      </CardTitle>

                      <CardDescription>
                        {category.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* =========================
                      Success Message
                  ========================= */}

                  {isSuccess ? (
                    <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg flex items-center">
                      <div className="rounded-full bg-green-100 dark:bg-green-900/50 p-2 mr-4">
                        <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>

                      <div>
                        <h3 className="font-bold text-green-800 dark:text-green-300">
                          Product Successfully Listed!
                        </h3>

                        <p className="text-green-700 dark:text-green-400">
                          Your product has been added to
                          the marketplace and is now
                          visible to farmers.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* =========================
                       Product Form
                    ========================= */

                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(
                          onSubmit,
                        )}
                        className="space-y-6"
                      >
                        {/* Product Name */}

                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Product Name
                              </FormLabel>

                              <FormControl>
                                <Input
                                  placeholder={`Enter ${category.name.toLowerCase()} name`}
                                  {...field}
                                />
                              </FormControl>

                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Price + Quantity */}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Price (₹)
                                </FormLabel>

                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    placeholder="Enter price per unit"
                                    {...field}
                                  />
                                </FormControl>

                                <FormDescription>
                                  Price per{" "}
                                  {key === "seeds" ||
                                  key ===
                                    "fertilizers" ||
                                  key ===
                                    "pesticides"
                                    ? "kg"
                                    : "unit"}
                                </FormDescription>

                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Available Quantity
                                </FormLabel>

                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    placeholder="Enter available quantity"
                                    {...field}
                                  />
                                </FormControl>

                                <FormDescription>
                                  In{" "}
                                  {key === "seeds" ||
                                  key ===
                                    "fertilizers" ||
                                  key ===
                                    "pesticides"
                                    ? "kg"
                                    : "units"}
                                </FormDescription>

                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Description */}

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Product Description
                              </FormLabel>

                              <FormControl>
                                <Textarea
                                  placeholder="Describe your product in detail..."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>

                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Manufacturer + Image */}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="manufacturer"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Manufacturer
                                </FormLabel>

                                <FormControl>
                                  <Input
                                    placeholder="Enter manufacturer name"
                                    {...field}
                                  />
                                </FormControl>

                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="imageUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Product Image URL
                                </FormLabel>

                                <FormControl>
                                  <Input
                                    placeholder="Enter image URL (optional)"
                                    {...field}
                                  />
                                </FormControl>

                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* =========================
                            Seeds
                        ========================= */}

                        {key === "seeds" && (
                          <div className="bg-card/50 p-4 rounded-lg">
                            <h3 className="font-medium mb-3">
                              Seed-specific Information
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium mb-1 block">
                                  Suitable Growing Regions
                                </label>

                                <div className="flex flex-wrap gap-2 mt-2">
                                  <Badge
                                    variant="outline"
                                    className="bg-primary/5"
                                  >
                                    North
                                  </Badge>

                                  <Badge
                                    variant="outline"
                                    className="bg-primary/5"
                                  >
                                    South
                                  </Badge>

                                  <Badge
                                    variant="outline"
                                    className="bg-primary/5"
                                  >
                                    East
                                  </Badge>

                                  <Badge
                                    variant="outline"
                                    className="bg-primary/5"
                                  >
                                    West
                                  </Badge>

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add
                                  </Button>
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium mb-1 block">
                                  Growing Season
                                </label>

                                <div className="flex flex-wrap gap-2 mt-2">
                                  <Badge
                                    variant="outline"
                                    className="bg-primary/5"
                                  >
                                    Kharif
                                  </Badge>

                                  <Badge
                                    variant="outline"
                                    className="bg-primary/5"
                                  >
                                    Rabi
                                  </Badge>

                                  <Badge
                                    variant="outline"
                                    className="bg-primary/5"
                                  >
                                    Zaid
                                  </Badge>

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* =========================
                            Fertilizers
                        ========================= */}

                        {key === "fertilizers" && (
                          <div className="bg-card/50 p-4 rounded-lg">
                            <h3 className="font-medium mb-3">
                              Fertilizer-specific Information
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium mb-1 block">
                                  Type
                                </label>

                                <Select>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>

                                  <SelectContent>
                                    <SelectItem value="organic">
                                      Organic
                                    </SelectItem>

                                    <SelectItem value="inorganic">
                                      Inorganic
                                    </SelectItem>

                                    <SelectItem value="biofertilizer">
                                      Biofertilizer
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <label className="text-sm font-medium mb-1 block">
                                  NPK Ratio
                                </label>

                                <Input placeholder="e.g., 14-14-14" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* =========================
                            Pesticides
                        ========================= */}

                        {key === "pesticides" && (
                          <div className="bg-card/50 p-4 rounded-lg">
                            <h3 className="font-medium mb-3">
                              Pesticide-specific Information
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium mb-1 block">
                                  Target Pests
                                </label>

                                <div className="flex flex-wrap gap-2 mt-2">
                                  <Badge
                                    variant="outline"
                                    className="bg-primary/5"
                                  >
                                    Aphids
                                  </Badge>

                                  <Badge
                                    variant="outline"
                                    className="bg-primary/5"
                                  >
                                    Borers
                                  </Badge>

                                  <Badge
                                    variant="outline"
                                    className="bg-primary/5 flex items-center gap-1"
                                  >
                                    Mites
                                    <X className="h-3 w-3 cursor-pointer" />
                                  </Badge>

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add
                                  </Button>
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium mb-1 block">
                                  Formulation
                                </label>

                                <Select>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select formulation" />
                                  </SelectTrigger>

                                  <SelectContent>
                                    <SelectItem value="liquid">
                                      Liquid
                                    </SelectItem>

                                    <SelectItem value="powder">
                                      Powder
                                    </SelectItem>

                                    <SelectItem value="granules">
                                      Granules
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* =========================
                            Instruments
                        ========================= */}

                        {key === "instruments" && (
                          <div className="bg-card/50 p-4 rounded-lg">
                            <h3 className="font-medium mb-3">
                              Equipment-specific Information
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium mb-1 block">
                                  Equipment Type
                                </label>

                                <Select>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>

                                  <SelectContent>
                                    <SelectItem value="manual">
                                      Manual Tools
                                    </SelectItem>

                                    <SelectItem value="power">
                                      Power Tools
                                    </SelectItem>

                                    <SelectItem value="irrigation">
                                      Irrigation Equipment
                                    </SelectItem>

                                    <SelectItem value="processing">
                                      Processing Equipment
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <label className="text-sm font-medium mb-1 block">
                                  Warranty Period
                                </label>

                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    min={0}
                                    className="w-20"
                                    placeholder="0"
                                  />

                                  <Select defaultValue="months">
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>

                                    <SelectContent>
                                      <SelectItem value="days">
                                        Days
                                      </SelectItem>

                                      <SelectItem value="months">
                                        Months
                                      </SelectItem>

                                      <SelectItem value="years">
                                        Years
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* =========================
                            Submit
                        ========================= */}

                        <div className="mt-6">
                          <Button
                            type="submit"
                            variant="agrarian"
                            size="lg"
                            className="w-full"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>Listing Product...</>
                            ) : (
                              <>
                                <Plus className="mr-2 h-4 w-4" />
                                List for Sale
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ),
        )}
      </Tabs>
    </div>
  );
}