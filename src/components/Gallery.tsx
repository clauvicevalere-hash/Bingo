"use client";

import { useState } from "react";

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const list = images.length ? images : ["/placeholder.svg"];
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="gallery-main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={list[active]} alt={name} />
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
