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

import { useLanguage } from "@/i18n/LanguageContext";

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
  const { t } = useLanguage();

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

  // Get farmer listings
  const {
    data: listings = [],
    isLoading: listingsLoading,
    isError: listingsError,
  } = useQuery<Listing[]>({
    queryKey: ["/api/listings/mine?farmerId=1"],
  });

  // Get offers for each listing
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

  // Create listing
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
      setMessage(t.messages.listingCreated);

      setForm({
        farmerId: "1",
        crop: "",
        wasteType: "",
        quantity: "",
        unit: "kg",
        location: "",
        price: "",
      });

      await queryClient.invalidateQueries({
        queryKey: ["/api/listings/mine?farmerId=1"],
      });
    },

    onError: () => {
      setMessage(t.messages.listingFailed);
    },
  });

  // Update offer status
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

      listings.forEach((listing) => {
        queryClient.invalidateQueries({
          queryKey: [`/api/listings/${listing.id}/offers`],
        });
      });
    },
  });

  const updateField = (
    field: string,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return t.farmer.pending;

      case "accepted":
        return t.farmer.accepted;

      case "rejected":
        return t.farmer.rejected;

      case "active":
        return t.farmer.active;

      case "sold":
        return t.farmer.sold;

      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">

      {/* Dashboard Header */}

      <div>
        <h1 className="text-3xl font-bold">
          {t.farmer.dashboard}
        </h1>

        <p className="text-muted-foreground">
          Manage your waste listings and received offers.
        </p>
      </div>

      {/* Create Listing */}

      <Card>
        <CardHeader>
          <CardTitle>
            {t.farmer.createListing}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">

            {/* Crop */}

            <div className="space-y-2">
              <Label>{t.farmer.crop}</Label>

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
              <Label>{t.farmer.wasteType}</Label>

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
              <Label>{t.farmer.quantity}</Label>

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
              <Label>{t.farmer.unit}</Label>

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
              <Label>{t.farmer.location}</Label>

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
              <Label>{t.farmer.askingPrice}</Label>

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
              : t.farmer.createListingButton}
          </Button>

          {message && (
            <p className="mt-4 text-sm">
              {message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* My Listings + Received Offers */}

      <div className="grid gap-6 md:grid-cols-2">

        {/* My Listings */}

        <Card>
          <CardHeader>
            <CardTitle>
              {t.farmer.myListings}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {listingsLoading && (
              <p className="text-muted-foreground">
                {t.farmer.loadingListings}
              </p>
            )}

            {listingsError && (
              <p className="text-destructive">
                {t.messages.offersFailed}
              </p>
            )}

            {!listingsLoading &&
              !listingsError &&
              listings.length === 0 && (
                <p className="text-muted-foreground">
                  {t.farmer.noListings}
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

                        <span className="text-sm font-medium">
                          {getStatusLabel(
                            listing.status,
                          )}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">

                        <p>
                          {t.farmer.quantity}:{" "}
                          {listing.quantity}{" "}
                          {listing.unit}
                        </p>

                        <p>
                          {t.farmer.askingPrice}: ₹
                          {listing.price}
                        </p>

                        <p>
                          {t.farmer.location}:{" "}
                          {listing.location}
                        </p>

                      </div>
                    </div>
                  ))}

                </div>
              )}
          </CardContent>
        </Card>

        {/* Received Offers */}

        <Card>
          <CardHeader>
            <CardTitle>
              {t.farmer.receivedOffers}
            </CardTitle>
          </CardHeader>

          <CardContent>

            {listingsLoading && (
              <p className="text-muted-foreground">
                {t.farmer.loadingOffers}
              </p>
            )}

            {!listingsLoading &&
              listings.length === 0 && (
                <p className="text-muted-foreground">
                  {t.farmer.noOffers}
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
                              {t.farmer.loadingOffers}
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
                              {t.messages.offersFailed}
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
                              {t.farmer.noOffers}
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
                                      {t.farmer.askingPrice}: ₹
                                      {
                                        offer.offeredPrice
                                      }
                                    </p>
                                  </div>

                                  <span className="text-sm font-medium">
                                    {getStatusLabel(
                                      offer.status,
                                    )}
                                  </span>

                                </div>

                                {offer.message && (
                                  <p className="mt-2 text-sm">
                                    {offer.message}
                                  </p>
                                )}

                                {offer.status ===
                                  "pending" && (
                                  <div className="mt-4 flex gap-2">

                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        updateOfferStatus.mutate(
                                          {
                                            offerId:
                                              offer.id,
                                            status:
                                              "accepted",
                                          },
                                        )
                                      }
                                      disabled={
                                        updateOfferStatus.isPending
                                      }
                                    >
                                      {t.farmer.accept}
                                    </Button>

                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        updateOfferStatus.mutate(
                                          {
                                            offerId:
                                              offer.id,
                                            status:
                                              "rejected",
                                          },
                                        )
                                      }
                                      disabled={
                                        updateOfferStatus.isPending
                                      }
                                    >
                                      {t.farmer.reject}
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