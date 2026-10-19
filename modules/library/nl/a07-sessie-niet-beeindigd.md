## Sessie blijft geldig na uitloggen en verloopt niet

**Severity**: Medium · **CVSS 3.1**: 6.5 (`CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:L/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A07:2021, WSTG-SESS-06, WSTG-SESS-07, V3 · **CWE**: 613 · **Tags**: web, api, sessiebeheer

**Affected**:

- (vul in: host, URL of systeem)

### Description

Na uitloggen blijft het sessietoken server-side geldig: een eerder vastgelegd token kan na het uitloggen nog worden gebruikt. Daarnaast kent de sessie geen absolute levensduur en geen inactiviteitstime-out, waardoor een eenmaal verkregen token onbeperkt bruikbaar blijft. Bij JWT's zonder server-side intrekking is dit een bekend ontwerpprobleem.

### Impact

Een token dat ooit lekt (via logs, een gedeelde computer, een proxy of een andere kwetsbaarheid) geeft blijvend toegang tot het account, ook nadat de gebruiker heeft uitgelogd of zijn wachtwoord heeft gewijzigd.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Maak tokens server-side ongeldig bij uitloggen, bij wachtwoordwijziging en bij het intrekken van sessies door een beheerder; bij JWT's door een korte levensduur te combineren met refresh tokens die wél kunnen worden ingetrokken.
- Stel een inactiviteitstime-out in (bijvoorbeeld 30 minuten voor gevoelige applicaties) en een absolute maximale sessieduur.
- Toon gebruikers hun actieve sessies en bied de mogelijkheid die te beëindigen.

### References

- OWASP Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- CWE-613: https://cwe.mitre.org/data/definitions/613.html
