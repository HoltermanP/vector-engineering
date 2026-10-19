# VECTOR Engineering website

Statische site (index.html, css/, js/) op Vercel, met een serverless contactformulier (api/contact.js, nodemailer via Strato SMTP).

## Wijzigen en live zetten
1. Pas de bestanden aan; verhoog `?v=` achter css/js in index.html bij elke wijziging aan die bestanden.
2. Commit lokaal. Push naar `main` op GitHub alleen als Patrick daar expliciet om vraagt; Vercel deployt dan automatisch.
3. SMTP-gegevens staan alleen als environment variables in Vercel (zie .env.example). Nooit committen of tonen.

`_php-oud/` is de oude PHP-versie, alleen ter referentie en niet in git.
