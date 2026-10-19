## Onveilige deserialisatie van gebruikersinvoer

**Severity**: Critical · **CVSS 3.1**: 9.8 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A08:2021, WSTG-INPV-11, V5 · **CWE**: 502 · **Tags**: web, api, injectie

**Affected**:

- (vul in: host, URL of systeem)

### Description

De applicatie deserialiseert door gebruikers aangeleverde objecten (bijvoorbeeld in cookies, verborgen formuliervelden of API-berichten) met een native serialisatieformaat van de taal (Java-serialisatie, PHP `unserialize`, Python `pickle`, .NET `BinaryFormatter`). Daarbij wordt niet beperkt welke klassen mogen worden geïnstantieerd.

### Impact

Met bekende "gadget chains" in aanwezige bibliotheken kan een aanvaller tijdens het deserialiseren willekeurige code laten uitvoeren op de server. Dit leidt in de regel tot volledige overname.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Deserialiseer geen gebruikersinvoer in een native formaat. Gebruik een gegevensformaat zonder code-uitvoering (JSON) met een expliciet schema.
- Als native deserialisatie onvermijdelijk is: pas een strikte whitelist van toegestane klassen toe, signeer de geserialiseerde data en verifieer de handtekening vóór het deserialiseren.
- Draai het proces met minimale rechten en houd bibliotheken met bekende gadget chains actueel.

### References

- OWASP Deserialization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html
- CWE-502: https://cwe.mitre.org/data/definitions/502.html
