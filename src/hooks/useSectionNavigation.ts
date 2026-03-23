import { useEffect, useCallback } from "react";

const SECTION_IDS = [
  "home",
  "impact-stats", 
  "causes",
  "fundraisers",
  "how-it-works",
  "success-stories",
  "cta",
  "footer"
];

const useSectionNavigation = () => {
  const getCurrentSectionIndex = useCallback(() => {
    const scrollPosition = window.scrollY + window.innerHeight / 3;
    
    for (let i = SECTION_IDS.length - 1; i >= 0; i--) {
      const section = document.getElementById(SECTION_IDS[i]);
      if (section && section.offsetTop <= scrollPosition) {
        return i;
      }
    }
    return 0;
  }, []);

  const scrollToSection = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, SECTION_IDS.length - 1));
    const section = document.getElementById(SECTION_IDS[clampedIndex]);
    
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only handle arrow keys when not in an input/textarea
    const target = event.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }

    const currentIndex = getCurrentSectionIndex();

    if (event.key === "ArrowDown" || event.key === "PageDown") {
      event.preventDefault();
      scrollToSection(currentIndex + 1);
    } else if (event.key === "ArrowUp" || event.key === "PageUp") {
      event.preventDefault();
      scrollToSection(currentIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      scrollToSection(0);
    } else if (event.key === "End") {
      event.preventDefault();
      scrollToSection(SECTION_IDS.length - 1);
    }
  }, [getCurrentSectionIndex, scrollToSection]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { scrollToSection, getCurrentSectionIndex, sectionIds: SECTION_IDS };
};

export default useSectionNavigation;
