## Onvoldoende logging en monitoring van beveiligingsgebeurtenissen

**Severity**: Low · **CVSS 3.1**: 3.7 (`CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:L/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A09:2021, V7 · **CWE**: 778 · **Tags**: web, api, infra, detectie

**Affected**:

- (vul in: host, URL of systeem)

### Description

Tijdens de test zijn duizenden mislukte inlogpogingen, geautomatiseerde verzoeken en injectiepogingen uitgevoerd zonder dat dit tot een melding of blokkade heeft geleid. Uit navraag blijkt dat beveiligingsrelevante gebeurtenissen (mislukte logins, wijzigingen van rechten, toegang tot gevoelige gegevens) niet of niet centraal worden gelogd en niet worden bewaakt.

### Impact

Een aanval wordt niet of te laat opgemerkt en kan achteraf niet worden gereconstrueerd, wat de schade vergroot en de meldplicht bij een datalek bemoeilijkt (wat is er precies ingezien?). Gemiddeld blijft een inbreuk zonder monitoring maanden onopgemerkt.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Log beveiligingsrelevante gebeurtenissen met tijd, gebruiker, bron-IP en resultaat: inloggen (geslaagd en mislukt), wachtwoordwijzigingen, rechtenwijzigingen, toegang tot en export van gevoelige gegevens, en geweigerde verzoeken.
- Verzamel logs centraal (buiten het bereik van een aanvaller op het systeem), bewaar ze minimaal een jaar en stel waarschuwingen in op afwijkende patronen (veel mislukte logins, veel 403's, verzoeken buiten kantoortijd op beheerfuncties).
- Log geen wachtwoorden, tokens of volledige persoonsgegevens.

### References

- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- OWASP A09:2021: https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures/
