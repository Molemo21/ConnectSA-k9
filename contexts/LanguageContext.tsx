"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'en' | 'af' | 'zu' | 'xh'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation data - hero, services, and how it works sections
const translations = {
  en: {
    // Hero section translations
    'hero.title': 'Bringing trusted professionals to your doorstep',
    'hero.subtitle': 'Verified experts ready to help, while you relax at home.',
    'hero.getStarted': 'Get Started',
    'hero.bookService': 'Book a Service',
    'hero.becomeProvider': 'Become a Provider',
    'hero.trustBadge': '100% Verified Providers',
    
    // Services section translations
    'services.title': 'Our Services',
    'services.subtitle': 'Professional services delivered to your doorstep. Choose from our verified network of experts.',
    'services.bookNow': 'Book Now',
    'services.viewAllServices': 'View All Services',
    
    // How it works section translations
    'howItWorks.title': 'How It Works',
    'howItWorks.subtitle': 'Three simple steps to connect with verified professionals and get your tasks done',
    'howItWorks.step1.title': 'Browse & Discover',
    'howItWorks.step1.description': 'Explore our curated selection of verified professionals and services tailored to your specific needs and location.',
    'howItWorks.step2.title': 'Connect & Chat',
    'howItWorks.step2.description': 'Message providers directly, discuss your requirements, and receive instant quotes for your project.',
    'howItWorks.step3.title': 'Book & Relax',
    'howItWorks.step3.description': 'Secure your booking with our escrow payment system and let us handle the rest while you relax.',
    
    // Why Choose Us section translations
    'whyChooseUs.title': 'Why People Trust Our Platform',
    'whyChooseUs.subtitle': 'Join thousands of satisfied customers who rely on our platform for their service needs.',
    'whyChooseUs.saveTime.title': 'Save Time',
    'whyChooseUs.saveTime.description': 'We make finding reliable services effortless, saving you hours of research and phone calls.',
    'whyChooseUs.guaranteedQuality.title': 'Guaranteed Quality',
    'whyChooseUs.guaranteedQuality.description': 'Avoid scams and poor service with our vetted professionals and quality guarantee.',
    'whyChooseUs.dedicatedSupport.title': 'Dedicated Support',
    'whyChooseUs.dedicatedSupport.description': 'Our customer service team is always ready to help with any questions or issues.',
    'whyChooseUs.realReviews.title': 'Real Reviews',
    'whyChooseUs.realReviews.description': 'Make informed decisions based on authentic reviews from real users.',
    
    // Navigation bar translations
    'nav.services': 'Services',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.signIn': 'Sign In',
    'nav.dashboard': 'Dashboard',
  },
  af: {
    // Afrikaans translations
    'hero.title': 'Bringe vertroude professionele persone na jou deur',
    'hero.subtitle': 'Geverifieerde kenners gereed om te help, terwyl jy tuis ontspan.',
    'hero.getStarted': 'Begin Nou',
    'hero.bookService': 'Boek \'n Diens',
    'hero.becomeProvider': 'Word \'n Verskaffer',
    'hero.trustBadge': '100% Geverifieerde Verskaffers',
    
    // Services section translations
    'services.title': 'Ons Dienste',
    'services.subtitle': 'Professionele dienste gelewer aan jou deur. Kies uit ons geverifieerde netwerk van kenners.',
    'services.bookNow': 'Boek Nou',
    'services.viewAllServices': 'Bekyk Alle Dienste',
    
    // How it works section translations
    'howItWorks.title': 'Hoe Dit Werk',
    'howItWorks.subtitle': 'Drie eenvoudige stappe om met geverifieerde professionele persone te verbind en jou take gedoen te kry',
    'howItWorks.step1.title': 'Blaai & Ontdek',
    'howItWorks.step1.description': 'Verken ons gekuratieerde keuse van geverifieerde professionele persone en dienste wat toegespits is op jou spesifieke behoeftes en ligging.',
    'howItWorks.step2.title': 'Verbind & Klets',
    'howItWorks.step2.description': 'Stuur verskaffers direk boodskappe, bespreek jou vereistes, en ontvang onmiddellike kwotasies vir jou projek.',
    'howItWorks.step3.title': 'Boek & Ontspan',
    'howItWorks.step3.description': 'Beveilig jou bespreking met ons escrow betalingsisteem en laat ons die res hanteer terwyl jy ontspan.',
    
    // Why Choose Us section translations
    'whyChooseUs.title': 'Waarom Mense Ons Platform Vertrou',
    'whyChooseUs.subtitle': 'Sluit aan by duisende tevrede kliënte wat op ons platform staatmaak vir hul diensbehoeftes.',
    'whyChooseUs.saveTime.title': 'Spaar Tyd',
    'whyChooseUs.saveTime.description': 'Ons maak die vind van betroubare dienste moeiteloos, wat jou ure van navorsing en telefoonoproepe bespaar.',
    'whyChooseUs.guaranteedQuality.title': 'Gewaarborgde Kwaliteit',
    'whyChooseUs.guaranteedQuality.description': 'Vermy bedrog en swak diens met ons gekeurde professionele persone en kwaliteitswaarborg.',
    'whyChooseUs.dedicatedSupport.title': 'Toegewyde Ondersteuning',
    'whyChooseUs.dedicatedSupport.description': 'Ons kliëntedienspan is altyd gereed om te help met enige vrae of probleme.',
    'whyChooseUs.realReviews.title': 'Regte Resensies',
    'whyChooseUs.realReviews.description': 'Maak ingeligte besluite gebaseer op outentieke resensies van regte gebruikers.',
    
    // Navigation bar translations
    'nav.services': 'Dienste',
    'nav.about': 'Oor Ons',
    'nav.contact': 'Kontak',
    'nav.signIn': 'Teken In',
    'nav.dashboard': 'Dashboard',
  },
  zu: {
    // Zulu translations
    'hero.title': 'Siletha ochwepheshe abathembekile emnyango wakho',
    'hero.subtitle': 'Ochwepheshe abaqinisekisiwe balungele ukusiza, ngenkathi wena ukhululeka ekhaya.',
    'hero.getStarted': 'Qala Manje',
    'hero.bookService': 'Bhukha Inkonzo',
    'hero.becomeProvider': 'Yiba Umnikeli',
    'hero.trustBadge': '100% Abanikeli Abaqinisekisiwe',
    
    // Services section translations
    'services.title': 'Izinkonzo Zethu',
    'services.subtitle': 'Izinkonzo zobuchwepheshe ezilethwa emnyango wakho. Khetha kwinethiwekhi yethu eqinisekisiwe yochwepheshe.',
    'services.bookNow': 'Bhukha Manje',
    'services.viewAllServices': 'Buka Zonke Izinkonzo',
    
    // How it works section translations
    'howItWorks.title': 'Kusebenza Kanjani',
    'howItWorks.subtitle': 'Izinyathelo ezintathu ezilula ukuxhumana nochwepheshe abaqinisekisiwe nokwenza imisebenzi yakho',
    'howItWorks.step1.title': 'Hlola & Thola',
    'howItWorks.step1.description': 'Hlola ukukhetha kwethu okuhleliwe kochwepheshe abaqinisekisiwe nezinkonzo ezihleliwe ezidingweni zakho ezithile nendawo.',
    'howItWorks.step2.title': 'Xhuma & Khuluma',
    'howItWorks.step2.description': 'Thumela abanikeli ngqo imiyalezo, xoxa ngezidingo zakho, futhi thola izilinganiso ezisheshayo zephrojekthi yakho.',
    'howItWorks.step3.title': 'Bhukha & Khululeka',
    'howItWorks.step3.description': 'Vikela ukubhuka kwakho ngesistimu yethu yokukhokha ye-escrow futhi sivumele thina sikwazi ukubhekana nokunye ngenkathi wena ukhululeka.',
    
    // Why Choose Us section translations
    'whyChooseUs.title': 'Kungani Abantu Bathemba Isikhwama Sethu',
    'whyChooseUs.subtitle': 'Joyina izinkulungwane zamakhasimende athokozileyo athembele isikhwama sethu ngezidingo zezinkonzo zawo.',
    'whyChooseUs.saveTime.title': 'Gcina Isikhathi',
    'whyChooseUs.saveTime.description': 'Senza ukuthola izinkonzo ezinokwethenjelwa kube lula, sikugcine amahora ocwaningo nokushayela izingcingo.',
    'whyChooseUs.guaranteedQuality.title': 'Ikhwalithi Eqinisekisiwe',
    'whyChooseUs.guaranteedQuality.description': 'Gwema amakhohliso nezinkonzo ezingalungile ngabachwepheshe bethu abahlolwe nesiqinisekiso sekhwalithi.',
    'whyChooseUs.dedicatedSupport.title': 'Ukusekelwa Okuzinikele',
    'whyChooseUs.dedicatedSupport.description': 'Iqembu lethu lezinkonzo zamakhasimende lihlale lilungele ukusiza nganoma yimiphi imibuzo noma izinkinga.',
    'whyChooseUs.realReviews.title': 'Ukubuyekeza Kwangempela',
    'whyChooseUs.realReviews.description': 'Thatha izinqumo ezinolwazi ngokusekelwe ekubuyekezweni kwangempela kwabasebenzisi bangempela.',
    
    // Navigation bar translations
    'nav.services': 'Izinkonzo',
    'nav.about': 'Mayelana Nathi',
    'nav.contact': 'Thintana',
    'nav.signIn': 'Ngena',
    'nav.dashboard': 'I-Dashboard',
  },
  xh: {
    // Xhosa translations
    'hero.title': 'Sizisa iingcali ezinokuthenjelwa emnyango wakho',
    'hero.subtitle': 'Iingcali eziqinisekisiweyo zilungele ukunceda, ngelixa wena ukhululeka ekhaya.',
    'hero.getStarted': 'Qala Ngoku',
    'hero.bookService': 'Bhukha Inkonzo',
    'hero.becomeProvider': 'Yiba Umnikeli',
    'hero.trustBadge': '100% Abanikeli Abaqinisekisiweyo',
    
    // Services section translations
    'services.title': 'Iinkonzo Zethu',
    'services.subtitle': 'Iinkonzo zobuchwepheshe ezithunyelwa emnyango wakho. Khetha kwinkqubo yethu eqinisekisiweyo yochwepheshe.',
    'services.bookNow': 'Bhukha Ngoku',
    'services.viewAllServices': 'Jonga Zonke Iinkonzo',
    
    // How it works section translations
    'howItWorks.title': 'Kusebenza Njani',
    'howItWorks.subtitle': 'Iinyathelo ezintathu ezilula ukudibanisa nochwepheshe abaqinisekisiweyo nokwenza imisebenzi yakho',
    'howItWorks.step1.title': 'Jonga & Fumana',
    'howItWorks.step1.description': 'Jonga ukukhetha kwethu okuhleliwe kochwepheshe abaqinisekisiweyo neeinkonzo ezihleliwe kwimfuno yakho ethile nendawo.',
    'howItWorks.step2.title': 'Dibanisa & Thetha',
    'howItWorks.step2.description': 'Thumela abanikeli ngqo iimiyalezo, thetha ngeemfuno zakho, kwaye fumana izilinganiso ezisheshayo zeprojekthi yakho.',
    'howItWorks.step3.title': 'Bhukha & Khululeka',
    'howItWorks.step3.description': 'Khusela ukubhuka kwakho ngesistimu yethu yokuhlawula ye-escrow kwaye sivumele thina sikwazi ukujongana nokunye ngelixa wena ukhululeka.',
    
    // Why Choose Us section translations
    'whyChooseUs.title': 'Kutheni Abantu Bathemba Inkqubo Yethu',
    'whyChooseUs.subtitle': 'Joyina iinkulungwane zamakhasimende athokozileyo athembele inkqubo yethu ngeemfuno zeenkonzo zawo.',
    'whyChooseUs.saveTime.title': 'Gcina Ixesha',
    'whyChooseUs.saveTime.description': 'Senza ukufumana iinkonzo ezinokuthenjelwa kube lula, sikugcine iiyure zophando nokushayela iingcingo.',
    'whyChooseUs.guaranteedQuality.title': 'Ikhwalithi Eqinisekisiweyo',
    'whyChooseUs.guaranteedQuality.description': 'Gqiba amakhohliso neenkonzo ezingalunganga ngabachwepheshe bethu abahlolweyo nesiqinisekiso sekhwalithi.',
    'whyChooseUs.dedicatedSupport.title': 'Inkxaso Enikezelweyo',
    'whyChooseUs.dedicatedSupport.description': 'Iqela lethu leenkonzo zamakhasimende lihlale lilungele ukunceda nganoma yeyiphi imibuzo okanye iingxaki.',
    'whyChooseUs.realReviews.title': 'Ukubuyekeza Kwangempela',
    'whyChooseUs.realReviews.description': 'Yenza izigqibo ezinolwazi ngokusekelwe ekubuyekezweni kwangempela kwabasebenzisi bangempela.',
    
    // Navigation bar translations
    'nav.services': 'Iinkonzo',
    'nav.about': 'Malunga Nathi',
    'nav.contact': 'Dibanisa',
    'nav.signIn': 'Ngena',
    'nav.dashboard': 'I-Dashboard',
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')

  // Load saved language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && ['en', 'af', 'zu', 'xh'].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    }
  }, [])

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
