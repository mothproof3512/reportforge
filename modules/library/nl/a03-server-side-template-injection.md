## Server-side template injection (SSTI)

**Severity**: Critical · **CVSS 3.1**: 8.8 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A03:2021, WSTG-INPV-18, V5 · **CWE**: 1336 · **Tags**: web, injectie

**Affected**:

- (vul in: host, URL of systeem)

### Description

Gebruikersinvoer wordt als onderdeel van een template verwerkt in plaats van als gegevens die in een template worden ingevoegd (bijvoorbeeld bij e-mailsjablonen, rapportages of aanpasbare berichten). De template-engine evalueert expressies in de invoer, wat is aangetoond door een rekenkundige expressie die door de server werd uitgerekend.

### Impact

Afhankelijk van de template-engine en de sandboxing kan een aanvaller via template-expressies objecten van de applicatie benaderen, bestanden lezen en uiteindelijk systeemcommando's uitvoeren. In de meeste engines leidt SSTI tot volledige overname van de server.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Geef gebruikersinvoer uitsluitend door als variabele aan een vaste template; stel nooit de template zelf samen uit gebruikersinvoer.
- Als gebruikers templates moeten kunnen aanpassen: gebruik een "logic-less" template-taal of een engine met een strikte sandbox, en beperk de beschikbare objecten en functies expliciet.
- Draai het applicatieproces met minimale rechten.

### References

- OWASP WSTG-INPV-18: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/07-Input_Validation_Testing/18-Testing_for_Server-side_Template_Injection
- PortSwigger, Server-side template injection: https://portswigger.net/web-security/server-side-template-injection
- CWE-1336: https://cwe.mitre.org/data/definitions/1336.html
