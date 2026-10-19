## SNMP bereikbaar met standaard community string

**Severity**: Medium · **CVSS 3.1**: 7.5 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A05:2021, A07:2021, T1046 · **CWE**: 1392 · **Tags**: infra, netwerk

**Affected**:

- (vul in: host, URL of systeem)

### Description

Netwerkapparatuur en/of servers beantwoorden SNMP-verzoeken (versie 1 of 2c) met de standaard community string `public`. SNMPv1/2c verstuurt de community string onversleuteld, en de standaardwaarde is algemeen bekend.

### Impact

Een aanvaller kan uitgebreide informatie over de systemen opvragen: interfaces, routeringstabellen, draaiende processen, gebruikersaccounts en soms configuratie met wachtwoorden. Als ook een schrijfbare community string (`private`) actief is, kan de configuratie worden gewijzigd.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken systemen, de reproductiestappen, de relevante tooloutput (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Schakel SNMP uit waar het niet wordt gebruikt.
- Gebruik SNMPv3 met authenticatie en versleuteling; als v2c onvermijdelijk is, wijzig de community strings en beperk toegang tot de monitoringsystemen met ACL's.

### References

- CWE-1392: https://cwe.mitre.org/data/definitions/1392.html
