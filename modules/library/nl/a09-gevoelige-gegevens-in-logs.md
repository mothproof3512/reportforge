## Gevoelige gegevens in logbestanden

**Severity**: Medium · **CVSS 3.1**: 4.9 (`CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:N/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A09:2021, A02:2021, V7.1 · **CWE**: 532 · **Tags**: web, logging, gegevensbescherming

**Affected**:

- (vul in: host, URL of systeem)

### Description

De applicatie schrijft gevoelige gegevens naar logbestanden of een centrale logvoorziening: wachtwoorden of sessietokens (bijvoorbeeld door volledige verzoeken te loggen), persoonsgegevens, betaalgegevens of API-sleutels.

### Impact

Logbestanden hebben doorgaans een ruimere kring van lezers dan de productiedatabase (beheerders, monitoringtools, externe logdiensten) en een langere bewaartermijn. Daarmee ontstaat een tweede, slechter beschermde kopie van gevoelige gegevens; een lek daarvan is meldplichtig onder de AVG en tokens in logs maken accountovername mogelijk.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Inventariseer welke velden worden gelogd en maskeer of verwijder wachtwoorden, tokens, kaartgegevens en niet-noodzakelijke persoonsgegevens vóór het loggen (allowlist van velden in plaats van volledige verzoeken).
- Beperk de toegang tot logbestanden en de logvoorziening, versleutel ze in rust en stel een bewaartermijn vast.
- Schoon bestaande logs op na correctie.

### References

- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- CWE-532: https://cwe.mitre.org/data/definitions/532.html
