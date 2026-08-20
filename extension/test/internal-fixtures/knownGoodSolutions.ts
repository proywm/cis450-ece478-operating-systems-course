export interface KnownGoodFixture {
  id: string;
  labId: string;
  language: 'c' | 'python' | 'bash';
  filename: string;
  source: string;
  expectedOutput: readonly string[];
}

/**
 * Internal release fixtures only. These solve small formative analogs used to
 * prove that each public guided-lab workflow has a known-good executable path.
 * They are excluded from the VSIX and are not Fall 2026 assignment answers.
 */
export const KNOWN_GOOD_LAB_FIXTURES: readonly KnownGoodFixture[] = [
  {
    id: 'ref-environment', labId: 'environment-evidence', language: 'c', filename: 'reference.c',
    source: '#include <stdio.h>\n#include <unistd.h>\nint main(void){if(getpid()<=0)return 1;puts("environment-ok");return 0;}\n',
    expectedOutput: ['environment-ok']
  },
  {
    id: 'ref-process-api', labId: 'process-api', language: 'c', filename: 'reference.c',
    source: '#include <stdio.h>\n#include <stdlib.h>\n#include <sys/wait.h>\n#include <unistd.h>\nint main(void){pid_t p=fork();if(p<0)return 1;if(p==0){execl("/bin/echo","echo","child-exec-ok",(char*)0);_exit(2);}int status=0;if(waitpid(p,&status,0)!=p||!WIFEXITED(status)||WEXITSTATUS(status)!=0)return 3;puts("parent-wait-ok");return 0;}\n',
    expectedOutput: ['child-exec-ok', 'parent-wait-ok']
  },
  {
    id: 'ref-scheduler', labId: 'scheduler-trace', language: 'python', filename: 'reference.py',
    source: `jobs=[("A",0,6),("B",0,2),("C",1,3)]
def schedule(policy):
    waiting=list(jobs); time=0; trace=[]
    while waiting:
        ready=[j for j in waiting if j[1] <= time]
        if not ready:
            time=min(j[1] for j in waiting); ready=[j for j in waiting if j[1] <= time]
        job=min(ready,key=(lambda j:(j[2],j[1],j[0]))) if policy=="sjf" else ready[0]
        waiting.remove(job); name,arrival,burst=job; start=time; time+=burst
        trace.append((name,start,time,start-arrival,time-arrival))
    return trace
fcfs=schedule("fcfs"); sjf=schedule("sjf")
assert fcfs==[("A",0,6,0,6),("B",6,8,6,8),("C",8,11,7,10)]
assert sjf==[("B",0,2,0,2),("C",2,5,1,4),("A",5,11,5,11)]
print("scheduler-ok",fcfs,sjf)
`,
    expectedOutput: ['scheduler-ok', "('B', 0, 2, 0, 2)"]
  },
  {
    id: 'ref-relocation', labId: 'relocation-segmentation', language: 'python', filename: 'reference.py',
    source: `def relocate(va,base,bound):
    if va < 0 or va >= bound: return "fault"
    return base+va
assert [relocate(v,4000,500) for v in (0,499,500)]==[4000,4499,"fault"]
segments={"code":(1000,256,"rx"),"heap":(3000,512,"rw")}
assert relocate(120,*segments["code"][:2])==1120
assert relocate(600,*segments["heap"][:2])=="fault"
print("relocation-ok")
`,
    expectedOutput: ['relocation-ok']
  },
  {
    id: 'ref-paging', labId: 'paging-tlb', language: 'python', filename: 'reference.py',
    source: `PAGE=1024; pt={0:3,1:7,4:2}; tlb={}; hits=0; misses=0
def translate(va):
    global hits,misses
    vpn,off=divmod(va,PAGE)
    if vpn in tlb: hits+=1; pfn=tlb[vpn]
    else:
        misses+=1
        if vpn not in pt: return None
        pfn=pt[vpn]; tlb[vpn]=pfn
    return pfn*PAGE+off
result=[translate(v) for v in (12,1030,12,4097,6144)]
assert result==[3084,7174,3084,2049,None] and hits==1 and misses==4
print("paging-ok hits=1 misses=4")
`,
    expectedOutput: ['paging-ok hits=1 misses=4']
  },
  {
    id: 'ref-replacement', labId: 'replacement', language: 'python', filename: 'reference.py',
    source: `refs=[1,2,3,1,4,1,2,5]
def faults(policy,capacity=3):
    frames=[]; count=0
    for page in refs:
        if page in frames:
            if policy=="lru": frames.remove(page); frames.append(page)
            continue
        count+=1
        if len(frames)==capacity: frames.pop(0)
        frames.append(page)
    return count
assert faults("fifo")==7 and faults("lru")==6
print("replacement-ok fifo=7 lru=6")
`,
    expectedOutput: ['replacement-ok fifo=7 lru=6']
  },
  {
    id: 'ref-race', labId: 'thread-race', language: 'c', filename: 'reference.c',
    source: '#include <pthread.h>\n#include <stdio.h>\n#define N 200000\nstatic long counter=0;static pthread_mutex_t lock=PTHREAD_MUTEX_INITIALIZER;\nstatic void *work(void *p){(void)p;for(int i=0;i<N;i++){pthread_mutex_lock(&lock);counter++;pthread_mutex_unlock(&lock);}return NULL;}\nint main(void){pthread_t a,b;if(pthread_create(&a,0,work,0)||pthread_create(&b,0,work,0))return 1;pthread_join(a,0);pthread_join(b,0);if(counter!=2L*N)return 2;printf("race-fixed-ok counter=%ld\\n",counter);return 0;}\n',
    expectedOutput: ['race-fixed-ok counter=400000']
  },
  {
    id: 'ref-lock-invariant', labId: 'lock-invariant', language: 'c', filename: 'reference.c',
    source: '#include <pthread.h>\n#include <stdio.h>\nstatic long left=100000,right=100000;static pthread_mutex_t lock=PTHREAD_MUTEX_INITIALIZER;\nstatic void *move(void *p){(void)p;for(int i=0;i<50000;i++){pthread_mutex_lock(&lock);left--;right++;pthread_mutex_unlock(&lock);}return NULL;}\nint main(void){pthread_t a,b;pthread_create(&a,0,move,0);pthread_create(&b,0,move,0);pthread_join(a,0);pthread_join(b,0);if(left+right!=200000||left!=0||right!=200000)return 1;puts("invariant-ok total=200000");return 0;}\n',
    expectedOutput: ['invariant-ok total=200000']
  },
  {
    id: 'ref-condition-buffer', labId: 'condition-buffer', language: 'c', filename: 'reference.c',
    source: '#include <pthread.h>\n#include <stdio.h>\n#define CAP 2\nstatic int data[CAP],head=0,tail=0,count=0,sum=0;static pthread_mutex_t m=PTHREAD_MUTEX_INITIALIZER;static pthread_cond_t nonempty=PTHREAD_COND_INITIALIZER,nonfull=PTHREAD_COND_INITIALIZER;\nstatic void put(int v){pthread_mutex_lock(&m);while(count==CAP)pthread_cond_wait(&nonfull,&m);data[tail]=v;tail=(tail+1)%CAP;count++;pthread_cond_signal(&nonempty);pthread_mutex_unlock(&m);}\nstatic int get(void){pthread_mutex_lock(&m);while(count==0)pthread_cond_wait(&nonempty,&m);int v=data[head];head=(head+1)%CAP;count--;pthread_cond_signal(&nonfull);pthread_mutex_unlock(&m);return v;}\nstatic void *producer(void*p){(void)p;for(int i=1;i<=8;i++)put(i);return NULL;}static void *consumer(void*p){(void)p;for(int i=1;i<=8;i++)sum+=get();return NULL;}\nint main(void){pthread_t p,c;pthread_create(&p,0,producer,0);pthread_create(&c,0,consumer,0);pthread_join(p,0);pthread_join(c,0);if(sum!=36||count!=0)return 1;puts("buffer-ok sum=36 count=0");return 0;}\n',
    expectedOutput: ['buffer-ok sum=36 count=0']
  },
  {
    id: 'ref-deadlock', labId: 'deadlock-order', language: 'python', filename: 'reference.py',
    source: `def cyclic(graph):
    for start in graph:
        seen=set(); cur=start
        while cur in graph:
            if cur in seen: return True
            seen.add(cur); cur=graph[cur]
    return False
inverted={"T1":"T2","T2":"T1"}; ordered={"T2":"T1"}
assert cyclic(inverted) and not cyclic(ordered)
print("deadlock-ok inversion=cycle global-order=acyclic")
`,
    expectedOutput: ['deadlock-ok inversion=cycle global-order=acyclic']
  },
  {
    id: 'ref-io', labId: 'io-trace', language: 'c', filename: 'reference.c',
    source: '#include <fcntl.h>\n#include <stdio.h>\n#include <string.h>\n#include <unistd.h>\nint main(void){const char*s="observable write\\n";int fd=open("evidence.txt",O_CREAT|O_TRUNC|O_WRONLY,0644);if(fd<0||write(fd,s,strlen(s))!=(ssize_t)strlen(s)||fsync(fd)||close(fd))return 1;char b[32]={0};fd=open("evidence.txt",O_RDONLY);if(fd<0||read(fd,b,sizeof b)!=(ssize_t)strlen(s)||close(fd)||strcmp(b,s))return 2;puts("io-ok content-verified");return 0;}\n',
    expectedOutput: ['io-ok content-verified']
  },
  {
    id: 'ref-links', labId: 'links-metadata', language: 'bash', filename: 'reference.sh',
    source: "#!/usr/bin/env bash\nset -euo pipefail\nlab_dir=\"$(mktemp -d)\"\ntrap 'rm -rf -- \"$lab_dir\"' EXIT\nprintf 'data\\n' > \"$lab_dir/original\"\nln \"$lab_dir/original\" \"$lab_dir/hard\"\nln -s original \"$lab_dir/symbolic\"\ntest \"$(stat -c %i \"$lab_dir/original\")\" = \"$(stat -c %i \"$lab_dir/hard\")\"\nrm \"$lab_dir/original\"\ntest \"$(cat \"$lab_dir/hard\")\" = data\ntest -L \"$lab_dir/symbolic\" && test ! -e \"$lab_dir/symbolic\"\nprintf 'links-ok hard-survives symlink-dangles\\n'\n",
    expectedOutput: ['links-ok hard-survives symlink-dangles']
  },
  {
    id: 'ref-crash', labId: 'crash-consistency', language: 'python', filename: 'reference.py',
    source: `updates=["allocate","initialize","link"]
def consistent(prefix): return "link" not in prefix or ("allocate" in prefix and "initialize" in prefix)
assert all(consistent(updates[:n]) for n in range(4))
journal=["begin","records","commit"]
def replay(prefix): return updates if "commit" in prefix else []
assert replay(journal[:2])==[] and replay(journal)==updates and consistent(replay(journal))
print("crash-ok committed-replay-consistent")
`,
    expectedOutput: ['crash-ok committed-replay-consistent']
  }
] as const;

export interface LabReferenceCoverage {
  fixtureId: string;
  automatedStepIds: readonly string[];
  manualStepIds: readonly string[];
  limitation: string;
}

export const LAB_REFERENCE_COVERAGE: Readonly<Record<string, LabReferenceCoverage>> = {
  'environment-evidence': { fixtureId: 'ref-environment', automatedStepIds: ['build', 'run'], manualStepIds: ['inspect', 'predict', 'report'], limitation: 'Version-report quality and the student explanation require human review.' },
  'process-api': { fixtureId: 'ref-process-api', automatedStepIds: ['run', 'wait', 'exec'], manualStepIds: ['annotate', 'predict'], limitation: 'The partial-order diagram and source annotation are not machine-graded.' },
  'scheduler-trace': { fixtureId: 'ref-scheduler', automatedStepIds: ['fcfs', 'sjf', 'metrics'], manualStepIds: ['define', 'interpret'], limitation: 'Policy-objective interpretation remains a written reasoning task.' },
  'relocation-segmentation': { fixtureId: 'ref-relocation', automatedStepIds: ['run', 'invalid', 'segment'], manualStepIds: ['table', 'holes'], limitation: 'Hand calculations and fragmentation diagrams require human review.' },
  'paging-tlb': { fixtureId: 'ref-paging', automatedStepIds: ['pte', 'tlb', 'compare'], manualStepIds: ['split', 'sparse'], limitation: 'Binary decomposition and sparse-table sketches require human review.' },
  replacement: { fixtureId: 'ref-replacement', automatedStepIds: ['verify', 'lru'], manualStepIds: ['manual', 'vary', 'locality'], limitation: 'The release fixture proves one reference string; students must still vary workloads and explain locality.' },
  'thread-race': { fixtureId: 'ref-race', automatedStepIds: ['run', 'repair'], manualStepIds: ['expand', 'sanitize', 'reason'], limitation: 'ThreadSanitizer availability is platform-dependent and an invariant argument requires human review.' },
  'lock-invariant': { fixtureId: 'ref-lock-invariant', automatedStepIds: ['lock', 'stress'], manualStepIds: ['invariant', 'identify', 'granularity'], limitation: 'Invariant inventory and granularity tradeoffs require human review.' },
  'condition-buffer': { fixtureId: 'ref-condition-buffer', automatedStepIds: ['complete'], manualStepIds: ['predicate', 'wait', 'trace', 'compare'], limitation: 'The bounded run checks completion and the final invariant; event-trace and semaphore reasoning require review.' },
  'deadlock-order': { fixtureId: 'ref-deadlock', automatedStepIds: ['detect', 'order'], manualStepIds: ['graph', 'conditions', 'classify'], limitation: 'Graph construction and liveness classification require human review.' },
  'io-trace': { fixtureId: 'ref-io', automatedStepIds: ['run'], manualStepIds: ['predict', 'trace', 'boundary', 'compare'], limitation: 'strace and device-layer observations depend on the runtime; the fixture validates file-system-call behavior only.' },
  'links-metadata': { fixtureId: 'ref-links', automatedStepIds: ['create', 'inode', 'unlink', 'cleanup'], manualStepIds: ['descriptor'], limitation: 'The open-descriptor lifetime explanation remains a reasoning task.' },
  'crash-consistency': { fixtureId: 'ref-crash', automatedStepIds: ['invariant', 'classify', 'journal'], manualStepIds: ['orders', 'bound'], limitation: 'This finite model is not a real disk crash or an xv6 file-system recovery test.' }
} as const;

export interface CourseworkReferenceCheck {
  fixtureIds: readonly string[];
  automatedEvidenceIndexes: readonly number[];
  manualEvidenceIndexes: readonly number[];
  limitation: string;
  xv6PreflightMode?: 'pa1a' | 'pa1b' | 'pa2';
}

/** Maps every published planning-guide evidence line to executable or manual verification. */
export const COURSEWORK_REFERENCE_CHECKS: Readonly<Record<string, CourseworkReferenceCheck>> = {
  hw1: { fixtureIds: ['ref-process-api', 'ref-scheduler'], automatedEvidenceIndexes: [0, 1], manualEvidenceIndexes: [2], limitation: 'Canvas controls the active questions and submission format.' },
  pa1a: { fixtureIds: ['ref-environment'], automatedEvidenceIndexes: [0, 1], manualEvidenceIndexes: [2], xv6PreflightMode: 'pa1a', limitation: 'The real-kernel preflight validates the pinned historical reference; Canvas must confirm whether Fall 2026 uses the same revision and requirements.' },
  pa1b: { fixtureIds: ['ref-process-api'], automatedEvidenceIndexes: [0, 1], manualEvidenceIndexes: [2], xv6PreflightMode: 'pa1b', limitation: 'The real-kernel preflight validates source anchors and runtime behavior, while the student explanation and active Canvas requirements remain human-reviewed.' },
  hw2: { fixtureIds: ['ref-relocation', 'ref-paging', 'ref-replacement'], automatedEvidenceIndexes: [0, 2], manualEvidenceIndexes: [1], limitation: 'Effective-access-time probability derivations remain manual; Canvas controls the active questions.' },
  pa2: { fixtureIds: ['ref-scheduler'], automatedEvidenceIndexes: [1], manualEvidenceIndexes: [0, 2, 3], xv6PreflightMode: 'pa2', limitation: 'The real-kernel preflight validates the pinned historical behavior and upstream regressions, not every interleaving or active Canvas rubric item.' },
  hw3: { fixtureIds: ['ref-race', 'ref-lock-invariant', 'ref-condition-buffer', 'ref-deadlock'], automatedEvidenceIndexes: [0, 1], manualEvidenceIndexes: [2], limitation: 'Safety/liveness prose and the active Canvas scenarios require human review.' },
  pa3: { fixtureIds: ['ref-lock-invariant', 'ref-condition-buffer', 'ref-deadlock'], automatedEvidenceIndexes: [0], manualEvidenceIndexes: [1, 2, 3], limitation: 'The historical traffic scenario may change; timestamps, argument quality, and current Canvas rules are not reproducible locally.' }
} as const;
