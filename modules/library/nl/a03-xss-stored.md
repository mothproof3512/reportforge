## Stored cross-site scripting (XSS)

**Severity**: High · **CVSS 3.1**: 7.6 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:L/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A03:2021, WSTG-INPV-02, V5 · **CWE**: 79 · **Tags**: web, injectie

**Affected**:

- (vul in: host, URL of systeem)

### Description

Invoer die door de applicatie wordt opgeslagen (bijvoorbeeld een naam, opmerking, bericht of bestandsnaam) wordt bij het tonen niet correct ge-encodeerd. Script dat een gebruiker opslaat, wordt uitgevoerd bij iedereen die de betreffende pagina bekijkt, zonder dat die een speciale link hoeft te openen.

### Impact

Anders dan bij reflected XSS is geen interactie met een geprepareerde link nodig: elke bezoeker van de pagina wordt getroffen, inclusief beheerders. Daarmee kan een gebruiker met beperkte rechten acties uitvoeren met de rechten van een beheerder, bijvoorbeeld door een beheerder een pagina te laten openen waarop het script staat.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Pas contextafhankelijke output-encoding toe bij het tonen van alle opgeslagen gebruikersinvoer; vertrouw niet op invoerfiltering alleen, want opgeslagen gegevens worden vaak op meerdere plekken en in meerdere contexten getoond.
- Als rijke tekst (HTML) functioneel nodig is: gebruik een beproefde sanitizer met een whitelist van tags en attributen, server-side.
- Voer een Content Security Policy in zonder `unsafe-inline`.
- Controleer de opgeslagen gegevens op reeds aanwezige scriptfragmenten en verwijder die.

### References

- OWASP XSS Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- OWASP WSTG-INPV-02: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/07-Input_Validation_Testing/02-Testing_for_Stored_Cross_Site_Scripting
