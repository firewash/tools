import SimpleHTTPServer
import SocketServer
import sys

PORT = 8000

class UCBrowserFEDHTTPRequestHandle(SimpleHTTPServer.SimpleHTTPRequestHandler):
    server_version = "Wangle: for ucbrowser fed debug"
    
    def end_headers(self):
        self.send_my_headers() 
        SimpleHTTPServer.SimpleHTTPRequestHandler.end_headers(self)

    def send_my_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")

def printhelpinfo():
    path = sys.path[0]
    print "current www root: ",path

def main():
    printhelpinfo()
    Handler = UCBrowserFEDHTTPRequestHandle
    httpd = SocketServer.TCPServer(("", PORT), Handler)
    print "serving at port", PORT
    httpd.serve_forever()

main()

