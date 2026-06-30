# Development instructions for Agents
## Updating copilot-instructions.md with New Learnings

As you work on the codebase, you will discover important information, edge cases, and best practices that aren't yet documented:

1. **Capture insights**: When you encounter something non-obvious (e.g., a gotcha, a useful tip, an undocumented behavior), note it
2. **Update this file**: Add the information to the appropriate section in copilot-instructions.md
3. **Be concise**: Keep additions brief and actionable
4. **Include context**: Explain *why* the information matters, not just *what* it is

### Example Additions

Instead of:
> "The email quota endpoint sometimes times out"

Write:
> "The email quota endpoint can timeout if the database is under heavy load. If you see timeout errors in tests, increase the Prisma query timeout in `.env` or check for long-running queries in `npx prisma studio`"

Commit these updates as documentation improvements:
```
docs(agents): add note about email quota endpoint timeouts

Updates copilot-instructions.md with debugging guidance for common timeout issues.
```
