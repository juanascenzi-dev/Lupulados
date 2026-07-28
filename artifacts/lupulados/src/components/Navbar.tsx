import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X, Beer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  getActiveSectionId,
  getSectionEntryGap,
  getSiteHeaderOffset,
  LANDING_SECTION_ORDER,
  NAV_LINKS,
  scrollToSection,
  setSiteHeaderOffset,
} from "@/lib/sectionNavigation";

interface NavbarProps {
  bannerVisible: boolean;
  bannerHeight: number;
}

export function Navbar({ bannerVisible, bannerHeight }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("inicio");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const firstMobileLinkRef = useRef<HTMLButtonElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const updateHeaderOffset = useCallback(() => {
    const header = headerRef.current;
    if (!header) return;

    setSiteHeaderOffset(header.getBoundingClientRect().bottom);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    updateHeaderOffset();

    const header = headerRef.current;
    const resizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(() => updateHeaderOffset())
        : null;

    if (header) resizeObserver?.observe(header);
    window.addEventListener("resize", updateHeaderOffset);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateHeaderOffset);
    };
  }, [bannerHeight, bannerVisible, isScrolled, updateHeaderOffset]);

  useEffect(() => {
    const sectionIds = LANDING_SECTION_ORDER;
    const observedSections = new Set<Element>();
    let sectionObserver: IntersectionObserver | null = null;
    let sectionResizeObserver: ResizeObserver | null = null;

    const updateActiveSection = () => {
      rafIdRef.current = null;

      const sections = sectionIds
        .map((id) => {
          const element = document.getElementById(id);
          if (!element) return null;

          const rect = element.getBoundingClientRect();
          const top = rect.top + window.scrollY;
          return { id, top, bottom: top + rect.height };
        })
        .filter((section) => section !== null);

      const nextActiveSection = getActiveSectionId({
        sections,
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
        headerOffset: getSiteHeaderOffset(),
        entryGap: getSectionEntryGap(),
      });

      if (nextActiveSection) {
        setActiveSection((current) =>
          current === nextActiveSection ? current : nextActiveSection,
        );
      }
    };

    const scheduleUpdate = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = window.requestAnimationFrame(updateActiveSection);
    };

    sectionObserver =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(scheduleUpdate, {
            root: null,
            rootMargin: `-${Math.round(getSiteHeaderOffset())}px 0px -55% 0px`,
            threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
          })
        : null;

    sectionResizeObserver =
      typeof ResizeObserver === "function" ? new ResizeObserver(scheduleUpdate) : null;

    const observeCurrentSections = () => {
      sectionIds.forEach((id) => {
        const element = document.getElementById(id);
        if (!element || observedSections.has(element)) return;

        observedSections.add(element);
        sectionObserver?.observe(element);
        sectionResizeObserver?.observe(element);
      });
      scheduleUpdate();
    };

    const mutationObserver =
      typeof MutationObserver === "function"
        ? new MutationObserver(observeCurrentSections)
        : null;

    observeCurrentSections();
    mutationObserver?.observe(document.body, { childList: true, subtree: true });

    updateActiveSection();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("hashchange", scheduleUpdate);

    return () => {
      sectionObserver?.disconnect();
      sectionResizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("hashchange", scheduleUpdate);
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [bannerHeight, bannerVisible]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  useEffect(() => {
    if (!mobileMenuOpen) return;

    firstMobileLinkRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const handleNavClick = (href: string) => {
    setActiveSection(href);
    setMobileMenuOpen(false);
    scrollToSection(href);
  };

  const navTop = Math.max(0, bannerHeight);
  const mainLinks = NAV_LINKS.filter((link) => !link.isContact);
  const contactLink = NAV_LINKS.find((link) => link.isContact);

  return (
    <header
      ref={headerRef}
      style={{ top: `${navTop}px` }}
      className={cn(
        "fixed left-0 right-0 z-40 transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b border-white/5 py-3 shadow-lg"
          : "bg-transparent py-5",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between" aria-label="Navegacion principal">
          <button
            type="button"
            className="flex items-center gap-2 group"
            onClick={() => handleNavClick("inicio")}
          >
            <span className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(217,119,6,0.3)] group-hover:shadow-[0_0_25px_rgba(217,119,6,0.6)] transition-all">
              <Beer className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
            </span>
            <span className="font-display font-bold text-2xl tracking-wide text-white">
              Lupulados
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-6">
            {mainLinks.map((link) => {
              const isActive = activeSection === link.href;
              return (
              <button
                key={link.name}
                type="button"
                onClick={() => handleNavClick(link.href)}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "text-sm font-medium transition-colors relative group whitespace-nowrap",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-primary",
                )}
              >
                {link.name}
                <span
                  className={cn(
                    "absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300",
                    isActive ? "w-full" : "w-0 group-hover:w-full",
                  )}
                />
              </button>
              );
            })}
            {contactLink && (
              <button
                type="button"
                onClick={() => handleNavClick(contactLink.href)}
                aria-current={activeSection === contactLink.href ? "location" : undefined}
                className={cn(
                  "px-5 py-2.5 rounded-full border text-sm font-semibold transition-all",
                  activeSection === contactLink.href
                    ? "bg-primary text-black border-primary shadow-[0_0_18px_rgba(217,119,6,0.25)]"
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-white hover:border-primary/50",
                )}
              >
                {contactLink.name}
              </button>
            )}
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            className="lg:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="menu-mobile"
            aria-haspopup="menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="menu-mobile"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full left-0 w-full bg-background/98 backdrop-blur-xl border-b border-white/10 shadow-2xl"
            role="menu"
            aria-label="Navegacion mobile"
          >
            <div className="flex flex-col p-4 gap-2 max-h-[80vh] overflow-y-auto">
              {mainLinks.map((link, index) => {
                const isActive = activeSection === link.href;
                return (
                <button
                  key={link.name}
                  ref={index === 0 ? firstMobileLinkRef : undefined}
                  type="button"
                  role="menuitem"
                  onClick={() => handleNavClick(link.href)}
                  aria-current={isActive ? "location" : undefined}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-lg font-medium border-l-2",
                    isActive
                      ? "text-primary bg-white/5 border-primary"
                      : "text-muted-foreground border-transparent hover:text-primary",
                  )}
                >
                  {link.name}
                </button>
                );
              })}
              {contactLink && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNavClick(contactLink.href)}
                  aria-current={activeSection === contactLink.href ? "location" : undefined}
                  className={cn(
                    "w-full mt-2 px-4 py-3 rounded-lg font-bold text-center border",
                    activeSection === contactLink.href
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white/5 text-white border-white/10",
                  )}
                >
                  {contactLink.name}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
