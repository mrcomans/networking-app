# LinkedIn spike (MVP)

## TL;DR
Voor de MVP rekenen we **niet** op een volledige LinkedIn connectielijst via officiële API. We implementeren daarom een **fallback** waarbij deelnemers hun connecties handmatig kunnen plakken/importeren (1 naam per regel).

## Waarom (kort)
- LinkedIn APIs zijn sterk gelimiteerd en doorgaans niet bedoeld om een volledige connectielijst te exporteren voor algemene apps.
- Praktisch gevolg: het risico op blokkade (permissions/review) is hoog en timing is onvoorspelbaar voor “Power Hour”.

## MVP aanpak
- Provider-interface in code: `upload | linkedin | none`
- MVP shipped: `upload` (handmatig) + matching op genormaliseerde naam binnen 1 event.
- `linkedin` blijft een toekomstige provider: OAuth flow + matchen op providerUserId indien beschikbaar.

