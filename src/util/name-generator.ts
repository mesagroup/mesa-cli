const adjectives = [
  'cosmic', 'blazing', 'silent', 'crimson', 'swift', 'frozen', 'stellar',
  'amber', 'crystal', 'golden', 'iron', 'jade', 'lunar', 'midnight',
  'noble', 'obsidian', 'polar', 'quantum', 'radiant', 'sapphire',
  'turbo', 'ultra', 'vivid', 'winter', 'zenith', 'atomic', 'bright',
  'carbon', 'digital', 'electric', 'fierce', 'galactic', 'hyper',
  'ionic', 'kinetic', 'liquid', 'magnet', 'neon', 'onyx', 'prism',
  'rapid', 'sonic', 'titan', 'velvet', 'wild', 'azure', 'bold',
  'coral', 'deep', 'epic',
];

const nouns = [
  'falcon', 'reef', 'nexus', 'orbit', 'phoenix', 'vortex', 'spark',
  'atlas', 'beacon', 'cipher', 'delta', 'echo', 'flux', 'grid',
  'hawk', 'iris', 'jet', 'karma', 'lance', 'matrix', 'nova',
  'omega', 'pulse', 'quartz', 'ray', 'storm', 'tower', 'unity',
  'vector', 'wave', 'apex', 'bolt', 'core', 'drift', 'edge',
  'forge', 'gate', 'helix', 'ion', 'key', 'link', 'mesa',
  'node', 'opal', 'peak', 'quest', 'ridge', 'shield', 'trace',
  'vault',
];

export function generateFancyName(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}-${noun}`;
}
