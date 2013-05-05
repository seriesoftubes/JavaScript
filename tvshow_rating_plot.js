var episodes = [];
var chart;
var options = {
	credits: {enabled: false},
    chart: {
		renderTo: 'container',
		zoomType: 'x',
        spacingRight: 20,
		marginTop: 80,
		loading: {
			labelStyle: {color: 'white'},
			style: {backgroundColor: 'gray'}
		},
		backgroundColor: 'rgba(0,0,0,0)'
    },
	title: {
		text: 'Load A TV Show First',
		style: {color: '#3E576F', fontSize: '33px'},
		y: 14
	},
	subtitle: {
		text: 'Source: IMDB.com <br/>' + 
		"Click and drag across the screen to zoom; " +
		"Click on a dot to get more info<br/>" +
		"Light blue dots are in the top 10% of episodes (including ties)"
	},
    xAxis: {
		type: 'datetime',
		maxZoom: 14 * 24 * 3600000, // fourteen days
		title: {text: null}
    },
    yAxis: {
		title: {
			text: 'Rating',
			margin: 30,
			style: {fontSize: '19px', fontWeight: 'normal'}
        },
		tickInterval : 0.5,
        labels: {
			align: 'left',
            x: -15,
            y: 16,
            formatter: function() {
				return Highcharts.numberFormat(this.value, 1);
            }
        },
        showFirstLabel: false,
		allowDecimals : true,
		gridLineWidth: .8,
		max: 10.0
    },
    legend: {
		align: 'left',
        verticalAlign: 'top',
        y: 20,
        floating: true,
        borderWidth: 0
    },
    tooltip: {shared: true, crosshairs: true},
    plotOptions: {
        series: {
			cursor: 'pointer',
            point: {
				events: {
					click: function() {
						var current_episode = episodes[this.id];
						hs.htmlExpand(null, {
							pageOrigin: {x: this.pageX, y: this.pageY},
							headingText: "Episode Title: " + current_episode.title,
							maincontentText: "Rating: " + this.y + "</br>" + 
							"Number of Ratings: " + current_episode.number_of_ratings + "</br>" +
							"Originally Aired: " + Highcharts.dateFormat('%b %e, %Y', this.x) + "</br>Season: " + current_episode.season
							+ "</br>Episode: " + current_episode.title + "</br>" + "<a href=" + current_episode.link + " target='_blank'>" + "</br>Get more info" + "</a>",
							width: 250
						});
					}
                }
            },
            marker: {lineWidth: 1},
			shadow: false
        }
    },
    series: [{
        name: 'Episode Rating',
        lineWidth: .5,
        marker: {radius: 4},
		data: []
    }]
}

function sortDropDownListByText(selectId) {
	$(selectId).html($(selectId + " option").sort(function(a, b) {
	   return a.text == b.text ? 0 : a.text < b.text ? -1 : 1;
	}))
}

function toTitleCase(str) {
	return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function setPageTitle(chosen_show) {
	options.title.text = "";
	if (chosen_show == "simpsons") {
		options.title.text = "The ";
	}
	options.title.text += toTitleCase(chosen_show);
}

function getLastBestAndFirstWorstRatings(topPercent, bottomPercent) {
	var ratings = [];
	for (var i = 0; i < options.series[0].data.length; ++i) {
		ratings.push(options.series[0].data[i].y);
	}
	ratings.sort(function sortNumber(a, b) {
		return b - a;
	})
	var lastBest = ratings[Math.floor(topPercent * ratings.length)],
		firstWorst = ratings[Math.ceil((1 - bottomPercent) * ratings.length)];
	return {'lastBest': lastBest, 'firstWorst': firstWorst};
}

function colorDataPoints() {
	ratingRanges = getLastBestAndFirstWorstRatings(0.1, 0.1);
	var lastBest = ratingRanges.lastBest,
		firstWorst = ratingRanges.firstWorst;
	for (var i = 0; i < options.series[0].data.length; ++i) {
		if (options.series[0].data[i].y >= lastBest) {
			options.series[0].data[i].color = "#9BF5FA";
			options.series[0].data[i].marker.fillColor = "#9BF5FA";
		}
		else if (options.series[0].data[i].y <= firstWorst) {
			options.series[0].data[i].color = "#FD3D02";
			options.series[0].data[i].marker.fillColor = "#FD3D02";
		}
		else {
			options.series[0].data[i].color = "#1A00AD";
			options.series[0].data[i].marker.fillColor = "#1A00AD";
		}
	}
}

function repopulateDataSeries(xml) {
	options.series[0].data = [];
	episodes = [];
	var i = 0;
	$(xml).find('ROW').each(function() {
		var xml_date = $(this).find('originalAirDate').text(),
			d = new Date(xml_date),
			d_utc = Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()),
			rating = Number($(this).find('imdbRating').text()),
			numberRatings = Number($(this).find('imdbNumberOfRatings').text()),
			title = $(this).find('title').text(),
			season = $(this).find('seasonNumber').text(),
			epNbr = $(this).find('episodeInSeason').text(),
			link = $(this).find('link').text();
		var episode_info = {
			'title': title,
			'season': season,
			'episode_number': epNbr,
			'link': link,
			'number_of_ratings': numberRatings,
			'date': d_utc,
			'rating': rating
		};
		episodes.push(episode_info);
		options.series[0].data.push({
			x: d_utc,
			y: rating,
			id: i++,
			marker: {lineWidth:1, lineColor:"003659"}
		});
	});
}

function load() {
	var chosenval = document.getElementById('cboShows').options[document.getElementById('cboShows').selectedIndex].value;
	setPageTitle(chosenval);
	var chosenxml = chosenval + ".xml";
	try {
		$.ajax({
			type: "GET",
			url: chosenxml,
			dataType: "xml",
			success: function(xml) {
				repopulateDataSeries(xml);
				colorDataPoints();
				chart = new Highcharts.Chart(options);
			}
		});
	}
	catch (e) {}
}

$(document).ready(function() {
	sortDropDownListByText('#cboShows');
	chart = new Highcharts.Chart(options);
});