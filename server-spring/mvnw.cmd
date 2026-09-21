@ECHO OFF
set "ROOT=%~dp0.."
set "LOCAL_MVN=%ROOT%\tools\maven\apache-maven-3.9.9\bin\mvn.cmd"

if exist "%LOCAL_MVN%" (
    call "%LOCAL_MVN%" %*
) else (
    call mvn %*
)
