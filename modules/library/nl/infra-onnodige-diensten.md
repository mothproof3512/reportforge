## Onnodige diensten vanaf het netwerk bereikbaar

**Severity**: Medium · **CVSS 3.1**: 6.5 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A05:2021, WSTG-CONF-01, T1046, V14 · **CWE**: 1327 · **Tags**: infra, netwerk, hardening

**Affected**:

- (vul in: host, URL of systeem)

### Description

Op de onderzochte systemen zijn diensten bereikbaar die voor de functie van het systeem niet nodig zijn of niet vanaf dit netwerk bereikbaar zouden moeten zijn, zoals databasepoorten, beheerprotocollen (RDP, SSH, WinRM, SNMP), bestandsdeling of ontwikkeltooling. Een deel van deze diensten is bereikbaar vanaf het internet.

### Impact

Elke bereikbare dienst vergroot het aanvalsoppervlak: beheerprotocollen zijn doelwit van brute force, databases zijn zonder authenticatie of met zwakke credentials direct uit te lezen, en elke dienst kan kwetsbaarheden bevatten. De ernst stijgt bij diensten zonder authenticatie of met bekende kwetsbaarheden (zie aparte bevindingen).

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken systemen, de reproductiestappen, de relevante tooloutput (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Schakel diensten uit die niet nodig zijn en beperk de overige met host- en netwerkfirewalls tot de systemen en netwerken die ze daadwerkelijk gebruiken (beheer alleen via VPN of een bastion).
- Segmenteer het netwerk zodat databases en beheerinterfaces niet in hetzelfde segment staan als werkplekken of publieke servers.
- Scan periodiek de externe en interne aanvalsoppervlakken en vergelijk met een vastgestelde baseline.

### References

- CIS Benchmarks: https://www.cisecurity.org/cis-benchmarks
- MITRE ATT&CK T1046: https://attack.mitre.org/techniques/T1046/
