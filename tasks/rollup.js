const path = require("path");
const rollup = require("rollup");

module.exports = (grunt) => {
    grunt.registerMultiTask("rollup", "Grunt plugin for rollup - next-generation ES6 module bundler", () => {
        const { current } = grunt.task;

        const done = current.async();
        const options = current.options({
            cache: null,
            external: [],
            format: "es",
            exports: "auto",
            moduleId: null,
            moduleName: null,
            globals: {},
            indent: true,
            useStrict: true,
            banner: null,
            footer: null,
            intro: null,
            outro: null,
            onwarn: null,
            paths: null,
            plugins: [],
            sourceMap: false,
            sourceMapFile: null,
            treeshake: true,
            interop: true,
            amd: {
                id: null,
                define: null,
            },
            extend: false,
        });

        const promises = current.files.map((files) => {
            let { plugins } = options;
            if (typeof plugins === "function") {
                plugins = plugins();
            }

            const inputOptions = (({
                cache,
                external,
                context,
                moduleContext,
                onwarn,
                treeshake,
            }) => ({
                cache,
                external,
                context,
                moduleContext,
                onwarn,
                treeshake,
            }))(options);
            const outputOptions = (({
                format,
                exports,
                paths,
                amd,
                name,
                globals,
                indent,
                strict,
                banner,
                footer,
                intro,
                outro,
                sourceMap,
                sourceMapFile,
                interop,
                extend,
            }) => ({
                format,
                exports,
                paths,
                amd,
                name,
                globals,
                indent,
                strict,
                banner,
                footer,
                intro,
                outro,
                sourcemap: sourceMap,
                sourcemapFile: sourceMapFile,
                interop,
                extend,
            }))(options);

            const isMultipleInput = Array.isArray(files.src) && files.src.length > 1;

            return rollup
                .rollup({
                    ...inputOptions,
                    input: files.src,
                    plugins,
                })
                .then(bundle => bundle.generate({
                    ...outputOptions,
                    [isMultipleInput ? "dir" : "files"]: files.dest,
                }))
                .then(result => result.output.forEach((output) => {
                    let { code } = output;
                    const dest = isMultipleInput ? path.join(files.dest, output.fileName) : files.dest;
                    const dir = path.dirname(dest);

                    if (outputOptions.sourcemap === true) {
                        const sourceMapOutPath = outputOptions.sourcemapFile || `${dest}.map`;
                        grunt.file.write(sourceMapOutPath, String(output.map));
                        code += `\n//# sourceMappingURL=${path.relative(dir, sourceMapOutPath)}`;
                    }
                    else if (outputOptions.sourcemap === "inline") {
                        code += `\n//# sourceMappingURL=${output.map.toUrl()}`;
                    }

                    grunt.file.write(dest, code);
                }));
        });

        Promise
            .all(promises)
            .then(done)
            .catch(error => grunt.fail.warn(error));
    });
};
