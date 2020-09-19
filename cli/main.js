#!/usr/bin/env node
// const readline = require("readline");
// const { spawnSync, execSync } = require("child_process");

// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// })
// .on('SIGINT', () => process.emit('SIGINT'))
// .on('SIGTERM', () => process.emit('SIGTERM'));

const { program } = require('commander');

var commands = require('require-all')({
  dirname     :  __dirname + '/commands',
  excludeDirs :  /^\.(git|svn)$/,
  recursive   : true
});

program
  .option('-d, --debug', 'output extra debugging')
  .option('-i, --init', 'initialise app')
  .option('-a, --add', 'add new component');

 if (process.argv.length <= 2) {
 	program.help();
 };

program.parse(process.argv);

// console.log("program = ", program);

// if (program.args.length === 0) {
//   program.help();
// }



process.on('exit', function() {
	console.log('process killing');
	// console.log('killing', children.length, 'child processes');
	// children.forEach(function(child) {
	// 	child.kill();
	// });
});

process.on('close', function() {
  console.log('process closing');
  // children.forEach(function(child) {
  //   child.kill();
  // });
});

if (program.debug) console.log(program.opts());
if (program.init) {
	console.log('initialising muffin app...');
	commands.create_new_app();
};
if (program.add) {
	console.log('adding new component...');
	commands.add_component();
}