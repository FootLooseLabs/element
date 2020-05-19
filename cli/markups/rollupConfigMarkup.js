var rollupConfigMarkup = () => {
return `import babel from "rollup-plugin-babel";
import resolve from "rollup-plugin-node-resolve";
import replace from "rollup-plugin-replace";
import { uglify } from "rollup-plugin-uglify";

export default {
    entry: "src/components/index.js",
    dest: "_cmps_tmp/_cmps.js",
    format: "iife",
    sourceMap: "inline",
    plugins: [
        babel(),
        resolve({
            jsnext: true,
            main: true,
            browser: true,
        }),
        replace({
            ENV: JSON.stringify(process.env.NODE_ENV || "development"),
        }),
        process.env.NODE_ENV === "production" && uglify(),
    ],
};`
}

module.exports = {
	rollupConfigMarkup
}