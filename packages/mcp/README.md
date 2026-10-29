# semark-mcp

Sema as tools for agents, over the Model Context Protocol (stdio).

```sh
semark-mcp path/to/corpus          # the folder that holds patterns.md
```

| Tool | What it returns |
| --- | --- |
| `semark_check` | what `semark check` prints: problems with file and line, readiness per screen; `json: true` for the structured report |
| `semark_page` | one page: its tokens with what each resolved to and the walk it took, the diagnostics on the page, its readiness, and the drawing as data |
| `semark_dump` | the whole resolved model: designs, pages in reading order, definitions, diagnostics, readiness |

Add it to an agent's MCP configuration as a stdio server, for example:

```json
{ "mcpServers": { "semark": { "command": "npx", "args": ["semark-mcp", "docs/design"] } } }
```

The server speaks `initialize`, `tools/list` and `tools/call`, and nothing else; it has no dependencies beyond `semark`.
