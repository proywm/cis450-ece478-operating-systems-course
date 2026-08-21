import { courseAgentsMd } from './aiCoach.js';

export const OSTEP_HOMEWORK_REMOTE = 'https://github.com/remzi-arpacidusseau/ostep-homework.git';
export const OSTEP_HOMEWORK_PAGE = 'https://pages.cs.wisc.edu/~remzi/OSTEP/Homework/homework.html';
export const OSTEP_HOMEWORK_COMMIT = 'afb36ca8ddbf81d847d18f6bd18a87f0a18667f2';

export type OstepSimulatorMode = 'practice' | 'reveal';

export interface OstepSimulator {
  id: string;
  moduleNumber: number;
  chapter: string;
  title: string;
  directory: string;
  entrypoint: string;
  arguments: readonly string[];
  purpose: string;
  predict: string;
  explain: string;
  priorKnowledge: string;
}

export const OSTEP_SIMULATORS: readonly OstepSimulator[] = [
  {
    id: 'process-run', moduleNumber: 2, chapter: 'Chapter 4', title: 'Process-state transitions',
    directory: 'cpu-intro', entrypoint: 'process-run.py',
    arguments: ['-l', '5:100,5:0', '-L', '3', '-S', 'SWITCH_ON_IO', '-I', 'IO_RUN_IMMEDIATE'],
    purpose: 'Trace RUNNING, READY, BLOCKED, and DONE while CPU work overlaps an I/O-bound process.',
    predict: 'Draw the two process-state columns and mark each CPU or I/O-busy interval.',
    explain: 'Explain why the I/O completion policy changes response time and CPU utilization.',
    priorKnowledge: 'Read Chapter 4 through process states; no fork/exec code is required.'
  },
  {
    id: 'scheduler', moduleNumber: 3, chapter: 'Chapter 7', title: 'FIFO/SJF scheduling metrics',
    directory: 'cpu-sched', entrypoint: 'scheduler.py', arguments: ['-p', 'SJF', '-l', '7,2,4'],
    purpose: 'Compute a complete SJF execution trace plus response, turnaround, and wait time.',
    predict: 'Order the jobs, draw the Gantt chart, and calculate every metric with units.',
    explain: 'Reconcile each completion time with the simulator and state the simultaneous-arrival assumption.',
    priorKnowledge: 'Read Chapter 7 sections on metrics, FIFO, and SJF.'
  },
  {
    id: 'mlfq', moduleNumber: 3, chapter: 'Chapter 8', title: 'MLFQ priority and I/O behavior',
    directory: 'cpu-sched-mlfq', entrypoint: 'mlfq.py', arguments: ['-Q', '2,4,8', '-A', '1,1,1', '-l', '0,10,0:0,6,2', '-B', '20'],
    purpose: 'Follow demotion, I/O, and a priority boost for CPU-bound and interactive-style jobs.',
    predict: 'Track each job’s queue, remaining allotment, and I/O state for the first twelve ticks.',
    explain: 'Identify which rule prevents starvation and which behavior favors the I/O-bound job.',
    priorKnowledge: 'Read Chapter 8 rules through priority boosts and accounting.'
  },
  {
    id: 'lottery', moduleNumber: 3, chapter: 'Chapter 9', title: 'Lottery scheduling',
    directory: 'cpu-sched-lottery', entrypoint: 'lottery.py', arguments: ['-l', '5:10,5:30', '-q', '1', '-s', '3'],
    purpose: 'Use random numbers and ticket ranges to select the running job.',
    predict: 'For each supplied random number, compute the winning ticket and update remaining time.',
    explain: 'Compare the short trace with the 1:3 ticket share without claiming short-run equality.',
    priorKnowledge: 'Read Chapter 9 through ticket selection and probabilistic fairness.'
  },
  {
    id: 'multi', moduleNumber: 3, chapter: 'Chapter 10', title: 'Multiprocessor scheduling and caches',
    directory: 'cpu-sched-multi', entrypoint: 'multi.py', arguments: ['-n', '2', '-L', 'a:4:20,b:4:20', '-M', '40', '-q', '1', '-t', '-C'],
    purpose: 'Observe two CPUs, a central run queue, and cache-warmth information.',
    predict: 'Assign each job to a CPU at every tick and mark whether its working set is warm.',
    explain: 'Describe how affinity, migration, and load balance could change the trace.',
    priorKnowledge: 'Read Chapter 10 through cache affinity and single- versus multi-queue scheduling.'
  },
  {
    id: 'relocation', moduleNumber: 4, chapter: 'Chapter 15', title: 'Base-and-bounds relocation',
    directory: 'vm-mechanism', entrypoint: 'relocation.py', arguments: ['-a', '1k', '-p', '16k', '-b', '4096', '-l', '512', '-n', '4', '-s', '1'],
    purpose: 'Separate a bounds check from base-plus-offset translation.',
    predict: 'For each virtual address, decide valid/fault before calculating any physical address.',
    explain: 'Show why the limit is a size check and the base is added only after validity succeeds.',
    priorKnowledge: 'Read Chapter 15 through dynamic relocation.'
  },
  {
    id: 'segmentation', moduleNumber: 4, chapter: 'Chapter 16', title: 'Two-segment translation',
    directory: 'vm-segmentation', entrypoint: 'segmentation.py', arguments: ['-a', '1k', '-p', '16k', '-b', '4096', '-l', '400', '-B', '12288', '-L', '400', '-A', '100,600,900'],
    purpose: 'Translate addresses in a positive-growing segment and a negative-growing segment.',
    predict: 'Identify the segment, offset direction, bounds decision, and physical address or fault.',
    explain: 'Explain the negative-growing calculation rather than treating both segments alike.',
    priorKnowledge: 'Read Chapter 16 through segment identification and stack growth.'
  },
  {
    id: 'paging-linear', moduleNumber: 5, chapter: 'Chapter 18', title: 'Linear page-table translation',
    directory: 'vm-paging', entrypoint: 'paging-linear-translate.py', arguments: ['-a', '16k', '-p', '32k', '-P', '4k', '-u', '50', '-A', '0,4096,12288', '-s', '1'],
    purpose: 'Split virtual addresses into VPN and offset, inspect PTE validity, and form a physical address.',
    predict: 'Compute the VPN/offset for all three addresses and mark the expected validity result.',
    explain: 'Show that translation replaces the VPN with a PFN while preserving the page offset.',
    priorKnowledge: 'Read Chapter 18 through PTE contents and address decomposition.'
  },
  {
    id: 'paging-multilevel', moduleNumber: 5, chapter: 'Chapter 20', title: 'Multi-level page-table walk',
    directory: 'vm-smalltables', entrypoint: 'paging-multilevel-translate.py', arguments: ['-a', '8', '-n', '4', '-s', '1'],
    purpose: 'Walk page-directory and page-table indices in the simulator’s compact address model.',
    predict: 'For each generated virtual address, identify the directory index, table index, and offset.',
    explain: 'Explain which invalid entry stops the walk and why sparse allocation saves table space.',
    priorKnowledge: 'Read Chapter 20 through multi-level page tables. Read the simulator README before interpreting its compact dump.'
  },
  {
    id: 'paging-policy', moduleNumber: 6, chapter: 'Chapter 22', title: 'Page-replacement policies',
    directory: 'vm-beyondphys-policy', entrypoint: 'paging-policy.py', arguments: ['-a', '1,2,3,1,4,1,2,5', '-C', '3', '-p', 'FIFO'],
    purpose: 'Trace FIFO hits, misses, victims, and cache contents on a fixed reference string.',
    predict: 'Write the three-frame state and victim after every reference; count hits and misses.',
    explain: 'Rerun conceptually under LRU and identify the first step where FIFO and LRU diverge.',
    priorKnowledge: 'Read Chapter 22 through FIFO, LRU, and workload examples.'
  },
  {
    id: 'thread-interleaving', moduleNumber: 7, chapter: 'Chapter 26', title: 'Thread interleaving trace',
    directory: 'threads-intro', entrypoint: 'x86.py', arguments: ['-p', 'loop.s', '-t', '2', '-i', '3', '-R', 'ax,bx'],
    purpose: 'Trace two simplified x86 threads across deterministic interrupt points.',
    predict: 'Step each thread’s program counter and registers until both halt.',
    explain: 'Mark where a context switch occurs and distinguish private register state from shared memory.',
    priorKnowledge: 'Read Chapter 26 through uncontrolled scheduling; the simulator uses a simplified teaching ISA, not real x86 execution.'
  },
  {
    id: 'lock-interleaving', moduleNumber: 8, chapter: 'Chapter 28', title: 'Test-and-set lock trace',
    directory: 'threads-locks', entrypoint: 'x86.py', arguments: ['-p', 'test-and-set.s', '-t', '2', '-i', '2', '-M', '2000', '-R', 'ax,bx'],
    purpose: 'Follow atomic exchange, spinning, critical-section entry, and lock release.',
    predict: 'Track mutex memory, registers, and the owning thread after every instruction.',
    explain: 'Identify the atomic instruction and explain why a plain load/store acquisition would race.',
    priorKnowledge: 'Read Chapter 28 through test-and-set and spin-lock evaluation.'
  },
  {
    id: 'vsfs', moduleNumber: 13, chapter: 'Chapter 40', title: 'Very simple file-system state',
    directory: 'file-implementation', entrypoint: 'vsfs.py', arguments: ['-s', '1', '-i', '8', '-d', '8', '-n', '4'],
    purpose: 'Infer how directory, inode, and bitmap state changes after file-system operations.',
    predict: 'Compare each pair of states and name the operation plus all changed structures.',
    explain: 'Justify every bitmap, inode, reference-count, and directory-entry change.',
    priorKnowledge: 'Read Chapter 40 through inodes, directories, free-space bitmaps, and access paths.'
  },
  {
    id: 'ffs', moduleNumber: 13, chapter: 'Chapter 41', title: 'FFS placement policy',
    directory: 'file-ffs', entrypoint: 'ffs.py', arguments: ['-f', 'in.example1', '-M'],
    purpose: 'Predict block-group placement for directories and related file data.',
    predict: 'Place root, /a, /b, and their files into groups using the stated FFS policies.',
    explain: 'Connect observed placement to locality, balancing, and the large-file tradeoff.',
    priorKnowledge: 'Read Chapter 41 through block groups and file/directory placement.'
  },
  {
    id: 'fsck', moduleNumber: 13, chapter: 'Chapter 42', title: 'File-system consistency diagnosis',
    directory: 'file-journaling', entrypoint: 'fsck.py', arguments: ['-s', '1', '-S', '2', '-i', '8', '-d', '8', '-n', '4'],
    purpose: 'Diagnose one deliberate inconsistency in a small on-disk file-system image.',
    predict: 'Check bitmap, inode, directory, address, and reference-count invariants before naming the corruption.',
    explain: 'State which invariant was broken and what a checker can infer without a journal.',
    priorKnowledge: 'Read Chapter 42 through fsck and journaling; this tool models fsck-style diagnosis, not the journal protocol itself.'
  }
] as const;

export interface OstepSimulatorManifest {
  kind: 'systemstudio-ostep-simulators';
  version: 1;
  source: typeof OSTEP_HOMEWORK_REMOTE;
  commit: typeof OSTEP_HOMEWORK_COMMIT;
}

export function parseOstepSimulatorManifest(value: unknown): OstepSimulatorManifest | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Partial<OstepSimulatorManifest>;
  if (candidate.kind !== 'systemstudio-ostep-simulators' || candidate.version !== 1 || candidate.source !== OSTEP_HOMEWORK_REMOTE || candidate.commit !== OSTEP_HOMEWORK_COMMIT) return undefined;
  return { kind: candidate.kind, version: candidate.version, source: candidate.source, commit: candidate.commit };
}

export function ostepSimulator(id: string): OstepSimulator | undefined {
  return OSTEP_SIMULATORS.find((simulator) => simulator.id === id);
}

export function simulatorArguments(simulator: OstepSimulator, mode: OstepSimulatorMode): string[] {
  return [simulator.entrypoint, ...simulator.arguments, ...(mode === 'reveal' ? ['-c'] : [])];
}

export function ostepSimulatorWorkspaceFiles(): Record<string, string> {
  const manifest: OstepSimulatorManifest = {
    kind: 'systemstudio-ostep-simulators', version: 1, source: OSTEP_HOMEWORK_REMOTE, commit: OSTEP_HOMEWORK_COMMIT
  };
  const rows = OSTEP_SIMULATORS.map((simulator) => `| ${simulator.chapter} | ${simulator.title} | \`cd official/${simulator.directory}\`, then \`python3 ${simulatorArguments(simulator, 'practice').join(' ')}\` |`).join('\n');
  return {
    'AGENTS.md': courseAgentsMd(),
    '.systemstudio/ostep-homework.json': `${JSON.stringify(manifest, null, 2)}\n`,
    '.devcontainer/Dockerfile': 'FROM python:3.12-slim\nWORKDIR /workspace\nCMD ["bash"]\n',
    'compose.yaml': 'services:\n  simulator:\n    build:\n      context: .\n      dockerfile: .devcontainer/Dockerfile\n    working_dir: /workspace\n    volumes:\n      - .:/workspace\n',
    '.vscode/tasks.json': `${JSON.stringify({ version: '2.0.0', tasks: [
      { label: 'OSTEP: Open simulator guide', type: 'shell', command: 'echo', args: ['Open README.md, predict first, and launch a simulator from the SystemStudio OS extension.'], problemMatcher: [] }
    ] }, null, 2)}\n`,
    'README.md': `# Official OSTEP simulator workspace

This workspace points to the official OSTEP homework repository at the exact revision validated for this extension:

- Source: ${OSTEP_HOMEWORK_REMOTE}
- Commit: ${OSTEP_HOMEWORK_COMMIT}
- Author documentation: ${OSTEP_HOMEWORK_PAGE}

The upstream source is in \`official/\`; SystemStudio does not modify it or redistribute it in the VSIX. Use the extension's **Run an official OSTEP simulator** action so command arguments stay fixed and visible. Python 3 can run the tools natively. The supplied Docker recipe provides the same Python environment on Windows, macOS, and Linux when Docker is installed and running.

## Learning workflow

1. Read the exact mapped chapter and the simulator's own \`README.md\`.
2. Choose **New prediction problem**. The command intentionally omits \`-c\`.
3. Record your state table, trace, arithmetic, or invariant before asking for output.
4. Choose **Reveal after prediction**. Confirm that your prediction is recorded; the extension reruns the exact preset with \`-c\`.
5. Explain the first mismatch. Do not paste a revealed trace as assessed work.

## Included launch presets

| Reading | Simulator | Prediction command |
|---|---|---|
${rows}

## Boundaries

These are official textbook learning tools, not current Canvas assignments, answer submissions, grades, or proof of mastery. Canvas and the instructor control assessed-work rules. The extension stores only local practice/reveal counts; it does not upload simulator output.
`
  };
}
