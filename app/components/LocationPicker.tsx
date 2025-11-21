'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface LocationPickerProps {
  onLocationSelect?: (lat: number, lng: number) => void
  initialLat?: number
  initialLng?: number
}

export default function LocationPicker({
  onLocationSelect,
  initialLat,
  initialLng,
}: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [lat, setLat] = useState(initialLat && initialLng ? initialLat : 24.7136)
  const [lng, setLng] = useState(initialLat && initialLng ? initialLng : 46.6753)

  // Memoize callback to satisfy exhaustive-deps
  const handleLocationSelect = useCallback(
    (newLat: number, newLng: number) => {
      if (onLocationSelect) {
        onLocationSelect(newLat, newLng)
      }
    },
    [onLocationSelect]
  )

  useEffect(() => {
    if (!mapContainer.current) return

    // Dynamically load Leaflet libraries
    const loadLeaflet = async () => {
      // Load CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
      document.head.appendChild(link)

      // Load JS
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
      script.async = true
      script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const L = (window as any).L
        if (!L) return

        const mapInstance = L.map(mapContainer.current).setView([lat, lng], 13)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }).addTo(mapInstance)

        // Add marker
        const marker = L.marker([lat, lng]).addTo(mapInstance)
        marker.bindPopup('موقعك الحالي')

        // Handle map clicks
        mapInstance.on('click', (e: { latlng: { lat: number; lng: number } }) => {
          const newLat = e.latlng.lat
          const newLng = e.latlng.lng
          setLat(newLat)
          setLng(newLng)

          marker.setLatLng([newLat, newLng])
          marker.setPopupContent(`الإحداثيات: ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`)
          marker.openPopup()

          handleLocationSelect(newLat, newLng)
        })
      }
      document.body.appendChild(script)
    }

    loadLeaflet()
  }, [lat, lng, handleLocationSelect])

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">موقعك على الخريطة</label>
      <div
        ref={mapContainer}
        className="w-full h-64 rounded-lg border border-gray-300 shadow-sm"
        id="map"
      />
      <p className="text-xs text-gray-500 mt-2">اضغط على الخريطة لتحديد موقعك. الإحداثيات الحالية: {lat.toFixed(4)}, {lng.toFixed(4)}</p>
      
      {/* Hidden inputs to store lat/lng */}
      <input type="hidden" name="latitude" value={lat} />
      <input type="hidden" name="longitude" value={lng} />
    </div>
  )
}
