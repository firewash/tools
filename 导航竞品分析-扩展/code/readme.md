如何安装：
1、将crx包安装到UC或Chrome浏览器

如何使用：
1、关掉所有的tab页，只保留你要比较的两个tab页，比如www.uc123.com,www.hao123.com
2、点击浏览器右上角的扩展图标，打开管理页面：chrome-extension://ejgdfjmcfogabiplkamhhnfgcojnahml/background.html
3、选择基准和对比
4、点击“开始比较按钮”
5、接下来，能看到按钮下面会出现对比数据。

如何使用查看数据：
1 比较结果的几个取值的释义： 
equal： url相同，且出现次数相同，且每个label也相同。
diff-count：url相同，但是出现次数不同
diff-label：url相同，但是label不同
new：完全不同，则各自标记为new

版本演进
V0.1 抽取两个页面中所有的链接，并进行数据对比；在页面中标记所有链接的对比结果
V0.2 对页面中重复投放的链接进行归类处理；在页面中高亮显示用户需要点击查看的链接。