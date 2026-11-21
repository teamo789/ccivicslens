/**
 * CivicLens - Seed Mock Data for Hackathon Demos
 * Member 1: Frontend Architecture & UI
 * Provides realistic civic complaints with AI Triage scores and realistic metadata.
 */

// Helper to generate SVG visual data URIs so the app works 100% offline with crisp visuals
function generateIssueSvg(title, bgGradient, iconType) {
  let iconSvg = '';
  if (iconType === 'road') {
    iconSvg = '<path d="M40 180 L160 20 L240 20 L360 180 Z" fill="#334155"/><path d="M195 40 L205 40 L202 80 L198 80 Z" fill="#fbbf24"/><path d="M196 110 L204 110 L201 160 L199 160 Z" fill="#fbbf24"/><ellipse cx="200" cy="140" rx="35" ry="12" fill="#0f172a"/><ellipse cx="180" cy="110" rx="20" ry="7" fill="#1e293b"/>';
  } else if (iconType === 'electric') {
    iconSvg = '<polygon points="210,20 160,110 200,110 180,180 250,90 205,90" fill="#facc15" stroke="#ca8a04" stroke-width="3"/><path d="M100 160 Q 200 130 300 170" stroke="#ef4444" stroke-width="4" fill="none" stroke-dasharray="8,4"/>';
  } else if (iconType === 'water') {
    iconSvg = '<path d="M200 30 C 200 30 140 110 140 150 C 140 183 167 210 200 210 C 233 210 260 183 260 150 C 260 110 200 30 200 30 Z" fill="#38bdf8"/><ellipse cx="200" cy="160" rx="40" ry="20" fill="#0284c7" opacity="0.6"/><path d="M80 180 Q 200 160 320 180 Q 200 200 80 180 Z" fill="#0ea5e9" opacity="0.4"/>';
  } else if (iconType === 'waste') {
    iconSvg = '<rect x="140" y="70" width="120" height="120" rx="10" fill="#64748b"/><polygon points="120,70 280,70 270,50 130,50" fill="#475569"/><rect x="165" y="90" width="10" height="80" rx="5" fill="#94a3b8"/><rect x="195" y="90" width="10" height="80" rx="5" fill="#94a3b8"/><rect x="225" y="90" width="10" height="80" rx="5" fill="#94a3b8"/><path d="M120 180 C 120 150 170 140 200 160 C 230 140 280 150 280 180 Z" fill="#15803d" opacity="0.8"/>';
  } else if (iconType === 'safety') {
    iconSvg = '<path d="M200 30 L 290 185 L 110 185 Z" fill="#f59e0b" stroke="#b45309" stroke-width="6"/><rect x="193" y="85" width="14" height="50" rx="5" fill="#1e293b"/><circle cx="200" cy="158" r="8" fill="#1e293b"/>';
  } else {
    iconSvg = '<path d="M200 40 L220 90 L270 90 L230 120 L250 170 L200 140 L150 170 L170 120 L130 90 L180 90 Z" fill="#10b981"/>';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220" width="100%" height="100%">
    <defs>
      <linearGradient id="g_${iconType}" x1="0%" y1="0%" x2="100%" y2="100%">
        ${bgGradient}
      </linearGradient>
    </defs>
    <rect width="400" height="220" fill="url(#g_${iconType})"/>
    <g transform="translate(0, 0)">${iconSvg}</g>
    <rect x="0" y="175" width="400" height="45" fill="rgba(15, 23, 42, 0.7)"/>
    <text x="15" y="202" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto" font-size="13" font-weight="600" fill="#f8fafc">
      ${title}
    </text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const SEED_COMPLAINTS = [
  {
    id: "CVL-2041",
    title: "Live Downed High-Voltage Wire Sparking Near School Walkway",
    description: "A tree branch fell on the 11kV overhead wire on Oak Avenue right opposite St. Jude Elementary. Cable is touching the wet pavement and actively sparking. High risk of electrocution for students.",
    category: "Electricity & Lighting",
    severity: "critical",
    status: "in_progress",
    location: "412 Oak Avenue, Ward 4 (Near Gate B)",
    coordinates: { lat: 37.7749, lng: -122.4194 },
    photo: generateIssueSvg("Downed High-Voltage Cable", '<stop offset="0%" stop-color="#450a0a"/><stop offset="100%" stop-color="#7f1d1d"/>', "electric"),
    aiTriage: {
      score: 98,
      urgencyRationale: "Direct life-safety hazard. High-voltage line sparking near active school zone during morning drop-off hours.",
      department: "Municipal Power & Emergency Safety Grid",
      duplicateRisk: "Low (First report)",
      visionTags: ["Sparking Cable", "Wet Pavement", "Public Walkway", "Electrical Hazard"],
      estimatedResolutionHours: 2
    },
    citizen: {
      name: "Marcus Vance",
      phone: "+1 (555) 382-9014",
      isAnonymous: false
    },
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 mins ago
  },
  {
    id: "CVL-2040",
    title: "Dangerous 15cm Crater Pothole on Highway 9 Off-Ramp",
    description: "Deep pothole with exposed jagged rebar on the sharp curve of Exit 14. Already witnessed 2 vehicles suffer blown front tires within the last hour. Causing emergency braking.",
    category: "Roads & Infrastructure",
    severity: "critical",
    status: "triaged",
    location: "Hwy 9 Southbound, Exit 14 Off-Ramp, Ward 8",
    coordinates: { lat: 37.7692, lng: -122.4281 },
    photo: generateIssueSvg("Deep Crater Pothole with Rebar", '<stop offset="0%" stop-color="#1e293b"/><stop offset="100%" stop-color="#0f172a"/>', "road"),
    aiTriage: {
      score: 94,
      urgencyRationale: "High-speed traffic corridor with tire punctures and sudden deceleration creating multi-car collision risk.",
      department: "Department of Transportation - Rapid Asphalt Unit",
      duplicateRisk: "Medium (Similar report submitted 45m ago)",
      visionTags: ["Structural Asphalt Rupture", "Depth > 12cm", "Exposed Aggregate", "Highway Off-Ramp"],
      estimatedResolutionHours: 4
    },
    citizen: {
      name: "Anonymous Citizen",
      phone: "",
      isAnonymous: true
    },
    createdAt: new Date(Date.now() - 48 * 60 * 1000).toISOString() // 48 mins ago
  },
  {
    id: "CVL-2039",
    title: "Major Water Main Rupture Flooding Commercial Street",
    description: "Subterranean 12-inch water main burst near the intersection of Elm & 5th. Water pressure has cratered for three surrounding blocks and clean water is flooding into retail basements.",
    category: "Water Supply & Drainage",
    severity: "high",
    status: "in_progress",
    location: "Corner of Elm St & 5th Ave, Ward 2",
    coordinates: { lat: 37.7833, lng: -122.4167 },
    photo: generateIssueSvg("High Pressure Water Main Burst", '<stop offset="0%" stop-color="#082f49"/><stop offset="100%" stop-color="#0c4a6e"/>', "water"),
    aiTriage: {
      score: 87,
      urgencyRationale: "Flooding threatening property foundations, road erosion risk, and significant potable water loss.",
      department: "Municipal Water Board & Drainage Authority",
      duplicateRisk: "Low",
      visionTags: ["Pressurized Water Gusher", "Pavement Undermining", "Submersion"],
      estimatedResolutionHours: 6
    },
    citizen: {
      name: "Dr. Elena Rostova",
      phone: "+1 (555) 749-1123",
      isAnonymous: false
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  {
    id: "CVL-2038",
    title: "Biohazard Spill from Overturned Waste Compactor",
    description: "Commercial garbage bin overturned in the alleyway behind Market Square. Trash is scattered across 40 meters, attracting stray animals and blocking the fire exit lane.",
    category: "Sanitation & Waste",
    severity: "high",
    status: "submitted",
    location: "Alley 3 Behind Market Square Plaza, Ward 1",
    coordinates: { lat: 37.7785, lng: -122.4056 },
    photo: generateIssueSvg("Overflowing Dumpster & Spill", '<stop offset="0%" stop-color="#14532d"/><stop offset="100%" stop-color="#052e16"/>', "waste"),
    aiTriage: {
      score: 79,
      urgencyRationale: "Sanitary violation and obstruction of designated building emergency fire egress lane.",
      department: "Sanitation & Solid Waste Management",
      duplicateRisk: "Low",
      visionTags: ["Solid Waste Accumulation", "Blocked Fire Egress", "Biological Odor Alert"],
      estimatedResolutionHours: 8
    },
    citizen: {
      name: "Tariq Al-Mansoor",
      phone: "+1 (555) 881-4920",
      isAnonymous: false
    },
    createdAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString() // 3.5 hours ago
  },
  {
    id: "CVL-2037",
    title: "Traffic Signal Stuck on Continuous Red in All 4 Directions",
    description: "The automated signal controller at Grand & Lincoln is malfunctioning after the storm. All 4 sides showing red, causing gridlock backed up for 6 intersections.",
    category: "Public Safety & Hazards",
    severity: "high",
    status: "in_progress",
    location: "Intersection of Grand Ave & Lincoln Blvd, Ward 6",
    coordinates: { lat: 37.7612, lng: -122.4348 },
    photo: generateIssueSvg("Malfunctioning Intersection Signal", '<stop offset="0%" stop-color="#78350f"/><stop offset="100%" stop-color="#451a03"/>', "safety"),
    aiTriage: {
      score: 83,
      urgencyRationale: "Major arterial intersection paralysis and escalating driver agitation creating t-bone accident risk.",
      department: "Traffic Operations & Signals Unit",
      duplicateRisk: "Medium",
      visionTags: ["Signal Controller Failure", "Traffic Gridlock", "Four-way Conflict"],
      estimatedResolutionHours: 1.5
    },
    citizen: {
      name: "Carlos Mendez",
      phone: "+1 (555) 234-7711",
      isAnonymous: false
    },
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // 5 hours ago
  },
  {
    id: "CVL-2036",
    title: "Non-Functional Streetlight Cluster in Residential Park",
    description: "Five consecutive solar/LED streetlights are completely dead along the central jogging path in Centennial Park. Path is pitch dark after 6:30 PM.",
    category: "Electricity & Lighting",
    severity: "medium",
    status: "triaged",
    location: "Centennial Park East Trail, Ward 5",
    coordinates: { lat: 37.7554, lng: -122.4412 },
    photo: generateIssueSvg("Darkened Park Trail Lights", '<stop offset="0%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#0f172a"/>', "electric"),
    aiTriage: {
      score: 58,
      urgencyRationale: "Diminished evening public safety in recreational space, non-immediate vehicular impact.",
      department: "Parks & Urban Forestry Maintenance",
      duplicateRisk: "Low",
      visionTags: ["Unilluminated Luminaires", "Pedestrian Trail"],
      estimatedResolutionHours: 24
    },
    citizen: {
      name: "Sarah Jenkins",
      phone: "+1 (555) 910-3329",
      isAnonymous: false
    },
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString() // 14 hours ago
  },
  {
    id: "CVL-2035",
    title: "Broken Playground Swing Set Chain with Sharp Metal Edge",
    description: "Toddler swing chain snapped on one side and hangs down with rusted sharp links. Children playing nearby.",
    category: "Parks & Environment",
    severity: "medium",
    status: "resolved",
    location: "Meadowbrook Park Children's Zone, Ward 3",
    coordinates: { lat: 37.7681, lng: -122.4501 },
    photo: generateIssueSvg("Playground Equipment Damage", '<stop offset="0%" stop-color="#064e3b"/><stop offset="100%" stop-color="#022c22"/>', "other"),
    aiTriage: {
      score: 62,
      urgencyRationale: "Child injury hazard localized to play zone. Successfully replaced with rated hardware.",
      department: "Parks & Recreation Division",
      duplicateRisk: "Low",
      visionTags: ["Severed Chain", "Corrosion Alert", "Recreational Equipment"],
      estimatedResolutionHours: 12
    },
    citizen: {
      name: "Priya Nair",
      phone: "+1 (555) 412-8800",
      isAnonymous: false
    },
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString() // Yesterday
  },
  {
    id: "CVL-2034",
    title: "Stormwater Grate Clogged by Autumn Leaves & Yard Waste",
    description: "Street gutter grate is completely covered with compacted wet leaves. Water pooling 4 inches deep on the curb.",
    category: "Water Supply & Drainage",
    severity: "low",
    status: "resolved",
    location: "88 Willow Creek Way, Ward 7",
    coordinates: { lat: 37.7812, lng: -122.4632 },
    photo: generateIssueSvg("Clogged Gutter Drain", '<stop offset="0%" stop-color="#134e4a"/><stop offset="100%" stop-color="#042f2e"/>', "water"),
    aiTriage: {
      score: 34,
      urgencyRationale: "Nuisance ponding, slow drainage; no immediate structural breach or traffic hazard.",
      department: "Public Works Street Cleaning Crew",
      duplicateRisk: "Low",
      visionTags: ["Organic Debris", "Curb Pooling"],
      estimatedResolutionHours: 36
    },
    citizen: {
      name: "David Miller",
      phone: "+1 (555) 601-2918",
      isAnonymous: false
    },
    createdAt: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString()
  }
];

// Export to window so it is accessible across vanilla JS files
window.CivicMockData = {
  SEED_COMPLAINTS,
  generateIssueSvg
};
