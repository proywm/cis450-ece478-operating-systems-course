export type ModuleUnit = 'Virtualization' | 'Concurrency' | 'Persistence';

export interface PracticeQuestion {
  id: string;
  level: 'Remember' | 'Understand' | 'Apply' | 'Analyze';
  prompt: string;
  choices: readonly string[];
  answer: number;
  explanation: string;
}

export interface CourseModule {
  id: string;
  number: number;
  unit: ModuleUnit;
  title: string;
  objectives: readonly string[];
  reading: string;
  readingUrl: string;
  lesson: readonly string[];
  handsOn: string;
  artifact: string;
  sourceBasis: string;
  questions: readonly PracticeQuestion[];
}

const OSTEP = 'https://pages.cs.wisc.edu/~remzi/OSTEP/';

export const COURSE = {
  term: 'Fall 2026',
  title: 'CIS 450 / ECE 478: Operating Systems',
  section: '001',
  credits: 4,
  instructor: 'Dr. Probir Roy',
  instructorEmail: 'probirr@umich.edu',
  instructorOffice: 'CIS Building, Room 230',
  gsi: 'Syed Salauddin Mohammad Tariq',
  gsiPreferred: 'Tariq',
  gsiEmail: 'ssmtariq@umich.edu',
  meeting: 'Mondays and Wednesdays, 2:00–3:45 p.m.',
  room: 'CASL 1048',
  canvasUrl: 'https://canvas.umd.umich.edu/',
  academicCalendarUrl: 'https://umdearborn.edu/sites/default/files/unmanaged/pdf/registrar/2026-2027-academic-calendar.pdf',
  textbook: 'Operating Systems: Three Easy Pieces (OSTEP), free online',
  textbookUrl: OSTEP
} as const;

export const MODULES: readonly CourseModule[] = [
  {
    id: 'm01', number: 1, unit: 'Virtualization', title: 'What an Operating System Does',
    objectives: ['Explain virtualization, concurrency, and persistence as the course\'s three organizing ideas.', 'Distinguish mechanism from policy.', 'Use a Unix shell, compiler, and debugger safely.'],
    reading: 'OSTEP Introduction and Chapter 2: Introduction to Operating Systems', readingUrl: `${OSTEP}intro.pdf`,
    lesson: [
      'An operating system turns physical resources into easier abstractions while coordinating protection and sharing. CPU virtualization creates the process abstraction; memory virtualization gives each process an address space; persistence organizes durable data behind files and directories.',
      'Mechanism answers how an operation can happen—for example, a context switch. Policy answers which choice to make—for example, which ready process runs next. Keeping the two separate makes later scheduler and memory-management designs easier to compare.',
      'The hands-on path uses C, a shell, Docker, Make, and eventually xv6. The goal of the first lab is reproducibility: another student should be able to build and run the same small program from the same workspace.'
    ],
    handsOn: 'Create the portable OS lab workspace, inspect its container recipe, compile the starter C program, and record the compiler/runtime versions.',
    artifact: 'A short environment report containing the commands used, versions, output, and one troubleshooting note.',
    sourceBasis: 'Winter 2026 syllabus program goals; OSTEP introduction; recent evaluation request for explicit Docker, Makefile, and C setup demonstrations.',
    questions: [
      { id: 'm01q1', level: 'Understand', prompt: 'Which example is a policy rather than a mechanism?', choices: ['Saving CPU registers during a context switch', 'Choosing the next ready process', 'Entering kernel mode on a trap', 'Translating a virtual address'], answer: 1, explanation: 'Choosing among runnable processes is a scheduling policy. Saving/restoring state and entering the kernel are mechanisms.' },
      { id: 'm01q2', level: 'Apply', prompt: 'A program builds on one laptop but not another. What is the best first reproducibility step?', choices: ['Rewrite the program', 'Record tool versions and build commands', 'Increase CPU priority', 'Disable compiler warnings'], answer: 1, explanation: 'A versioned environment and repeatable command are needed before diagnosing code differences.' },
      { id: 'm01q3', level: 'Analyze', prompt: 'Which mapping correctly pairs the course themes?', choices: ['CPU→persistence; files→concurrency', 'Processes→virtualization; races→concurrency; files→persistence', 'Locks→virtualization; pages→persistence', 'Directories→concurrency; threads→persistence'], answer: 1, explanation: 'Processes/address spaces are virtual abstractions, shared execution introduces concurrency, and file systems provide persistence.' }
    ]
  },
  {
    id: 'm02', number: 2, unit: 'Virtualization', title: 'Processes and Process APIs',
    objectives: ['Describe process state and address-space contents.', 'Trace fork, exec, wait, and exit.', 'Explain how a shell builds a process pipeline.'],
    reading: 'OSTEP Chapters 4–5: Processes and Process API', readingUrl: `${OSTEP}cpu-api.pdf`,
    lesson: [
      'A process is a running program plus the state needed to resume it: address space, registers, open-file information, credentials, and scheduling state. The operating system assigns a process identifier and tracks transitions such as ready, running, and blocked.',
      'fork creates a child process with a logically separate address space; its return value distinguishes parent from child. exec replaces the calling process image with another program. wait lets a parent synchronize with child termination, and exit releases the process.',
      'The separation of fork and exec gives a shell a useful setup window: after fork and before exec, the child can redirect file descriptors or construct a pipeline.'
    ],
    handsOn: 'Write a small C program that forks, prints parent/child PIDs, waits, and then add an exec call. Predict the output before running it.',
    artifact: 'Annotated process tree plus predicted and observed output; explain every difference without copying assignment answers.',
    sourceBasis: 'Winter 2026 HW1 and PA1 process exercises; OSTEP process/API chapters.',
    questions: [
      { id: 'm02q1', level: 'Remember', prompt: 'What does fork return in the newly created child?', choices: ['The parent PID', 'Zero', 'Negative one', 'The child PID'], answer: 1, explanation: 'A successful fork returns zero in the child and the child PID in the parent.' },
      { id: 'm02q2', level: 'Understand', prompt: 'What does exec do to the calling process?', choices: ['Creates a second process', 'Replaces its program image', 'Blocks until a child exits', 'Duplicates every open file'], answer: 1, explanation: 'exec loads a new program into the current process; it does not create another process.' },
      { id: 'm02q3', level: 'Analyze', prompt: 'Why is fork followed by exec useful to a shell?', choices: ['The parent can change the child after exec', 'The child can set redirection before replacing its image', 'exec automatically waits', 'fork prevents context switches'], answer: 1, explanation: 'The child configures descriptors and environment between fork and exec, enabling redirection and pipelines.' }
    ]
  },
  {
    id: 'm03', number: 3, unit: 'Virtualization', title: 'CPU Mechanisms and Scheduling',
    objectives: ['Explain limited direct execution and timer interrupts.', 'Compute turnaround, response, and waiting time.', 'Compare FCFS, SJF, STCF, RR, and MLFQ tradeoffs.'],
    reading: 'OSTEP Chapters 6–10: Mechanism and CPU Scheduling', readingUrl: `${OSTEP}cpu-sched.pdf`,
    lesson: [
      'Limited direct execution lets user code run directly on the CPU while privileged operations trap into the kernel. A periodic timer interrupt ensures the OS can regain control even when a process does not cooperate.',
      'Schedulers balance different goals. Turnaround time measures completion latency, response time measures time until first run, and fairness concerns how service is shared. A policy that optimizes one workload can harm another.',
      'MLFQ approximates knowledge of job behavior by observing CPU use. Interactive jobs tend to remain at higher priority; CPU-intensive jobs move downward. Priority boosts prevent indefinite starvation.'
    ],
    handsOn: 'Run OSTEP scheduling simulators with at least three seeds. Draw one Gantt chart manually, then reconcile it with simulator output.',
    artifact: 'Gantt chart, metric calculations, simulator command, and a short policy tradeoff paragraph.',
    sourceBasis: 'Winter 2026 HW1 scheduling questions and PA2 scheduler goals; OSTEP scheduling chapters.',
    questions: [
      { id: 'm03q1', level: 'Understand', prompt: 'Why does an OS need a timer interrupt?', choices: ['To allocate disk blocks', 'To regain CPU control from a running process', 'To translate addresses', 'To create a file descriptor'], answer: 1, explanation: 'The timer provides a non-cooperative path back into the kernel so the scheduler can preempt.' },
      { id: 'm03q2', level: 'Apply', prompt: 'Jobs A(3) and B(1) arrive together. Under non-preemptive SJF, which order minimizes average turnaround?', choices: ['A then B', 'B then A', 'Either is identical', 'They must alternate'], answer: 1, explanation: 'Running the shortest job first completes B at 1 and A at 4, reducing average completion time.' },
      { id: 'm03q3', level: 'Analyze', prompt: 'What MLFQ mechanism primarily addresses starvation?', choices: ['Longer process names', 'Periodic priority boosts', 'Disabling preemption', 'One global time quantum only'], answer: 1, explanation: 'Boosting waiting jobs returns them to a higher-priority queue so they eventually receive service.' }
    ]
  },
  {
    id: 'm04', number: 4, unit: 'Virtualization', title: 'Address Spaces, Relocation, and Segmentation',
    objectives: ['Identify code, data, heap, and stack.', 'Translate addresses with base and bounds.', 'Analyze fragmentation and segmented growth.'],
    reading: 'OSTEP Chapters 13–16: Address Spaces through Segmentation', readingUrl: `${OSTEP}vm-segmentation.pdf`,
    lesson: [
      'An address space is the process-visible arrangement of code, static data, heap, stack, and mapped regions. Virtual addresses must be translated and checked before physical memory is accessed.',
      'Dynamic relocation adds a base to a virtual offset and checks the result against a bound. The hardware performs the fast check; the OS controls base/bounds values during context switches.',
      'Segmentation represents logically different regions with separate bases, limits, and growth directions. It improves flexibility but introduces external fragmentation and placement questions.'
    ],
    handsOn: 'Use the OSTEP relocation and segmentation simulators. For three addresses, compute the result by hand before revealing the simulator answer.',
    artifact: 'Translation table with validity decision, arithmetic, and physical address or protection fault.',
    sourceBasis: 'Winter 2026 HW2 address-space, base/bounds, and segmentation items; OSTEP VM chapters.',
    questions: [
      { id: 'm04q1', level: 'Remember', prompt: 'Which region normally grows as dynamic allocation occurs?', choices: ['Code', 'Heap', 'Program counter', 'Page table register'], answer: 1, explanation: 'malloc-family allocation typically expands or maps heap storage.' },
      { id: 'm04q2', level: 'Apply', prompt: 'With base 4000 and bound 500, what happens to virtual address 300?', choices: ['Fault', 'Physical 3700', 'Physical 4300', 'Physical 4500'], answer: 2, explanation: '300 is within the 500-byte bound, so translation is base + offset = 4300.' },
      { id: 'm04q3', level: 'Analyze', prompt: 'What is a main cost of variable-sized segmentation?', choices: ['No protection', 'External fragmentation', 'No sharing', 'Every access causes a disk read'], answer: 1, explanation: 'Variable-sized segments leave noncontiguous holes that can make allocation difficult.' }
    ]
  },
  {
    id: 'm05', number: 5, unit: 'Virtualization', title: 'Paging, TLBs, and Page Tables',
    objectives: ['Split a virtual address into VPN and offset.', 'Explain TLB hits and misses.', 'Compare linear and multi-level page tables.'],
    reading: 'OSTEP Chapters 18–20: Paging, TLBs, and Page Tables', readingUrl: `${OSTEP}vm-smalltables.pdf`,
    lesson: [
      'Paging divides virtual and physical memory into fixed-size pages and frames. The offset is preserved during translation; a page-table entry supplies the physical frame number and protection metadata.',
      'A translation lookaside buffer caches recent translations. A TLB hit avoids a page-table lookup, while a TLB miss invokes hardware or OS-assisted page-table traversal. A TLB miss is not automatically a page fault.',
      'Linear page tables are simple but can consume substantial memory. Multi-level tables allocate lower levels only for populated virtual regions, trading extra lookup steps for space savings.'
    ],
    handsOn: 'Use the OSTEP paging translation simulator, then write a tiny address-translation worksheet that labels VPN, offset, valid bit, and PFN.',
    artifact: 'Completed translations plus one paragraph distinguishing a TLB miss, invalid PTE, and page fault.',
    sourceBasis: 'Winter 2026 HW2 paging/TLB questions; OSTEP paging chapters.',
    questions: [
      { id: 'm05q1', level: 'Apply', prompt: 'With 4 KiB pages, how many offset bits are in a byte address?', choices: ['4', '10', '12', '16'], answer: 2, explanation: '4 KiB is 4096 = 2^12 bytes, so the offset uses 12 bits.' },
      { id: 'm05q2', level: 'Understand', prompt: 'Which statement is correct?', choices: ['Every TLB miss is a page fault', 'A TLB caches virtual-to-physical translations', 'The page offset changes during translation', 'Paging creates external fragmentation between frames'], answer: 1, explanation: 'A TLB is a translation cache. Missing there may still find a valid in-memory page-table entry.' },
      { id: 'm05q3', level: 'Analyze', prompt: 'Why can a multi-level page table use less memory?', choices: ['It removes offsets', 'It omits lower-level tables for unused regions', 'It stores pages on the CPU', 'It disables protection bits'], answer: 1, explanation: 'Sparse address spaces need only the page-table subtrees that describe mapped regions.' }
    ]
  },
  {
    id: 'm06', number: 6, unit: 'Virtualization', title: 'Demand Paging and Replacement',
    objectives: ['Trace a page fault from trap to restart.', 'Compare FIFO, OPT, LRU, and Clock.', 'Reason about locality and thrashing.'],
    reading: 'OSTEP Chapters 21–22: Beyond Physical Memory and Replacement', readingUrl: `${OSTEP}vm-beyondphys-policy.pdf`,
    lesson: [
      'Demand paging leaves some virtual pages outside physical memory. Accessing a nonresident valid page traps to the OS, which locates data, chooses a frame, performs I/O if needed, updates metadata, and restarts the instruction.',
      'Replacement policy decides which resident page to evict. OPT is an unattainable benchmark, LRU exploits recency, FIFO is simple, and Clock approximates recency with reference bits.',
      'Locality makes caching effective. When a workload\'s actively used pages exceed available memory, repeated eviction and reload can cause thrashing.'
    ],
    handsOn: 'Run page-replacement traces under FIFO, LRU, and Clock; explain one point where policies diverge.',
    artifact: 'Frame-by-frame table, page-fault counts, and a locality-based explanation.',
    sourceBasis: 'Winter 2026 HW2 effective access time and replacement questions; OSTEP replacement chapters.',
    questions: [
      { id: 'm06q1', level: 'Understand', prompt: 'What distinguishes a page fault from a TLB miss?', choices: ['A page fault means the referenced page is not currently resident or access is invalid', 'A TLB miss always terminates the process', 'A page fault never enters the kernel', 'They are identical'], answer: 0, explanation: 'A TLB miss concerns the translation cache; a page fault concerns page-table validity/residency or protection.' },
      { id: 'm06q2', level: 'Remember', prompt: 'Why is OPT mainly a benchmark?', choices: ['It requires future references', 'It cannot count faults', 'It uses no memory', 'It is identical to FIFO'], answer: 0, explanation: 'OPT evicts the page whose next use is farthest in the future, information a real system does not possess.' },
      { id: 'm06q3', level: 'Analyze', prompt: 'What pattern best signals thrashing?', choices: ['High CPU use and no faults', 'Frequent faults with little useful execution', 'One compulsory miss at startup', 'A large TLB'], answer: 1, explanation: 'Thrashing spends much of the time moving pages rather than running useful instructions.' }
    ]
  },
  {
    id: 'm07', number: 7, unit: 'Concurrency', title: 'Threads and Race Conditions',
    objectives: ['Compare processes and threads.', 'Explain a race as an interleaving of machine operations.', 'Use ThreadSanitizer as evidence, not as a proof of correctness.'],
    reading: 'OSTEP Chapters 26–27: Concurrency and Thread API', readingUrl: `${OSTEP}threads-api.pdf`,
    lesson: [
      'Threads in one process share the address space and open resources but retain separate register state and stacks. This makes communication cheap and also exposes shared data to harmful interleavings.',
      'An expression such as counter++ expands to load, modify, and store operations. Two threads can load the same old value and overwrite one another\'s updates. The result depends on timing rather than program intent.',
      'A race detector can expose observed conflicts, but one clean run does not prove correctness. Reasoning about which state is shared and which ordering is required remains essential.'
    ],
    handsOn: 'Compile a pthread counter program with and without `-fsanitize=thread`, reproduce a race, then protect the critical section.',
    artifact: 'Before/after output, sanitizer excerpt, and a statement of the protected invariant.',
    sourceBasis: 'Packaged lecture source 2-1; Winter 2026 HW3; recent evaluation request for concrete race-condition demonstrations.',
    questions: [
      { id: 'm07q1', level: 'Understand', prompt: 'What do threads in one process normally share?', choices: ['Every stack frame', 'Address space and open files', 'Program counters', 'CPU registers'], answer: 1, explanation: 'Threads share process resources but need independent registers and stacks for independent execution.' },
      { id: 'm07q2', level: 'Apply', prompt: 'Why can two counter++ operations lose an increment?', choices: ['The compiler deletes both', 'Their load/modify/store sequences can overlap', 'The OS resets the counter', 'Threads cannot read memory'], answer: 1, explanation: 'Both threads may load the same value and then store the same incremented result.' },
      { id: 'm07q3', level: 'Analyze', prompt: 'A ThreadSanitizer run reports no race. What may be concluded?', choices: ['The program is proven correct', 'No race was reported in that explored execution', 'Locks are unnecessary', 'The program is deadlock-free'], answer: 1, explanation: 'Dynamic testing observes executions; it cannot prove all possible schedules safe.' }
    ]
  },
  {
    id: 'm08', number: 8, unit: 'Concurrency', title: 'Locks and Correct Critical Sections',
    objectives: ['State mutual exclusion, progress, and fairness goals.', 'Explain atomic hardware support for locks.', 'Recognize lock-order and granularity tradeoffs.'],
    reading: 'OSTEP Chapters 28–29: Locks and Lock-based Data Structures', readingUrl: `${OSTEP}threads-locks.pdf`,
    lesson: [
      'A lock protects a critical section whose operations must appear indivisible relative to other threads. The programmer must identify the invariant and ensure every access that can violate it follows the same discipline.',
      'Hardware atomic instructions such as test-and-set make it possible to change lock state without an intervening thread observing a half-completed update. Spinning may be appropriate for very short waits but wastes CPU for long waits.',
      'Coarse-grained locks are simpler but reduce parallelism. Fine-grained locks may increase concurrency but also raise proof, ordering, and debugging complexity.'
    ],
    handsOn: 'Implement a mutex-protected counter, then deliberately move one access outside the critical section and explain the broken invariant.',
    artifact: 'Code diff plus an invariant-based explanation of why the protected version is correct.',
    sourceBasis: 'Packaged lecture source 2-2; Winter 2026 HW3 lock questions; OSTEP lock chapters.',
    questions: [
      { id: 'm08q1', level: 'Remember', prompt: 'What property does a lock primarily provide?', choices: ['Persistence', 'Mutual exclusion', 'Address translation', 'Disk scheduling'], answer: 1, explanation: 'A correctly used lock prevents simultaneous entry into a protected critical section.' },
      { id: 'm08q2', level: 'Understand', prompt: 'Why is an atomic instruction needed to build a basic spin lock?', choices: ['To update and test lock state indivisibly', 'To allocate a page', 'To create a thread', 'To flush a file'], answer: 0, explanation: 'Without an indivisible state transition, two contenders could both believe they acquired the lock.' },
      { id: 'm08q3', level: 'Analyze', prompt: 'What is a typical fine-grained locking tradeoff?', choices: ['Less concurrency and less complexity', 'More concurrency and more reasoning complexity', 'No deadlock risk', 'No shared state'], answer: 1, explanation: 'More locks can allow independent operations to overlap but complicate ordering and invariant protection.' }
    ]
  },
  {
    id: 'm09', number: 9, unit: 'Concurrency', title: 'Condition Variables and Semaphores',
    objectives: ['Use condition variables with a predicate and mutex.', 'Distinguish mutual exclusion from condition synchronization.', 'Model counting and binary semaphores.'],
    reading: 'OSTEP Chapters 30–31: Condition Variables and Semaphores', readingUrl: `${OSTEP}threads-sema.pdf`,
    lesson: [
      'A condition variable lets a thread sleep until shared state may satisfy a predicate. The thread checks that predicate while holding the associated mutex and waits in a loop because wakeups do not guarantee the condition is now true.',
      'A semaphore combines a counter with atomic wait and post operations. A counting semaphore can represent available units of a resource; a binary semaphore can resemble a lock, though ownership conventions differ.',
      'Correct synchronization begins with state and invariants, not with choosing a primitive. First state what must be true; then choose locks, conditions, or semaphores that enforce it.'
    ],
    handsOn: 'Build a bounded-buffer or ordered-print exercise with pthread mutexes and condition variables; add a log that makes waiting and wakeup visible.',
    artifact: 'State diagram, predicate, code, and trace explaining each wait/signal.',
    sourceBasis: 'Packaged lecture sources 2-3 and 2-4; Winter 2026 HW3; OSTEP condition/semaphore chapters.',
    questions: [
      { id: 'm09q1', level: 'Apply', prompt: 'How should a condition-variable wait normally be guarded?', choices: ['By an if with no lock', 'By a while loop checking the predicate under the mutex', 'By sleeping for a fixed time', 'By a page fault'], answer: 1, explanation: 'The predicate must be rechecked after wakeup while the mutex protects the shared state.' },
      { id: 'm09q2', level: 'Understand', prompt: 'What can a counting semaphore represent?', choices: ['Only a Boolean', 'The number of available identical resources', 'A virtual address', 'A process identifier'], answer: 1, explanation: 'Its count can track multiple available units; wait consumes one and post returns one.' },
      { id: 'm09q3', level: 'Analyze', prompt: 'Why is a timed sleep a weak substitute for synchronization?', choices: ['Time never advances', 'It guesses about another thread rather than observing protected state', 'It always deadlocks', 'It prevents compilation'], answer: 1, explanation: 'Timing varies across executions; synchronization must encode the actual condition or ordering.' }
    ]
  },
  {
    id: 'm10', number: 10, unit: 'Concurrency', title: 'Deadlock and Liveness',
    objectives: ['Identify the four Coffman conditions.', 'Draw a wait-for graph.', 'Compare prevention, avoidance, detection, and recovery.'],
    reading: 'OSTEP Chapter 32: Common Concurrency Problems', readingUrl: `${OSTEP}threads-bugs.pdf`,
    lesson: [
      'Deadlock is a liveness failure in which participants wait forever for resources held within the waiting set. The classic necessary conditions are mutual exclusion, hold-and-wait, no preemption, and circular wait.',
      'A consistent global lock order prevents cycles. Other strategies remove a different necessary condition, avoid unsafe allocations, detect cycles after they form, or recover by terminating or rolling back work.',
      'Not every hang is deadlock. Starvation denies service to one participant while the system still progresses; livelock changes state repeatedly without useful progress.'
    ],
    handsOn: 'Create a two-lock deadlock under controlled conditions, capture thread stacks, then repair it with a documented lock order.',
    artifact: 'Wait-for graph, stack evidence, fixed code, and a deadlock/starvation/livelock comparison.',
    sourceBasis: 'Packaged lecture source 2-5; OSTEP concurrency-bugs chapter.',
    questions: [
      { id: 'm10q1', level: 'Remember', prompt: 'Which is one Coffman condition?', choices: ['Circular wait', 'Demand paging', 'Spatial locality', 'Write buffering'], answer: 0, explanation: 'Circular wait is one of the four necessary conditions for deadlock.' },
      { id: 'm10q2', level: 'Apply', prompt: 'Threads acquire locks only in increasing numeric order. Which condition is targeted?', choices: ['Mutual exclusion', 'Circular wait', 'No preemption', 'Persistence'], answer: 1, explanation: 'A total order prevents a cycle in resource acquisition.' },
      { id: 'm10q3', level: 'Analyze', prompt: 'The system keeps running, but one thread never gets the lock. What is this?', choices: ['Deadlock necessarily', 'Starvation', 'A page fault', 'Journaling'], answer: 1, explanation: 'Progress by others with indefinite denial to one participant is starvation.' }
    ]
  },
  {
    id: 'm11', number: 11, unit: 'Persistence', title: 'I/O Devices and Device Interaction',
    objectives: ['Explain polling, interrupts, and DMA.', 'Trace an I/O request across user/kernel/device boundaries.', 'Recognize why device latency changes OS policy.'],
    reading: 'OSTEP Chapter 36: I/O Devices', readingUrl: `${OSTEP}file-devices.pdf`,
    lesson: [
      'Programs access devices through OS abstractions and system calls. The kernel validates requests, coordinates drivers, and arranges data transfer while preserving isolation.',
      'Polling repeatedly checks device status; interrupts let the CPU do other work until notification; DMA moves bulk data between device and memory with limited CPU copying. Each approach has workload-dependent overheads.',
      'A correct I/O trace distinguishes request submission, waiting/blocking, device completion, interrupt handling, and process wakeup.'
    ],
    handsOn: 'Use `strace` in the container to observe open/read/write calls from a small C program; annotate which operations cross into the kernel.',
    artifact: 'Filtered trace, annotated request path, and one performance hypothesis.',
    sourceBasis: 'Packaged lecture source 3-1; Winter 2026 syllabus persistence goal; OSTEP device chapter.',
    questions: [
      { id: 'm11q1', level: 'Understand', prompt: 'What is a principal benefit of DMA?', choices: ['It removes files', 'It transfers bulk data without CPU copying every word', 'It prevents all interrupts', 'It replaces virtual memory'], answer: 1, explanation: 'The CPU programs the transfer, and the DMA engine handles much of the data movement.' },
      { id: 'm11q2', level: 'Analyze', prompt: 'When can polling be reasonable?', choices: ['A device is expected to complete almost immediately', 'A device takes minutes and CPU work is plentiful', 'There is no status register', 'The process has exited'], answer: 0, explanation: 'For very short waits, polling can cost less than sleeping and handling an interrupt.' },
      { id: 'm11q3', level: 'Apply', prompt: 'Which tool can show a Linux program\'s file-related system calls?', choices: ['strace', 'make clean only', 'A page-table simulator', 'The linker alone'], answer: 0, explanation: 'strace records system-call entry, arguments, and results, making the user/kernel boundary visible.' }
    ]
  },
  {
    id: 'm12', number: 12, unit: 'Persistence', title: 'Files, Directories, and Metadata',
    objectives: ['Relate descriptors, open-file state, and inodes.', 'Explain hard links and symbolic links.', 'Use metadata to reason about names and objects.'],
    reading: 'OSTEP Chapter 39: Files and Directories', readingUrl: `${OSTEP}file-intro.pdf`,
    lesson: [
      'A file descriptor is a per-process handle returned by open; it refers through kernel state to an underlying file object and current offset. A pathname is resolved through directories and is not itself the file\'s content identity.',
      'Directory entries map names to underlying objects such as inodes. Hard links create another directory entry for the same inode; symbolic links store a pathname to resolve later.',
      'Metadata operations such as stat help separate questions about names, sizes, permissions, link counts, and timestamps.'
    ],
    handsOn: 'Create a file, hard link, and symbolic link inside the lab workspace; compare `ls -li`, `stat`, and behavior after removing the original name.',
    artifact: 'Command transcript and an inode/name diagram explaining every observation.',
    sourceBasis: 'Packaged lecture source 3-3; OSTEP files/directories chapter.',
    questions: [
      { id: 'm12q1', level: 'Understand', prompt: 'What is a file descriptor?', choices: ['A pathname stored on disk only', 'A process-local handle to kernel-managed open-file state', 'A physical disk sector', 'A scheduler queue'], answer: 1, explanation: 'The integer descriptor indexes per-process state that refers to an open file or I/O object.' },
      { id: 'm12q2', level: 'Apply', prompt: 'Two hard-link names usually refer to what?', choices: ['Different inodes with copied data', 'The same underlying inode', 'Two processes', 'A TLB entry'], answer: 1, explanation: 'A hard link adds another directory entry referring to the same inode.' },
      { id: 'm12q3', level: 'Analyze', prompt: 'Why can an open file remain readable after its last pathname is removed?', choices: ['The open kernel reference still retains the object', 'The TLB restores the name', 'The compiler caches it forever', 'Removing names never changes metadata'], answer: 0, explanation: 'The data object is reclaimed only when link and active reference conditions allow it.' }
    ]
  },
  {
    id: 'm13', number: 13, unit: 'Persistence', title: 'File-System Implementation and Crash Consistency',
    objectives: ['Map a pathname to inode and data blocks.', 'Explain allocation structures and caching.', 'Reason about journaling order after a crash.'],
    reading: 'OSTEP Chapters 40–42: File-System Implementation, FFS, and Crash Consistency', readingUrl: `${OSTEP}file-journaling.pdf`,
    lesson: [
      'A simple file system divides storage among metadata, allocation structures, inodes, directories, and data blocks. Reading a pathname can require a sequence of directory and inode lookups before reaching content blocks.',
      'FFS-style placement tries to preserve locality by grouping related metadata and data. Caching and write buffering reduce I/O but create ordering questions when memory state is lost during a crash.',
      'Journaling records an update transaction so recovery can distinguish committed work from incomplete work. Correctness depends on what is logged and on enforced write ordering, not merely on issuing writes.'
    ],
    handsOn: 'Walk a simplified VSFS image or diagram: resolve a pathname, identify inode/data bitmap changes for file creation, then mark crash points in an update sequence.',
    artifact: 'Block-access trace and crash-consistency table showing states before commit, after commit, and after checkpoint.',
    sourceBasis: 'Packaged lecture sources 3-4 and 3-5; OSTEP file-system implementation and journaling chapters.',
    questions: [
      { id: 'm13q1', level: 'Apply', prompt: 'Creating a new regular file typically changes which structures?', choices: ['Only the CPU scheduler', 'A directory, an inode allocation structure, and inode metadata', 'Only the TLB', 'Only the process stack'], answer: 1, explanation: 'Creation allocates/initializes metadata and connects a directory name to it; data blocks may be allocated when content is written.' },
      { id: 'm13q2', level: 'Understand', prompt: 'What problem does journaling primarily address?', choices: ['CPU fairness', 'Consistency after interrupted multi-step updates', 'Virtual-address size', 'Thread creation speed'], answer: 1, explanation: 'A crash can interrupt related writes; the journal provides a recoverable transaction boundary.' },
      { id: 'm13q3', level: 'Analyze', prompt: 'Why is write ordering important even with a journal?', choices: ['Recovery assumptions depend on commit/data reaching storage in the intended order', 'Disks execute C code', 'Page offsets must change', 'It prevents all hardware failure'], answer: 0, explanation: 'If storage reorders writes, a commit record may become durable before required log data unless barriers/order are enforced.' }
    ]
  }
] as const;

export interface CourseworkItem {
  id: string;
  kind: 'Homework' | 'Programming';
  title: string;
  focus: string;
  modules: readonly number[];
  evidence: readonly string[];
}

export const COURSEWORK: readonly CourseworkItem[] = [
  { id: 'hw1', kind: 'Homework', title: 'Homework 1 · CPU Virtualization and Scheduling', focus: 'Processes, restricted execution, scheduling metrics, MLFQ, and simulator reasoning.', modules: [2, 3], evidence: ['Show calculations, not only final numbers.', 'Include simulator commands and reconcile manual work.', 'Submit only the format required by the current Canvas assignment.'] },
  { id: 'pa1a', kind: 'Programming', title: 'Programming 1A · Reproducible xv6 Environment', focus: 'Build/run xv6 and document a portable development workflow.', modules: [1, 2], evidence: ['Successful clean build and xv6 boot.', 'Versioned environment evidence.', 'Troubleshooting record and contribution statement if Canvas permits a team.'] },
  { id: 'pa1b', kind: 'Programming', title: 'Programming 1B · Process Instrumentation', focus: 'Add and observe a user process and selected process-control-block state.', modules: [2, 3], evidence: ['Small, explainable code changes.', 'Expected versus observed trace.', 'Every change identified in the report.'] },
  { id: 'hw2', kind: 'Homework', title: 'Homework 2 · Memory Virtualization', focus: 'Segmentation, paging, TLBs, effective access time, and replacement.', modules: [4, 5, 6], evidence: ['Label VPN/offset/PFN arithmetic.', 'Show each effective-access-time probability term.', 'Provide frame-by-frame replacement traces.'] },
  { id: 'pa2', kind: 'Programming', title: 'Programming 2 · xv6 Scheduler', focus: 'Design, implement, and test a simplified scheduler modification.', modules: [3], evidence: ['State queue invariants before coding.', 'Use targeted kernel logging.', 'Explain behavior rather than pasting output.', 'Fall 2026 specification and deadline come from Canvas.'] },
  { id: 'hw3', kind: 'Homework', title: 'Homework 3 · Concurrency', focus: 'Threads, races, locks, condition variables, semaphores, and deadlock.', modules: [7, 8, 9, 10], evidence: ['Name shared state and invariants.', 'Trace at least one harmful interleaving.', 'Separate safety from liveness claims.'] },
  { id: 'pa3', kind: 'Programming', title: 'Programming 3 · Synchronization System', focus: 'Coordinate concurrent actors with pthread locks and semaphores; historical source used traffic control.', modules: [7, 8, 9, 10], evidence: ['Deterministic test scenarios where possible.', 'Timestamped event trace.', 'Safety and progress argument.', 'Fall 2026 specification and deadline come from Canvas.'] }
] as const;

export const SOURCE_BOUNDARIES = {
  verifiedCurrent: [
    'Fall 2026, section 001',
    'Instructor: Dr. Probir Roy',
    'Mondays and Wednesdays, 2:00–3:45 p.m., CASL 1048',
    'GSI: Syed Salauddin Mohammad Tariq (Tariq)'
  ],
  historicalPolicy: [
    'Winter 2026 syllabus: participation 10%, homework 15%, programming 40%, exams 35% (midterm 15%, final 20%)',
    'Three homework assignments and four programming components',
    'OSTEP required and free online; xv6 recommended for projects'
  ],
  canvasOnly: [
    'Fall 2026 assignment wording, release dates, deadlines, submission types, team rules, and late policy',
    'Direct Fall 2026 course URL',
    'Exam dates, office hours, grading-policy changes, and official grades'
  ]
} as const;
