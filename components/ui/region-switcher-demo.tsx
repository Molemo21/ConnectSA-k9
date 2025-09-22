"use client"

import { RegionSwitcher } from "./region-switcher"

export function RegionSwitcherDemo() {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Region Switcher Component Demo</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Default Usage</h2>
          <div className="flex items-center gap-4">
            <RegionSwitcher 
              onRegionChange={(region) => {
                console.log('Region changed to:', region)
              }}
            />
            <p className="text-gray-600">Click the region switcher above to see it in action!</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">In Dark Context (Navbar Style)</h2>
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="flex items-center gap-4">
              <RegionSwitcher 
                onRegionChange={(region) => {
                  console.log('Region changed to:', region)
                }}
              />
              <p className="text-gray-300">This shows how it looks in a dark navbar context.</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Responsive Behavior</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Mobile (&lt; 640px)</h3>
              <div className="flex items-center gap-2">
                <div className="text-lg">🇿🇦</div>
                <div className="text-lg">🌐</div>
                <span className="text-sm text-gray-600">Flag + Globe only</span>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Desktop (≥ 640px)</h3>
              <div className="flex items-center gap-2">
                <div className="text-lg">🇿🇦</div>
                <div className="text-sm font-medium">ZAR</div>
                <div className="text-lg">🌐</div>
                <span className="text-sm text-gray-600">Flag + Currency + Globe</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          <ul className="space-y-2 text-gray-700">
            <li>✅ Responsive design (flag only on mobile, flag + currency on desktop)</li>
            <li>✅ Modern shadcn/ui DropdownMenu component</li>
            <li>✅ Clean, rounded corners and subtle shadows</li>
            <li>✅ Hover states and smooth transitions</li>
            <li>✅ Keyboard accessible</li>
            <li>✅ TypeScript support</li>
            <li>✅ Customizable via props</li>
            <li>✅ Default region: South Africa 🇿🇦</li>
            <li>✅ 4 regions included: ZA, US, GB, EU</li>
          </ul>
        </div>
      </div>
    </div>
  )
}