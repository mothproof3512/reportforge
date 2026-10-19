## XML External Entity (XXE) injection

**Severity**: High · **CVSS 3.1**: 8.2 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:L`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A05:2021, WSTG-INPV-07, V5 · **CWE**: 611 · **Tags**: web, api, injectie

**Affected**:

- (vul in: host, URL of systeem)

### Description

De XML-parser van de applicatie verwerkt externe entiteiten in door gebruikers aangeleverde XML (bijvoorbeeld bij uploads, SOAP-berichten of importfuncties). Daardoor kan een document verwijzen naar lokale bestanden of interne URL's, waarvan de inhoud in het antwoord of in een foutmelding terechtkomt.

### Impact

Lezen van bestanden op de server (configuratie, secrets), verzoeken naar interne systemen namens de server (vergelijkbaar met SSRF) en, met recursieve entiteiten, uitputting van geheugen en CPU (denial of service).

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Schakel de verwerking van DTD's en externe entiteiten uit in alle XML-parsers die gebruikersinvoer verwerken; de meeste bibliotheken hebben hiervoor expliciete instellingen (zie de OWASP XXE Prevention Cheat Sheet per taal).
- Gebruik waar mogelijk een eenvoudiger formaat (JSON) voor gegevensuitwisseling.
- Houd parserbibliotheken actueel.

### References

- OWASP XXE Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html
- OWASP WSTG-INPV-07: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/07-Input_Validation_Testing/07-Testing_for_XML_Injection
- CWE-611: https://cwe.mitre.org/data/definitions/611.html
