import { useState } from "react";
import {
  useMutation,
  useQueries,
  useQuery,
} from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  apiRequest,
  queryClient,
} from "@/lib/queryClient";

type Listing = {
  id: number;
  crop: string;
  wasteType: string;
  quantity: number;
  unit: string;
  price: number;
  location: string;
  status: string;
};

type Offer = {
  id: number;
  listingId: number;
  companyId: number;
  offeredPrice: number;
  message: string | null;
  status: string;
};

export default function FarmerDashboard() {
  const [form, setForm] = useState({
    farmerId: "1",
    crop: "",
    wasteType: "",
    quantity: "",
    unit: "kg",
    location: "",
    price: "",
  });

  const [message, setMessage] = useState("");

  // --------------------------------
  // Get Farmer Listings
  // --------------------------------

  const {
    data: listings = [],
    isLoading: listingsLoading,
    isError: listingsError,
  } = useQuery<Listing[]>({
    queryKey: ["/api/listings/mine?farmerId=1"],
  });

  // --------------------------------
  // Get Offers for Each Listing
  // --------------------------------

  const offerQueries = useQueries({
    queries: listings.map((listing) => ({
      queryKey: [`/api/listings/${listing.id}/offers`],

      queryFn: async (): Promise<Offer[]> => {
        const response = await apiRequest(
          "GET",
          `/api/listings/${listing.id}/offers`,
        );

        return response.json();
      },
    })),
  });

  // --------------------------------
  // Create Listing
  // --------------------------------

  const createListing = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/listings", {
        farmerId: Number(form.farmerId),
        crop: form.crop,
        wasteType: form.wasteType,
        quantity: Number(form.quantity),
        unit: form.unit,
        location: form.location,
        price: Number(form.price),
      });
    },
    onSuccess: async () => {
      setMessage("Listing created successfully!");

      setForm({
        farmerId: "1",
        crop: "",
        wasteType: "",
        quantity: "",
        unit: "kg",
        location: "",
        price: "",
      });

      // Refresh My Listings
      await queryClient.invalidateQueries({
        queryKey: ["/api/listings/mine?farmerId=1"],
      });
    },

    onError: () => {
      setMessage("Failed to create listing.");
    },
  });

  const updateOfferStatus = useMutation({
    mutationFn: async ({
      offerId,
      status,
    }: {
      offerId: number;
      status: "accepted" | "rejected";
    }) => {
      return apiRequest(
        "PATCH",
        `/api/offers/${offerId}/status`,
        { status },
      );
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["/api/listings/mine?farmerId=1"],
      });
    },
  });

  // --------------------------------
  // Form Field Update
  // --------------------------------

  const updateField = (
    field: string,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="container mx-auto space-y-6 p-6">

      {/* ================================
          Dashboard Header
      ================================= */}

      <div>
        <h1 className="text-3xl font-bold">
          Farmer Dashboard
        </h1>

        <p className="text-muted-foreground">
          Manage your waste listings and received offers.
        </p>
      </div>

      {/* ================================
          Create Listing
      ================================= */}

      <Card>
        <CardHeader>
          <CardTitle>
            Create Waste Listing
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">

            {/* Crop */}

            <div className="space-y-2">
              <Label>Crop</Label>

              <Input
                value={form.crop}
                onChange={(e) =>
                  updateField(
                    "crop",
                    e.target.value,
                  )
                }
                placeholder="e.g. Rice"
              />
            </div>

            {/* Waste Type */}

            <div className="space-y-2">
              <Label>Waste Type</Label>

              <Input
                value={form.wasteType}
                onChange={(e) =>
                  updateField(
                    "wasteType",
                    e.target.value,
                  )
                }
                placeholder="e.g. Rice Straw"
              />
            </div>

            {/* Quantity */}

            <div className="space-y-2">
              <Label>Quantity</Label>

              <Input
                type="number"
                value={form.quantity}
                onChange={(e) =>
                  updateField(
                    "quantity",
                    e.target.value,
                  )
                }
                placeholder="e.g. 500"
              />
            </div>

            {/* Unit */}

            <div className="space-y-2">
              <Label>Unit</Label>

              <Input
                value={form.unit}
                onChange={(e) =>
                  updateField(
                    "unit",
                    e.target.value,
                  )
                }
                placeholder="kg"
              />
            </div>

            {/* Location */}

            <div className="space-y-2">
              <Label>Location</Label>

              <Input
                value={form.location}
                onChange={(e) =>
                  updateField(
                    "location",
                    e.target.value,
                  )
                }
                placeholder="e.g. Vijayawada"
              />
            </div>

            {/* Price */}

            <div className="space-y-2">
              <Label>Asking Price</Label>

              <Input
                type="number"
                value={form.price}
                onChange={(e) =>
                  updateField(
                    "price",
                    e.target.value,
                  )
                }
                placeholder="e.g. 8"
              />
            </div>
          </div>

          <Button
            className="mt-6"
            onClick={() =>
              createListing.mutate()
            }
            disabled={createListing.isPending}
          >
            {createListing.isPending
              ? "Creating..."
              : "Create Listing"}
          </Button>

          {message && (
            <p className="mt-4 text-sm">
              {message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ================================
          My Listings + Received Offers
      ================================= */}

      <div className="grid gap-6 md:grid-cols-2">

        {/* ================================
            My Listings
        ================================= */}

        <Card>
          <CardHeader>
            <CardTitle>
              My Listings
            </CardTitle>
          </CardHeader>

          <CardContent>
            {listingsLoading && (
              <p className="text-muted-foreground">
                Loading your listings...
              </p>
            )}

            {listingsError && (
              <p className="text-destructive">
                Failed to load listings.
              </p>
            )}

            {!listingsLoading &&
              !listingsError &&
              listings.length === 0 && (
                <p className="text-muted-foreground">
                  You have no listings yet.
                </p>
              )}

            {!listingsLoading &&
              !listingsError &&
              listings.length > 0 && (
                <div className="space-y-4">

                  {listings.map((listing) => (
                    <div
                      key={listing.id}
                      className="rounded-lg border p-4"
                    >

                      <div className="flex items-center justify-between">

                        <div>
                          <h3 className="font-semibold">
                            {listing.crop}
                          </h3>

                          <p className="text-sm text-muted-foreground">
                            {listing.wasteType}
                          </p>
                        </div>

                        <span className="text-sm font-medium capitalize">
                          {listing.status}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">

                        <p>
                          Quantity:{" "}
                          {listing.quantity}{" "}
                          {listing.unit}
                        </p>

                        <p>
                          Price: ₹{listing.price}
                        </p>

                        <p>
                          Location:{" "}
                          {listing.location}
                        </p>

                        <p>
                          Listing ID: #{listing.id}
                        </p>

                      </div>
                    </div>
                  ))}

                </div>
              )}
          </CardContent>
        </Card>

        {/* ================================
            Received Offers
        ================================= */}

        <Card>
          <CardHeader>
            <CardTitle>
              Received Offers
            </CardTitle>
          </CardHeader>

          <CardContent>

            {listingsLoading && (
              <p className="text-muted-foreground">
                Loading offers...
              </p>
            )}

            {!listingsLoading &&
              listings.length === 0 && (
                <p className="text-muted-foreground">
                  Create a listing to receive offers.
                </p>
              )}

            {!listingsLoading &&
              listings.length > 0 && (
                <div className="space-y-5">

                  {offerQueries.map(
                    (query, index) => {
                      const listing =
                        listings[index];

                      const offers =
                        (query.data ?? []) as Offer[];

                      if (query.isLoading) {
                        return (
                          <div
                            key={listing.id}
                            className="rounded-lg border p-4"
                          >
                            <p className="text-sm text-muted-foreground">
                              Loading offers for{" "}
                              {listing.crop}...
                            </p>
                          </div>
                        );
                      }

                      if (query.isError) {
                        return (
                          <div
                            key={listing.id}
                            className="rounded-lg border p-4"
                          >
                            <p className="text-sm text-destructive">
                              Failed to load offers
                              for {listing.crop}.
                            </p>
                          </div>
                        );
                      }

                      if (offers.length === 0) {
                        return (
                          <div
                            key={listing.id}
                            className="rounded-lg border p-4"
                          >
                            <p className="font-medium">
                              {listing.crop}
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                              No offers received yet.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={listing.id}
                          className="space-y-3"
                        >

                          <div>
                            <h3 className="font-semibold">
                              {listing.crop} -{" "}
                              {listing.wasteType}
                            </h3>

                            <p className="text-xs text-muted-foreground">
                              Listing #{listing.id}
                            </p>
                          </div>

                          {offers.map(
                            (offer) => (
                              <div
                                key={offer.id}
                                className="rounded-lg border p-4"
                              >

                                <div className="flex items-center justify-between">

                                  <div>
                                    <p className="font-medium">
                                      Company #
                                      {offer.companyId}
                                    </p>

                                    <p className="text-sm text-muted-foreground">
                                      Offered Price:
                                      ₹
                                      {
                                        offer.offeredPrice
                                      }
                                    </p>
                                  </div>

                                  <span className="text-sm font-medium capitalize">
                                    {offer.status}
                                  </span>

                                </div>

                                {offer.message && (
                                  <p className="mt-2 text-sm">
                                    {offer.message}
                                  </p>
                                )}
                                {offer.status === "pending" && (
    <div className="mt-4 flex gap-2">
    <Button
      size="sm"
      onClick={() =>
        updateOfferStatus.mutate({
          offerId: offer.id,
          status: "accepted",
        })
      }
      disabled={updateOfferStatus.isPending}
    >
      Accept
    </Button>

    <Button
      size="sm"
      variant="outline"
      onClick={() =>
        updateOfferStatus.mutate({
          offerId: offer.id,
          status: "rejected",
        })
      }
      disabled={updateOfferStatus.isPending}
    >
      Reject
    </Button>
  </div>
)}

                              </div>
                            ),
                          )}

                        </div>
                      );
                    },
                  )}

                </div>
              )}

          </CardContent>
        </Card>

      </div>
    </div>
  );
}