# University of Michigan-Dearborn Syllabus

## CIS 450 / ECE 478: Operating Systems, 4 Credits

**Semester:** Fall 2026  
**Section:** 001  
**Instructor:** Dr. Probir Roy  
**Office:** CIS Building, Room 230  
**Phone:** (313) 583-6620  
**Email:** probirr@umich.edu  
**Office hours:** See the current Canvas syllabus/announcement; or by appointment.  
**Course staffing:** No GSI or grader is currently assigned or confirmed; check
Canvas and department announcements for updates.
**Meetings:** Mondays and Wednesdays, 2:00–3:45 p.m., CASL 1048  
**Course site:** UM-Dearborn Canvas. Canvas is authoritative for announcements,
deadlines, assignment specifications, submissions, feedback, exam information,
and official grades.

> Instructor review required before Canvas publication. The meeting schedule
> is verified for Fall 2026. No GSI or grader is currently assigned or
> confirmed; check Canvas and department announcements for updates. The grading scheme below is carried
> forward from the matching Fall 2025 and Winter 2026 syllabi and must be
> confirmed by the instructor in Canvas.

## Course description

This course presents an operating system as a manager of computing resources,
including CPU, memory, files, disks, and devices. It studies processes and
threads, CPU scheduling, virtual memory, synchronization, deadlock, I/O, and
file systems, with hands-on work in C and a Unix-like teaching operating system.

**Prerequisites from the recent course syllabus:** CIS 310 and one of CIS
350/3501, IMSE 350, or ECE 370 with ECE/MATH 276; previous or concurrent IMSE
317. Students should verify their degree/program requirements in the catalog.

## Course goals and learning outcomes

The course is organized around three ideas: virtualization, concurrency, and
persistence. By the end of the course, students should be able to:

1. Explain core OS abstractions and the mechanisms and policies that implement
   them.
2. Analyze CPU scheduling, address translation, page replacement, and file
   system behavior using traces and quantitative metrics.
3. Identify race conditions, state invariants, and liveness risks; select and
   justify appropriate synchronization.
4. Build, modify, test, and explain basic OS components in a reproducible
   development environment.
5. Communicate design decisions, evidence, limitations, and team contributions
   clearly and professionally.

## Required materials and technology

- **Required, free online:** Remzi H. Arpaci-Dusseau and Andrea C.
  Arpaci-Dusseau, *Operating Systems: Three Easy Pieces* (OSTEP),
  <https://pages.cs.wisc.edu/~remzi/OSTEP/>.
- A computer capable of running VS Code and the course's visible Linux
  container through Docker on Windows, macOS, or Linux. Linux/macOS students
  may also use an already-installed native POSIX toolchain. The extension does
  not silently install Docker or change administrator settings. It provides a
  verified historical reference based on official MIT x86 `xv6-public` commit
  `eeb7b415dbcb12cc362d0783e41c3d1f44066b17`. Canvas will state whether the
  active Fall 2026 assignment uses that revision or another source/image.
- C and Unix command-line background. The course extension includes a setup
  check, portable workspace, fixed solution-free preflights for HW1, HW2, HW3,
  and PA3, small demonstrations, and practice activities.

Contact the instructor early if the required environment is inaccessible;
do not wait until an assignment deadline.

## Learning sequence

The SystemStudio OS extension presents every module as:

1. mapped OSTEP reading before class;
2. accessible text explanation and examples;
3. readiness questions with explanations;
4. hands-on trace, simulator, C/pthread, xv6, or file-system activity; and
5. private local reflection/progress.

Extension progress is self-reported and ungraded. It is not sent to Canvas or
staff and must not be confused with instructor or Canvas evaluation.

## Assessment and grading

| Category | Recent verified count | Weight carried forward for instructor confirmation |
|---|---:|---:|
| Participation / Canvas quizzes | Multiple | 10% |
| Homework | 3 | 15% |
| Programming | 4 components | 40% |
| Midterm examination | 1 | 15% |
| Final examination | 1 | 20% |
| **Total** |  | **100%** |

The local extension calculator accepts category percentages copied manually
from Canvas. It provides a planning estimate only, applies no unverified drop
rule, and never replaces the official Canvas grade.

### Letter-grade scale carried forward for instructor confirmation

| Grade | Range | Grade | Range | Grade | Range |
|---|---:|---|---:|---|---:|
| A+ | 96.67–100+ | A | 93.34–96.66 | A− | 90.00–93.33 |
| B+ | 86.67–89.99 | B | 83.34–86.66 | B− | 80.00–83.33 |
| C+ | 76.67–79.99 | C | 73.34–76.66 | C− | 70.00–73.33 |
| D+ | 66.67–69.99 | D | 63.34–66.66 | D− | 60.00–63.33 |
| E | 0–59.99 |  |  |  |  |

Do not infer a deadline, late penalty, team rule, submission format, exam
condition, or dropped score from a historical document. The Fall 2026 Canvas
item controls.

## Coursework progression

- Homework 1: CPU virtualization and scheduling
- Programming 1A: reproducible xv6 environment
- Programming 1B: process instrumentation
- Homework 2: memory virtualization
- Programming 2: xv6 scheduling
- Homework 3: concurrency
- Programming 3: synchronization system

These are planning titles grounded in recent offerings. Canvas will contain the
official Fall 2026 specifications and due dates.

For preparation, the extension can create a solution-free pinned xv6 workspace
and run local QEMU preflights for the historical PA1A, PA1B, and simplified
FQ/AQ/EQ scheduler behaviors. The known-good release reference passes the full
upstream xv6 `usertests` suite. These checks are formative: they do not upload,
submit, grade, or replace the current Canvas prompt or instructor evaluation.

## Feedback and help

Students should receive the rubric or evidence expectations when coursework is
released. For efficient help, send the instructor the relevant requirement,
your smallest reproducible attempt, expected behavior, actual output, and one
focused question. Questions about grades, accommodations, or private work
should use a private Canvas message rather than a public discussion.

The extension's offline helper offers concept routing and debugging prompts. It
does not have authority over deadlines or grades.

## Generative AI and academic integrity

University academic-integrity rules and the current Canvas assignment policy
apply. Unless Canvas explicitly authorizes otherwise, do not use an AI system
to produce code, calculations, explanations, reports, or other material that
you submit as your own. Never upload private course solutions, student data, or
restricted instructor material to a third-party service.

Appropriate learning questions include asking for a concept explanation, a
smaller analogous example, an explanation of an error message, or feedback on
reasoning you wrote. The extension's helper refuses requests for completed
assignment answers and redirects to invariants, traces, and the student's own
attempt.

## Attendance and participation

Regular participation is expected because demonstrations and hands-on
reasoning build on one another. Notify the instructor when circumstances affect
attendance. Consult Canvas for the current participation mechanism and campus
attendance policy.

## Accessibility and accommodations

The course provides semantic HTML lesson alternatives, keyboard-operable
extension content, visible focus, text explanations for diagrams, and
reflowable layouts. If any course material or tool creates an access barrier,
contact the instructor promptly so an equivalent path can be provided.

The University makes reasonable accommodations for documented disabilities.
Students should register with Disability and Accessibility Services each
semester and notify the instructor of approved accommodations. Current contact
and registration information is at
<https://umdearborn.edu/students/disability-services>.

## Academic conduct, respectful environment, and reporting

Students are responsible for following the UM-Dearborn Code of Academic
Conduct and the specific collaboration rules in each Canvas assignment. The
class should support respectful questions, partial reasoning, corrections, and
professional discussion. University reporting resources for harassment,
sexual violence, bias, and discrimination are available at
<https://umdearborn.edu/offices/enrollment-management-student-life/incident-and-complaint-reporting>.

## Fall 2026 calendar boundaries

- Wednesday, August 26: classes begin and first course meeting
- Monday, September 7: Labor Day, no class
- November 21–29: Thanksgiving recess; no November 23/25 meetings
- Monday, December 7: last regular class meeting
- December 8–9: study days
- December 10–16: final examination period; exact CIS 450 / ECE 478 details
  will be announced in Canvas

The extension exports 27 regular class meetings. Topics and assessed-work dates
may change; Canvas is authoritative.

## Topic map

1. OS overview and portable C/Unix environment
2. Processes and process APIs
3. CPU mechanisms and scheduling
4. Address spaces, relocation, and segmentation
5. Paging, TLBs, and page tables
6. Demand paging and replacement
7. Threads and race conditions
8. Locks and critical sections
9. Condition variables and semaphores
10. Deadlock and liveness
11. I/O devices
12. Files, directories, and metadata
13. File-system implementation and crash consistency
