'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface BusinessImage {
  id: string
  image_url: string
  caption: string | null
}

interface Props {
  images: BusinessImage[]
  businessName: string
}

export default function ImageGallery({ images, businessName }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (images.length === 0) return null

  const handlePrevious = () => {
    if (selectedIndex === null) return
    setSelectedIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1)
  }

  const handleNext = () => {
    if (selectedIndex === null) return
    setSelectedIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (selectedIndex === null) return
    if (e.key === 'ArrowLeft') handlePrevious()
    if (e.key === 'ArrowRight') handleNext()
    if (e.key === 'Escape') setSelectedIndex(null)
  }

  return (
    <>
      {/* Galería Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setSelectedIndex(index)}
            className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity group"
          >
            <Image
              src={image.image_url}
              alt={image.caption || `${businessName} - Imagen ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {image.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {image.caption}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Modal de imagen completa */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-5xl p-0 bg-black">
          <div className="relative w-full h-[80vh]">
            {selectedIndex !== null && (
              <>
                {/* Imagen */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={images[selectedIndex].image_url}
                    alt={images[selectedIndex].caption || `${businessName} - Imagen ${selectedIndex + 1}`}
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />
                </div>

                {/* Controles */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedIndex(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                >
                  <X className="w-6 h-6" />
                </Button>

                {/* Caption y contador */}
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  {images[selectedIndex].caption && (
                    <p className="text-white text-lg mb-2">{images[selectedIndex].caption}</p>
                  )}
                  <p className="text-white/70 text-sm">
                    {selectedIndex + 1} / {images.length}
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
