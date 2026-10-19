## Geen multifactorauthenticatie op gevoelige toegang

**Severity**: Medium · **CVSS 3.1**: 7.4 (`CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A07:2021, WSTG-ATHN-01, V2.8 · **CWE**: 308 · **Tags**: web, authenticatie

**Affected**:

- (vul in: host, URL of systeem)

### Description

Inloggen op de applicatie en/of de beheeromgeving gebeurt uitsluitend met gebruikersnaam en wachtwoord. Er is geen tweede factor beschikbaar of deze is optioneel en niet afgedwongen voor accounts met verhoogde rechten of toegang tot gevoelige gegevens.

### Impact

Een gelekt, geraden of via phishing verkregen wachtwoord geeft direct volledige toegang. Wachtwoordhergebruik en credential stuffing zijn de meest voorkomende oorzaak van accountovername; MFA neemt het grootste deel van dat risico weg. Voor beheerders en toegang tot persoonsgegevens verwachten toezichthouders en de ISO 27001/NIS2-praktijk een tweede factor.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Dwing MFA af voor beheerders en voor alle toegang tot gevoelige gegevens; bied het daarnaast aan alle gebruikers aan.
- Kies bij voorkeur phishingbestendige methoden (FIDO2/passkeys) of een authenticator-app; sms alleen als terugvaloptie.
- Koppel waar mogelijk aan de centrale identity provider (SSO), zodat beleid op één plek wordt afgedwongen.

### References

- OWASP MFA Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html
- OWASP ASVS V2.8: https://github.com/OWASP/ASVS
