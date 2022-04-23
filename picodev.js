const http = require('http'), URL = require('url'), fs = require('fs'), Path = require('path');
const {WebSocketServer} = require('ws');
const debounce = (fn, t=5)=>function(...args){clearTimeout(this.clk);this.clk=setTimeout(()=>fn(...args),t);};
const chalk = Object.entries({bright:1,dim:2,red:31,green:32,yellow:33,blue:34,magenta:35,cyan:36,white:37,black:30,grey:90}).reduce((acc, [name, id])=>{return {...acc, [name]:(txt)=>`\x1b[${id}m${txt}\x1b[0m`}});

const DefaultUpdateSnippet = (evt)=>{
	const matchingRes = [...document.querySelectorAll(`link[href*="${evt.data}"],img[src*="${evt.data}"]`)];
	if(!matchingRes.length) return window.location.reload();
	matchingRes.map(el=>{ const attr = !!el.href ? 'href' : 'src'; el[attr] = `${el[attr].split('?')[0]}?v=${Date.now()}`; });
};
const DefaultCloseSnippet = ()=>window.close();

const AddSnippets = (html, opts)=>{
	html = html.toString();
	const idx = html.lastIndexOf('</html>');
	const inject = `<script>
		const PicodevSocket = new WebSocket("ws://localhost:${opts.port}");
		PicodevSocket.onmessage = ${opts.update};
		PicodevSocket.onclose = ${opts.close};
	</script>`;
	return html.slice(0, idx) + inject + html.slice(idx);
};

const getFile = (path)=>{
	const ext = Path.extname(path);
	if(!ext) return getFile(path + '.html') || getFile(path + '/index.html');
	try{
		return [fs.readFileSync(path), path, ext];
	}catch(err){
		return false;
	}
};

module.exports = (rootDir=process.cwd(), opts={})=>{
	opts = {
		port   : 8080,
		open   : true,
		update : DefaultUpdateSnippet.toString(),
		close  : DefaultCloseSnippet.toString(),
		...opts
	};
	rootDir = Path.resolve(process.cwd(), rootDir);

	const server = http.createServer((req, res)=>{
		let url = URL.parse(req.url).pathname.slice(1);
		let [file, path, ext] = getFile(Path.resolve(rootDir, './' + url)) || [];
		if(!file){
			res.statusCode = 404;
			res.end(`File ${url} not found!`);
			return;
		};
		watchFile(path, url);
		if(ext==='.html') file = AddSnippets(file, opts);
		res.end(file);
	});

	let watching = new Set(), clients = [];
	const watchFile = (filepath, url)=>{
		if(watching.has(filepath)) return;
		watching.add(filepath);
		console.log(`Watching: ${chalk.cyan(filepath.replace(process.cwd(),''))}`);
		fs.watch(filepath, debounce((...args)=>{
			console.log(chalk.grey(`Changed: ${filepath.replace(process.cwd(),'')}`));
			clients.map(c=>c.send(url))
		}));
	};
	(new WebSocketServer({server})).on('connection', (ws)=>clients.push(ws));

	server.listen(parseInt(opts.port), ()=>{
		console.log(`\nServing: ${chalk.yellow(rootDir)}`);
		console.log(`Address: ${chalk.green(`http://localhost:${opts.port}`)}\n`);

		if(opts.open) require('child_process').exec(`start http://localhost:${opts.port}`);
	});
};