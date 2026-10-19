## SMB-signing niet afgedwongen

**Severity**: Medium · **CVSS 3.1**: 6.8 (`CVSS:3.1/AV:A/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: T1557, T1021, V9 · **CWE**: 290 · **Tags**: infra, windows, active-directory

**Affected**:

- (vul in: host, URL of systeem)

### Description

Op de genoemde systemen is SMB-signing ingeschakeld maar niet verplicht ("enabled, not required"), of geheel uitgeschakeld. Daardoor accepteren deze systemen SMB-sessies zonder cryptografische handtekening op de berichten.

### Impact

Een aanvaller met een positie in het netwerk kan authenticatieverzoeken van gebruikers en servicemachines doorsturen (relay) naar deze systemen en zo met hun rechten code uitvoeren of gegevens benaderen. In combinatie met LLMNR/NBT-NS-poisoning of een gedwongen authenticatie is dit een gangbare route naar beheerrechten op het domein.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken systemen, de reproductiestappen, de relevante tooloutput (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Dwing SMB-signing af op alle servers en werkstations via groepsbeleid ("Microsoft network server: Digitally sign communications (always)" en de client-equivalent).
- Schakel SMBv1 uit.
- Beperk daarnaast de mogelijkheden tot relay: LDAP-signing en channel binding afdwingen, LLMNR en NBT-NS uitschakelen, en lokale beheerdersaccounts per systeem uniek maken (LAPS).

### References

- Microsoft, Overview of SMB signing: https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/overview-server-message-block-signing
- MITRE ATT&CK T1557: https://attack.mitre.org/techniques/T1557/
