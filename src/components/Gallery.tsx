"use client";

import Image from "next/image";
import { useState } from "react";

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const list = images.length ? images : ["/placeholder.svg"];
  const [active, setActive] = useState(0);
  const current = list[active];
  const svg = current.endsWith(".svg");

  return (
    <div>
      <div className="gallery-main" style={{ position: "relative" }}>
        {svg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt={name} />
        ) : (
          <Image
            src={current}
            alt={name}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 520px"
            style={{ objectFit: "contain", padding: 18 }}
          />
        )}
      </div>
      {list.length > 1 && (
        <div className="thumbs">
          {list.map((src, i) => (
            <button
              key={src + i}
              type="button"
              className={i === active ? "active" : ""}
              onClick={() => setActive(i)}
              aria-label={`Image ${i + 1}`}
            >
              {src.endsWith(".svg") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" />
              ) : (
                <Image src={src} alt="" width={66} height={66} style={{ objectFit: "contain" }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
