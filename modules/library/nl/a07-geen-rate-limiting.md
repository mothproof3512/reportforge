## Geen beperking van inlogpogingen (brute force mogelijk)

**Severity**: Medium · **CVSS 3.1**: 5.3 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A07:2021, WSTG-ATHN-03, API4:2023, V2 · **CWE**: 307 · **Tags**: web, api, authenticatie

**Affected**:

- (vul in: host, URL of systeem)

### Description

Het inlogformulier en/of de inlog-API beperken het aantal pogingen niet: na een groot aantal mislukte pogingen vanaf één adres of op één account volgt geen vertraging, blokkade of extra verificatie. Hetzelfde geldt voor andere functies waar raden loont, zoals wachtwoordreset-codes, tweefactorcodes en coupon- of verificatiecodes.

### Impact

Wachtwoorden kunnen geautomatiseerd worden geraden (brute force) of getoetst met gelekte combinaties van andere diensten (credential stuffing). Gezien het hergebruik van wachtwoorden leidt dit in de praktijk tot overname van een deel van de accounts. Bij korte numerieke codes (resets, 2FA) is raden binnen minuten mogelijk.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Beperk inlogpogingen per account en per IP-adres, met een oplopende vertraging; blokkeer tijdelijk na een drempel (bijvoorbeeld 5 pogingen per 15 minuten per account) en meld de gebruiker verdachte activiteit.
- Zet bij codes (reset, 2FA) een hard maximum op het aantal pogingen per code en laat de code daarna vervallen.
- Overweeg MFA voor alle gebruikers en controleer wachtwoorden bij het instellen tegen lijsten met gelekte wachtwoorden.
- Pas rate limiting toe op de API-gateway voor alle endpoints, niet alleen op inloggen.

### References

- OWASP Authentication Cheat Sheet, Login Throttling: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Credential Stuffing Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html
- CWE-307: https://cwe.mitre.org/data/definitions/307.html
