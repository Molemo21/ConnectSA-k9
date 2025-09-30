"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

type Language = 'en' | 'af' | 'zu' | 'xh'

const languages = [
  { id: 'en' as Language, name: 'English', flag: '🇺🇸' },
  { id: 'af' as Language, name: 'Afrikaans', flag: '🇿🇦' },
  { id: 'zu' as Language, name: 'Zulu', flag: '🇿🇦' },
  { id: 'xh' as Language, name: 'Xhosa', flag: '🇿🇦' },
]

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage()

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang)
  }

  const currentLanguage = languages.find(lang => lang.id === language) || languages[0]

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white border-0 focus:ring-2 focus:ring-white/20"
          >
            <span className="text-lg">{currentLanguage.flag}</span>
            <Globe className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-white border-0 shadow-lg rounded-xl p-2"
        >
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.id}
              onClick={() => handleLanguageSelect(lang.id)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-gray-50 focus:bg-gray-50 transition-colors"
            >
              <span className="text-xl">{lang.flag}</span>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-medium text-gray-900 text-sm">
                  {lang.name}
                </span>
              </div>
              {language === lang.id && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}