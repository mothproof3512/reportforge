## Besturingssysteem of firmware zonder leveranciersondersteuning

**Severity**: High · **CVSS 3.1**: 9.8 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`) · **Status**: Likely · **Source**: Handmatig · **Mapping**: A06:2021, T1190, V14 · **CWE**: 1104 · **Tags**: infra, patchbeheer

**Affected**:

- (vul in: host, URL of systeem)

### Description

De genoemde systemen draaien een besturingssysteem- of firmwareversie waarvoor de leverancier geen beveiligingsupdates meer uitbrengt (end-of-life). Bekende kwetsbaarheden in deze versies worden niet meer gedicht; de versie is vastgesteld op basis van banners en fingerprinting.

### Impact

Nieuwe kwetsbaarheden blijven permanent open, en voor end-of-life-versies zijn doorgaans publieke exploits beschikbaar. Dergelijke systemen zijn een voor de hand liggend startpunt voor een aanvaller en een terugkerende bevinding bij audits (ISO 27001, NIS2).

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken systemen, de reproductiestappen, de relevante tooloutput (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Migreer naar een ondersteunde versie; stel een plan op met prioriteit voor systemen die vanaf het internet of vanaf werkplekken bereikbaar zijn.
- Waar migratie niet op korte termijn mogelijk is: isoleer de systemen in een apart netwerksegment, beperk toegang tot het minimum, schakel onnodige diensten uit en monitor ze extra.
- Neem end-of-life-datums op in de inventaris zodat vervanging tijdig wordt ingepland.

### References

- OWASP A06:2021: https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/
- endoflife.date: https://endoflife.date/
