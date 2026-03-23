'use client'

interface PhotoGalleryProps {
  photos: string[]
  address: string
}

export default function PhotoGallery({ photos, address }: PhotoGalleryProps) {
  if (photos.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-3">
      {photos.map((photo, i) => (
        <div
          key={i}
          style={{
            borderRadius: 12,
            overflow: 'hidden',
            aspectRatio: '4/3',
            transition: 'filter 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.filter = 'brightness(1.05)'
            el.style.transform = 'scale(1.01)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.filter = 'brightness(1)'
            el.style.transform = 'scale(1)'
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt={`${address} — photo ${i + 2}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      ))}
    </div>
  )
}
