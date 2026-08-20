# Homework 2 preparation: memory virtualization

**Authority:** Planning guide only. Canvas controls the active questions and
submission.

Prepare base/bounds and segmentation translation, placement/fragmentation,
paging, VPN/offset/PFN decomposition, TLB effective-access time, multi-level
page tables, page faults, and FIFO/OPT/LRU/Clock replacement.

Evidence check: label every bit field and unit, show translation arithmetic,
distinguish TLB miss from page fault, show probability terms, and include a
frame-by-frame replacement trace rather than only a fault count.

## Executable formative route

Use the **relocation and segmentation**, **paging and TLB**, and **page
replacement** guided labs. Their completed internal references check boundary
faults, PTE/TLB behavior, and FIFO/LRU traces. Effective-access-time derivation
and the current Canvas questions remain manual work.

Create the portable coursework workspace once, then choose **Run Portable
Coursework Preflight → HW2**. The same supplied Python runtime executes the
translation, paging, and replacement analogs on Windows, macOS, and Linux;
students do not need to assemble separate per-homework environments.
