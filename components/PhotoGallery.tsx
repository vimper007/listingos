'use client'

import { useState } from 'react'

interface PhotoGalleryProps {
  photos: string[]
  address: string
}

export default function PhotoGallery({ photos, address }: PhotoGalleryProps) {
  const [current, setCurrent] = useState(0)

  return (
    <div className="relative w-full bg-gray-900">
      {/* Main photo */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[current]}
          alt={`${address} — photo ${current + 1}`}
          className="w-full h-full object-cover"
        />

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setCurrent((c) => (c - 1 + photos.length) % photos.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setCurrent((c) => (c + 1) % photos.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              ›
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
              {current + 1} / {photos.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto">
          {photos.map((photo, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-colors ${
                current === i ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
