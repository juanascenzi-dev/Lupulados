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

export interface SectionPosition {
  id: string;
  top: number;
  bottom: number;
}

const DEFAULT_HEADER_OFFSET = 80;
const DEFAULT_SECTION_ENTRY_GAP = 12;

export function getSiteHeaderOffset() {
  if (typeof window === "undefined") return DEFAULT_HEADER_OFFSET;

  const rawValue = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--site-header-offset")
    .trim();
  const parsedValue = Number.parseFloat(rawValue);

  return Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : DEFAULT_HEADER_OFFSET;
}

export function getSectionEntryGap() {
  if (typeof window === "undefined") return DEFAULT_SECTION_ENTRY_GAP;

  const rawValue = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--section-entry-gap")
    .trim();
  const parsedValue = Number.parseFloat(rawValue);

  return Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : DEFAULT_SECTION_ENTRY_GAP;
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
}: {
  sections: SectionPosition[];
  scrollY: number;
  viewportHeight: number;
  documentHeight: number;
  headerOffset: number;
}) {
  if (sections.length === 0) return null;

  if (scrollY <= 2) return sections[0].id;

  const maxScroll = Math.max(0, documentHeight - viewportHeight);
  if (scrollY >= maxScroll - 2) return sections[sections.length - 1].id;

  const activeLine = scrollY + headerOffset + viewportHeight * 0.28;
  const containingSection = sections.find(
    (section) => section.top <= activeLine && section.bottom > activeLine,
  );

  if (containingSection) return containingSection.id;

  const previousSection = [...sections]
    .reverse()
    .find((section) => section.top <= activeLine);

  return previousSection?.id ?? sections[0].id;
}
