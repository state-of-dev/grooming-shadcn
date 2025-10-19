'use client'

import { useState } from 'react'
import { Share2, Check, Facebook, Twitter, Link as LinkIcon, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface Props {
  url: string
  title: string
  description?: string
}

export default function ShareButton({ url, title, description }: Props) {
  const [copied, setCopied] = useState(false)

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url
  const encodedUrl = encodeURIComponent(fullUrl)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description || title)

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      toast.success('¡Enlace copiado!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Error al copiar el enlace')
    }
  }

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400')
  }

  // Web Share API para dispositivos móviles
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: fullUrl
        })
      } catch (error) {
        // Usuario canceló o error
      }
    }
  }

  // Verificar si Web Share API está disponible
  const hasNativeShare = typeof window !== 'undefined' && navigator.share

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Compartir
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {hasNativeShare && (
          <>
            <DropdownMenuItem onClick={handleNativeShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Compartir...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-500" />
              ¡Copiado!
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4 mr-2" />
              Copiar enlace
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
          <Send className="w-4 h-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleShare('facebook')}>
          <Facebook className="w-4 h-4 mr-2" />
          Facebook
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleShare('twitter')}>
          <Twitter className="w-4 h-4 mr-2" />
          Twitter
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleShare('telegram')}>
          <Send className="w-4 h-4 mr-2" />
          Telegram
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
