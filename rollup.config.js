import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import {uglify}  from "rollup-plugin-uglify";

export default {
  entry: 'src/muffin.js',
  dest: 'dist/muffin.min.js',
  format: 'iife',
  sourceMap: 'inline',
  plugins: [
    babel({
      include: 'node_modules/localforages'
    }),
    resolve({
      jsnext: true,
      main: true,
      browser: true,
    }),
    replace({
      ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
    (process.env.NODE_ENV === 'production' && uglify()),
  ],
};
