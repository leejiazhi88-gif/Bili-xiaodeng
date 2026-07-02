const http=require("http"),fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,"..","outputs");
http.createServer((req,res)=>{const file=path.join(root,"growth_indices_dashboard.html");res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});fs.createReadStream(file).pipe(res);}).listen(9876,"127.0.0.1");
