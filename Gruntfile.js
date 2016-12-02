module.exports = function(grunt) {
    "use strict";

    var pkg = grunt.file.readJSON("package.json");
    grunt.initConfig({
        widgetName: pkg.widgetName,

        watch: {
            autoDeployUpdate: {
                files: [ "./src/**/*" ],
                tasks: [ "compress", "copy" ],
                options: {
                    debounceDelay: 250,
                    livereload: true
                }
            }
        },

        compress: {
            makeZip: {
                options: {
                    archive: "./dist/" + pkg.widgetName + ".mpk",
                    mode: "zip"
                },
                files: [ {
                    expand: true,
                    date: new Date(),
                    store: false,
                    cwd: "./src",
                    src: [ "**/*" ]
                } ]
            }
        },

        copy: {
            deployment: {
                files: [
                    { dest: "./test/deployment/web/widgets", cwd: "./src/", src: [ "**/*" ], expand: true }
                ]
            },
            mpks: {
                files: [
                    { dest: "./test/widgets", cwd: "./dist/", src: [ pkg.widgetName + ".mpk" ], expand: true }
                ]
            }
        },

        clean: { build: [ "./dist" ] },

        csslint: {
            strict: {
                options: { import: 2 },
                src: [ "src/" + pkg.widgetName + "/widget/ui/*.css" ]
            }
        },

        eslint: {
            options: { fix: true },
            target: [ "src/" + pkg.widgetName + "/widget/" + pkg.widgetName + ".js" ]
        }
    });

    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-csslint");
    grunt.loadNpmTasks("grunt-eslint");

    grunt.registerTask(
        "default",
        "Watches for changes and automatically creates an MPK file, copy changes to the deployment folder",
        [ "clean build", "watch" ]
    );

    grunt.registerTask(
        "clean build",
        "Compiles all the assets and copies the files to the build directory.",
        [ "clean", "compress", "copy" ]
    );

    grunt.registerTask(
        "build",
        [ "clean build" ]
    );
};
