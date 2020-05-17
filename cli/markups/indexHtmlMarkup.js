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

	    <meta property="og:image" content="./assets/imgs/logo_2.1.png">
	    <meta name="twitter:image" content="./assets/imgs/logo_2.1.png">
	    <meta name="twitter:card" content="./assets/imgs/logo_2.1.png">
	    <link rel="icon" href="./assets/imgs/logo_2.1.png" type="image/gif" />

	    <script inline src="/node_modules/muffin/dist/muffin.min.js"></script>
	</head>

	<body>
	    <div class="surface" route="contact-page">
	         <hello-world></hello-world>
	    </div>
	    <script inline src="./assets/js/dist/app.min.js"></script>
	</body>
</html>`
}

module.exports = {
	indexHTMLMarkup	
}