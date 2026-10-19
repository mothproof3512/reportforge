## Standaard- of zwakke beheercredentials

**Severity**: Critical · **CVSS 3.1**: 9.8 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A07:2021, WSTG-ATHN-02, V2 · **CWE**: 1392 · **Tags**: web, infra, authenticatie

**Affected**:

- (vul in: host, URL of systeem)

### Description

Een beheerinterface of dienst is toegankelijk met standaardcredentials van de leverancier of met een eenvoudig te raden wachtwoord (bijvoorbeeld de naam van de organisatie gevolgd door een jaartal). De combinatie is tijdens de test met een korte woordenlijst gevonden.

### Impact

Directe beheertoegang tot het betreffende systeem zonder enige kwetsbaarheid in de software. Standaardcredentials staan in publieke lijsten en worden continu geautomatiseerd uitgeprobeerd op het internet; de kans dat dit al eerder is gebeurd, is aanzienlijk.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Wijzig de credentials direct en controleer de logs van het systeem op eerder gebruik.
- Neem in het inrichtingsproces een verplichte stap op voor het wijzigen van standaardwachtwoorden en het uitschakelen van standaardaccounts; controleer dit periodiek met een scan.
- Gebruik unieke, lange wachtwoorden uit een wachtwoordmanager en MFA voor beheertoegang; beperk beheerinterfaces tot vertrouwde netwerken.

### References

- OWASP WSTG-ATHN-02: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/04-Authentication_Testing/02-Testing_for_Default_Credentials
- CWE-1392: https://cwe.mitre.org/data/definitions/1392.html
