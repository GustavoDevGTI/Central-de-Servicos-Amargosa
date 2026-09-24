"use client";

import { useEffect, useState } from "react";

type ManualSection = {
  id: string;
  label: string;
};

export default function ManualSeiIndex({
  sections,
}: {
  sections: readonly ManualSection[];
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    let animationFrame = 0;

    const updateActiveSection = () => {
      const readingLine = Math.min(
        360,
        Math.max(160, window.innerHeight * 0.35),
      );
      let nextActiveId = sections[0]?.id ?? "";

      for (const section of sections) {
        const element = document.getElementById(section.id);

        if (element && element.getBoundingClientRect().top <= readingLine) {
          nextActiveId = section.id;
        }
      }

      const reachedPageEnd =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 8;

      if (reachedPageEnd) {
        nextActiveId = sections.at(-1)?.id ?? nextActiveId;
      }

      setActiveId((currentId) =>
        currentId === nextActiveId ? currentId : nextActiveId,
      );
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [sections]);

  return (
    <nav className="manual-sei-index" aria-label="Etapas do manual">
      <strong>Nesta página</strong>
      {sections.map((section) => {
        const isActive = activeId === section.id;

        return (
          <a
            key={section.id}
            className={isActive ? "is-active" : undefined}
            href={`#${section.id}`}
            aria-current={isActive ? "location" : undefined}
            onClick={() => setActiveId(section.id)}
          >
            {section.label}
          </a>
        );
      })}
    </nav>
  );
}
