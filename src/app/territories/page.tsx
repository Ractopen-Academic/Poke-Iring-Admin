import { MapPin } from "lucide-react";

export default function TerritoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-100">Territories & Polygons</h1>
        <p className="text-xs text-neutral-400 mt-1">
          Monitor geofenced territory boundaries, dominant species claims, and ring control points.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-12 text-center">
        <MapPin className="mx-auto h-8 w-8 text-neutral-600" />
        <h3 className="mt-3 text-sm font-semibold text-neutral-200">Territory Inspection Module</h3>
        <p className="mt-1 text-xs text-neutral-400 max-w-md mx-auto">
          Connected to the mobile client territory system. Map visualization and polygon geometry editing can be integrated using Leaflet or Mapbox.
        </p>
      </div>
    </div>
  );
}
