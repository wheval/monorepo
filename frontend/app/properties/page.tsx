"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, SearchX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PropertyCard,
  propertyListingToCard,
} from "@/components/property-card";
import { PropertyCardSkeleton } from "@/components/property-card-skeleton";
import useAuthStore from "@/store/useAuthStore";
import {
  fetchSavedListingIds,
  setListingSaved,
} from "@/lib/savedPropertiesApi";
import {
  searchProperties,
  type PropertySearchFilters,
  type PropertyListing,
} from "@/lib/propertiesApi";

const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu"];
const BED_OPTIONS = ["Any", "1", "2", "3", "4", "4+"];
const BATH_OPTIONS = ["Any", "1", "2", "3", "3+"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "bedrooms_desc", label: "Most Bedrooms" },
];

function PropertiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [showFilters, setShowFilters] = useState(false);

  const searchQuery = searchParams.get("q") || "";
  const selectedLocation = searchParams.get("location") || "All Locations";
  const selectedPrice = searchParams.get("price") || "Any Price";
  const selectedBeds = searchParams.get("beds") || "Any";
  const sortBy = searchParams.get("sort") || "newest";

  const updateParams = (params: Record<string, string>) => {
    const newParams = new URLSearchParams();
    const currentQ = searchParams.get("q") || "";
    const currentLocation = searchParams.get("location") || "All Locations";
    const currentPrice = searchParams.get("price") || "Any Price";
    const currentBeds = searchParams.get("beds") || "Any";
    const currentSort = searchParams.get("sort") || "newest";

    const merged = {
      q: params.q !== undefined ? params.q : currentQ,
      location: params.location !== undefined ? params.location : currentLocation,
      price: params.price !== undefined ? params.price : currentPrice,
      beds: params.beds !== undefined ? params.beds : currentBeds,
      sort: params.sort !== undefined ? params.sort : currentSort,
    };

    Object.entries(merged).forEach(([key, value]) => {
      if (value === "All Locations" || value === "Any Price" || value === "Any" || value === "newest") {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    router.push(`?${newParams.toString()}`);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    router.push("/properties");
  };

  const hasActiveFilters =
    city ||
    area ||
    minBedrooms ||
    maxBedrooms ||
    minBathrooms ||
    maxBathrooms ||
    minAnnualRent ||
    maxAnnualRent;

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: PropertySearchFilters = {
        sortBy: (sortBy as PropertySearchFilters["sortBy"]) || "newest",
        page,
        pageSize: 20,
      };

      if (searchQuery.trim()) filters.query = searchQuery.trim();
      if (city) filters.city = city;
      if (area) filters.area = area;
      if (minBedrooms && minBedrooms !== "Any")
        filters.minBedrooms = parseInt(minBedrooms, 10);
      if (maxBedrooms && maxBedrooms !== "Any" && maxBedrooms !== "4+")
        filters.maxBedrooms = parseInt(maxBedrooms, 10);
      if (maxBedrooms === "4+") filters.minBedrooms = 4;
      if (minBathrooms && minBathrooms !== "Any")
        filters.minBathrooms = parseInt(minBathrooms, 10);
      if (maxBathrooms && maxBathrooms !== "Any" && maxBathrooms !== "3+")
        filters.maxBathrooms = parseInt(maxBathrooms, 10);
      if (maxBathrooms === "3+") filters.minBathrooms = 3;
      if (minAnnualRent) filters.minAnnualRent = parseInt(minAnnualRent, 10);
      if (maxAnnualRent) filters.maxAnnualRent = parseInt(maxAnnualRent, 10);

      const result = await searchProperties(filters);
      setProperties(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      setProperties([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery,
    city,
    area,
    minBedrooms,
    maxBedrooms,
    minBathrooms,
    maxBathrooms,
    minAnnualRent,
    maxAnnualRent,
    sortBy,
    page,
  ]);

  useEffect(() => {
    const debounce = setTimeout(fetchProperties, 300);
    return () => clearTimeout(debounce);
  }, [fetchProperties]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSavedListingIds([]);
      return;
    }

    let cancelled = false;
    fetchSavedListingIds()
      .then((ids) => {
        if (!cancelled) {
          setSavedListingIds(ids);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSavedListingIds([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const handleFavoriteChange = async (listingId: string, saved: boolean) => {
    await setListingSaved(listingId, saved);
    setSavedListingIds((prev) =>
      saved
        ? prev.includes(listingId)
          ? prev
          : [...prev, listingId]
        : prev.filter((id) => id !== listingId),
    );
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    updateParams({ q: query });
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
    updateParams({ location });
  };

  const handlePriceChange = (price: string) => {
    setSelectedPrice(price);
    updateParams({ price });
  };

  const handleBedsChange = (beds: string) => {
    setSelectedBeds(beds);
    updateParams({ beds });
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    updateParams({ sort });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  let filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation =
      selectedLocation === "All Locations" ||
      property.location.includes(selectedLocation);

    let matchesPrice = true;
    if (selectedPrice === "Under ₦2M") matchesPrice = property.price < 2000000;
    else if (selectedPrice === "₦2M - ₦5M")
      matchesPrice = property.price >= 2000000 && property.price <= 5000000;
    else if (selectedPrice === "₦5M - ₦10M")
      matchesPrice = property.price > 5000000 && property.price <= 10000000;
    else if (selectedPrice === "Above ₦10M")
      matchesPrice = property.price > 10000000;

    let matchesBeds = true;
    if (selectedBeds !== "Any") {
      if (selectedBeds === "4+") matchesBeds = property.beds >= 4;
      else matchesBeds = property.beds === Number.parseInt(selectedBeds);
    }

    return matchesSearch && matchesLocation && matchesPrice && matchesBeds;
  });

  if (sortBy === "price-low") {
    filteredProperties = [...filteredProperties].sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-high") {
    filteredProperties = [...filteredProperties].sort((a, b) => b.price - a.price);
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Header */}
      <section className="border-b-3 border-foreground bg-muted py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="mb-4 font-mono text-3xl font-black md:text-5xl">
            Find Your <span className="text-primary">Perfect Home</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Browse through our collection of verified rental properties. All
            listings come with our rent-now-pay-later option.
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="border-b-3 border-foreground bg-card py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by location or property name..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="border-3 border-foreground bg-background pl-12 py-6 font-medium shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
              />
            </div>

            <Button
              onClick={() => setShowFilters(!showFilters)}
              className="border-3 border-foreground bg-background px-6 py-6 font-bold text-foreground shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] md:w-auto"
            >
              <SlidersHorizontal className="mr-2 h-5 w-5" />
              Filters
              {(selectedLocation !== "All Locations" ||
                selectedPrice !== "Any Price" ||
                selectedBeds !== "Any") && (
                <span className="ml-2 flex h-6 w-6 items-center justify-center bg-primary text-xs font-bold">
                  {
                    [
                      selectedLocation !== "All Locations",
                      selectedPrice !== "Any Price",
                      selectedBeds !== "Any",
                    ].filter(Boolean).length
                  }
                </span>
              )}
            </Button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-6 border-3 border-foreground bg-background p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-lg font-bold">
                  Filter Properties
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleLocationChange("All Locations");
                    handlePriceChange("Any Price");
                    handleBedsChange("Any");
                    handleSortChange("newest");
                  }}
                  className="text-sm underline"
                >
                  Clear All
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <p className="mb-2 block font-mono text-sm font-bold">
                    Location
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {locations.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => handleLocationChange(loc)}
                        className={`border-2 border-foreground px-3 py-2 text-sm font-medium transition-all ${
                          selectedLocation === loc
                            ? "bg-foreground text-background"
                            : "bg-background hover:bg-muted"
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 block font-mono text-sm font-bold">
                    Price Range (Annual)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {priceRanges.map((range) => (
                      <button
                        key={range}
                        onClick={() => handlePriceChange(range)}
                        className={`border-2 border-foreground px-3 py-2 text-sm font-medium transition-all ${
                          selectedPrice === range
                            ? "bg-foreground text-background"
                            : "bg-background hover:bg-muted"
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 block font-mono text-sm font-bold">
                    Bedrooms
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {bedOptions.map((beds) => (
                      <button
                        key={beds}
                        onClick={() => handleBedsChange(beds)}
                        className={`border-2 border-foreground px-4 py-2 text-sm font-medium transition-all ${
                          selectedBeds === beds
                            ? "bg-foreground text-background"
                            : "bg-background hover:bg-muted"
                        }`}
                      >
                        {beds}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 block font-mono text-sm font-bold">
                    Sort By
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "newest", label: "Newest" },
                      { value: "price-low", label: "Price: Low to High" },
                      { value: "price-high", label: "Price: High to Low" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        className={`border-2 border-foreground px-3 py-2 text-sm font-medium transition-all ${
                          sortBy === option.value
                            ? "bg-foreground text-background"
                            : "bg-background hover:bg-muted"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-muted-foreground">
              Showing{" "}
              <span className="font-bold text-foreground">
                {filteredProperties.length}
              </span>{" "}
              properties
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="border-3 border-foreground bg-muted p-12 text-center shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <SearchX className="mx-auto h-16 w-16 text-muted-foreground" />
              <p className="font-mono text-xl font-bold mb-2 mt-4">
                No properties found
              </p>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query.
              </p>
              <Button
                onClick={() => {
                  handleSearchChange("");
                  handleLocationChange("All Locations");
                  handlePriceChange("Any Price");
                  handleBedsChange("Any");
                }}
                className="mt-6 border-3 border-foreground bg-primary font-bold shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.listingId}
                    property={propertyListingToCard(property)}
                    isFavorited={savedListingIds.includes(property.listingId)}
                    onFavoriteChange={(saved) =>
                      handleFavoriteChange(property.listingId, saved)
                    }
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => updateParams({ page: String(page - 1) })}
                    className="border-2 border-foreground font-bold"
                  >
                    Previous
                  </Button>
                  <span className="px-4 font-mono font-bold">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => updateParams({ page: String(page + 1) })}
                    className="border-2 border-foreground font-bold"
                  >
                    Next
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PropertiesContent />
    </Suspense>
  );
}
