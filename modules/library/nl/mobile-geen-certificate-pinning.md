## Geen certificate pinning en acceptatie van ongeldige certificaten

**Severity**: Medium · **CVSS 3.1**: 6.8 (`CVSS:3.1/AV:A/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: MASVS-NETWORK, A02:2021 · **CWE**: 295 · **Tags**: mobile, cryptografie

**Affected**:

- (vul in: host, URL of systeem)

### Description

De mobiele app accepteert TLS-certificaten die niet door een vertrouwde autoriteit zijn uitgegeven, of vertrouwt elk door de gebruiker geïnstalleerd CA-certificaat zonder pinning. Daardoor kon het verkeer tussen app en API met een eigen certificaat worden onderschept en gelezen.

### Impact

Een aanvaller met een netwerkpositie (openbare wifi, gecompromitteerde router) kan het verkeer meelezen en manipuleren, inclusief inloggegevens en sessietokens. Bij apps die ongeldige certificaten accepteren, is hiervoor geen interactie van de gebruiker nodig.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken systemen, de reproductiestappen, de relevante tooloutput (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Gebruik de standaard certificaatvalidatie van het platform en schakel die nooit uit, ook niet in testbuilds die naar productie kunnen lekken.
- Overweeg certificate pinning (op de public key van de server of een intermediate CA) voor apps die gevoelige gegevens verwerken, met een rotatieplan en een back-up-pin.
- Op Android: gebruik de Network Security Configuration om door de gebruiker toegevoegde CA's niet te vertrouwen.

### References

- OWASP MASVS-NETWORK: https://mas.owasp.org/MASVS/06-MASVS-NETWORK/
- OWASP Pinning Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Pinning_Cheat_Sheet.html
