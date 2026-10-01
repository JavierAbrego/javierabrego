// Hand written content for the profile card. Edit freely: the workflow
// regenerates the asset on push, so changes here show up on the profile in a
// minute. Keep it generic: no client or product names.

export const profile = {
  login: 'JavierAbrego',
  fullName: 'Javier Abrego Lorente',
  user: 'javier',
  host: 'zaragoza',
  location: 'Zaragoza, ES',
  role: 'software engineer · founder',
  shell: 'zsh + neovim + claude code',

  // Printed by `cat ~/.focus`.
  focus: [
    ['ai agents', 'fleets of autonomous agents that ship real code'],
    ['cloud sovereignty', 'self hosted infra: your data, your metal'],
    ['llm inference', 'open models served on bare metal GPUs'],
    ['rust', 'fast, safe tooling and CLIs'],
    ['distributed systems', 'clusters, queues and consensus'],
  ],

  // Fixed language mix, shown in this order. Weights are relative.
  languages: [
    { name: 'Rust', color: '#dea584', weight: 34 },
    { name: 'TypeScript', color: '#3178c6', weight: 25 },
    { name: 'Python', color: '#3572a5', weight: 17 },
    { name: 'Shell', color: '#89e051', weight: 11 },
    { name: 'JavaScript', color: '#f1e05a', weight: 8 },
    { name: 'Vim Script', color: '#199f4b', weight: 5 },
  ],
};
