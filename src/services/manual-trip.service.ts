import { BadRequestError } from '../utils/errors';
import { prisma } from '../db/prisma';
import crypto from 'crypto';

export interface TravelerDTO {
  sex: string;
  age: number;
}

export interface ActivityDTO {
  name: string;
  detail?: string;
  imageUrl?: string;
  estimatedINR?: number;
}

export interface DayPlanDTO {
  day: number;
  title: string;
  date?: string;
  route?: string;
  distance?: string;
  travelTime?: string;
  altitudeSeaLevel?: string;
  dailyPacing?: string;
  experienceDescription?: string;
  destinationImageUrl?: string;
  accommodation?: {
    hotelName?: string;
    bookingLink?: string;
    whyRecommended?: string;
    bookingPlatform?: string;
    pricePerPersonINR?: number;
  };
  transportDetails?: {
    type?: string;
    subType?: string;
    flightOrTrainNumber?: string;
    departureTime?: string;
    arrivalTime?: string;
  };
  predictedWeather?: {
    conditions?: string;
    temperatureLow?: string;
    temperatureHigh?: string;
  };
  dailyActivities?: ActivityDTO[];
  costBreakdown?: {
    transportBaseINR?: number;
    fuelINR?: number;
    tollsINR?: number;
    accommodationINR?: number;
    activitiesINR?: number;
    foodINR?: {
      breakfast?: number;
      lunch?: number;
      dinner?: number;
    };
  };
}

export interface TravelMediumConfig {
  selected: boolean;
  type?: string;
  ownership?: string;
}

export interface TravelMediumDTO {
  bus?: TravelMediumConfig;
  car?: TravelMediumConfig;
  bike?: TravelMediumConfig;
  train?: TravelMediumConfig;
  flights?: TravelMediumConfig;
  mixed_best_suitable?: boolean;
}

export interface ManualTripDTO {
  generationId?: string;
  status: 'DRAFT' | 'COMPLETED';
  destination: string;
  tripType: string;
  totalDays: number;
  totalPersons: number;
  experienceType: string;
  baseCurrency: string;
  travelers: TravelerDTO[];
  days: DayPlanDTO[];
  
  // Summary & Preferences
  origin?: string;
  startDate?: string;
  budgetINR?: number;
  luxuryLevel?: string; // "budget" | "moderate" | "luxury"
  travelStyle?: string; // "adventure" | "relaxed" | "sightseeing"
  foodPreference?: string; // "veg" | "non-veg" | "any"
  isRoundTrip?: boolean;
  travelMedium?: TravelMediumDTO;
  imageUrl?: string;
}

const IMAGES_BY_THEME: Record<string, string[]> = {
  adventure: [
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=1200&auto=format&fit=crop'
  ],
  beach: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1473116763269-255ea7b8b5f1?q=80&w=1200&auto=format&fit=crop'
  ],
  culture: [
    'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=80&w=1200&auto=format&fit=crop'
  ],
  default: [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506125840744-167167210587?q=80&w=1200&auto=format&fit=crop'
  ]
};

export class ManualTripService {
  /**
   * Helper to pick a random visual cover image based on experience keyword
   */
  private getCoverImage(experience: string): string {
    const norm = experience.toLowerCase();
    let pool = IMAGES_BY_THEME.default;

    if (norm.includes('mountain') || norm.includes('adventure') || norm.includes('trek')) {
      pool = IMAGES_BY_THEME.adventure;
    } else if (norm.includes('beach') || norm.includes('sea') || norm.includes('relax')) {
      pool = IMAGES_BY_THEME.beach;
    } else if (norm.includes('culture') || norm.includes('historical') || norm.includes('city')) {
      pool = IMAGES_BY_THEME.culture;
    }

    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  }

  /**
   * Validate the publication payload strictly
   */
  public validatePublish(dto: ManualTripDTO) {
    if (!dto.destination || dto.destination.trim() === '') {
      throw new BadRequestError('Destination is required.');
    }
    if (!dto.totalDays || dto.totalDays <= 0) {
      throw new BadRequestError('Trip duration (days) must be at least 1 day.');
    }
    if (!dto.experienceType) {
      throw new BadRequestError('Experience type is required.');
    }
    if (!dto.days || dto.days.length === 0) {
      throw new BadRequestError('Logistics itinerary days cannot be empty.');
    }
  }

  /**
   * Formats raw inputs into the identical, canonical response JSON tree used by AI-generated trips.
   * Auto-enriches missing values to guarantee frontend visual stability.
   */
  public formatItinerary(dto: ManualTripDTO): any {
    const coverImage = dto.imageUrl || this.getCoverImage(dto.experienceType || 'default');

    // 1. Format Days List
    const days = (dto.days || []).map((dayPlan, index) => {
      const dayNum = dayPlan.day || index + 1;
      
      // Weather parameters
      const conditions = dayPlan.predictedWeather?.conditions || (index % 2 === 0 ? 'Clear Skies / Cool Breeze' : 'Sunny & Calm');
      const tempLow = dayPlan.predictedWeather?.temperatureLow || (index % 2 === 0 ? '12°C' : '10°C');
      const tempHigh = dayPlan.predictedWeather?.temperatureHigh || (index % 2 === 0 ? '22°C' : '20°C');

      // Activities Format Map
      const dailyActivities = (dayPlan.dailyActivities || []).map((act, actIdx) => ({
        name: act.name || `Activity ${actIdx + 1}`,
        detail: act.detail || 'Exploring key local sights.',
        estimatedINR: Number(act.estimatedINR) || 0,
        imageUrl: act.imageUrl || coverImage
      }));

      // Accommodation Format Map
      const accommodation = {
        hotelName: dayPlan.accommodation?.hotelName || 'Hotel Grand View / Guesthouse',
        bookingPlatform: dayPlan.accommodation?.bookingPlatform || 'Booking.com',
        bookingLink: dayPlan.accommodation?.bookingLink || 'Not Applicable',
        pricePerPersonINR: Number(dayPlan.accommodation?.pricePerPersonINR) || 0,
        whyRecommended: dayPlan.accommodation?.whyRecommended || 'Highly rated for cleanliness and traveler hospitality.'
      };

      // Transport format Map
      const transportDetails = {
        type: dayPlan.transportDetails?.type || 'Cab / Walking',
        subType: dayPlan.transportDetails?.subType || 'Local Transit',
        flightOrTrainNumber: dayPlan.transportDetails?.flightOrTrainNumber || 'Not Applicable',
        departureTime: dayPlan.transportDetails?.departureTime || 'Not Applicable',
        arrivalTime: dayPlan.transportDetails?.arrivalTime || 'Not Applicable'
      };

      // Cost calculation
      const transportCost = Number(dayPlan.costBreakdown?.transportBaseINR) || 0;
      const fuelCost = Number(dayPlan.costBreakdown?.fuelINR) || 0;
      const tollsCost = Number(dayPlan.costBreakdown?.tollsINR) || 0;
      const stayCost = Number(dayPlan.accommodation?.pricePerPersonINR) || 0;
      const activitiesCost = dailyActivities.reduce((sum, curr) => sum + curr.estimatedINR, 0);
      const breakfastCost = Number(dayPlan.costBreakdown?.foodINR?.breakfast) || 500;
      const lunchCost = Number(dayPlan.costBreakdown?.foodINR?.lunch) || 800;
      const dinnerCost = Number(dayPlan.costBreakdown?.foodINR?.dinner) || 1200;

      const costBreakdown = {
        transportBaseINR: transportCost,
        fuelINR: fuelCost,
        tollsINR: tollsCost,
        accommodationINR: stayCost,
        activitiesINR: activitiesCost,
        foodINR: {
          breakfast: breakfastCost,
          lunch: lunchCost,
          dinner: dinnerCost
        }
      };

      return {
        day: dayNum,
        date: dayPlan.date || `Day ${dayNum}`,
        title: dayPlan.title || `Exploring ${dto.destination}`,
        route: dayPlan.route || `${dto.destination} Local`,
        distance: dayPlan.distance || 'Not Applicable',
        travelTime: dayPlan.travelTime || 'Not Applicable',
        altitudeSeaLevel: dayPlan.altitudeSeaLevel || 'Not Applicable',
        predictedWeather: {
          conditions,
          temperatureHigh: tempHigh,
          temperatureLow: tempLow
        },
        transportDetails,
        destinationImageUrl: coverImage,
        accommodation,
        experienceDescription: dayPlan.experienceDescription || 'Enjoying beautiful local scenery and interacting with locals.',
        dailyPacing: dayPlan.dailyPacing || 'Moderate',
        dailyActivities,
        costBreakdown
      };
    });

    // 2. Aggregate Full Costs Breakdown
    let totalStay = 0;
    let totalTransport = 0;
    let totalActivities = 0;
    let totalBreakfast = 0;
    let totalLunch = 0;
    let totalDinner = 0;
    let totalFuel = 0;
    let totalTolls = 0;

    days.forEach((d) => {
      totalStay += d.accommodation.pricePerPersonINR;
      totalTransport += d.costBreakdown.transportBaseINR;
      totalActivities += d.costBreakdown.activitiesINR;
      totalBreakfast += d.costBreakdown.foodINR.breakfast;
      totalLunch += d.costBreakdown.foodINR.lunch;
      totalDinner += d.costBreakdown.foodINR.dinner;
      totalFuel += d.costBreakdown.fuelINR;
      totalTolls += d.costBreakdown.tollsINR;
    });

    const foodBreakdownFull = {
      breakfast: totalBreakfast,
      lunch: totalLunch,
      dinner: totalDinner,
      snacksAndDrinks: Math.round((totalBreakfast + totalLunch + totalDinner) * 0.15) // Estimate snacks at 15%
    };

    const hiddenCosts = {
      fuelEstimatedTotal: totalFuel,
      tollsAndTaxes: totalTolls,
      tips: days.length * 200, // 200 INR tip estimation per day
      permits: dto.experienceType.toLowerCase().includes('trek') ? 1000 : 0
    };

    const totalFoodCost = foodBreakdownFull.breakfast + foodBreakdownFull.lunch + foodBreakdownFull.dinner + foodBreakdownFull.snacksAndDrinks;
    const totalHiddenCost = hiddenCosts.fuelEstimatedTotal + hiddenCosts.tollsAndTaxes + hiddenCosts.tips + hiddenCosts.permits;
    
    // Per person cost = stay + activities + food + hidden + (transport / total persons)
    const basePerPerson = totalStay + totalActivities + totalFoodCost + totalHiddenCost;
    const transportShare = dto.totalPersons > 0 ? (totalTransport / dto.totalPersons) : totalTransport;
    const perPersonINR = Math.round(basePerPerson + transportShare);

    const costBreakdownFull = {
      stayINR: totalStay,
      activitiesINR: totalActivities,
      hiddenCostsINR: hiddenCosts,
      foodBreakdownINR: foodBreakdownFull,
      interCityTransportINR: totalTransport,
      intraCityTransportINR: Math.round(totalTransport * 0.2) // Local cab estimates
    };

    // Calculate dynamic safety costs (Min, Safe, Max margins)
    const safeCostINR = perPersonINR * dto.totalPersons;
    const minimumCostINR = Math.round(safeCostINR * 0.9);
    const maxCostINR = Math.round(safeCostINR * 1.1);

    const totalCostSummary = {
      minimumCostINR,
      safeCostINR,
      maxCostINR,
      perPersonINR
    };

    // Packing list matching theme
    const packingList = ['Sturdy trekking/walking shoes', 'Warm layered clothing', 'Reusable water bottle'];
    const healthAndSafety = ['Stay hydrated', 'Carry basic medical survival kit'];
    const scamWarnings = ['Only use pre-negotiated or pre-paid booths.', 'Agree on prices before booking any service.'];
    const culturalNorms = ['Respect local customs.', 'Dress modestly when entering holy shrines.'];
    const emergencyContacts = ['Police: 100', 'Ambulance: 108'];
    const localAppsToDownload = ['Google Maps', 'Weather App'];

    // 3. Assemble Canonical Itinerary Document
    return {
      days,
      summary: {
        imageUrl: coverImage,
        tripType: dto.tripType || 'Round Trip',
        totalDays: dto.totalDays,
        travelers: (dto.travelers || []).map((t) => ({ sex: t.sex || 'M', age: Number(t.age) || 22 })),
        destination: dto.destination,
        baseCurrency: dto.baseCurrency || 'INR',
        totalPersons: dto.totalPersons || 1,
        experienceType: dto.experienceType
      },
      logistics: {
        packingList,
        healthAndSafety
      },
      survivalGuide: {
        scamWarnings,
        culturalNorms,
        emergencyContacts,
        localAppsToDownload
      },
      travelInsights: {
        hiddenGems: [
          'Hadimba Devi Temple & Local Springs',
          'Charming offbeat village tracks and traditional shops.'
        ],
        cautionPoints: [
          'Be careful while driving on high mountain loops.',
          'Be prepared for quick changes in high-altitude weather.'
        ],
        bestExperiences: [
          'Exploring local mountain side cafe crawl sessions.',
          'Thrilling hikes and nature sights.'
        ],
        bestTimeToVisit: 'May to October',
        sustainabilityTips: [
          'Minimize usage of plastic wrappers and cups.',
          'Support village handloom products and homestay services.'
        ]
      },
      totalCostSummary,
      costBreakdownFull
    };
  }

  /**
   * Main save pipeline: creates or updates a User trip
   */
  public async saveManualTrip(userId: string, dto: ManualTripDTO) {
    // 1. Setup UUID Generation ID
    const generationId = dto.generationId || crypto.randomUUID();

    // 2. Build Formatted Itinerary
    const responseJson = this.formatItinerary(dto);

    // 3. Extract the 8 primitive columns directly from formatted itinerary for efficient Feed Projection
    const coverImage = responseJson.summary.imageUrl;
    const tripType = responseJson.summary.tripType;
    const totalDays = responseJson.summary.totalDays;
    const destination = responseJson.summary.destination;
    const baseCurrency = responseJson.summary.baseCurrency;
    const totalPersons = responseJson.summary.totalPersons;
    const experienceType = responseJson.summary.experienceType;
    const perPersonCost = responseJson.totalCostSummary.perPersonINR;

    // 4. Structure the exact raw incoming DTO details into a canonical payload JSON
    const payloadJson = {
      preferences: {
        luxury_level: dto.luxuryLevel || 'moderate',
        travel_style: dto.travelStyle || 'adventure',
        food_preference: dto.foodPreference || 'any'
      },
      trip_details: {
        days: dto.totalDays,
        origin: dto.origin || 'Ghaziabad',
        budgetINR: Number(dto.budgetINR) || 45000,
        startDate: dto.startDate || '2026-06-15',
        destination: dto.destination,
        isRoundTrip: dto.isRoundTrip ?? true
      },
      travel_medium: dto.travelMedium || {
        car: {
          type: 'suv',
          selected: true,
          ownership: 'rented'
        }
      },
      party_composition: {
        travelers: (dto.travelers || []).map((t) => ({ sex: t.sex || 'M', age: Number(t.age) || 22 })),
        totalPersons: dto.totalPersons
      }
    };

    const dbData = {
      status: dto.status, // DRAFT or COMPLETED
      payload: payloadJson as any, // Canonical input details
      response: responseJson,
      type: 'user', // Manual trip
      userId,
      coverImage,
      tripType,
      totalDays,
      destination,
      baseCurrency,
      totalPersons,
      experienceType,
      perPersonCost
    };

    console.log(`[ManualTripService] Upserting manual trip: ${generationId} with status ${dto.status}`);

    const trip = await prisma.trip.upsert({
      where: { generationId },
      update: dbData,
      create: {
        generationId,
        ...dbData
      }
    });

    return trip;
  }
}

export const manualTripService = new ManualTripService();
