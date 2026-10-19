## Cross-site request forgery (CSRF)

**Severity**: Medium · **CVSS 3.1**: 6.5 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:H/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A01:2021, WSTG-SESS-05, V4 · **CWE**: 352 · **Tags**: web, sessiebeheer

**Affected**:

- (vul in: host, URL of systeem)

### Description

Verzoeken die een wijziging doorvoeren (bijvoorbeeld het aanpassen van een e-mailadres, adres of wachtwoord, of het plaatsen van een bestelling) bevatten geen anti-CSRF-token en het sessiecookie wordt zonder `SameSite`-beperking meegestuurd. Een pagina op een ander domein kan daardoor zo'n verzoek namens een ingelogde gebruiker indienen.

### Impact

Een aanvaller die een ingelogde gebruiker een geprepareerde pagina laat openen, kan namens die gebruiker wijzigingen doorvoeren. Afhankelijk van de getroffen functies leidt dit tot accountovername (wijzigen van e-mailadres gevolgd door een wachtwoordreset) of financiële schade.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Gebruik het CSRF-mechanisme van het framework (synchronizer token of double-submit cookie) voor alle state-wijzigende verzoeken en valideer het token server-side.
- Zet `SameSite=Lax` of `Strict` op het sessiecookie als extra laag.
- Vereis voor gevoelige wijzigingen (e-mailadres, wachtwoord, betaalgegevens) herauthenticatie of een bevestiging via een tweede kanaal.
- Accepteer voor API's alleen JSON-bodies met een custom header en weiger verzoeken met `Content-Type: application/x-www-form-urlencoded`.

### References

- OWASP CSRF Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- OWASP WSTG-SESS-05: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/06-Session_Management_Testing/05-Testing_for_Cross_Site_Request_Forgery
