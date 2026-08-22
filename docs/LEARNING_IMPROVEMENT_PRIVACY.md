# Learning-improvement data: dormant pre-IRB design

Status for this release: **disabled**.

The institutional gate is compiled off, and both the protocol identifier and endpoint are blank. Students see no research-consent prompt; no learning-improvement event is recorded or transmitted. VS Code settings cannot override this gate.

Existing private course progress remains separate and local. Module status, confidence, practice history, lab checkmarks, simulator history, grade-planner values, and walkthrough position are never retrospectively copied into a later research queue.

After institutional/IRB review, a new reviewed release may offer separate opt-ins for coarse technical setup outcomes; ungraded tutorial, practice, guided-lab, and simulator outcomes; and fixed-choice helpfulness feedback. The proposed event dictionary uses course-week, duration, and attempt buckets rather than exact timestamps or clickstream data.

The JSON payload excludes names, emails, UMIDs, IP addresses, Canvas identifiers or records, grades and planner values, student files/code, paths, terminal output, logs, AI/FAQ prompts or conversations, credentials, exact timestamps, and stable student/device identifiers. The queue is limited to 300 events. The future endpoint review must separately cover ordinary HTTPS request metadata, request-log minimization, and retention. No pre/post survey or longitudinal linkage is active pending approval of its exact protocol.

In a future enabled release, students may choose each category, preview and export the exact JSON, explicitly approve each batch, withdraw, and delete the queue. Nothing sends automatically, and the endpoint must be approved U-M HTTPS infrastructure.

Before enabling `extension/src/learningImprovementCore.ts`, document the determination/protocol, freeze instruments and event definitions, provision and security-review the U-M endpoint, test decline/withdraw/delete/no-network behavior, and ship the change only as a new reviewed release.
