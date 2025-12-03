@echo off

:: 1. Assure que le répertoire courant est celui du script
cd /d "%~dp0"

echo.
echo ==========================================================
echo === Lancement de l'Application Next.js (Port 3000) ... ===
echo ==========================================================
echo.

:: La variable PORT definit le port d'ecoute
SET PORT=3000

:: 2. UTILISE NPX pour executer le binaire 'next' de node_modules
IF EXIST "node_modules\next" (
    echo Serveur en cours d'execution sur http://localhost:%PORT%
    echo Le serveur va demarrer dans une nouvelle fenetre...
    echo.
    
    :: Lance l'application dans une NOUVELLE fenetre CMD separee.
    :: 'npx next start' est la commande la plus fiable.
    start "Next.js Production Server" cmd /k "npx next start -H 0.0.0.0 -p %PORT% & exit"
    
    echo.
    echo L'application est maintenant accessible via l'adresse IP de cette machine sur le port %PORT%.
    echo.
    echo NE PAS FERMER CETTE FENETRE.
    echo.

) ELSE (
    echo.
    echo ❌ ERREUR CRITIQUE : Le dossier node_modules est manquant ou incomplet.
    echo Veuillez verifier si "npm install" a ete execute correctement.
    echo.
)

:: Garde cette fenetre ouverte, affichant les informations.
pause