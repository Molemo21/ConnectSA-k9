"use client"

import { useEffect } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Wrench, Zap, SprayCan, Paintbrush, Flower, Scissors, Sparkles, Calendar, Clock, MapPin, CheckCircle } from "lucide-react"
import dynamic from "next/dynamic"
const BookingSummary = dynamic(() => import("./summary"), { ssr: false })

const CATEGORIES = [
  {
    name: "Plumbing",
    icon: Wrench,
    services: ["Leak Fix", "Unclog Drain", "Pipe Installation", "Geyser Repair"]
  },
  {
    name: "Electrical",
    icon: Zap,
    services: ["Power Outage", "Install Light Fixture", "Wiring Issue", "Appliance Repair"]
  },
  {
    name: "Cleaning",
    icon: SprayCan,
    services: ["Home Cleaning", "Carpet Cleaning", "Window Cleaning"]
  },
  {
    name: "Painting",
    icon: Paintbrush,
    services: ["Wall Painting", "Ceiling Painting", "Fence Painting"]
  },
  {
    name: "Gardening",
    icon: Flower,
    services: ["Lawn Mowing", "Tree Trimming", "Garden Cleanup"]
  },
  {
    name: "Hair",
    icon: Scissors,
    services: ["Men's Cut", "Women's Cut", "Kids Cut", "Styling"]
  },
  {
    name: "Spa",
    icon: Sparkles,
    services: ["Massage", "Facial", "Manicure", "Pedicure"]
  },
];

const TIME_SLOTS = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
]

const STEPS = [
  { title: "Choose Service" },
  { title: "Photos (Optional)" },
  { title: "Select Date & Time" },
  { title: "Enter Address" },
  { title: "Summary" },
]

export default function BookServicePage() {
  // Force dark mode on mount
  useEffect(() => {
    document.documentElement.classList.add("dark")
    return () => document.documentElement.classList.remove("dark")
  }, [])

  const [step, setStep] = useState(0)
  const [category, setCategory] = useState("")
  const [service, setService] = useState("")
  const [description, setDescription] = useState("")
  const [photos, setPhotos] = useState<File[]>([])
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
  }
  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }
  const handleBook = async () => {
    setIsLoading(true);
    sessionStorage.setItem("bookingDetails", JSON.stringify({ service, date, time, address }));
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        router.push("/dashboard");
        return;
      } else {
        router.push("/login?intent=booking");
        return;
      }
    } catch {
      router.push("/login?intent=booking");
      return;
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="w-full min-h-screen bg-gray-900 py-12 dark">
      <div className="w-full flex justify-end max-w-6xl mx-auto px-4 mb-2">
        <Button
          type="button"
          variant="outline"
          className="px-6"
          onClick={() => window.location.href = '/'}
        >
          Homepage
        </Button>
      </div>
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center gap-10">
        {/* Left: Hero + Booking Flow */}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">Book Trusted Local Service Providers</h1>
          <p className="text-lg text-gray-300 mb-8">From home cleaning to repairs — get help at your doorstep.</p>

          {/* Stepper */}
          <div className="mb-8">
  <div className="flex items-center justify-between max-w-2xl mx-auto">
    {STEPS.map((s, i) => (
      <div key={s.title} className="flex items-center w-full">
        <div className="flex flex-col items-center z-10 w-full">
          <div className={`w-9 h-9 flex items-center justify-center rounded-full border-2 transition-all duration-300
            ${i < step ? "bg-blue-600 border-blue-600" : i === step ? "bg-gray-900 border-blue-600" : "bg-gray-800 border-gray-700"}`}
          >
            {i < step ? (
              <CheckCircle className="w-5 h-5 text-white" />
            ) : (
              <span className={`font-bold text-lg ${i === step ? "text-blue-400" : "text-gray-500"}`}>{i + 1}</span>
            )}
          </div>
          <span className={`text-xs mt-2 font-semibold text-center block w-24 truncate ${i === step ? "text-blue-400" : "text-gray-400"}`}>{s.title}</span>
        </div>
        {i < STEPS.length - 1 && (
          <div className={`flex-1 h-1 mx-1 rounded-full transition-all duration-300
            ${i < step ? "bg-blue-600" : "bg-gray-700"}`}></div>
        )}
      </div>
    ))}
  </div>
</div>

          {/* Step Forms */}
          <Card className="w-full max-w-2xl mx-auto p-6 rounded-xl shadow-lg bg-gray-800 border border-gray-700">
            <form>
              {/* Step 1: Service */}
              {step === 0 && (
  <div className="space-y-6 animate-fade-in">
    <label className="block font-medium text-gray-200 mb-2">Select a category</label>
    <div className="relative mb-4">
      <select
        className="w-full px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 bg-gray-900 text-white appearance-none pr-10"
        value={category}
        onChange={e => {
          setCategory(e.target.value);
          setService("");
        }}
        required
      >
        <option value="" disabled>Select...</option>
        {CATEGORIES.map(({ name }) => (
          <option
            key={name}
            value={name}
            disabled={!["Hair", "Spa"].includes(name)}
            style={!["Hair", "Spa"].includes(name) ? {} : { color: '#888' }}
          >
            {name}
          </option>
        ))}
      </select>
      <Wrench className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
    </div>
    {category && (
      <>
        <label className="block font-medium text-gray-200 mb-2">Select a service</label>
        <div className="relative mb-4">
          <select
            className="w-full px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 bg-gray-900 text-white appearance-none pr-10"
            value={service}
            onChange={e => setService(e.target.value)}
            required
          >
            <option value="" disabled>Select...</option>
            {CATEGORIES.find(c => c.name === category)?.services.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <label className="block font-medium text-gray-200 mb-2">Specify (describe the problem)</label>
        <textarea
          className="w-full px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 bg-gray-900 text-white"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe the problem in detail..."
          required
        />
      </>
    )}
  </div>
)}
              {/* Step 2: Date & Time */}
              {step === 1 && (
  <div className="space-y-6 animate-fade-in">
    <label className="block font-medium text-gray-200 mb-2">Upload photos (optional)</label>
    <input
      type="file"
      accept="image/*"
      multiple
      className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-white"
      onChange={e => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        setPhotos(files);
      }}
    />
    {photos.length > 0 && (
      <div className="flex flex-wrap gap-3 mt-2">
        {photos.map((file, idx) => (
          <img
            key={idx}
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="w-24 h-24 object-cover rounded border border-gray-700"
          />
        ))}
      </div>
    )}
  </div>
)}

{step === 2 && (
  <div className="space-y-6 animate-fade-in">
    <label className="block font-medium text-gray-200 mb-2">Choose a date</label>
    <div className="relative mb-4">
      <input
        type="date"
        className="w-full px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 bg-gray-900 text-white pr-10"
        value={date}
        onChange={e => setDate(e.target.value)}
        required
        min={new Date().toISOString().split("T")[0]}
      />
      <Calendar className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
    </div>
    <label className="block font-medium text-gray-200 mb-2">Pick a time</label>
    <div className="relative">
      <select
        className="w-full px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 bg-gray-900 text-white appearance-none pr-10"
        value={time}
        onChange={e => setTime(e.target.value)}
        required
      >
        <option value="" disabled>Select...</option>
        {TIME_SLOTS.map(slot => (
          <option key={slot} value={slot}>{slot}</option>
        ))}
      </select>
      <Clock className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
    </div>
  </div>
)}
              {/* Step 3: Address */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <label className="block font-medium text-gray-200 mb-2">Enter your address</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 bg-gray-900 text-white pr-10"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="e.g. 123 Main St, Suburb"
                      required
                    />
                    <MapPin className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              )}
              {/* Step 4: Confirm */}
              {step === 4 && (
  <BookingSummary
    booking={{ category, service, description, photos, date, time, address }}
    onBook={handleBook}
  />
)}

              {/* Step Buttons */}
              <div className="flex justify-between mt-8 gap-3">
                <Button type="button" variant="outline" onClick={handleBack} disabled={step === 0 || isLoading} className="px-6">
                  Back
                </Button>
                {step < 4 ? (
  <Button
    type="button"
    className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
    onClick={handleNext}
    disabled={isLoading ||
      (step === 0 && (!category || !service || !description)) ||
      (step === 2 && (!date || !time)) ||
      (step === 3 && !address)
    }
  >
    Next
  </Button>
) : null}
              </div>
            </form>
          </Card>
        </div>
        {/* Right: Illustration */}
        <div className="flex-1 flex items-center justify-center min-w-0 mt-12 md:mt-0">
          {/* Placeholder SVG illustration */}
          <div className="w-full max-w-md">
            <svg viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <rect x="10" y="60" width="300" height="200" rx="30" fill="#1e293b" />
              <rect x="60" y="120" width="200" height="80" rx="20" fill="#334155" />
              <circle cx="160" cy="160" r="40" fill="#3b82f6" />
              <rect x="145" y="140" width="30" height="40" rx="8" fill="#fff" />
              <rect x="135" y="185" width="50" height="10" rx="5" fill="#fff" />
            </svg>
            <div className="text-center mt-4 text-gray-500 text-sm">Your trusted local pros</div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Optional: Add fade-in animation
// Add to globals.css:
// .animate-fade-in { animation: fadeIn 0.4s; }
// @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
