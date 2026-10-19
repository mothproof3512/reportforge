## Serviceaccounts met zwakke wachtwoorden kwetsbaar voor Kerberoasting

**Severity**: High · **CVSS 3.1**: 8.8 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: T1558, T1078, V2 · **CWE**: 521 · **Tags**: infra, windows, active-directory

**Affected**:

- (vul in: host, URL of systeem)

### Description

In het Active Directory-domein zijn gebruikersaccounts met een Service Principal Name (SPN) geregistreerd. Elke geauthenticeerde domeingebruiker kan voor deze accounts een Kerberos-serviceticket opvragen dat is versleuteld met het wachtwoord van het serviceaccount. Voor een of meer van deze accounts is het wachtwoord offline gekraakt binnen de testperiode; de betreffende accounts hebben bovendien verhoogde rechten.

### Impact

Een aanvaller met een willekeurig domeinaccount (bijvoorbeeld via phishing verkregen) kan zo de wachtwoorden van serviceaccounts achterhalen zonder enig inlogfalen te veroorzaken. Serviceaccounts hebben vaak hoge rechten en wachtwoorden die jarenlang niet wijzigen, waardoor dit een directe route naar domeinbeheer is.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken systemen, de reproductiestappen, de relevante tooloutput (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Gebruik Group Managed Service Accounts (gMSA) voor diensten die dat ondersteunen; die hebben automatisch roterende, lange wachtwoorden.
- Geef overige serviceaccounts wachtwoorden van minimaal 25 willekeurige tekens en rooster rotatie in.
- Beperk de rechten van serviceaccounts tot wat de dienst nodig heeft; geen lidmaatschap van Domain Admins.
- Dwing AES af voor Kerberos (schakel RC4 uit) en monitor op grote aantallen TGS-aanvragen vanaf één account.

### References

- MITRE ATT&CK T1558.003: https://attack.mitre.org/techniques/T1558/003/
- Microsoft, Group Managed Service Accounts: https://learn.microsoft.com/en-us/windows-server/security/group-managed-service-accounts/group-managed-service-accounts-overview
