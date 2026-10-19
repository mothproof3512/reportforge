## Reflected cross-site scripting (XSS)

**Severity**: Medium · **CVSS 3.1**: 6.1 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A03:2021, WSTG-INPV-01, V5 · **CWE**: 79 · **Tags**: web, injectie

**Affected**:

- (vul in: host, URL of systeem)

### Description

Een parameter wordt zonder contextafhankelijke encoding teruggegeven in de HTML van de pagina. Een aanvaller kan een link construeren die, zodra een gebruiker hem opent, script uitvoert in de context van de applicatie.

### Impact

Een aanvaller die een gebruiker een geprepareerde link laat openen (bijvoorbeeld via phishing), kan handelingen uitvoeren namens die gebruiker, gegevens uit de pagina lezen en de interface manipuleren, bijvoorbeeld om inloggegevens af te vangen. Als het sessiecookie niet `HttpOnly` is, kan de sessie direct worden overgenomen. De impact is beperkt tot gebruikers die de link openen.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Pas contextafhankelijke output-encoding toe op alle gebruikersinvoer die in HTML, attributen, JavaScript of URL's wordt opgenomen; gebruik de encoding van het template-framework en vermijd constructies die encoding uitschakelen.
- Voer een Content Security Policy in zonder `unsafe-inline` als extra verdedigingslaag.
- Zet het `HttpOnly`-attribuut op sessiecookies.

### References

- OWASP XSS Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- OWASP WSTG-INPV-01: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/07-Input_Validation_Testing/01-Testing_for_Reflected_Cross_Site_Scripting
- CWE-79: https://cwe.mitre.org/data/definitions/79.html
