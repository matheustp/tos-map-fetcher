const fs = require('fs'),
	request = require('request'),
	jsdom = require('jsdom/lib/old-api.js');

let download = function (uri, filename, callback) {
	request.head(uri, function (err, res, body) {
		request('https://tos.neet.tv' + uri).pipe(fs.createWriteStream('images/zones/' + filename + '.png')).on('close', callback);
	});
};


function next(obj, position) {
	resultsArray[position] = obj;
	position++;
	if (position < resultsArray.length) {
		getDetails(resultsArray[position], position);
	} else {
		console.log('total: ' + resultsArray.length);
		fs.writeFile('resultsJSON.json', JSON.stringify(resultsArray), 'utf8');
	}
}

const structure = {
	"id": 0,
	"name": "",
	"level": 0,
	"type": "",
	"rank": 0,
	"warp": "",
	"className": "",
	"connectedTo": [],
	"imgUrl": ""
};

let resultsArray = [];

request({ uri: 'https://tos.neet.tv/zones' }, function (error, response, body) {
	if (error && (response === undefined || response.statusCode !== 200)) {
		console.log('Error when contacting the website');
		return;
	}

	jsdom.env({
		html: body,
		scripts: [
			'http://code.jquery.com/jquery-1.5.min.js'
		],
		done: function (err, window) {
			let $ = window.jQuery;
			$('.results-table tr').each(function () {
				let position = 0;
				let currentObject = JSON.parse(JSON.stringify(structure));
				$(this).find('td').each(function () {
					switch (position) {
						case 0:
							currentObject.id = $(this).find('a').html();
							break;
						case 1:
							currentObject.name = $(this).html();
							break;
						case 2:
							currentObject.level = $(this).html();
							break;
						case 3:
							currentObject.type = $(this).html();
							break;
						case 4:
							currentObject.rank = $(this).html().length;
							break;
						case 5:
							currentObject.warp = $(this).html();
							break;
						case 7:
							currentObject.className = $(this).html();
							break;
						default:
							break;
					}
					position++;
				});
				resultsArray.push(currentObject);
			});
			getDetails(resultsArray[0], 0);
		}
	});
});

function getDetails(obj, position) {
	if (obj !== null && obj !== undefined) {
		request({ uri: 'https://tos.neet.tv/zones/' + obj.id }, function (error, response, body) {
			if (error && (response === undefined || response.statusCode !== 200)) {
				console.log('Error fetching details');
				return;
			}

			jsdom.env({
				html: body,
				scripts: [
					'http://code.jquery.com/jquery-1.5.min.js'
				],
				done: function (err, window) {
					let $ = window.jQuery;
					$('table:eq(1) tr').each(function () {
						let link = $(this).find('td:eq(0) a').attr('href');
						if (link !== null && link !== undefined) {
							let id = link.slice(7);
							obj.connectedTo.push(id);
						}
					});
					let imgSrc = $('#zone-radar-img').attr('src');
					if (imgSrc !== null && imgSrc !== undefined) {
						obj.imgUrl = imgSrc;
						download(imgSrc, obj.className, function () {
							console.log('image downloaded' + obj.id);
							next(obj, position);
						});
					} else {
						next(obj, position);
					}
				}
			});
		});
	}
}
