// Rainbow candy palette: pink, sky blue, sunny yellow, mint green.
// Full class names are spelled out so the Tailwind CDN can pick them up.
export interface CandyTone {
  border: string;      // resting border
  hoverBorder: string; // hover border
  hoverShadow: string; // card hover glow
  solid: string;       // solid badge / selected chip
  soft: string;        // pastel chip background
  softBorder: string;  // pastel chip border
  text: string;        // readable text on pastel / white
  hoverText: string;   // title hover text
  bar: string;         // left accent bar
}

export const CANDY_TONES: CandyTone[] = [
  {
    border: 'border-pink-300', hoverBorder: 'hover:border-pink-400', hoverShadow: 'hover:shadow-pink-400/40',
    solid: 'bg-pink-400 text-white', soft: 'bg-pink-100', softBorder: 'border-pink-300',
    text: 'text-pink-600', hoverText: 'group-hover:text-pink-500', bar: 'border-pink-400',
  },
  {
    border: 'border-sky-300', hoverBorder: 'hover:border-sky-400', hoverShadow: 'hover:shadow-sky-400/40',
    solid: 'bg-sky-400 text-white', soft: 'bg-sky-100', softBorder: 'border-sky-300',
    text: 'text-sky-600', hoverText: 'group-hover:text-sky-500', bar: 'border-sky-400',
  },
  {
    border: 'border-yellow-300', hoverBorder: 'hover:border-yellow-400', hoverShadow: 'hover:shadow-yellow-400/40',
    solid: 'bg-yellow-400 text-yellow-900', soft: 'bg-yellow-100', softBorder: 'border-yellow-300',
    text: 'text-yellow-700', hoverText: 'group-hover:text-yellow-600', bar: 'border-yellow-400',
  },
  {
    border: 'border-emerald-300', hoverBorder: 'hover:border-emerald-400', hoverShadow: 'hover:shadow-emerald-400/40',
    solid: 'bg-emerald-400 text-white', soft: 'bg-emerald-100', softBorder: 'border-emerald-300',
    text: 'text-emerald-600', hoverText: 'group-hover:text-emerald-500', bar: 'border-emerald-400',
  },
];

export const toneAt = (n: number): CandyTone => CANDY_TONES[Math.abs(n) % CANDY_TONES.length];
