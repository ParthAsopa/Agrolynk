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
  ChevronsRight
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

// Define the form schema with Zod
const formSchema = z.object({
  crop: z.string().min(1, { message: "Please select a crop" }),
  quantity: z.coerce.number().min(10, { message: "Minimum order is 10 quintals" }),
  gradeQuality: z.enum(["premium", "standard", "economy"], {
    required_error: "Please select a quality grade",
  }),
});

type FormValues = z.infer<typeof formSchema>;

// Crop data
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
  "wheat": {
    name: "Wheat",
    averagePrice: 2200,
    availableStock: 5000,
    description: "High-quality wheat grain suitable for flour production and various food applications.",
    deliveryEstimate: "3-5 business days",
    regions: ["Punjab", "Haryana", "Uttar Pradesh"],
    image: "https://images.unsplash.com/photo-1631898039260-3be2215da208?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
  },
  "corn": {
    name: "Corn",
    averagePrice: 1850,
    availableStock: 3500,
    description: "Fresh sweet corn suitable for both human consumption and animal feed.",
    deliveryEstimate: "4-6 business days",
    regions: ["Karnataka", "Andhra Pradesh", "Maharashtra"],
    image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
  },
  "coconut": {
    name: "Coconut",
    averagePrice: 2500,
    availableStock: 2800,
    description: "Fresh coconuts with thick white flesh and sweet coconut water.",
    deliveryEstimate: "5-7 business days",
    regions: ["Kerala", "Tamil Nadu", "Andhra Pradesh"],
    image: "https://images.unsplash.com/photo-1546815670-5c603dcb6766?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
  }
};

// Quality grades
type QualityGrade = "premium" | "standard" | "economy";

const qualityGrades: Record<QualityGrade, { name: string; priceMultiplier: number; description: string }> = {
  "premium": { name: "Premium", priceMultiplier: 1.15, description: "Top-tier quality, meeting all international standards" },
  "standard": { name: "Standard", priceMultiplier: 1.0, description: "Regular quality, suitable for most applications" },
  "economy": { name: "Economy", priceMultiplier: 0.85, description: "Basic quality, ideal for processing and animal feed" }
};

export default function CompanyBuy() {
  const [selectedCrop, setSelectedCrop] = useState<CropInfo | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<QualityGrade | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      crop: "",
      quantity: undefined,
      gradeQuality: undefined,
    },
  });

  // Calculate order total based on form values
  const calculateTotal = () => {
    const crop = form.watch("crop");
    const quantity = form.watch("quantity") || 0;
    const grade = form.watch("gradeQuality");

    if (!crop || !grade || !quantity) return 0;

    const cropPrice = cropsData[crop]?.averagePrice || 0;
    const gradeMultiplier = qualityGrades[grade]?.priceMultiplier || 1;
    
    return cropPrice * quantity * gradeMultiplier;
  };

  function onSubmit(values: FormValues) {
    setIsOrdering(true);
    
    // Simulate API call to place order
    setTimeout(() => {
      setIsOrdering(false);
      setOrderPlaced(true);
    }, 1500);
  }

  // Update selected crop when form value changes
  const watchedCrop = form.watch("crop");
  const watchedGrade = form.watch("gradeQuality");

  if (watchedCrop && cropsData[watchedCrop] && (!selectedCrop || selectedCrop.name !== cropsData[watchedCrop].name)) {
    setSelectedCrop(cropsData[watchedCrop]);
  }

  if (watchedGrade !== selectedGrade && watchedGrade) {
    setSelectedGrade(watchedGrade as QualityGrade);
  }

  const orderTotal = calculateTotal();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
          Purchase Crops
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
          Buy high-quality crops directly from verified farmers
        </p>
      </div>

      {!orderPlaced ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="card-agrarian">
              <CardHeader>
                <CardTitle>Crop Order Details</CardTitle>
                <CardDescription>
                  Please provide details about the crops you wish to purchase
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                                <SelectValue placeholder="Choose a crop to purchase" />
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity (in quintals)</FormLabel>
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

                      <FormField
                        control={form.control}
                        name="gradeQuality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quality Grade</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select quality grade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="premium">Premium</SelectItem>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="economy">Economy</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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
                            <h3 className="font-medium text-lg">{selectedCrop.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {selectedCrop.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {selectedCrop.regions.map((region) => (
                                <Badge key={region} variant="outline" className="text-xs">
                                  {region}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-6">
                      <Button
                        type="submit"
                        variant="agrarian"
                        size="lg"
                        className="w-full"
                        disabled={isOrdering}
                      >
                        {isOrdering ? (
                          <>Processing Order...</>
                        ) : (
                          <>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Place Order
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="card-agrarian sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedCrop && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Selected Crop:</span>
                      <span className="font-medium">{selectedCrop.name}</span>
                    </div>
                  )}

                  {selectedCrop && form.watch("quantity") && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Quantity:</span>
                      <span className="font-medium">{form.watch("quantity")} quintals</span>
                    </div>
                  )}

                  {selectedGrade && qualityGrades[selectedGrade] && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Quality Grade:</span>
                      <span className="font-medium">{qualityGrades[selectedGrade].name}</span>
                    </div>
                  )}

                  <Separator />

                  {selectedCrop && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Base Price:</span>
                      <span className="font-medium">
                        {formatCurrency(selectedCrop.averagePrice)}/quintal
                      </span>
                    </div>
                  )}

                  {selectedGrade && qualityGrades[selectedGrade] && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Quality Adjustment:</span>
                      <span className={`font-medium ${
                        qualityGrades[selectedGrade].priceMultiplier > 1 
                          ? 'text-green-500' 
                          : qualityGrades[selectedGrade].priceMultiplier < 1 
                            ? 'text-orange-500' 
                            : ''
                      }`}>
                        {(qualityGrades[selectedGrade].priceMultiplier > 1 ? '+' : '') + 
                        ((qualityGrades[selectedGrade].priceMultiplier - 1) * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-primary">{formatCurrency(orderTotal)}</span>
                  </div>

                  {selectedCrop && (
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center text-sm">
                        <Truck className="mr-2 h-4 w-4 text-primary" />
                        <span>Estimated delivery: {selectedCrop.deliveryEstimate}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-2 h-4 w-4 text-primary" />
                        <span>Payment terms: Net 30 days</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="max-w-2xl mx-auto card-agrarian">
          <CardHeader className="bg-primary/10 text-center">
            <div className="mx-auto rounded-full bg-primary/20 p-3 w-16 h-16 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Order Placed Successfully!</CardTitle>
            <CardDescription className="text-base">
              Your crop purchase order has been submitted
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="bg-card p-4 rounded-lg">
                <h3 className="font-medium flex items-center mb-2">
                  <Wheat className="mr-2 h-5 w-5 text-primary" />
                  Order Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Crop:</p>
                    <p className="font-medium">{selectedCrop?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Quantity:</p>
                    <p className="font-medium">{form.getValues().quantity} quintals</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Quality Grade:</p>
                    <p className="font-medium">
                      {selectedGrade ? qualityGrades[selectedGrade].name : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Cost:</p>
                    <p className="font-medium text-primary">{formatCurrency(orderTotal)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card p-4 rounded-lg">
                <h3 className="font-medium mb-2">Next Steps</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex">
                    <ChevronsRight className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                    <p>Our team will review your order and contact you for confirmation.</p>
                  </div>
                  <div className="flex">
                    <ChevronsRight className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                    <p>Quality verification will be conducted before shipment.</p>
                  </div>
                  <div className="flex">
                    <ChevronsRight className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                    <p>You'll receive tracking information once your order is shipped.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline" className="mr-2" onClick={() => setOrderPlaced(false)}>
              Place Another Order
            </Button>
            <Button variant="agrarian">
              View Order Status
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}