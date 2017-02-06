const webpack = require("webpack");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    entry: "./src/com/mendix/widget/ListViewSwipeOut/ListViewSwipeOut.ts",
    output: {
        path: path.resolve(__dirname, "dist/tmp"),
        filename: "src/com/mendix/widget/ListViewSwipeOut/ListViewSwipeOut.js",
        libraryTarget: "umd",
        umdNamedDefine: false
    },
    resolve: {
        extensions: [ "", ".ts", ".js", ".json" ]
    },
    errorDetails: true,
    module: {
        loaders: [
            { test: /\.ts$/, loader: "ts-loader" },
            { test: /\.json$/, loader: "json" },
            { test: /\.css$/, loader: ExtractTextPlugin.extract("style-loader", "css-loader") }
        ]
    },
    devtool: "source-map",
    externals: [
        "mxui/widget/_WidgetBase",
        "dojo/_base/declare",
        "dojo/aspect",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/query",
        "dijit/registry",
        "dojo/dom-construct"
    ],
    plugins: [
        new CopyWebpackPlugin([
            { from: "src/**/*.js" },
            { from: "src/**/*.xml" }
        ], {
            copyUnmodified: true
        }),
        new ExtractTextPlugin("./src/com/mendix/widget/ListViewSwipeOut/ui/ListViewSwipeOut.css")
    ],
    watch: true
};
