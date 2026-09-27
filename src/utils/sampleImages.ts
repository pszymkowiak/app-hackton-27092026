/**
 * Generates realistic construction job site SVG images as Data URLs.
 * Perfect for instant preview, testing, and camera fallback.
 */

export function createSampleSlabImage(type: 'patio' | 'driveway' | 'foundation'): string {
  let svg = '';

  if (type === 'patio') {
    // 800x600 top-down view of 20x14 patio with 2x4 wooden formwork on gravel
    svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <defs>
        <radialGradient id="dirt" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#785942" />
          <stop offset="100%" stop-color="#543d2b" />
        </radialGradient>
        <pattern id="gravel" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="2.5" fill="#8c827a" />
          <circle cx="14" cy="7" r="3" fill="#a39b94" />
          <circle cx="9" cy="15" r="2" fill="#6e655e" />
          <circle cx="17" cy="16" r="2.2" fill="#544c46" />
        </pattern>
        <pattern id="wood" width="80" height="20" patternUnits="userSpaceOnUse">
          <rect width="80" height="20" fill="#c29b68" />
          <line x1="0" y1="5" x2="80" y2="5" stroke="#9e7b4b" stroke-width="1.5" />
          <line x1="0" y1="12" x2="80" y2="12" stroke="#b08a54" stroke-width="1" />
        </pattern>
      </defs>

      <!-- Soil background -->
      <rect width="800" height="600" fill="url(#dirt)" />

      <!-- Surrounding grass and dirt clods -->
      <rect x="0" y="0" width="800" height="60" fill="#3b4d28" opacity="0.8" />
      <rect x="0" y="540" width="800" height="60" fill="#3b4d28" opacity="0.8" />

      <!-- Excavated Slab Area with Gravel Base -->
      <polygon points="120,130 680,110 700,470 110,490" fill="#a89f91" />
      <polygon points="120,130 680,110 700,470 110,490" fill="url(#gravel)" opacity="0.65" />

      <!-- Vapor barrier poly sheet wrinkles -->
      <path d="M 140 180 Q 300 160 500 190 T 670 170" fill="none" stroke="#2b2b2b" stroke-width="2" opacity="0.4" />
      <path d="M 130 330 Q 380 350 680 320" fill="none" stroke="#2b2b2b" stroke-width="2" opacity="0.4" />

      <!-- Rebar grid (16 inch centers) -->
      <g stroke="#8B3A1A" stroke-width="3" opacity="0.85">
        <line x1="150" y1="160" x2="670" y2="140" />
        <line x1="145" y1="230" x2="675" y2="210" />
        <line x1="140" y1="300" x2="680" y2="280" />
        <line x1="135" y1="370" x2="685" y2="350" />
        <line x1="130" y1="440" x2="690" y2="420" />

        <line x1="200" y1="135" x2="190" y2="480" />
        <line x1="290" y1="130" x2="280" y2="475" />
        <line x1="380" y1="125" x2="370" y2="475" />
        <line x1="470" y1="120" x2="460" y2="470" />
        <line x1="560" y1="115" x2="550" y2="470" />
        <line x1="640" y1="112" x2="630" y2="468" />
      </g>

      <!-- 2x4 Wooden Formwork perimeter (The Target Polygon) -->
      <!-- Top Form -->
      <polygon points="105,120 695,100 690,118 115,138" fill="url(#wood)" stroke="#593e1e" stroke-width="1.5" />
      <!-- Right Form -->
      <polygon points="680,105 715,105 710,480 690,470" fill="url(#wood)" stroke="#593e1e" stroke-width="1.5" />
      <!-- Bottom Form -->
      <polygon points="100,505 715,485 700,465 110,485" fill="url(#wood)" stroke="#593e1e" stroke-width="1.5" />
      <!-- Left Form -->
      <polygon points="95,120 125,135 110,495 90,505" fill="url(#wood)" stroke="#593e1e" stroke-width="1.5" />

      <!-- Wooden stakes and 2x4 kickers -->
      <rect x="250" y="85" width="16" height="25" fill="#e0bc7b" stroke="#4a3114" />
      <rect x="450" y="80" width="16" height="25" fill="#e0bc7b" stroke="#4a3114" />
      <rect x="705" y="240" width="25" height="16" fill="#e0bc7b" stroke="#4a3114" />
      <rect x="700" y="380" width="25" height="16" fill="#e0bc7b" stroke="#4a3114" />
      <rect x="300" y="495" width="16" height="25" fill="#e0bc7b" stroke="#4a3114" />
      <rect x="520" y="485" width="16" height="25" fill="#e0bc7b" stroke="#4a3114" />
      <rect x="80" y="250" width="25" height="16" fill="#e0bc7b" stroke="#4a3114" />

      <!-- 10-ft Yellow Tape measure lying along top form for scale reference -->
      <line x1="200" y1="125" x2="480" y2="116" stroke="#facc15" stroke-width="6" stroke-linecap="round" />
      <circle cx="200" cy="125" r="4" fill="#1e293b" />
      <circle cx="480" cy="116" r="4" fill="#1e293b" />
      <text x="310" y="112" fill="#0f172a" font-weight="bold" font-size="11" font-family="sans-serif">10 FT TAPE</text>

      <!-- Badge watermark -->
      <rect x="20" y="20" width="220" height="34" rx="6" fill="#0f172a" opacity="0.85" />
      <text x="32" y="42" fill="#facc15" font-weight="bold" font-size="13" font-family="sans-serif">SITE PHOTO: PATIO FORMWORK</text>
    </svg>
    `;
  } else if (type === 'driveway') {
    // 800x600 top-down view of 40x18 driveway
    svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <defs>
        <pattern id="soil" width="30" height="30" patternUnits="userSpaceOnUse">
          <rect width="30" height="30" fill="#69513e" />
          <circle cx="5" cy="5" r="1.5" fill="#4d3a2b" />
          <circle cx="20" cy="18" r="2" fill="#80654e" />
        </pattern>
        <pattern id="base" width="15" height="15" patternUnits="userSpaceOnUse">
          <rect width="15" height="15" fill="#b0aba4" />
          <circle cx="7" cy="7" r="2" fill="#857e75" />
        </pattern>
      </defs>

      <rect width="800" height="600" fill="url(#soil)" />

      <!-- Driveway slab outline -->
      <polygon points="140,80 660,70 720,530 80,540" fill="url(#base)" stroke="#3e2d1c" stroke-width="4" />

      <!-- Rebar wire mesh grid -->
      <g stroke="#8c3e23" stroke-width="2.5" opacity="0.7">
        <line x1="130" y1="130" x2="670" y2="120" />
        <line x1="120" y1="200" x2="680" y2="190" />
        <line x1="110" y1="270" x2="690" y2="260" />
        <line x1="100" y1="340" x2="700" y2="330" />
        <line x1="90" y1="410" x2="710" y2="400" />
        <line x1="85" y1="480" x2="715" y2="470" />

        <line x1="220" y1="80" x2="190" y2="535" />
        <line x1="320" y1="78" x2="300" y2="535" />
        <line x1="420" y1="75" x2="410" y2="535" />
        <line x1="520" y1="73" x2="520" y2="532" />
        <line x1="610" y1="71" x2="630" y2="530" />
      </g>

      <!-- 2x6 Edge form boards -->
      <polygon points="135,68 665,58 660,78 140,88" fill="#d4a373" stroke="#5c3d1e" stroke-width="2" />
      <polygon points="655,68 675,68 735,535 715,535" fill="#d4a373" stroke="#5c3d1e" stroke-width="2" />
      <polygon points="70,550 730,540 720,520 80,530" fill="#d4a373" stroke="#5c3d1e" stroke-width="2" />
      <polygon points="140,78 120,78 68,542 88,542" fill="#d4a373" stroke="#5c3d1e" stroke-width="2" />

      <!-- Center expansion joint / keyway -->
      <line x1="100" y1="310" x2="700" y2="300" stroke="#1f2937" stroke-width="4" stroke-dasharray="8 4" />
      <text x="350" y="295" fill="#374151" font-size="12" font-weight="bold" font-family="sans-serif">KEYED BULKHEAD</text>

      <rect x="20" y="20" width="240" height="34" rx="6" fill="#0f172a" opacity="0.85" />
      <text x="32" y="42" fill="#facc15" font-weight="bold" font-size="13" font-family="sans-serif">SITE PHOTO: DRIVEWAY SLAB</text>
    </svg>
    `;
  } else {
    // 800x600 foundation slab
    svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <rect width="800" height="600" fill="#4a3728" />

      <!-- Foundation footprint -->
      <polygon points="160,110 640,110 660,490 140,490" fill="#9ca3af" stroke="#713f12" stroke-width="6" />

      <!-- Dense structural rebar mat -->
      <g stroke="#7c2d12" stroke-width="3" opacity="0.85">
        <line x1="155" y1="170" x2="645" y2="170" />
        <line x1="150" y1="230" x2="650" y2="230" />
        <line x1="148" y1="290" x2="652" y2="290" />
        <line x1="145" y1="350" x2="655" y2="350" />
        <line x1="142" y1="410" x2="658" y2="410" />
        <line x1="140" y1="470" x2="660" y2="470" />

        <line x1="220" y1="110" x2="210" y2="490" />
        <line x1="290" y1="110" x2="280" y2="490" />
        <line x1="360" y1="110" x2="355" y2="490" />
        <line x1="430" y1="110" x2="435" y2="490" />
        <line x1="500" y1="110" x2="510" y2="490" />
        <line x1="570" y1="110" x2="585" y2="490" />
      </g>

      <!-- Diagonal bracing kickers -->
      <line x1="120" y1="200" x2="150" y2="200" stroke="#f59e0b" stroke-width="5" />
      <line x1="110" y1="380" x2="140" y2="380" stroke="#f59e0b" stroke-width="5" />
      <line x1="670" y1="200" x2="640" y2="200" stroke="#f59e0b" stroke-width="5" />
      <line x1="680" y1="380" x2="650" y2="380" stroke="#f59e0b" stroke-width="5" />

      <rect x="20" y="20" width="250" height="34" rx="6" fill="#0f172a" opacity="0.85" />
      <text x="32" y="42" fill="#facc15" font-weight="bold" font-size="13" font-family="sans-serif">SITE PHOTO: FOUNDATION PAD</text>
    </svg>
    `;
  }

  // Convert SVG string to data URL
  const cleanSvg = svg.trim().replace(/\s+/g, ' ');
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
}
