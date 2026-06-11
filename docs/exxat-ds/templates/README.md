# Exxat DS — templates

Markdown templates the agent fills in (or copies into a PR / docs folder) at
specific points of a design task.

| File | When the agent emits it |
|------|------------------------|
| `handoff.md` | After every design task that creates or rebuilds a surface, before the engineer wires real data. Source of truth for the design → engineering handoff. |

These ship via `@exxatdesignux/ui` and are written into the consumer repo at:

```
docs/exxat-ds/templates/<file>
```

…by `exxat-ui sync-extras`.

The agent locates the template via the `exxat-ux-discovery-protocol` rule
(see `.cursor/rules/exxat-ux-discovery-protocol.mdc`) and fills it in as
the closing artifact of a build.

Engineers do not edit these templates by hand. They open the filled-in copy
attached to a PR / saved at `docs/exxat-ds/handoff/<surface-slug>.md`.
