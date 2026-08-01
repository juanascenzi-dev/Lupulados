import { useEffect, useState } from "react";
import {
  calculateBarrelRecommendation,
  type BarrelRecommendation,
} from "@/domain/barrelCalculator";
import type { Beer } from "@/domain/beerCatalog";
import { EVENT_INTENSITY_MULTIPLIERS, type EventIntensity } from "@/domain/beerConsumptionEstimate";
import {
  calculateBeverageMixEstimate,
  getBeerSharePercentage,
  isDefaultBeverageMix,
  updateBeverageMixShare,
  type BeverageMixItemEstimate,
  type BeverageMixShare,
  type NonBeerBeverageType,
} from "@/domain/beverageMix";
import { formatDurationLabel } from "@/domain/eventDuration";
import { clampEventGuestCount, parseEventGuestCount } from "@/domain/eventGuestCount";
import { useCommercialDerivedData } from "@/context/CommercialDataContext";
import { parseNumericInput } from "@/lib/utils";

export const LITERS_PER_PERSON_MIN = 0.2;
export const LITERS_PER_PERSON_MAX = 3;

export function useCalculadoraState() {
  const { priceDisclaimer, beerCatalog } = useCommercialDerivedData();

  const [guests, setGuests] = useState(50);
  const [hours, setHours] = useState(4);
  const [minutes, setMinutes] = useState(0);
  const [type, setType] = useState<EventIntensity>("normal");
  const [isSummer, setIsSummer] = useState(false);
  const [selectedBeerId, setSelectedBeerId] = useState<string | null>(null);
  const [showLitersOverride, setShowLitersOverride] = useState(false);
  const [customLitersPerPerson, setCustomLitersPerPerson] = useState<number | null>(null);
  const [genderModeEnabled, setGenderModeEnabled] = useState(false);
  const [men, setMen] = useState(25);
  const [women, setWomen] = useState(25);
  const [showBeverageMix, setShowBeverageMix] = useState(false);
  const [beverageMixShares, setBeverageMixShares] = useState<BeverageMixShare[]>([]);
  const selectedBeer: Beer | null = beerCatalog.find((beer) => beer.id === selectedBeerId) ?? null;

  const [totalLiters, setTotalLiters] = useState(0);
  const [barrelPlan, setBarrelPlan] = useState<BarrelRecommendation>(() =>
    calculateBarrelRecommendation(0),
  );
  const [mixResult, setMixResult] = useState<BeverageMixItemEstimate[]>([]);

  const handleGuestsChange = (val: number) => {
    setGuests(clampEventGuestCount(val));
  };

  const handleMenChange = (val: number) => setMen(Math.min(Math.max(val, 0), 500));
  const handleWomenChange = (val: number) => setWomen(Math.min(Math.max(val, 0), 500));

  const handleToggleGenderMode = () => {
    if (genderModeEnabled) {
      setGuests(clampEventGuestCount(men + women));
      setGenderModeEnabled(false);
    } else {
      setMen(Math.ceil(guests / 2));
      setWomen(Math.floor(guests / 2));
      setGenderModeEnabled(true);
    }
  };

  const handleHoursChange = (val: number) => {
    setHours(Math.min(Math.max(val, 1), 12));
  };

  const handleMinutesChange = (val: number) => {
    const stepped = Math.min(Math.max(Math.round(val / 15) * 15, 0), 45);
    setMinutes(stepped);
  };

  const handleLitersOverrideChange = (val: number) => {
    const rounded = Math.round(val * 10) / 10;
    setCustomLitersPerPerson(
      Math.min(Math.max(rounded, LITERS_PER_PERSON_MIN), LITERS_PER_PERSON_MAX),
    );
  };

  const handleGuestsInputChange = (raw: string) => {     const parsed = parseEventGuestCount(raw);     if (parsed !== null) setGuests(parsed);   };

  const handleMenInputChange = (raw: string) => {
    const value = parseNumericInput(raw);
    if (value !== null) setMen(Math.min(Math.max(value, 0), 500));
  };

  const handleWomenInputChange = (raw: string) => {
    const value = parseNumericInput(raw);
    if (value !== null) setWomen(Math.min(Math.max(value, 0), 500));
  };

  const handleHoursInputChange = (raw: string) => {
    const value = parseNumericInput(raw);
    if (value !== null) setHours(Math.min(Math.max(value, 0), 12));
  };

  const handleMinutesInputChange = (raw: string) => {
    const value = parseNumericInput(raw);
    if (value !== null) setMinutes(Math.min(Math.max(value, 0), 59));
  };

  const handleLitersOverrideInputChange = (raw: string) => {
    const value = parseNumericInput(raw);
    if (value !== null) {
      setCustomLitersPerPerson(Math.min(Math.max(value, 0), LITERS_PER_PERSON_MAX));
    }
  };

  const standardLitersPerPerson = EVENT_INTENSITY_MULTIPLIERS[type];
  const effectiveLitersPerPerson = customLitersPerPerson ?? standardLitersPerPerson;
  const effectiveGuestsTotal = genderModeEnabled ? men + women : guests;

  const activeBeverageTypes = new Set(
    beverageMixShares.filter((s) => s.percentage > 0).map((s) => s.type),
  );
  const beerSharePercentage = getBeerSharePercentage(beverageMixShares);
  const mixIsDefault = isDefaultBeverageMix(beverageMixShares);

  const handleToggleBeverageType = (bevType: NonBeerBeverageType) => {
    if (activeBeverageTypes.has(bevType)) {
      setBeverageMixShares((current) => updateBeverageMixShare(current, bevType, 0));
      return;
    }
    const remaining = 100 - beverageMixShares.reduce((sum, s) => sum + s.percentage, 0);
    setBeverageMixShares((current) =>
      updateBeverageMixShare(current, bevType, Math.min(10, Math.max(remaining, 0))),
    );
  };

  const handleBeverageShareChange = (bevType: NonBeerBeverageType, value: number) =>
    setBeverageMixShares((current) => updateBeverageMixShare(current, bevType, Math.round(value)));

  const handleResetBeverageMix = () => {
    setBeverageMixShares([]);
    setShowBeverageMix(false);
  };

  const handleExpandLitersOverride = () => {
    setCustomLitersPerPerson((current) => current ?? standardLitersPerPerson);
    setShowLitersOverride(true);
  };

  const handleResetLitersOverride = () => {
    setCustomLitersPerPerson(null);
    setShowLitersOverride(false);
  };

  const handleSelectDurationChip = (chip: { hours: number; minutes: number }) => {
    setHours(chip.hours);
    setMinutes(chip.minutes);
  };

  const totalHoursDecimal = hours + minutes / 60;

  const durationLabel = formatDurationLabel(hours, minutes);

  useEffect(() => {
    const genderComposition = genderModeEnabled ? { men, women } : undefined;

    const mixEstimate = calculateBeverageMixEstimate({
      guests: effectiveGuestsTotal,
      genderComposition,
      intensity: type,
      litersPerPerson: customLitersPerPerson ?? undefined,
      totalHoursDecimal,
      isSummer,
      shares: beverageMixShares,
    });
    setMixResult(mixEstimate);

    const beerLiters = mixEstimate.find((item) => item.type === "beer")?.liters ?? 0;
    setTotalLiters(beerLiters);

    const barrelRecommendation = calculateBarrelRecommendation(
      beerLiters,
      selectedBeer,
      beerCatalog,
    );
    setBarrelPlan(barrelRecommendation);
  }, [
    effectiveGuestsTotal,
    genderModeEnabled,
    men,
    women,
    hours,
    minutes,
    type,
    isSummer,
    totalHoursDecimal,
    selectedBeer,
    beerCatalog,
    customLitersPerPerson,
    beverageMixShares,
  ]);

  const isChipActive = (chip: { hours: number; minutes: number }) =>
    hours === chip.hours && minutes === chip.minutes;

  return {
    // Commercial context passthrough
    priceDisclaimer,
    beerCatalog,

    // Raw state (the 10 useState calls this hook owns)
    state: {
      guests,
      hours,
      minutes,
      type,
      isSummer,
      selectedBeerId,
      showLitersOverride,
      customLitersPerPerson,
      genderModeEnabled,
      men,
      women,
      showBeverageMix,
      beverageMixShares,
      totalLiters,
      barrelPlan,
      mixResult,
    },

    // Derived values, recomputed every render from state
    derived: {
      selectedBeer,
      standardLitersPerPerson,
      effectiveLitersPerPerson,
      effectiveGuestsTotal,
      activeBeverageTypes,
      beerSharePercentage,
      mixIsDefault,
      totalHoursDecimal,
      durationLabel,
      isChipActive,
    },

    // Handlers, including the direct setters used as-is by simple selectors
    handlers: {
      setType,
      setIsSummer,
      setSelectedBeerId,
      setShowBeverageMix,
      handleGuestsChange,
      handleMenChange,
      handleWomenChange,
      handleToggleGenderMode,
      handleHoursChange,
      handleMinutesChange,
      handleLitersOverrideChange,
      handleGuestsInputChange,
      handleMenInputChange,
      handleWomenInputChange,
      handleHoursInputChange,
      handleMinutesInputChange,
      handleLitersOverrideInputChange,
      handleToggleBeverageType,
      handleBeverageShareChange,
      handleResetBeverageMix,
      handleExpandLitersOverride,
      handleResetLitersOverride,
      handleSelectDurationChip,
    },
  };
}

export type UseCalculadoraStateResult = ReturnType<typeof useCalculadoraState>;
