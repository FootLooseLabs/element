var indexHTMLMarkup = (_data) => {
// console.log("DATA = ", _data);
return `<!DOCTYPE HTML>
<html>
	<head>
	    <title>${_data.head.title}</title>
	    <meta charset="UTF-8" />
	    <meta http-equiv="X-UA-Compatible" content="IE=edge">
	    <meta name="description" content="${_data.head.description}" />
	    <meta name="keywords" content="${_data.head.keywords.join(', ')}" />

	    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, user-scalable=no">
	    <meta http-equiv="ScreenOrientation" content="autoRotate:disabled">
	    <meta name="theme-color" content="${_data.head.themeColor}" />

	    <meta property="og:image" content="./assets/imgs/muffin.js.png">
	    <meta name="twitter:image" content="./assets/imgs/muffin.js.png">
	    <meta name="twitter:card" content="./assets/imgs/muffin.js.png">
	    <link rel="icon" href="./assets/imgs/muffin.js.png" type="image/gif" />

	    <link inline-src rel="stylesheet" href="/styles/app.min.css" />
	    <script inline-src src="../node_modules/muffin/dist/muffin.min.js"></script>
	    <script inline-src src="./scripts/app.min.js"></script>
	</head>

	<body class="grey lighten-4">
		<div class="site-wrapper">
		    <hello-world></hello-world>
		</div>
	</body>
</html>`
}

module.exports = {
	indexHTMLMarkup	
}