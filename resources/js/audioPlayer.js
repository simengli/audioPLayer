/**
 *  ===================================================
 *	Name: audioPlayer.js
 *	Description: main js files for audio Player demo
 *	Dependency: jQuery.js, NW.js, Node.js
 *	Author: Simeng Li
 *	Version: 0.3
 *	Date: Aug 13 2016
 *  ======================================================
 */


'use strict';

var SL = SL || {};


/**
 *SL -- audioPlay.js
 *
 *
 */

SL.audioPlayer = ( function ($) {

	var audio = new Audio(),
		els = {},
	 	pub = {},
	 	playMethod = 'default',
		playStatus = false;

	var	 _options = {
			autoPlay : true,
			playMethod : 'default'
		};

	pub.init = init;

	function initAudio(el, autoPlay){
		var source = el.data('src'),
			title = el.data('title'),
			author = el.data('author'),
			cover = el.data('cover');


		//loading  Audio source
		if (typeof source != 'undefined' && source != '') {
			audio.src = source;
		}

		//update title and cover img
		els.playName.text(title);
		
		if (typeof cover != 'undefined' && cover != '') {
			els.cover.attr('src', cover);
		}
		else
			els.cover.attr('src','resources/img/noImage.jpeg');

		//update player active status
		var activeEl = els.playList.find('li.active');
		if (activeEl.length > 0) {
			activeEl.removeClass('active');
		}
		else {
			//init all control buttons
			els.crlButtons.find('button').removeAttr('disabled');
			els.progressWrapper.addClass('active');
		}
		el.addClass('active');

		if (el.next().length > 0) {
			els.nextButton.removeAttr('disabled');
		}
		else
			els.nextButton.attr('disabled','disabled');
		if (el.prev().length > 0) {
			els.prevButton.removeAttr('disabled');
		}
		else
			els.prevButton.attr('disabled','disabled');

		//read the volume setting
		audio.volume = parseFloat(els.volumeCrl.val() / 10);

		audio.onloadedmetadata = function() {
			//reset the audio tracker
			progressReset();

			if (autoPlay == true) 
				playAudio();
		}
	}
	function playAudio() {
			audio.play();
			els.playButton.hide();
			els.pauseButton.show();
			//els.duration.fadeIn(400);
			playStatus = true;
			console.log('playing track');
	}
	function pauseAudio() {
		audio.pause();
		els.pauseButton.hide();
		els.playButton.show();
		console.log('pausing track');
	}
	function stopAudio() {

		if (playStatus == true) {
			audio.pause();		
			audio.currentTime = 0;
			els.pauseButton.hide();
			els.playButton.show();
			playStatus = false;
			progressReset();
			console.log('stop playing');
		}
		else
			return true;
	}
	function setVolume(vol) {
		audio.volume = parseFloat(vol / 10);
		els.volumeVal.text(vol * 10);
	}
	function bindEvent() {
		//play button
		els.playButton.on('click', function(e) {
			playAudio();
		});
		//pause button
		els.pauseButton.on('click', function(e) {
			pauseAudio();
		});
		//stop button
		els.stopButton.on('click', function(e) {
			stopAudio();
		});
		//next button
		els.nextButton.on('click', function(e) {
			stopAudio();
			var next = els.playList.find('.active').next();

			if (next.length > 0) {
				initAudio(next,true);
			}
			else
				return false;
		});
		//prev button
		els.prevButton.on('click', function(e) {
			stopAudio();
			var prev = els.playList.find('.active').prev();

			if (prev.length > 0) {
				initAudio(prev,true);
			}
			else
				return true;
		});
		//play list click
		els.playList.find('li').on('click', function(e) {
			var $this = $(this);
			stopAudio();
			initAudio($this, true);
		});
		//Volume Control
		els.volumeCrl.on('change', function(e) {
			setVolume(this.value);
		});
		els.muteButton.on('click', function() {
			localStorage.volume = els.volumeCrl.val();
			els.volumeCrl.val(0).change();
			els.muteButton.toggle();
			els.unmuteButton.toggle();
		});
		els.unmuteButton.on('click', function() {
			els.volumeCrl.val(localStorage.volume).change();
			els.muteButton.toggle();
			els.unmuteButton.toggle();
		});
		//tracking contrl
		els.progressWrapper.on('click', function(e) {
			if ($(this).hasClass('active'))
				updateProgess(e);
			else
				return false;
		});
		//playing method control
		els.methodButtons.on('click', function() {
			var $this = $(this);
			//deavtivate current playing method
			if ($this.hasClass('active')) {
				$this.removeClass('active');
				playMethod = 'default';
			}
			else {
				els.methodButtons.removeClass('active');
				$this.addClass('active');
				playMethod = $this.data('method');
				console.log(playMethod);
			}
		})

		//audio run event 
		$(audio).bind('timeupdate',function(){
			animateProgessBar(audio.currentTime);
			updateCurrentime(audio.currentTime);
		});

		//playend event
		audio.addEventListener('ended', function() {
			stopAudio();
			
			var activeEl = els.playList.find('li.active');
			
			switch(playMethod) {
				case 'single-repeat' :
					playAudio();
					break;
				case 'list-repeat' :
					
					if (els.playList.find('li').length == 1) {
						playAudio();
					}
					else {
						var next = activeEl.next();

						if (next.length == 0) {
							next = $(els.playList.find('li')[0]);
						}
						initAudio(next,true);
					}
					break;
				case 'shuffle' :
					var shuffelList = els.playList.find('li').not('.active'),
						shuffleLength = shuffelList.length,
						next;
					if (shuffleLength > 0) {
						next = $(shuffelList[random(0,shuffleLength - 1)]);
						initAudio(next,true);
					}
					else {
						playAudio();
					}
					break;
				default : 
					return true;
			}
		});
	}
	function updateProgess(e) {
		var mouseX,
			percentage,
			newTime;

		//get postion
		if (e.offsetX)
			mouseX = e.offsetX;
		if (mouseX === undefined && e.layerX)
			mouseX = e.layerX;

		//calculate the time
		percentage = mouseX / els.progressWrapper.width();
		newTime = audio.duration * percentage;

		//set time update
		audio.currentTime = newTime;
		animateProgessBar(newTime);
		updateCurrentime(newTime);
	}
	function animateProgessBar(setTime) {
		var value = 0;
		if (setTime > 0) {
			value = (100 / audio.duration) * setTime;
		}
		if (value < 2)
			value = 2;
		els.progressBar.css('width',value+'%');
	}
	function updateCurrentime(setTime) {
		els.currentTime.html(timeFormat(setTime));
	}
	function progressReset() {
		els.progressBar.css('width','2%');
		els.currentTime.html('00:00');
		els.duration.html(timeFormat(audio.duration));
	}
	function init(options) {

		// play options
		if (typeof options.autoPlay !== 'undefined') { _options.autoPlay = options.autoPlay };
		if (typeof options.playMethod !== 'undefined') { _options.playMethod = options.playMethod };

		//binding elements
		els.playName = $('.player .trackName');
		els.cover = $('.audio-cover img');
		els.playList = $('.play-list ul');
		
		els.crlButtons = $('.control-buttons');
		els.playButton = els.crlButtons.find('#play');
		els.pauseButton = els.crlButtons.find('#pause');
		els.stopButton = els.crlButtons.find('#stop');
		els.prevButton = els.crlButtons.find('#prev');
		els.nextButton = els.crlButtons.find('#next');
		
		els.volumeCrl = $('input.volume');
		els.volumeVal = $('.volume-value');
		els.muteButton = $('.volume-icon');
		els.unmuteButton = $('.mute-icon');
		els.methodButtons = $('.playing-method');

		els.progressWrapper = $('.progress-bar');
		els.progressBar = $('.progress-bar-played');
		els.currentTime = $('.current-time');
		els.duration = $('.duration');

		bindEvent();
		playMethod = _options.playMethod;
		
		if (_options.playMethod && els.playList.find('li').length > 0) {
			initAudio($(els.playList.find('li')[0]), true);
		}
	}
	function timeFormat(t) {
		var s = parseInt(t % 60),
			m = parseInt((t / 60) % 60);
		//Add 0 if seconds less than 10
		if (s < 10) {
			s = '0' + s;
		}
		if (m < 10) {
			m = '0' + m;
		}

		return m + ':' + s;
	}
	function random(n,m) {
		var c = m-n+1;  
    	return Math.floor(Math.random() * c + n);
	}

	return pub;

})(jQuery);

$('document').ready(function() {
	var options = {};
	SL.audioPlayer.init(options);
});