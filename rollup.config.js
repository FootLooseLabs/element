import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import {uglify}  from "rollup-plugin-uglify";
const path = require('path');
const license = require('rollup-plugin-license');


export default {
  entry: 'src/muffin.js',
  dest: 'dist/muffin.min.js',
  format: 'iife',
  sourceMap: 'inline',
  plugins: [
    babel(
      {
        "plugins": [
          ["transform-class-properties", { "spec": true }]
        ]
      },
      {
        include: 'node_modules/localforages'
      }
    ),
    resolve({
      jsnext: true,
      main: true,
      browser: true,
    }),
    replace({
      ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
    license({
      banner: {
        commentStyle: 'regular', // The default
        content: {
          file: path.join(__dirname, 'banner.txt'),
        },
      },
    }),
    (process.env.NODE_ENV === 'production' && uglify()),
  ],
};
