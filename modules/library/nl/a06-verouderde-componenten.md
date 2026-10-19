## Verouderde software met bekende kwetsbaarheden

**Severity**: High · **CVSS 3.1**: 7.5 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N`) · **Status**: Likely · **Source**: Handmatig · **Mapping**: A06:2021, WSTG-INFO-02, V14 · **CWE**: 1104 · **Tags**: web, infra, patchbeheer

**Affected**:

- (vul in: host, URL of systeem)

### Description

Een of meer componenten (webserver, framework, bibliotheek, CMS of plugin) draaien in een versie met publiek bekende kwetsbaarheden. De versie is vastgesteld op basis van banners, headers, foutmeldingen of specifieke bestanden. Exploitatie is niet uitgevoerd omdat het productiesystemen betreft of omdat de spelregels dit niet toestaan; de status is daarom "waarschijnlijk".

### Impact

De impact hangt af van de ernstigste bekende kwetsbaarheid in de betreffende versie; bij de genoemde CVE's gaat het om [lezen van bestanden / uitvoeren van code / ...]. Voor bekende kwetsbaarheden zijn vaak publieke exploits beschikbaar en worden actief gescand, waardoor de kans op misbruik aanzienlijk is.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Werk de betreffende componenten bij naar de actuele, ondersteunde versie.
- Richt een patchproces in met een vaste cyclus (bijvoorbeeld maandelijks) en een kortere doorlooptijd voor kritieke kwetsbaarheden; gebruik een inventaris (SBOM) om snel te kunnen bepalen welke systemen geraakt worden.
- Verberg versie-informatie in banners en headers; dit vertraagt gericht scannen maar vervangt patchen niet.

### References

- OWASP A06:2021 Vulnerable and Outdated Components: https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/
- NVD: https://nvd.nist.gov/
