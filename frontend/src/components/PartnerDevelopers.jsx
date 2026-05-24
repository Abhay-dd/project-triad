import React from 'react';

const DEVELOPERS = [
  { name: "Emaar", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fd/Emaar_logo.svg" },
  { name: "Nakheel", logo: "https://upload.wikimedia.org/wikipedia/commons/6/67/Nakheel_logo.svg" },
  { name: "DAMAC", logo: "https://upload.wikimedia.org/wikipedia/commons/1/11/Damac_logo.svg" },
  { name: "Sobha", logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/Sobha_logo.JPG" },
  { name: "Binghatti", logo: "https://upload.wikimedia.org/wikipedia/commons/d/dd/Binghatti-logo-dark.webp" },
];

export default function PartnerDevelopers() {
  return (
    <section className="section-pad bg-white border-b border-[var(--line)]" data-testid="partner-developers">
      <div className="container-x text-center mb-10">
        <div className="overline text-[var(--gold-deep)]">Partner Developers</div>
      </div>
      <div className="overflow-hidden whitespace-nowrap relative w-full flex items-center">
        <div className="marquee-track flex items-center gap-16 md:gap-32">
          {/* Double the list for seamless looping */}
          {[...DEVELOPERS, ...DEVELOPERS, ...DEVELOPERS].map((dev, idx) => (
            <div key={idx} className="flex-shrink-0 flex items-center justify-center opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <img src={dev.logo} alt={dev.name} className="h-10 md:h-16 object-contain max-w-[150px]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
