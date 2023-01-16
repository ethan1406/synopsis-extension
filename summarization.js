// import $ from "jquery";

function getVideoId(url) {
  const urlObject = new URL(url);
  const pathname = urlObject.pathname;
  if (pathname.startsWith("/clip")) {
    return document.querySelector("meta[itemprop='videoId']").content;
  } else {
    if (pathname.startsWith("/shorts")) {
      return pathname.slice(8);
    }
    return urlObject.searchParams.get("v");
  }
}

function isVideoLoaded() {
  const videoId = getVideoId(window.location.href);
  return (
    document.querySelector(`ytd-watch-flexy[video-id='${videoId}']`) !== null ||
    // mobile: no video-id attribute
    document.querySelector('#player[loading="false"]:not([hidden])') !== null
  );
}

async function getLangOptions() {
	const videoPageResponse = await fetch(window.location.href)
	const videoPageHtml = await videoPageResponse.text()
	const splittedHtml = videoPageHtml.split('"captions":')

	if (splittedHtml.length < 2) return;

	const captions_json = JSON.parse(splittedHtml[1].split(',"videoDetails')[0].replace('\n', ''));
	const captionTracks = captions_json.playerCaptionsTracklistRenderer.captionTracks;
  const languageOptions = Array.from(captionTracks).map(i => { return i.name.simpleText; })
  
  const first = "English"; // Sort by English first
  languageOptions.sort(function(x,y){ return x.includes(first) ? -1 : y.includes(first) ? 1 : 0; });
  languageOptions.sort(function(x,y){ return x == first ? -1 : y == first ? 1 : 0; });

  return Array.from(languageOptions).map((langName, index) => {
    const link = captionTracks.find(i => i.name.simpleText === langName).baseUrl;
    return {
      language: langName,
      link: link
    }
  })

}

async function getTranscript(langOptions) {
  const rawTranscript = await getRawTranscript(langOptions.link);
  const transcript = rawTranscript.map((item) => { return item.text; }).join(' ');
  return transcript;
}

async function getRawTranscript(link) {

  // Get Transcript
  const transcriptPageResponse = await fetch(link); // default 0
  const transcriptPageXml = await transcriptPageResponse.text();

  // Parse Transcript
  const jQueryParse = $.parseHTML(transcriptPageXml);
  const textNodes = jQueryParse[1].childNodes;

  return Array.from(textNodes).map(i => {
    return {
      start: i.getAttribute("start"),
      duration: i.getAttribute("dur"),
      text: i.textContent
    };
  });

}

function injectElements() {

	const summaryButton = document.createElement('button');
	summaryButton.className = 'Synopsis-summary-button';
	summaryButton.innerHTML = 'Summarize';

	const langOptions = getLangOptions()
	// const transcript = getTranscript(langOptions)

	console.log(transcript)

	const subscribe = document.getElementById('subscribe-button');
	subscribe.parentNode.insertBefore(summaryButton, subscribe.nextsibling)

	const description = document.getElementById('description-inner');
	const summaryArea = document.createElement('div');
	summaryArea.className = 'Synopsis-summary';

	description.parentNode.insertBefore(summaryArea, description)
}


let jsInitCheckTimer = null;

const init = function() {

	function checkForJS_Finish() {
		if (isVideoLoaded()) {

			injectElements()

			clearInterval(jsInitCheckTimer);
			jsInitCheckTimer = null;
		}
	}

	jsInitCheckTimer = setInterval(checkForJS_Finish, 111)

}

init();
