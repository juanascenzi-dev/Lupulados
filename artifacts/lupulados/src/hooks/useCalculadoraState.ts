import { useEffect, useState } from "react";
import {
  calculateBarrelRecommendation,
  type BarrelRecommendation,
} from "@/domain/barrelCalculator";
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
import {
  durationPartsFromMinutes,
  durationToHoursDecimal,
  durationMinutesFromInputs,
  formatDurationLabel,
  parseDurationUnit,
  validateEventDuration,
} from "@/domain/eventDuration";
import {
  clampEventGuestCount,
  MAX_EVENT_GUESTS,
  parseEventGuestCount,
} from "@/domain/eventGuestCount";
import { useCommercialDerivedData } from "@/context/CommercialDataContext";
import { parseNumericInput } from "@/lib/utils";

export const LITERS_PER_PERSON_MIN = 0.2;
export const LITERS_PER_PERSON_MAX = 3;

export function useCalculadoraState() {
  const { priceDisclaimer, beerCatalog } = useCommercialDerivedData();

  const [guests, setGuests] = useState(50);
  const [durationMinutes, setDurationMinutes] = useState(240);
  const [type, setType] = useState<EventIntensity>("normal");
  const [isSummer, setIsSummer] = useState(false);
  const [selectedBeerIds, setSelectedBeerIds] = useState<string[]>([]);
  const [customLitersPerPerson, setCustomLitersPerPerson] = useState<number | null>(null);
  const [men, setMen] = useState(25);
  const [women, setWomen] = useState(25);
  const [beverageMixShares, setBeverageMixShares] = useState<BeverageMixShare[]>([]);

  const [totalLiters, setTotalLiters] = useState(0);
  const [barrelPlan, setBarrelPlan] = useState<BarrelRecommendation>(() =>
    calculateBarrelRecommendation(0),
  );
  const [mixResult, setMixResult] = useState<BeverageMixItemEstimate[]>([]);

  const syncGenderCompositionToTotal = (nextGuests: number) => {
    const currentTotal = men + women;
    if (currentTotal <= 0) {
      setMen(Math.ceil(nextGuests / 2));
      setWomen(Math.floor(nextGuests / 2));
      return;
    }

    const nextMen = Math.min(nextGuests, Math.round((men / currentTotal) * nextGuests));
    setMen(nextMen);
    setWomen(nextGuests - nextMen);
  };

  const handleGuestsChange = (val: number) => {
    const nextGuests = clampEventGuestCount(val);
    setGuests(nextGuests);
    syncGenderCompositionToTotal(nextGuests);
  };

  const handleMenChange = (val: number) => {
    const nextMen = Math.min(Math.max(val, 0), MAX_EVENT_GUESTS);
    const nextWomen = Math.min(women, Math.max(0, MAX_EVENT_GUESTS - nextMen));
    setMen(nextMen);
    setWomen(nextWomen);
    setGuests(clampEventGuestCount(nextMen + nextWomen));
  };

  const handleWomenChange = (val: number) => {
    const nextWomen = Math.min(Math.max(val, 0), MAX_EVENT_GUESTS);
    const nextMen = Math.min(men, Math.max(0, MAX_EVENT_GUESTS - nextWomen));
    setWomen(nextWomen);
    setMen(nextMen);
    setGuests(clampEventGuestCount(nextMen + nextWomen));
  };

  const handleHoursChange = (val: number) => {
    const nextHours = parseDurationUnit(val);
    if (nextHours === null) return;
    const { minutes: currentMinutes } = durationPartsFromMinutes(durationMinutes);
    setDurationMinutes(durationMinutesFromInputs(nextHours, currentMinutes));
  };

  const handleMinutesChange = (val: number) => {
    const nextMinutes = parseDurationUnit(val);
    if (nextMinutes === null) return;
    const { days, hours } = durationPartsFromMinutes(durationMinutes);
    setDurationMinutes(durationMinutesFromInputs(days * 24 + hours, nextMinutes));
  };

  const handleLitersOverrideChange = (val: number) => {
    const rounded = Math.round(val * 10) / 10;
    setCustomLitersPerPerson(
      Math.min(Math.max(rounded, LITERS_PER_PERSON_MIN), LITERS_PER_PERSON_MAX),
    );
  };

  const handleGuestsInputChange = (raw: string) => {
    const parsed = parseEventGuestCount(raw);
    if (parsed !== null) handleGuestsChange(parsed);
  };

  const handleMenInputChange = (raw: string) => {
    const value = parseNumericInput(raw);
    if (value !== null) handleMenChange(value);
  };

  const handleWomenInputChange = (raw: string) => {
    const value = parseNumericInput(raw);
    if (value !== null) handleWomenChange(value);
  };

  const handleHoursInputChange = (raw: string) => {
    const value = parseDurationUnit(raw);
    if (value !== null) handleHoursChange(value);
  };

  const handleMinutesInputChange = (raw: string) => {
    const value = parseDurationUnit(raw);
    if (value !== null) handleMinutesChange(value);
  };

  const handleLitersOverrideInputChange = (raw: string) => {
    const value = parseNumericInput(raw);
    if (value !== null) {
      setCustomLitersPerPerson(Math.min(Math.max(value, 0), LITERS_PER_PERSON_MAX));
    }
  };

  const standardLitersPerPerson = EVENT_INTENSITY_MULTIPLIERS[type];
  const effectiveLitersPerPerson = customLitersPerPerson ?? standardLitersPerPerson;
  const effectiveGuestsTotal = men + women;
  const selectedBeer =
    selectedBeerIds.length === 1
      ? (beerCatalog.find((beer) => beer.id === selectedBeerIds[0]) ?? null)
      : null;

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

  const handleSetBeverageMixShares = (shares: BeverageMixShare[]) => {
    setBeverageMixShares(shares);
  };

  const handleResetBeverageMix = () => {
    setBeverageMixShares([]);
  };

  const handleExpandLitersOverride = () => {
    setCustomLitersPerPerson((current) => current ?? standardLitersPerPerson);
  };

  const handleResetLitersOverride = () => {
    setCustomLitersPerPerson(null);
  };

  const durationParts = durationPartsFromMinutes(durationMinutes);
  const hours = durationParts.days * 24 + durationParts.hours;
  const minutes = durationParts.minutes;
  const totalHoursDecimal = durationToHoursDecimal(durationMinutes);
  const durationLabel = formatDurationLabel(durationMinutes);
  const durationValidationMessage = validateEventDuration(durationMinutes);

  useEffect(() => {
    const genderComposition = { men, women };

    if (durationValidationMessage) {
      setMixResult([]);
      setTotalLiters(0);
      setBarrelPlan(calculateBarrelRecommendation(0, selectedBeer, beerCatalog));
      return;
    }

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
    men,
    women,
    durationMinutes,
    type,
    isSummer,
    totalHoursDecimal,
    beerCatalog,
    customLitersPerPerson,
    beverageMixShares,
    durationValidationMessage,
    selectedBeer,
  ]);

  return {
    // Commercial context passthrough
    priceDisclaimer,
    beerCatalog,

    // Raw state (the 10 useState calls this hook owns)
    state: {
      guests,
      hours,
      minutes,
      durationMinutes,
      type,
      isSummer,
      selectedBeerIds,
      customLitersPerPerson,
      men,
      women,
      beverageMixShares,
      totalLiters,
      barrelPlan,
      mixResult,
    },

    // Derived values, recomputed every render from state
    derived: {
      standardLitersPerPerson,
      effectiveLitersPerPerson,
      effectiveGuestsTotal,
      activeBeverageTypes,
      beerSharePercentage,
      mixIsDefault,
      totalHoursDecimal,
      durationLabel,
      durationValidationMessage,
    },

    // Handlers, including the direct setters used as-is by simple selectors
    handlers: {
      setType,
      setIsSummer,
      setSelectedBeerIds,
      handleGuestsChange,
      handleMenChange,
      handleWomenChange,
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
      handleSetBeverageMixShares,
      handleResetBeverageMix,
      handleExpandLitersOverride,
      handleResetLitersOverride,
    },
  };
}

export type UseCalculadoraStateResult = ReturnType<typeof useCalculadoraState>;
