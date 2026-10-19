## LLMNR en NBT-NS actief (name poisoning mogelijk)

**Severity**: Medium · **CVSS 3.1**: 6.5 (`CVSS:3.1/AV:A/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: T1557, V9 · **CWE**: 290 · **Tags**: infra, windows, active-directory

**Affected**:

- (vul in: host, URL of systeem)

### Description

Werkstations en servers in het netwerk gebruiken LLMNR en NetBIOS Name Service als terugvaloptie wanneer DNS een naam niet kan vinden (bijvoorbeeld bij typefouten of verouderde netwerklocaties). Elk systeem in hetzelfde segment kan op zo'n broadcast antwoorden en zich voordoen als de gevraagde host.

### Impact

Een aanvaller in het netwerksegment ontvangt hierdoor NTLM-authenticaties van gebruikers, die offline kunnen worden gekraakt of direct kunnen worden doorgestuurd naar systemen zonder SMB-signing. Dit is een van de meest gebruikte eerste stappen bij interne aanvallen en leidt regelmatig tot domeinbeheerrechten.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken systemen, de reproductiestappen, de relevante tooloutput (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Schakel LLMNR uit via groepsbeleid ("Turn off multicast name resolution") en NetBIOS over TCP/IP uit via DHCP-optie of per adapter.
- Zorg dat DNS alle benodigde namen kan oplossen, zodat de terugvaloptie niet nodig is; overweeg mDNS eveneens uit te schakelen.
- Combineer met het afdwingen van SMB- en LDAP-signing om relay-aanvallen te blokkeren.

### References

- MITRE ATT&CK T1557.001: https://attack.mitre.org/techniques/T1557/001/
