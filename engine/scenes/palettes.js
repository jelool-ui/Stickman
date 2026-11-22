// Palettes des styles visuels.
export const PALETTES = {
  classic: { sky: '#f4f1ea', sky2: '#e9e2d0', ground: '#ded5c0', line: '#1b1b1f', soft: '#cfc5ae', a1: '#ff8a5b', a2: '#5b9bd5', a3: '#7cc68d', a4: '#f2c94c', window: '#cfe6f7', text: '#ffffff' },
  night: { dark: true, sky: '#161b2b', sky2: '#222a40', ground: '#2b3349', line: '#d9dcea', soft: '#3a4360', a1: '#ff7a59', a2: '#5d8fe0', a3: '#4fae74', a4: '#f2c94c', window: '#f5d76e', text: '#ffffff' },
  comic: { sky: '#ffe08a', sky2: '#ffd166', ground: '#7fd1ae', line: '#1b1b1f', soft: '#f6bd60', a1: '#ef476f', a2: '#118ab2', a3: '#06d6a0', a4: '#ffffff', window: '#bde0fe', text: '#ffffff' },
};
export const getPalette = (style) => PALETTES[style] || PALETTES.classic;
