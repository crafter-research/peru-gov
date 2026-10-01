# Hola, Perú

Unofficial Crafter Research prototype. Describe your situation and it routes you to the right procedure on gob.pe, showing the official page's own text and a link to the source. It is not a government site.

## How it works

1. A small model rewrites the question into gob.pe-style procedure titles.
2. The question and rewrites are embedded and matched against every top-level gob.pe page title (about 32k pages from the official sitemap).
3. Jev (`typesafe-ai/jev`) picks one of the top 25 candidates or none.
4. If Jev picks none but the rewrite found procedures, the user is asked to choose. If neither found anything, the app says so and links to gob.pe search.
5. The answer card renders the official sections verbatim. A model writes a two-sentence summary using only that page.

Shaping, spikes and measurements live in the Crafter vault (`04_Projects/_shaping/peru-gov/`).

## Run locally

```bash
bun install
cp .env.example .env.local   # add an AI Gateway key from the Crafter team
bun dev
```

Without `data/catalog.i8`, routing only considers the fichas in `data/fichas/`.

## Corpus

```bash
bun corpus:scan    # sitemap → data/index.json (5s between requests, never drops entries)
bun corpus:tree    # variant tree from slug hierarchy → data/tree.json
bun corpus:embed   # catalog titles → data/catalog.{json,f32} (needs the key)
bun corpus:crawl --limit 100   # fetch changed pages and extract fichas
bun dataset        # local snapshot in dist/dataset
```

The crawler follows gob.pe's `robots.txt`: it uses the declared sitemap instead of paginated search, and waits 5 seconds between requests.

## Checks

```bash
bun test && bun typecheck && bunx biome check .
bun eval   # held-out routing eval; fails below the measured baseline (39/46)
```

Scripts unset any inherited `AI_GATEWAY_API_KEY` so `.env.local` (the Crafter key) always wins; a key exported in your shell would otherwise take precedence and bill another team.
