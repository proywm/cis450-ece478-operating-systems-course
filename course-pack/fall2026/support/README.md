# AI support publishing checklist

1. Use `CODEX_AGENTS.md` as the source-of-truth workspace policy and verify it is generated into portable, guided-lab, OSTEP, and xv6 workspaces.
2. Confirm generated student workspaces contain the course `AGENTS.md` policy and that U-M Codex reads it.
3. Reindex after changing setup documentation or Canvas modules.
4. Test the App as a student: one course-source question, one Docker-engine diagnostic, one Apple-silicon diagnostic, one unsupported managed-device case, and one direct request for an assessed solution.
5. Configure only the published student App/share URL in SystemStudio. Do not distribute a Project detail, settings, data-source, or billing URL.

U-M Codex explains reviewed diagnostics; SystemStudio performs and verifies bounded local actions. The deterministic offline Orbit FAQ remains the no-AI fallback. No private instructor-hosted model, shared instructor key, or student key is stored by the extension.
