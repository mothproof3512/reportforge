## Hergebruikt lokaal beheerderswachtwoord op werkstations en servers

**Severity**: High · **CVSS 3.1**: 8.4 (`CVSS:3.1/AV:A/AC:L/PR:H/UI:N/S:C/C:H/I:H/A:H`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: T1078.003, T1021, V2 · **CWE**: 1391 · **Tags**: infra, windows, active-directory

**Affected**:

- (vul in: host, URL of systeem)

### Description

Het lokale beheerdersaccount heeft op een groot deel van de werkstations en/of servers hetzelfde wachtwoord. Wie dat wachtwoord of de bijbehorende hash op één systeem bemachtigt, kan daarmee inloggen op alle andere systemen met dezelfde instelling.

### Impact

Compromittering van één werkstation (bijvoorbeeld door malware of phishing) leidt direct tot beheerrechten op het hele systeemlandschap: laterale beweging zonder verdere kwetsbaarheden. Dit is een van de belangrijkste versnellers van ransomware-incidenten.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken systemen, de reproductiestappen, de relevante tooloutput (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Voer Windows LAPS in zodat elk systeem een uniek, automatisch roterend lokaal beheerderswachtwoord krijgt dat in Active Directory of Entra ID wordt bewaard.
- Blokkeer netwerkaanmelding met lokale accounts via groepsbeleid (gebruik de ingebouwde SID-groepen "Local account" in de "Deny access to this computer from the network"-rechten).
- Beperk het gebruik van beheerrechten op werkplekken tot aparte beheeraccounts.

### References

- Microsoft, Windows LAPS: https://learn.microsoft.com/en-us/windows-server/identity/laps/laps-overview
- MITRE ATT&CK T1078.003: https://attack.mitre.org/techniques/T1078/003/
