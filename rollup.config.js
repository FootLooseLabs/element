import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';

const isProd = process.env.NODE_ENV === 'production';

const banner = `/*!
 * @muffin/element v${process.env.npm_package_version}
 * Footloose Labs — ${new Date().getFullYear()}
 */`;

const plugins = [
    resolve({ browser: true, preferBuiltins: false }),
    commonjs(),
    replace({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        preventAssignment: true
    })
];

export default [
    // IIFE — CDN / script tag
    {
        input: 'src/main.js',
        output: {
            file: 'dist/element.min.js',
            format: 'iife',
            name: 'MuffinElement',
            exports: 'named',
            banner,
            sourcemap: isProd ? false : 'inline'
        },
        plugins: [...plugins, isProd && terser()].filter(Boolean)
    },

    // ESM — for bundlers (Vite, Rollup consumers)
    {
        input: 'src/main.js',
        output: {
            file: 'dist/element.esm.js',
            format: 'esm',
            banner
        },
        plugins: [...plugins, isProd && terser()].filter(Boolean)
    }
];
