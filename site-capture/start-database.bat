REM do not forget to add MongoDB to path
cd /d %~dp0
mongod.exe --dbpath="..\site-capture-data\db"