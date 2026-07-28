import { getMotionAwareScrollBehavior } from "./reducedMotion";

export const NAV_LINKS = [
  { name: "Inicio", href: "inicio", isContact: false },
  { name: "Servicios", href: "servicios", isContact: false },
  { name: "Cervezas", href: "cervezas", isContact: false },
  { name: "Calculadora", href: "calculadora", isContact: false },
  { name: "Arma tu Pedido", href: "arma-tu-pedido", isContact: false },
  { name: "Eventos", href: "eventos", isContact: false },
  { name: "Como Funciona", href: "como-funciona", isContact: false },
  { name: "FAQ", href: "faq", isContact: false },
  { name: "Contacto", href: "ubicacion", isContact: true },
] as const;

export type NavSectionId = (typeof NAV_LINKS)[number]["href"];

export const LANDING_SECTION_ORDER = NAV_LINKS.map((link) => link.href);

export interface SectionPosition {
  id: string;
  top: number;
  bottom: number;
}

const DEFAULT_HEADER_OFFSET = 80;
const DEFAULT_SECTION_ENTRY_GAP = 12;

function getCssPixelVariable(name: string, defaultValue: number) {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    !document.documentElement ||
    typeof window.getComputedStyle !== "function"
  ) {
    return defaultValue;
  }

  const rawValue = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parsedValue = Number.parseFloat(rawValue);

  return Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : defaultValue;
}

export function getSiteHeaderOffset() {
  return getCssPixelVariable("--site-header-offset", DEFAULT_HEADER_OFFSET);
}

export function getSectionEntryGap() {
  return getCssPixelVariable("--section-entry-gap", DEFAULT_SECTION_ENTRY_GAP);
}

export function setSiteHeaderOffset(offset: number) {
  if (typeof document === "undefined") return;

  document.documentElement.style.setProperty(
    "--site-header-offset",
    `${Math.max(0, Math.ceil(offset))}px`,
  );
}

export function getSectionScrollOffset() {
  return getSiteHeaderOffset() + getSectionEntryGap();
}

export function getSectionScrollTarget(section: HTMLElement) {
  return section.querySelector<HTMLElement>("[data-section-entry]") ?? section;
}

export function getScrollTopForSectionTarget({
  targetTop,
  scrollY,
  headerOffset,
  entryGap,
}: {
  targetTop: number;
  scrollY: number;
  headerOffset: number;
  entryGap: number;
}) {
  return Math.max(0, targetTop + scrollY - headerOffset - entryGap);
}

export function scrollToSection(id: string) {
  const section = document.getElementById(id);
  if (!section) return;

  const target = getSectionScrollTarget(section);
  const offsetPosition = getScrollTopForSectionTarget({
    targetTop: target.getBoundingClientRect().top,
    scrollY: window.scrollY,
    headerOffset: getSiteHeaderOffset(),
    entryGap: getSectionEntryGap(),
  });

  window.scrollTo({
    top: offsetPosition,
    behavior: getMotionAwareScrollBehavior(),
  });
}

export function getActiveSectionId({
  sections,
  scrollY,
  viewportHeight,
  documentHeight,
  headerOffset,
  entryGap = getSectionEntryGap(),
}: {
  sections: SectionPosition[];
  scrollY: number;
  viewportHeight: number;
  documentHeight: number;
  headerOffset: number;
  entryGap?: number;
}) {
  if (sections.length === 0) return null;

  if (scrollY <= 2) return sections[0].id;

  const maxScroll = Math.max(0, documentHeight - viewportHeight);
  if (scrollY >= maxScroll - 2) return sections[sections.length - 1].id;

  const sortedSections = [...sections].sort((a, b) => a.top - b.top);
  const readableViewport = Math.max(0, viewportHeight - headerOffset);
  const activeLine = scrollY + headerOffset + Math.min(readableViewport * 0.45, 420);
  const entryLine = scrollY + headerOffset + entryGap;
  const containingSection = sections.find(
    (section) => section.top <= activeLine && section.bottom > activeLine,
  );

  if (containingSection) return containingSection.id;

  const sectionAtEntryLine = sortedSections.find(
    (section) => section.top <= entryLine && section.bottom > entryLine,
  );

  if (sectionAtEntryLine) return sectionAtEntryLine.id;

  const previousSection = sortedSections
    .reverse()
    .find((section) => section.top <= activeLine);

  return previousSection?.id ?? sortedSections[0].id;
}
