## Publiek toegankelijke cloudopslag

**Severity**: High · **CVSS 3.1**: 7.5 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A01:2021, A05:2021 · **CWE**: 284 · **Tags**: cloud, gegevensbescherming

**Affected**:

- (vul in: host, URL of systeem)

### Description

Een opslagbucket of -container (S3, Azure Blob Storage, Google Cloud Storage) is zonder authenticatie leesbaar en bevat gegevens die niet voor publiek bestemd zijn, zoals back-ups, documenten van klanten, exportbestanden of configuratie. In sommige gevallen is de opslag ook schrijfbaar.

### Impact

Iedereen die de naam van de bucket kent of raadt, kan de gegevens downloaden; buckets worden actief gescand door aanvallers en onderzoekers. Bij schrijfrechten kunnen bestanden worden vervangen door schadelijke versies (bijvoorbeeld scripts die de website laadt). Een lek van persoonsgegevens is meldplichtig onder de AVG.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Blokkeer publieke toegang op account- en bucketniveau (S3 Block Public Access of equivalent) en geef applicaties toegang via IAM-rollen of kortlevende signed URL's.
- Controleer welke bestanden al publiek bereikbaar zijn geweest en beoordeel de meldplicht.
- Zet logging op de opslag aan en voeg een configuratiecontrole toe aan de CI/CD-pijplijn of cloudposturebeheer.

### References

- AWS, Blocking public access to S3: https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html
- CWE-284: https://cwe.mitre.org/data/definitions/284.html
