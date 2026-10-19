## OS command injection

**Severity**: Critical · **CVSS 3.1**: 8.8 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A03:2021, WSTG-INPV-12, V5 · **CWE**: 78 · **Tags**: web, api, injectie

**Affected**:

- (vul in: host, URL of systeem)

### Description

De applicatie geeft gebruikersinvoer door aan een systeemcommando (bijvoorbeeld voor het converteren van bestanden, een ping- of lookupfunctie of een exportscript) zonder de invoer te valideren of te scheiden van het commando. Shell-metatekens in de invoer leiden tot het uitvoeren van extra commando's op de server.

### Impact

Uitvoeren van willekeurige commando's met de rechten van het applicatieproces: lezen van configuratie en secrets, toegang tot de database en andere interne systemen, en een uitvalsbasis voor verdere aanvallen op het netwerk. Dit is in de praktijk een volledige overname van de server.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Vermijd het aanroepen van een shell. Gebruik bibliotheekfuncties van de taal of het platform voor de gewenste bewerking.
- Als een extern programma onvermijdelijk is: roep het aan zonder shell, met argumenten als aparte parameters (array-vorm), en valideer de invoer tegen een strikte whitelist (bijvoorbeeld alleen een hostnaam of alleen cijfers).
- Draai het applicatieproces met minimale rechten en isoleer het (container, aparte gebruiker) om de impact van een eventuele compromittering te beperken.
- Onderzoek de server op sporen van eerder misbruik voordat de kwetsbaarheid wordt gedicht; roteer secrets die vanaf de server leesbaar waren.

### References

- OWASP OS Command Injection Defense Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html
- OWASP WSTG-INPV-12: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/07-Input_Validation_Testing/12-Testing_for_Command_Injection
- CWE-78: https://cwe.mitre.org/data/definitions/78.html
