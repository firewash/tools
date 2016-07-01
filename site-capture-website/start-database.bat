REM do not forget to add MongoDB to path
cd /d %~dp0
REM mongod.exe --dbpath="..\site-capture-data\db"
mongod.exe --config="mongodb.conf"