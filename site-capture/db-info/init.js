//通过命令行进入mongo命令
mongo
//创建数据库
use tools_site_capture

//创建用户
db.createUser({ 
  user: "admin",
  pwd: "admin",
  customData: { des: "only for test" },
  roles: [
    { role: "readWrite", db: "tools_site_capture" },
    "readWrite"
  ]
});


//建表
db.createCollection("origin_captures");
db.createCollection("diff_captures");
db.createCollection("tasks");

//插入一条测试护具
db.origin_captures.insert({
  "name":"img1",
  "time":"2016031512000000",
  "path":"d:/img1.png",
  "rel_diff":"d:/img2.png",
  "site":"www.uc123.com"
})
