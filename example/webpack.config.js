import { CleanWebpackPlugin } from "clean-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";

export default (env, { mode }) => {
  return {
    entry: "./src/index.js",
    output: {
      filename: "bundle.js",
    },
    devServer:{
        port:1119
    },
    devtool: "source-map",
    plugins:[
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template:"./src/index.html"
        }),
    ]
  };
};
