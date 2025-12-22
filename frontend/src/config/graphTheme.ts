export const GRAPH_THEME = {
  nodes: {
    colors: {
      Subject: '#ff9f1c', // Orange/Gold
      Section: '#2ec4b6', // Teal/Blue
      Topic: '#7c5cff',   // Purple
      Skill: '#e71d36',   // Red/Pink
      Default: '#7c5cff',
    },
    sizes: {
      Subject: 40,
      Section: 32,
      Topic: 24,
      Skill: 18,
      Default: 24,
    },
    font: {
      size: 14,
      color: '#ffffff',
      strokeWidth: 3,
      strokeColor: '#000000',
      vadjustRatio: 0.8, // Multiplier for size
    },
    shape: 'hexagon',
    borderWidth: 2,
  },
  edges: {
    width: 1,
    dashes: [2, 4],
    color: {
      color: 'rgba(255,255,255,0.4)',
      highlight: '#fff',
      opacity: 0.4,
    },
    arrows: {
      scaleFactor: 0.4,
    },
  },
  physics: {
    gravitationalConstant: -100,
    centralGravity: 0.005,
    springLength: 200,
    springConstant: 0.05,
    stabilizationIterations: 250,
  },
  tooltip: {
    background: 'rgba(20, 20, 30, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    offset: 20,
  }
} as const
