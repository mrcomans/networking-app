# Power Hour readiness checklist (MVP)

## Vooraf (1 dag / paar uur)
- App start lokaal: `npm run dev`
- Browser test op laptop + telefoon (QR scanning)
- Event aanmaken op `/` en links werken:
  - Deelnemers: `/e/{slug}`
  - Organizer: `/organizer/{eventId}`
- 2 test deelnemers registreren en visibility testen:
  - default = hidden
  - public zichtbaar (maar alleen als match)
  - connections_only zichtbaar bij match

## Tijdens event (live)
- Maak 1 event aan, plak/deel de deelnemers-link als QR.
- Communiceer opt-in duidelijk:
  - “Je bent standaard onzichtbaar.”
  - “Je kunt je zichtbaarheid aanpassen bij aanmelden.”
- Laat deelnemers connecties plakken (1 per regel) en daarna refreshen op “Bekenden”.

## Bekende beperkingen (bewust voor MVP)
- Data is **Postgres-backed** (via `DATABASE_URL`): server restart = data blijft.
- LinkedIn connecties via officiële API niet in MVP; we gebruiken handmatige input.
- Matching is op genormaliseerde naam (kan false positives/negatives geven).

