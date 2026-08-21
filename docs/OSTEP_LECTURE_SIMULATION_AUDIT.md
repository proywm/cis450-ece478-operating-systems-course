# OSTEP chapter, lecture, and simulator alignment audit

Audit date: 2026-08-20

## What was reviewed

The review treated every assigned reading as an individual source, not merely
as a chapter number in a schedule. For all 29 assigned OSTEP chapter PDFs, the
chapter title, crux/problem statement, section sequence, worked examples,
summary, and homework type were extracted and checked against the module
objectives, novice explanation, questions, and hands-on task. This was a
structured content audit, not a claim that every paragraph was copyedited.

All nine locally available instructor PowerPoint files were separately
converted to PDF/text and reviewed for their outline, definitions, examples,
APIs, and demonstrations. They cover concurrency and persistence only. No
process, scheduling, or virtual-memory lecture decks were found in the local
course source set; Modules 1–6 therefore state that they are grounded in the
book, syllabus, and historical assignments and do not claim a lecture match.

The official OSTEP homework repository was inspected at commit
`afb36ca8ddbf81d847d18f6bd18a87f0a18667f2`. Every selected preset below was
executed both without `-c` (prediction mode) and with `-c` (computed feedback).
The repository did not contain a top-level license file at that revision, so
its code is not copied into the extension or VSIX. Students explicitly fetch
the pinned official checkout; the extension adds a separate local guide and
container recipe without modifying upstream files.

## Individual map

| OSTEP reading | Module | Local lecture-deck comparison | Official simulator integrated | Alignment decision |
|---|---:|---|---|---|
| Ch. 2 Introduction | 1 | No matching deck found | None in official homework set | Use for virtualization/concurrency/persistence, protection, mechanism/policy, and course vocabulary. |
| Ch. 4 Process | 2 | No matching deck found | `cpu-intro/process-run.py` | State transitions and CPU/I/O overlap precede process API code. |
| Ch. 5 Process API | 2 | No matching deck found | No separate simulation; official homework is code-oriented | Guided C fork/exec/wait lab supplies the API practice. |
| Ch. 6 Limited Direct Execution | 3 | No matching deck found | No official simulation; chapter homework is measurement | Use traps, restricted operations, timer interrupts, context switch, and concurrency caveat before policies. |
| Ch. 7 Scheduling Introduction | 3 | No matching deck found | `cpu-sched/scheduler.py` | Fixed SJF preset requires Gantt, response, turnaround, and wait calculations. |
| Ch. 8 MLFQ | 3 | No matching deck found | `cpu-sched-mlfq/mlfq.py` | Preset exposes demotion, interactive I/O, accounting, and priority boost. |
| Ch. 9 Proportional Share | 3 | No matching deck found | `cpu-sched-lottery/lottery.py` | Learner maps random numbers to tickets and discusses short-run versus long-run fairness. |
| Ch. 10 Multiprocessor Scheduling | 3 | No matching deck found | `cpu-sched-multi/multi.py` | Two-CPU trace exposes queue choice, cache warmth, affinity, and load-balance questions. |
| Ch. 13 Address Spaces | 4 | No matching deck found | None in official homework set | Establish code/heap/stack, isolation, transparency, and efficiency before mechanisms. |
| Ch. 14 Memory API | 4 | No matching deck found | No simulation; official homework is code-oriented | Retain malloc/free/error questions and the portable C environment; do not force it into an address-translation tool. |
| Ch. 15 Address Translation | 4 | No matching deck found | `vm-mechanism/relocation.py` | Base/bounds preset requires validity before arithmetic. |
| Ch. 16 Segmentation | 4 | No matching deck found | `vm-segmentation/segmentation.py` | Two segments expose positive/negative growth, bounds, translation, and fragmentation. |
| Ch. 18 Paging | 5 | No matching deck found | `vm-paging/paging-linear-translate.py` | Learner separates VPN/offset, PTE validity, PFN, and preserved offset. |
| Ch. 19 TLBs | 5 | No matching deck found | No official simulation; chapter homework is measurement | Guided paging/TLB worksheet covers hit/miss state and explicitly distinguishes TLB miss from page fault. |
| Ch. 20 Advanced Page Tables | 5 | No matching deck found | `vm-smalltables/paging-multilevel-translate.py` | The UI warns that the compact dump needs the simulator README before page-directory/table interpretation. |
| Ch. 21 Swapping Mechanisms | 6 | No matching deck found | No official Python simulation; chapter homework is measurement/C | Page-fault control flow and residency remain in reading, questions, and guided lab. |
| Ch. 22 Swapping Policies | 6 | No matching deck found | `vm-beyondphys-policy/paging-policy.py` | Fixed FIFO trace asks for frames/hits/misses first and an LRU divergence explanation second. |
| Ch. 26 Concurrency Introduction | 7 | `2-1 concurrency-thread__.pptx` audited | `threads-intro/x86.py` | Deck and chapter align on thread state/shared memory/races; simplified x86 trace makes interleaving visible. |
| Ch. 27 Thread API | 7 | Same deck audited | No separate official simulation; official homework is code-oriented | Deck covers pthread creation/join; book plus guided pthread lab supplies fuller API correctness. |
| Ch. 28 Locks | 8 | `2-2 concurrency-lock__.pptx` audited | `threads-locks/x86.py` | Deck covers critical sections, mutexes, ownership, and implementation; test-and-set trace exposes atomic exchange/spinning. |
| Ch. 29 Lock-based Data Structures | 8 | No complete deck coverage | No distinct official simulation; official homework is code-oriented | Explicitly book-only for concurrent counters, lists, queues, hash tables, and granularity; not hidden under the locks deck. |
| Ch. 30 Condition Variables | 9 | `2-3 concurrency-condition variable.pptx` audited | No Python simulation; official homework is C code | Deck and chapter align on predicate, mutex, wait/signal, loop recheck, and producer/consumer. |
| Ch. 31 Semaphores | 9 | `2-4 concurrency-semaphore_.pptx` audited | No Python simulation; official homework is C code | Deck and chapter align on binary/counting roles, ordering, bounded buffer, readers/writers, and dining philosophers. |
| Ch. 32 Concurrency Bugs | 10 | `2-5 concurrency-deadlock.pptx` audited | No Python simulation; official homework is C code | Deck covers deadlock/resource graphs/strategies; reading remains required for atomicity and order violations and the broader bug taxonomy. |
| Ch. 36 I/O Devices | 11 | `3-1 persistence-IO_v3.pptx` audited | None in official homework set | Deck and chapter align on registers, polling, interrupts, DMA, drivers, and request path; guided `strace` lab adds observation. |
| Ch. 39 Files and Directories | 12 | `3-3 persistence-files and directories__.pptx` audited | No simulation; official homework is code-oriented | Deck covers descriptor/API/link/metadata concepts; book supplies full interface and mounting treatment; link/inode lab adds evidence. |
| Ch. 40 File-System Implementation | 13 | `3-4 persistence-very simple file system_.pptx` audited | `file-implementation/vsfs.py` | Deck and chapter align on blocks, bitmaps, inodes, directories, allocation, and access paths; simulator requires state-change inference. |
| Ch. 41 Fast File System | 13 | `3-5 persistence-fast file system and journaling_v2 (1).pptx` audited | `file-ffs/ffs.py` | Deck already references `ffs.py`; preset makes grouping/locality/large-file tradeoffs observable. |
| Ch. 42 Crash Consistency | 13 | Same deck audited | `file-journaling/fsck.py` | Deck and chapter align on crash states, fsck, journaling, and ordering. The selected tool diagnoses fsck-style inconsistency and is not mislabeled as a journal simulator. |

## Lecture-source coverage and known gaps

| Local deck | Extracted words | Matched reading | Important retained gap |
|---|---:|---|---|
| `2-1 concurrency-thread__.pptx` | 1,966 | Ch. 26–27 | Book remains primary for full pthread error handling and atomicity reasoning. |
| `2-2 concurrency-lock__.pptx` | 1,516 | Ch. 28 | Ch. 29 data-structure patterns are book-only. |
| `2-3 concurrency-condition variable.pptx` | 740 | Ch. 30 | Book remains primary for covering conditions and complete producer/consumer reasoning. |
| `2-4 concurrency-semaphore_.pptx` | 1,650 | Ch. 31 | Book remains primary for the full readers/writers and implementation discussion. |
| `2-5 concurrency-deadlock.pptx` | 1,568 | Ch. 32 | Non-deadlock atomicity/order bugs remain book-only. |
| `3-1 persistence-IO_v3.pptx` | 1,459 | Ch. 36 | Book contains the fuller driver case study. |
| `3-3 persistence-files and directories__.pptx` | 1,477 | Ch. 39 | Book contains the full API and mounting sequence. |
| `3-4 persistence-very simple file system_.pptx` | 2,345 | Ch. 40 | Book contains fuller access-path and caching/write-traffic analysis. |
| `3-5 persistence-fast file system and journaling_v2 (1).pptx` | 1,818 | Ch. 41–42 | Book contains the full crash-state matrix, recovery protocol, and alternative approaches. |

## Student-facing safeguards

- Every simulator card names the exact reading and prerequisite knowledge.
- Practice and reveal are separate controls; reveal requires confirmation that
  a prediction was recorded.
- Commands are fixed argument arrays executed without a shell.
- Python 3 and Docker routes are explicit; the extension does not silently
  install system software.
- Local run counts are self-evaluation only and are not uploaded or labeled as
  grades.
- Upstream tools are learning aids. Canvas controls whether and how any tool
  may be used for assessed work.
