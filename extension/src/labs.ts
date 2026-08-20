export interface GuidedLab {
  id: string;
  moduleNumber: number;
  title: string;
  purpose: string;
  source: string;
  steps: readonly { id: string; instruction: string; evidence: string }[];
  reflection: string;
  files: Readonly<Record<string, string>>;
  runCommand: string;
}

const commonBoundary = 'This is formative starter work. Read the current Canvas assignment before reusing or submitting any artifact.';

export const GUIDED_LABS: readonly GuidedLab[] = [
  {
    id: 'environment-evidence', moduleNumber: 1, title: 'Reproducible OS environment',
    purpose: 'Build, run, and document a minimal C program in the same container recipe used by later labs.', source: 'OSTEP Introduction; Winter 2026 setup goals', runCommand: 'make run',
    steps: [
      { id: 'inspect', instruction: 'Inspect the Dockerfile, compose file, Makefile, and starter source before running anything.', evidence: 'List the compiler, runtime, and mounted workspace assumptions.' },
      { id: 'predict', instruction: 'Predict the program output and identify which value can vary between runs.', evidence: 'A written output prediction with the PID marked variable.' },
      { id: 'build', instruction: 'Run the documented build with warnings enabled.', evidence: 'The exact command and an exit status of zero.' },
      { id: 'run', instruction: 'Run twice and compare the process identifiers.', evidence: 'Two outputs and one sentence explaining the difference.' },
      { id: 'report', instruction: 'Record Docker, compiler, and OS/container versions.', evidence: 'A reproducible environment report.' }
    ], reflection: `Explain why an environment recipe is a mechanism for reproducibility rather than proof that a program is correct. ${commonBoundary}`,
    files: { 'main.c': '#include <stdio.h>\n#include <unistd.h>\nint main(void){ printf("OS lab ready: pid=%ld\\n",(long)getpid()); return 0; }\n' }
  },
  {
    id: 'process-api', moduleNumber: 2, title: 'fork, exec, and wait trace',
    purpose: 'Predict and observe process creation, replacement, and parent-child ordering.', source: 'OSTEP Chapters 4–5; historical PA1 basis', runCommand: 'make run',
    steps: [
      { id: 'annotate', instruction: 'Mark which lines can run in parent, child, or both.', evidence: 'Annotated source with fork return-value branches.' },
      { id: 'predict', instruction: 'Predict all possible ordering relationships before running.', evidence: 'A partial-order diagram, not one guessed transcript.' },
      { id: 'run', instruction: 'Build and run at least three times.', evidence: 'Three PID/output traces.' },
      { id: 'wait', instruction: 'Move wait to the marked location and rerun.', evidence: 'Before/after order and the synchronization edge.' },
      { id: 'exec', instruction: 'Replace the child image using the provided harmless `/bin/echo` target.', evidence: 'A trace identifying which process image changed.' }
    ], reflection: `Explain why fork creates a process but exec does not. ${commonBoundary}`,
    files: { 'process_trace.c': '#include <stdio.h>\n#include <stdlib.h>\n#include <sys/wait.h>\n#include <unistd.h>\nint main(void){ pid_t p=fork(); if(p<0){perror("fork");return 1;} if(p==0){printf("child pid=%ld\\n",(long)getpid()); execl("/bin/echo","echo","child exec complete",(char*)0); perror("exec");_exit(1);} printf("parent pid=%ld child=%ld\\n",(long)getpid(),(long)p); /* TODO: move wait here, predict, then enable */ waitpid(p,NULL,0); return 0;}\n' }
  },
  {
    id: 'scheduler-trace', moduleNumber: 3, title: 'Scheduler metric workbench',
    purpose: 'Create Gantt traces and compute response and turnaround under explicit policy assumptions.', source: 'OSTEP Chapters 7–10; historical HW1/PA2 basis', runCommand: 'python3 scheduler_lab.py',
    steps: [
      { id: 'define', instruction: 'Read the workload and state the arrival/burst assumptions.', evidence: 'A workload table with units.' },
      { id: 'fcfs', instruction: 'Draw the FCFS Gantt chart by hand.', evidence: 'Start/completion time for every job.' },
      { id: 'sjf', instruction: 'Change the policy function to select the shortest ready job.', evidence: 'A second trace and code diff.' },
      { id: 'metrics', instruction: 'Compute response and turnaround from each trace.', evidence: 'Per-job arithmetic and averages.' },
      { id: 'interpret', instruction: 'Name the objective each policy serves and one workload limitation.', evidence: 'A bounded comparison claim.' }
    ], reflection: `Explain why no scheduler is “best” without a workload and objective. ${commonBoundary}`,
    files: { 'scheduler_lab.py': 'jobs=[("A",0,6),("B",0,2),("C",1,3)]\n# Start with FCFS. TODO: produce (name,start,finish) records, then implement non-preemptive SJF.\ntime=0\nfor name,arrival,burst in jobs:\n    time=max(time,arrival); start=time; time+=burst\n    print(name,start,time,"response",start-arrival,"turnaround",time-arrival)\n' }
  },
  {
    id: 'relocation-segmentation', moduleNumber: 4, title: 'Relocation and segmentation translations',
    purpose: 'Separate validity checks from translation arithmetic and expose fragmentation tradeoffs.', source: 'OSTEP Chapters 13–16; historical HW2 basis', runCommand: 'python3 translate.py',
    steps: [
      { id: 'table', instruction: 'Complete three base/bounds cases by hand.', evidence: 'Offset, bound decision, and physical address/fault.' },
      { id: 'run', instruction: 'Run the starter and compare its output.', evidence: 'Observed results with discrepancies marked.' },
      { id: 'invalid', instruction: 'Add a boundary and out-of-range address.', evidence: 'Two tests that distinguish `< bound` from `<= bound`.' },
      { id: 'segment', instruction: 'Add separate code, heap, and downward-growing stack records.', evidence: 'A segment table with permissions/growth.' },
      { id: 'holes', instruction: 'Sketch a placement that leaves unusable holes.', evidence: 'An external-fragmentation diagram.' }
    ], reflection: `Explain which checks are hardware mechanisms and which placement decisions are OS policy. ${commonBoundary}`,
    files: { 'translate.py': 'base,bound=4000,500\nfor va in [0,300,499,500,700]:\n    print(va, "fault" if va<0 or va>=bound else base+va)\n' }
  },
  {
    id: 'paging-tlb', moduleNumber: 5, title: 'Paging and TLB worksheet',
    purpose: 'Decompose addresses and distinguish TLB misses from invalid or nonresident pages.', source: 'OSTEP Chapters 18–20; historical HW2 basis', runCommand: 'python3 paging.py',
    steps: [
      { id: 'split', instruction: 'Compute VPN and offset for the provided addresses by hand.', evidence: 'Binary/hex split with the offset width.' },
      { id: 'pte', instruction: 'Trace each VPN through the small page table.', evidence: 'PTE validity/protection and PFN.' },
      { id: 'tlb', instruction: 'Mark hit/miss for the provided reference sequence.', evidence: 'A TLB-state table after every access.' },
      { id: 'compare', instruction: 'Explain one TLB miss that is not a page fault.', evidence: 'A complete lookup path.' },
      { id: 'sparse', instruction: 'Sketch which multi-level table nodes the mappings require.', evidence: 'A sparse page-table tree.' }
    ], reflection: `Explain why the offset is preserved and why a TLB miss is not a residency claim. ${commonBoundary}`,
    files: { 'paging.py': 'PAGE=1024\npt={0:3,1:7,4:2}\nfor va in [12,1030,4097,6144]:\n    vpn,off=divmod(va,PAGE)\n    print(hex(va),"vpn",vpn,"offset",off,"=>", "invalid" if vpn not in pt else pt[vpn]*PAGE+off)\n' }
  },
  {
    id: 'replacement', moduleNumber: 6, title: 'Page-replacement traces',
    purpose: 'Compare FIFO and LRU on the same reference string and frame count.', source: 'OSTEP Chapters 21–22; historical HW2 basis', runCommand: 'python3 replacement.py',
    steps: [
      { id: 'manual', instruction: 'Trace FIFO manually before running the script.', evidence: 'Frame contents and hit/fault per reference.' },
      { id: 'verify', instruction: 'Run the starter FIFO implementation.', evidence: 'Fault total reconciled with the manual trace.' },
      { id: 'lru', instruction: 'Implement the TODO LRU choice.', evidence: 'A code diff and new trace.' },
      { id: 'vary', instruction: 'Try at least two frame counts and two strings.', evidence: 'A comparison table.' },
      { id: 'locality', instruction: 'Explain one result using temporal locality.', evidence: 'A claim tied to trace positions.' }
    ], reflection: `Explain why one reference string cannot establish a universal policy ranking. ${commonBoundary}`,
    files: { 'replacement.py': 'refs=[1,2,3,1,4,1,2,5]\ncapacity=3\nframes=[];faults=0\nfor page in refs:\n    hit=page in frames\n    if not hit:\n        faults+=1\n        if len(frames)==capacity: frames.pop(0) # FIFO; TODO: implement LRU separately\n        frames.append(page)\n    print(page,list(frames),"hit" if hit else "fault")\nprint("faults",faults)\n' }
  },
  {
    id: 'thread-race', moduleNumber: 7, title: 'Observe and repair a data race',
    purpose: 'Relate a lost update to interleaved load/modify/store operations and dynamic race evidence.', source: 'OSTEP Chapters 26–27; lecture 2-1', runCommand: 'make run',
    steps: [
      { id: 'expand', instruction: 'Expand `counter++` into conceptual load, add, and store operations.', evidence: 'A harmful two-thread interleaving.' },
      { id: 'run', instruction: 'Run the unprotected version repeatedly.', evidence: 'Expected and observed totals.' },
      { id: 'sanitize', instruction: 'Build with ThreadSanitizer where the host supports it.', evidence: 'A bounded report: finding or platform limitation.' },
      { id: 'repair', instruction: 'Protect the update with the provided mutex TODO.', evidence: 'Code diff and repeated runs.' },
      { id: 'reason', instruction: 'State the invariant and why every conflicting access follows one discipline.', evidence: 'An invariant-based correctness argument.' }
    ], reflection: `Explain why clean test runs alone do not prove the race is absent. ${commonBoundary}`,
    files: { 'race.c': '#include <pthread.h>\n#include <stdio.h>\n#define N 200000\nlong counter=0; pthread_mutex_t lock=PTHREAD_MUTEX_INITIALIZER;\nvoid *work(void *p){(void)p;for(int i=0;i<N;i++){/* TODO: lock */ counter++; /* TODO: unlock */}return NULL;}\nint main(void){pthread_t a,b;pthread_create(&a,0,work,0);pthread_create(&b,0,work,0);pthread_join(a,0);pthread_join(b,0);printf("expected=%d observed=%ld\\n",2*N,counter);}\n' }
  },
  {
    id: 'lock-invariant', moduleNumber: 8, title: 'Lock an invariant, not a line',
    purpose: 'Use a mutex to make a multi-field account invariant observable and correct.', source: 'OSTEP Chapters 28–29; lecture 2-2', runCommand: 'make run',
    steps: [
      { id: 'invariant', instruction: 'State the relationship between debit, credit, and total before editing.', evidence: 'One precise invariant.' },
      { id: 'identify', instruction: 'Mark every read/write participating in that invariant.', evidence: 'A shared-state inventory.' },
      { id: 'lock', instruction: 'Place one mutex around the complete state transition.', evidence: 'A minimal code diff.' },
      { id: 'stress', instruction: 'Run with multiple transfer threads.', evidence: 'Final totals across repeated runs.' },
      { id: 'granularity', instruction: 'Describe when finer locks might help and what new proof they require.', evidence: 'A measured, conditional design note.' }
    ], reflection: `Explain why locking only the write to one field is insufficient. ${commonBoundary}`,
    files: { 'invariant.c': '#include <pthread.h>\n#include <stdio.h>\nlong left=100000,right=100000; pthread_mutex_t m=PTHREAD_MUTEX_INITIALIZER;\nvoid *move(void *p){(void)p;for(int i=0;i<50000;i++){pthread_mutex_lock(&m);left--;right++;pthread_mutex_unlock(&m);}return NULL;}\nint main(void){pthread_t a,b;pthread_create(&a,0,move,0);pthread_create(&b,0,move,0);pthread_join(a,0);pthread_join(b,0);printf("left=%ld right=%ld total=%ld\\n",left,right,left+right);}\n' }
  },
  {
    id: 'condition-buffer', moduleNumber: 9, title: 'Bounded buffer with a predicate',
    purpose: 'Coordinate producer/consumer progress using a mutex and condition variables.', source: 'OSTEP Chapters 30–31; lectures 2-3/2-4', runCommand: 'make run',
    steps: [
      { id: 'predicate', instruction: 'Write the empty and full predicates in terms of count and capacity.', evidence: 'Two Boolean expressions.' },
      { id: 'wait', instruction: 'Explain why each wait is in a while loop under the mutex.', evidence: 'A check-to-sleep reasoning trace.' },
      { id: 'complete', instruction: 'Fill the marked producer/consumer state changes.', evidence: 'Compiling code with balanced updates.' },
      { id: 'trace', instruction: 'Log enqueue, dequeue, wait, and wake events.', evidence: 'A trace that never violates 0 ≤ count ≤ capacity.' },
      { id: 'compare', instruction: 'Describe an equivalent counting-semaphore model.', evidence: 'Initial counts and wait/post meanings.' }
    ], reflection: `Explain the difference between the protected predicate and its notification. ${commonBoundary}`,
    files: { 'buffer.c': '#include <pthread.h>\n#include <stdio.h>\n#define CAP 2\nint count=0; pthread_mutex_t m=PTHREAD_MUTEX_INITIALIZER; pthread_cond_t nonempty=PTHREAD_COND_INITIALIZER,nonfull=PTHREAD_COND_INITIALIZER;\nvoid put(void){pthread_mutex_lock(&m);while(count==CAP)pthread_cond_wait(&nonfull,&m);count++;printf("put count=%d\\n",count);pthread_cond_signal(&nonempty);pthread_mutex_unlock(&m);}\nvoid get(void){pthread_mutex_lock(&m);while(count==0)pthread_cond_wait(&nonempty,&m);count--;printf("get count=%d\\n",count);pthread_cond_signal(&nonfull);pthread_mutex_unlock(&m);}\nvoid *producer(void*p){(void)p;for(int i=0;i<8;i++)put();return NULL;}void *consumer(void*p){(void)p;for(int i=0;i<8;i++)get();return NULL;}\nint main(void){pthread_t p,c;pthread_create(&p,0,producer,0);pthread_create(&c,0,consumer,0);pthread_join(p,0);pthread_join(c,0);}\n' }
  },
  {
    id: 'deadlock-order', moduleNumber: 10, title: 'Diagnose lock ordering safely',
    purpose: 'Model a wait-for cycle and repair it without requiring an indefinitely hanging process.', source: 'OSTEP Chapter 32; lecture 2-5', runCommand: 'python3 lock_order.py',
    steps: [
      { id: 'graph', instruction: 'Translate the provided acquisition sequences into a wait-for graph.', evidence: 'A labeled graph.' },
      { id: 'conditions', instruction: 'Identify the four necessary deadlock conditions in the scenario.', evidence: 'A condition-to-evidence table.' },
      { id: 'detect', instruction: 'Run the finite graph-cycle checker.', evidence: 'The detected cycle.' },
      { id: 'order', instruction: 'Rewrite both sequences to follow one global order.', evidence: 'Cycle-free checker output.' },
      { id: 'classify', instruction: 'Contrast deadlock, starvation, and livelock.', evidence: 'One observable signature for each.' }
    ], reflection: `Explain which necessary condition the global order removes. ${commonBoundary}`,
    files: { 'lock_order.py': 'waits={"T1":"T2","T2":"T1"}\nfor start in waits:\n    seen=[];cur=start\n    while cur in waits and cur not in seen:\n        seen.append(cur);cur=waits[cur]\n    if cur in seen: print("cycle:"," -> ".join(seen[seen.index(cur):]+[cur]))\n# TODO: represent a consistent A-before-B lock order and show why no wait-for cycle follows.\n' }
  },
  {
    id: 'io-trace', moduleNumber: 11, title: 'Trace the I/O path',
    purpose: 'Observe file-related system calls and distinguish user code, kernel work, and device completion.', source: 'OSTEP Chapter 36; lecture 3-1', runCommand: 'make trace',
    steps: [
      { id: 'predict', instruction: 'Predict which open/write/fsync/close calls the program will make.', evidence: 'An ordered call list.' },
      { id: 'run', instruction: 'Run normally and inspect the resulting file.', evidence: 'Program output and file content.' },
      { id: 'trace', instruction: 'Run the documented strace filter.', evidence: 'A short trace with return values.' },
      { id: 'boundary', instruction: 'Mark user/kernel crossings and blocking possibilities.', evidence: 'An annotated request path.' },
      { id: 'compare', instruction: 'Explain where polling, interrupt, or DMA could appear below the system-call view.', evidence: 'A layered diagram with stated inference.' }
    ], reflection: `Explain what strace directly observes and what device behavior it does not prove. ${commonBoundary}`,
    files: { 'io_trace.c': '#include <fcntl.h>\n#include <string.h>\n#include <unistd.h>\nint main(void){int fd=open("evidence.txt",O_CREAT|O_TRUNC|O_WRONLY,0644);if(fd<0)return 1;const char*s="observable write\\n";if(write(fd,s,strlen(s))<0)return 2;if(fsync(fd)<0)return 3;return close(fd)!=0;}\n' }
  },
  {
    id: 'links-metadata', moduleNumber: 12, title: 'Names, inodes, and links',
    purpose: 'Observe how directory entries, hard links, symbolic links, and open descriptors differ.', source: 'OSTEP Chapter 39; lecture 3-3', runCommand: 'bash links_lab.sh',
    steps: [
      { id: 'create', instruction: 'Create an isolated temporary tree using the script.', evidence: 'The displayed tree.' },
      { id: 'inode', instruction: 'Compare inode and link-count output.', evidence: 'A name-to-inode diagram.' },
      { id: 'unlink', instruction: 'Predict and then observe removal of the original name.', evidence: 'Hard-link and symlink behavior after unlink.' },
      { id: 'descriptor', instruction: 'Explain why an already-open descriptor can outlive a pathname.', evidence: 'A reference-count explanation.' },
      { id: 'cleanup', instruction: 'Review the script cleanup trap and confirm it touches only its temporary directory.', evidence: 'The resolved temporary path.' }
    ], reflection: `Explain why a pathname is not the persistent object itself. ${commonBoundary}`,
    files: { 'links_lab.sh': "#!/usr/bin/env bash\nset -eu\nlab_dir=\"$(mktemp -d)\"\ntrap 'rm -rf -- \"$lab_dir\"' EXIT\nprintf \"data\\n\" > \"$lab_dir/original\"\nln \"$lab_dir/original\" \"$lab_dir/hard\"\nln -s original \"$lab_dir/symbolic\"\nls -li \"$lab_dir\"\nrm \"$lab_dir/original\"\nprintf \"after unlink:\\n\"\nls -li \"$lab_dir\"\nprintf \"hard content: \"; cat \"$lab_dir/hard\"\n" }
  },
  {
    id: 'crash-consistency', moduleNumber: 13, title: 'Crash-consistency update plan',
    purpose: 'Reason about multi-write invariants and journaling without corrupting a real file system.', source: 'OSTEP Chapters 40–42; lectures 3-4/3-5', runCommand: 'python3 crash_model.py',
    steps: [
      { id: 'invariant', instruction: 'State the consistency relationship among bitmap, inode, and data block.', evidence: 'A three-part invariant.' },
      { id: 'orders', instruction: 'Enumerate prefixes of the update sequence.', evidence: 'Possible crash points.' },
      { id: 'classify', instruction: 'Run the model and classify each prefix.', evidence: 'Consistent/inconsistent table.' },
      { id: 'journal', instruction: 'Add conceptual journal begin/update/commit/replay events.', evidence: 'A recovery state diagram.' },
      { id: 'bound', instruction: 'State what this model omits about actual disks and file systems.', evidence: 'At least two limitations.' }
    ], reflection: `Explain how journaling narrows recovery states without claiming that every write is instantly durable. ${commonBoundary}`,
    files: { 'crash_model.py': 'steps=["allocate_bitmap","initialize_data","link_inode"]\nfor completed in range(len(steps)+1):\n    prefix=steps[:completed]\n    allocated="allocate_bitmap" in prefix\n    data="initialize_data" in prefix\n    linked="link_inode" in prefix\n    consistent=(not linked or (allocated and data))\n    print(prefix,"consistent" if consistent else "BROKEN invariant")\n# TODO: model journal begin, records, commit, home writes, and replay eligibility.\n' }
  }
];

export function guidedLab(moduleNumber: number): GuidedLab | undefined {
  return GUIDED_LABS.find((lab) => lab.moduleNumber === moduleNumber);
}
