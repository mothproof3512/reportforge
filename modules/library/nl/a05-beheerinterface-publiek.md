## Beheerinterface publiek bereikbaar

**Severity**: Medium · **CVSS 3.1**: 6.5 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A05:2021, WSTG-CONF-05, V14 · **CWE**: 284 · **Tags**: web, infra, configuratie

**Affected**:

- (vul in: host, URL of systeem)

### Description

Een beheerinterface (applicatiebeheer, databasebeheer, serverstatus, CI/CD, monitoring) is vanaf het internet bereikbaar zonder netwerkbeperking of tweede factor. De interface is beschermd met alleen een wachtwoord, waardoor de beveiliging volledig afhangt van de wachtwoordkwaliteit en de weerbaarheid van het inlogformulier tegen raden.

### Impact

Beheerinterfaces zijn een geliefd doelwit voor credential stuffing en brute force en bevatten regelmatig kwetsbaarheden die niet voor het internet bedoeld zijn. Toegang betekent doorgaans beheer over de applicatie of het systeem. De ernst stijgt naar hoog als bovendien zwakke of standaardcredentials worden gebruikt of rate limiting ontbreekt.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Maak beheerinterfaces alleen bereikbaar vanaf vertrouwde netwerken (VPN, bastion, IP-allowlist) of achter een identity-aware proxy.
- Vereis multi-factor authenticatie voor beheertoegang.
- Monitor en beperk inlogpogingen op de interface.

### References

- OWASP WSTG-CONF-05: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/05-Enumerate_Infrastructure_and_Application_Admin_Interfaces
