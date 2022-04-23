#!/usr/bin/env node

const server = require('./');

const args = process.argv.slice(2).reduce((acc, part)=>{
	const [_,key,__,val] = /--?(\w+)(=(\w+))?/.exec(part) || [];
	key ? (acc[key] = val||true) : (acc.cmds.push(part));
	return acc;
}, {cmds:[]});

server(args.cmds[0], args);