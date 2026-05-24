import { useState } from "react";
import { GALLERY } from "../data";
import { X } from "lucide-react";

export default function Gallery() {
  const [open, setOpen] = useState(null);
  return (
    <>
      <section className="pt-40 pb-12 section-pad bg-white" data-testid="gallery-hero">
        <div className="container-x">
          <div className="overline text-[var(--gold-deep)]">Triad Experience</div>
          <h1 className="font-display text-5xl md:text-7xl mt-6 leading-[0.95]">The buildings, <em className="text-[var(--gold-deep)]">the moments.</em></h1>
          <p className="text-lg mt-6 max-w-2xl text-[var(--ink-2)]">A visual journal — site visits, handovers, launches, and the corners of the UAE we've grown to love.</p>
        </div>
      </section>

      <section className="px-2 md:px-6 pb-24" data-testid="gallery-grid">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {GALLERY.map((src, i) => (
            <div
              key={i}
              onClick={() => setOpen(src)}
              className={`img-zoom cursor-pointer ${i % 5 === 0 ? "row-span-2 aspect-[3/4]" : i % 7 === 3 ? "col-span-2 aspect-[3/2]" : "aspect-square"}`}
              data-testid={`gallery-item-${i}`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <button onClick={() => setOpen(null)} className="absolute top-6 right-6 text-white"><X /></button>
          <img src={open} alt="" className="max-h-[90vh] max-w-[95vw]" />
        </div>
      )}
    </>
  );
}
