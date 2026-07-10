'use client';

import { useEffect, useState } from 'react';

export interface HowItWorksSection {
  id: string;
  label: string;
}

export default function HowItWorksNav({ sections }: { sections: HowItWorksSection[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <>
      {/* Mobile: sticky horizontal pill nav */}
      <nav
        aria-label="How It Works sections"
        className="sticky top-[64px] z-30 -mx-6 mb-8 min-w-0 overflow-x-auto border-b border-sand-line bg-cream/95 px-6 py-3 backdrop-blur md:hidden"
      >
        <ul className="flex gap-2 whitespace-nowrap">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={`inline-block rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  active === section.id ? 'bg-teal text-white' : 'bg-sand/50 text-ink-soft hover:bg-sand'
                }`}
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Desktop: sticky side nav */}
      <aside className="sticky top-24 hidden min-w-0 self-start md:block">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-soft">On this page</p>
        <ul className="flex flex-col gap-1 border-l border-sand-line pl-4">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={`block rounded-r-md py-1.5 pl-3 text-[14.5px] font-semibold transition-colors ${
                  active === section.id
                    ? '-ml-4 border-l-2 border-teal bg-aqua/30 pl-[11px] text-teal-deep'
                    : 'text-ink-soft hover:text-teal-deep'
                }`}
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
