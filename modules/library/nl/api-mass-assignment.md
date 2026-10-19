## Mass assignment: wijzigen van niet-bedoelde objecteigenschappen

**Severity**: High · **CVSS 3.1**: 7.1 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:H/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: API3:2023, A04:2021, V4 · **CWE**: 915 · **Tags**: api, autorisatie

**Affected**:

- (vul in: host, URL of systeem)

### Description

De API koppelt de velden uit een verzoek automatisch aan het onderliggende datamodel, zonder te beperken welke velden een gebruiker mag zetten. Door extra velden mee te sturen die niet in de interface voorkomen (bijvoorbeeld `role`, `is_admin`, `balance`, `verified` of `price`) kunnen eigenschappen worden gewijzigd die alleen de applicatie zelf zou mogen zetten.

### Impact

Afhankelijk van de velden: verhogen van eigen rechten, omzeilen van verificatiestappen, manipuleren van prijzen of saldo's, of koppelen van objecten aan een ander account. Rechtenverhoging naar beheerder is de ernstigste variant.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Gebruik per endpoint een expliciet invoermodel (DTO/schema) met alleen de velden die een gebruiker mag zetten, en negeer of weiger alle andere velden.
- Beheer gevoelige eigenschappen (rol, status, verificatie, financiële velden) uitsluitend via aparte, geautoriseerde functies.
- Zet de ORM-instelling voor automatische binding uit of configureer per model een whitelist.

### References

- OWASP API Security Top 10 2023 — API3: Broken Object Property Level Authorization: https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/
- OWASP Mass Assignment Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html
