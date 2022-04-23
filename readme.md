# pico-dev

> Tiny development server for web projects. Inspired by [`live-server`](https://www.npmjs.com/package/live-server)

`pico-dev` is a super simple local development web server. It hosts a folder on your computer at a specified port. Any resource that's requested starts to be watched by `pico-dev`, and if that file changes the server emits update events to open pages.

By default `pico-dev` injects a websocket listener scripts into any request HTML reqources. It tries to hot-reload any updated style sheets or images, otherwise it just reloads the page. If the server is shut down, the pages will close too. Both of these functions are configurable


```
npm install --save-dev pico-dev
```


**Command Line Usage**
```
> pico-dev ./build --port=8000
```


**Library Usage**
```js
const server = require('pico-dev');

server('./build', {
	port : 8333,
	open : false,
	update : ({data})=>{
		alert(`${data} changed!`)
	},
	close : ()=>{
		alert('Connection with pico-dev lost');
	}
});
```
