const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

// SEE: https://webpack.js.org/guides/production/#specify-the-mode

module.exports = {
	entry: './src/main.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'main.js',
		clean: true,
    publicPath: ''
	},
	externals: {
		uxp: 'commonjs2 uxp',
		photoshop: 'commonjs2 photoshop',
		os: 'commonjs2 os',
		fs: 'commonjs2 fs'
	},
	resolve: {
		extensions: [".js", ".jsx"],
		// Webpack 5, see:
		// https://stackoverflow.com/questions/64557638/how-to-polyfill-node-core-modules-in-webpack-5
		fallback: {
			"fs": false,
			"tls": false,
			"net": false,
			"zlib": false,
			"http": false,
			"https": false,
			"path": require.resolve("path-browserify"),
			"crypto": require.resolve("crypto-browserify"),
			"buffer": require.resolve("buffer/"),
			"stream": require.resolve("stream-browserify"),
		}
	},
	module: {
		rules: [{
				test: /\.js?$/,
				exclude: /node_modules/,
				loader: "babel-loader",
				options: {
					plugins: [
						["@babel/plugin-transform-react-jsx", {
              "runtime": "automatic"
            }],
						"@babel/proposal-object-rest-spread",
						"@babel/plugin-proposal-class-properties",
            "@babel/plugin-transform-computed-properties"
					]
				}
			},
			{
				test: /\.png/,
				exclude: /node_modules/,
				type: 'asset/resource'
				// E.G.
				// import mainImage from './images/main.png';
				// img.src = mainImage; // '/dist/151cfcfa1bd74779aadb.png'
			},
			{
				test: /\.svg/,
				exclude: /node_modules/,
				// All .svg files will be injected into the bundles as data URI.
				// see: https://webpack.js.org/guides/asset-modules/
				type: 'asset/inline'
				// E.G.
				// import metroMap from './images/metro.svg';
 				// block.style.background = `url(${metroMap})` // url(data:image/svg+xml;base64,PHN...
			},
			{
				test: /\.txt/,
				// All .txt files will be injected into the bundles as is.
       			type: 'asset/source',
			},
			{
				test: /\.html/,
				// All .html files will be injected into the bundles as is.
       			type: 'asset/source',
			},	
			{
				test: /\.json/,
				// All .json files will be injected into the bundles as is.
       			type: 'asset/source',
			},						
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader"]
			}
		]
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				path.resolve(__dirname, 'plugin'),
			]
		})
	]
};
