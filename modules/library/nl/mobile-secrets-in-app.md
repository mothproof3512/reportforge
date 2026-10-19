## API-sleutels en secrets opgenomen in de app

**Severity**: Medium · **CVSS 3.1**: 6.5 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: MASVS-CODE, A02:2021 · **CWE**: 798 · **Tags**: mobile, gegevensbescherming

**Affected**:

- (vul in: host, URL of systeem)

### Description

In de app-binary zijn vaste geheimen aangetroffen: API-sleutels van externe diensten, een gedeeld geheim voor de backend-API of inloggegevens voor een testomgeving. Alles wat in een app staat, is door iedereen met de app uit te lezen; obfuscatie vertraagt dit alleen.

### Impact

Afhankelijk van de sleutel: misbruik van betaalde externe diensten op kosten van de organisatie, omzeilen van app-specifieke controles bij de API of toegang tot omgevingen die niet voor gebruikers bedoeld zijn.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken systemen, de reproductiestappen, de relevante tooloutput (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Verwijder de secrets uit de app en roteer ze. Laat de backend de aanroepen naar externe diensten doen, zodat de sleutels server-side blijven.
- Waar een client-sleutel onvermijdelijk is: beperk de sleutel bij de dienst tot de app (bundle-ID/package-naam en certificaatvingerafdruk) en tot de benodigde API's, en monitor het gebruik.
- Gebruik app-attestation (App Attest, Play Integrity) als de API moet kunnen vaststellen dat verzoeken van de echte app komen.

### References

- OWASP MASVS-CODE: https://mas.owasp.org/MASVS/10-MASVS-CODE/
- CWE-798: https://cwe.mitre.org/data/definitions/798.html
