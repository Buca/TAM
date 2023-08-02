if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./scripts/app/SW.js")
      .then((reg) => console.log("service Worker: registered"))
      .catch((err) => console.log(`service worker; Error:${err}`));
  });
}

particlesJS("particles", {
  particles: {
    number: { value: 16, density: { enable: true, value_area: 800 } },
    color: { value: "#CCC" },
    shape: {
      type: "circle",
      stroke: { width: 0, color: "#000000" },
      polygon: { nb_sides: 5 }
    },
    opacity: {
      value: 0.4,
      random: true,
      anim: { enable: true, speed: 1, opacity_min: 0.6, sync: false }
    },
    size: {
      value: 200,
      random: true,
      anim: { enable: true, speed: 1, size_min: 50, sync: false }
    },
    line_linked: {
      enable: false
    }
  },
  retina_detect: true
});

const update = function () {

  requestAnimationFrame( update );

};

requestAnimationFrame( update );

const masterVolumeInput = document.querySelector('#master-volume');
const UIVolumeInput = document.querySelector('#ui-volume');
const ambientInput = document.querySelector('#ambient-volume');
const musicInput = document.querySelector('#music-volume');

const observer = new IntersectionObserver( onIntersection, {
	  root: null,   // default is the viewport
	  threshold: .1 // percentage of target's visible area. Triggers "onIntersection"
});

	// callback is called on intersection change
function onIntersection(entries, opts){
	  entries.forEach( entry => { 
	    playHoverButtonSound();
	    entry.target.classList.toggle('visible', entry.isIntersecting)
	  });
};

async function openMenu() {

	const sidebar = document.getElementById('game-sidebar');

	sidebar.querySelector('h2').textContent = '';

	playOpenMenuSound();

	sidebar.classList.remove('hidden');
	sidebar.classList.remove('closed');
	sidebar.classList.add('open');

	for ( const page of sidebar.querySelectorAll('.page') ) 
			page.classList.add('hidden');

	sidebar.querySelector('#menu').classList.remove('hidden');

};

async function closeMenu() {

	const sidebar = document.getElementById('game-sidebar');
	sidebar.classList.remove('open');
	sidebar.classList.add('closed');

	playCloseMenuSound();

	sidebar.onanimationend = () => {

		if ( !sidebar.classList.contains('open') ) sidebar.classList.add('hidden');

	};

};

function startLoadingBuySnippetButton() {

	const button = document.getElementById('buy-snippet-button');
	button.disabled = true;

	const icon = button.querySelector('i');
	icon.classList.remove('gg-add');
	icon.classList.add('gg-spinner-two-alt');

};

function stopLoadingBuySnippetButton() {

	const button = document.getElementById('buy-snippet-button');
	//button.disabled = false;

	const icon = button.querySelector('i');
	icon.classList.remove('gg-spinner-two-alt');
	icon.classList.add('gg-add');

};

function startLoadingNextDocumentButton() {

	const button = document.getElementById('next-document-button');
	button.disabled = true;

	const icon = button.querySelector('i');
	icon.classList.remove('gg-arrow-right');
	icon.classList.add('gg-spinner-two-alt');

};

function stopLoadingNextDocumentButton() {

	const button = document.getElementById('next-document-button');
	button.disabled = false;

	const icon = button.querySelector('i');
	icon.classList.remove('gg-spinner-two-alt');
	icon.classList.add('gg-arrow-right');

	// Set new price or disable the button if no more snippets left

};

async function displaySnippet( snippet ) {

	// Create snippet element and add it to the feed:
		const snippetElement = document.createElement('div');
		snippetElement.classList.add('snippet');

		const label = document.createElement('div');
		label.classList.add('label');

		const text = document.createElement('p');
		text.textContent = Game.document.nextSnippetIndex + '.';

		label.append( text );
		snippetElement.append( label );

		document.querySelector('#feed content').append( snippetElement );

		snippetElement.scrollIntoView({ behavior: "smooth", block: "end"});
		observer.observe(snippetElement);

		//  Write each word
		await writeEachWord( snippet, snippetElement, 20, playTypeWordSound );
		snippetElement.scrollIntoView({ behavior: "smooth", block: "end"});

}

async function buySnippet( pay = true ) {

	const snippetIndex = Game.document.nextSnippetIndex;

	if ( Game.document.snippets.length > snippetIndex ) {
			
		// Get the snippet
		const snippet = Game.document.snippets[ snippetIndex ];

		// Increment by one
		Game.document.nextSnippetIndex += 1;

		// Save game
		saveGame('TAM');

		if ( pay ) removeCredits( snippetPrice(snippet) );

		//Display loading state for button:
		startLoadingBuySnippetButton();

		await displaySnippet( snippet );
		
		if ( snippetIndex + 1 < Game.document.snippets.length ) {
				
			const label = document.querySelector('#buy-snippet-button .label');

			if ( label.textContent !== 'BUY SNIPPET' ) await writeEachLetter('BUY SNIPPET', label, 20, playTypeLetterSound, playRemoveLetterSound);
			document.querySelector('#buy-snippet-button .price').textContent = '-'+snippetPrice(Game.document.snippets[ snippetIndex+1 ]);
			document.querySelector('#buy-snippet-button .price').classList.remove('hidden');
			document.querySelector('#buy-snippet-button .currency').classList.remove('hidden');
			document.querySelector('#buy-snippet-button').disabled = false;

		} else {

			document.querySelector('#buy-snippet-button').disabled = true;
			document.querySelector('#buy-snippet-button .price').classList.add('hidden');
			document.querySelector('#buy-snippet-button .currency').classList.add('hidden');

			writeEachLetter('NO SNIPPETS LEFT', document.querySelector('#buy-snippet-button .label'), 20, playTypeLetterSound, playRemoveLetterSound);

		}

		stopLoadingBuySnippetButton();

	}

};

async function removeCredits( price ) {

	const valueElem = document.querySelector('#credits .value');

	Game.stats.credits -= price;

	const iterations = Math.ceil( Math.min( 30, price/5 ) );
	const perIteration = price/iterations;
	const previousValue = parseInt( valueElem.textContent );

	for ( let i = 0; i < iterations; i ++ ) {

		valueElem.textContent = Math.floor( previousValue - i*perIteration );
		playAddCreditsSound();

		if ( i !== iterations - 1 ) await delay( 35 );
		else valueElem.textContent = previousValue - price;

	}

};

async function clearSnippets() {

	const snippetElements = document.querySelectorAll('#feed .snippet');

	for( const snippet of snippetElements ) {

		snippet.classList.add('close');
		await delay(50);

	}

	for( const snippet of snippetElements ) snippet.remove();

};

function snippetPrice( snippet ) {

	let hiddenTotal = 0;

	for( const { hide } of snippet ) 
		if ( hide ) hiddenTotal ++;

	return hiddenTotal * Game.pricePerWord;

}

function documentWorth() {

	let total = 0;

	for ( const snippet of Game.document.snippets ) 
		total += snippetPrice( snippet ); 

	return total;

};

function generateFilename( title, id ) {

	const join = ['_', '-'];

	const prefix = [ 'corrupted', 'broken', 'fragmented', 'degraded', 'unknown', 'unspecified', 'undefined' ]; 
	const suffix = [ 'document', 'doc', 'file', 'logs', 'article', 'chronicle', 'report', 'archive', 'record' ];
	const type = [ 'txt', 'pdf', 'doc', 'docx', 'wiki', 'note', 'rft', 'html', 'json', 'wpd', 'odt', 'tex', 'xml' ];

	return chooseOneRandomly(prefix) + chooseOneRandomly(join) + chooseOneRandomly(suffix) + '.' + chooseOneRandomly( type );

};

async function changeOptions( options ) {

	const buttons = document.querySelectorAll('#options button')

	for ( let i = 0; i < buttons.length; i ++ ) {

		const e = buttons[ i ]

		e.classList.add('transition-out');
		playOptionOutSound();

		e.onanimationend = () => {

			e.classList.remove('invisible');

			e.querySelector('.value').textContent = options[ i++ ].title;
			e.classList.remove('transition-out');
			e.classList.add('transition-in');
			e.classList.remove('incorrect');
			e.classList.remove('correct');
			e.classList.remove('correct-alt');
			playOptionInSound();
			e.onanimationend = () => {

				e.classList.remove('transition-in');

			}

		};

		if ( i < 3) await delay( 100 );

	}

};

async function nextDocument() {

	startLoadingNextDocumentButton();

	document.querySelector('#next-document-button').disabled = true;

	for ( const e of document.querySelectorAll('#options button') ) e.disabled = true;
	

	let options;

	if ( Game.settings.category.toLowerCase() === 'random' ) {

		console.log('CATEGORY:', Game.settings.category );
		options = await retrieveTitlesFromRandomCategory();

	} else {

		options = await retrieveTitlesFromCategory( Game.settings.category );

	}

	if ( options === false ) {

		// switch category to random
		selectCategory('Random');
		return nextDocument();

	}

	const winner = chooseOneRandomly( options );
	const snippets = obfuscate( winner.title, await retrieveSnippetsByTitle( winner.title ), Game.difficulty );

	Game.document = { options, snippets, winner, nextSnippetIndex: 1 };

	saveGame('TAM');

	displayDocument();
	
	document.querySelector('#next-document-button').disabled = false;

};

async function addCredits() {

	const valueElem = document.querySelector('#credits .value');

	const reward = documentWorth();

	Game.stats.credits += reward;

	document.querySelector('#credits-menu .value').textContent = Game.stats.credits

	const iterations = Math.ceil( Math.min( 30, reward/5 ) );
	const perIteration = reward/iterations;
	const previousValue = parseInt( valueElem.textContent );

	for ( let i = 0; i < iterations; i ++ ) {

		valueElem.textContent = Math.floor( previousValue + i*perIteration );
		playAddCreditsSound();

		if ( i !== iterations - 1 ) await delay( 35 );
		else valueElem.textContent = previousValue + reward;

	}

};

async function win( index ) {

	Game.documents.push( Game.document.winner.pageid );

	const option = document.querySelectorAll('#options button')[ index ];

	option.classList.add('correct');
	playWinSound();
	addCredits();

	const hiddenWords = document.querySelectorAll('#feed .hide');

	for( const word of hiddenWords ) {

		word.classList.add('unhide');

		await delay(10);

	}

	option.onanimationend = () => {

		nextDocument();
	
	};
	
};

async function lose( index ) {

	const option = document.querySelectorAll('#options button')[ index ];

	option.classList.add('incorrect');
	playLoseSound();

	const winnerTitle = Game.document.winner.title;

	for ( const e of document.querySelectorAll('#options button') ) {

		if ( winnerTitle === e.querySelector('.value').textContent ) {

			await delay(1000);
			e.classList.add('correct-alt');

		}

	}


	option.onanimationend = () => {

		nextDocument();
	
	};

};

async function chooseA() {

	if ( Game.document.winner.title === Game.document.options[ 0 ].title ) await win( 0 );
	else await lose( 0 );

};

async function chooseB() {

	if ( Game.document.winner.title === Game.document.options[ 1 ].title ) await win(1);
	else await lose(1);

};

async function chooseC() {

	if ( Game.document.winner.title === Game.document.options[ 2 ].title ) await win(2);
	else await lose(2);

};

async function chooseD() {

	if ( Game.document.winner.title === Game.document.options[ 3 ].title ) await win(3);
	else await lose(3);

};

function toggleNightmode() {

	document.querySelector('#root').classList.toggle('nightmode');

};

function toggleMenu() {

	document.getElementById('root').classList.toggle('sidebar');

};

function toggleSound() {};

function setBrightness() {};

function setMasterVolume( value ) {

	Game.settings.masterVolume = value;
	masterGain.gain.value = value;

	saveSettings();

};

function setUIVolume( value ) {

	Game.settings.UIVolume = value;
	UIGain.gain.value = value;

	saveSettings();

};

function setAmbientVolume( value ) {

	Game.settings.ambientVolume = value;
	ambientGain.gain.value = value;

	saveSettings();

};

function setMusicVolume( value ) {

	Game.settings.musicVolume = value;
	musicGain.gain.value = value;

	saveSettings();

};

function saveGame( name ) {

	const state = JSON.stringify({

		document: Game.document,
		documents: Game.documents,
		category: Game.category,
		stats: Game.stats

	});

	const key = `${name}`;

	localStorage.setItem( key, state );

};

function saveSettings() {

	const settings = JSON.stringify( Game.settings );

	localStorage.setItem( 'settings', settings );

}

function initStats() {

	document.querySelector('#credits .value').textContent = Game.stats.credits;
	document.querySelector('#credits-menu .value').textContent = Game.stats.credits;

};

function loadGame( key ) {

	const state = JSON.parse( localStorage.getItem( key ) );

	Game.currentSaveKey = key;

	Object.assign( Game, state );

	initStats();

	displayDocument(); 

};

function initSoundSettings() {

	masterGain.gain.value = Game.settings.masterVolume;
	musicGain.gain.value = Game.settings.musicVolume;
	UIGain.gain.value = Game.settings.UIVolume;
	ambientGain.gain.value = Game.settings.ambientVolume;

	masterVolumeInput.value = Game.settings.masterVolume;
	musicInput.value = Game.settings.musicVolume;
	UIVolumeInput.value = Game.settings.UIVolume;
	ambientInput.value = Game.settings.ambientVolume;

};

function initDifficulty() {

	const button = document.querySelector('#difficulty-game-option');
	button.querySelector('.value').textContent = Game.settings.difficulty;

	button.addEventListener('click', () => toggleDifficulty() );

}

function toggleDifficulty() {

	console.log('START:', Game.settings.difficulty)

	if ( Game.settings.difficulty === 'EASY' ) Game.settings.difficulty = 'NORMAL';
	else if ( Game.settings.difficulty === 'NORMAL' ) Game.settings.difficulty = 'HARD';
	else if ( Game.settings.difficulty === 'HARD' ) Game.settings.difficulty = 'EASY';

	console.log('END:', Game.settings.difficulty )

	saveSettings();

	writeEachLetter( Game.settings.difficulty, document.querySelector('#difficulty-game-option .value'), 10, playTypeLetterSound, playRemoveLetterSound );

};

function initCategory() {

	const gameButton = document.querySelector('#category-options');

	gameButton.addEventListener('click', () => openCategoryMenu() );

	const categoryText = Game.settings.category.split('Category:').join('');

	const gameTitle = gameButton.querySelector('.value');
	gameTitle.textContent = categoryText;

	const menuTitle = document.querySelector('#category-menu-title');
	menuTitle.textContent = categoryText;

	const searchInput = document.querySelector('#category-search');

	searchInput.addEventListener('input', async e => await search( searchInput.value ) )

};


function openCategoryMenu() {

	openMenu();

	const sidebar = document.querySelector('#game-sidebar');
	const sidebarPages = sidebar.querySelectorAll('.page');

	for ( const page of sidebarPages ) page.classList.add('hidden');

	document.querySelector('#category-page').classList.remove('hidden');
	document.querySelector('#close-sidebar').classList.remove('hidden');

	writeEachLetter( 'CATEGORY', sidebar.querySelector('header h2'), 10, playTypeLetterSound, playRemoveLetterSound );

};

function selectCategory( result ) {

	const toggleCategory = document.querySelector('#category-options');
	toggleCategory.addEventListener('click', () => openCategoryMenu() );

	const gameTitle = document.querySelector('#category-options .value');
	const menuTitle = document.querySelector('#category-menu-title');

	let title = result.title ? result.title : result;

	if ( Game.settings.category === title ) return;

	Game.settings.category = title;

	saveSettings();

	title = title.split('Category:').join('');

	writeEachLetter( title, gameTitle, 10 );
	writeEachLetter( title, menuTitle, 10 );

	const button = document.createElement('button');
	button.classList.add('result');
	button.classList.add('option');

	const label = document.createElement('span');
	label.classList.add('label');
	label.textContent = title;

	button.append( label );

	button.addEventListener('click', () => {

		selectCategory( result );

	});

	const recent = document.querySelector('#recent-categories');

	recent.prepend( button );

	if ( recent.children.length > 4 ) recent.lastChild.remove();

};

async function search( text, maxResults = 10 ) {

		if( 'random'.includes( text.toLowerCase() ) ) {

			// Add random options as a result and get rest of the

		}

		const results = await searchCategories( text, maxResults );

		if ( !results ) return;

		const nodes = [];

		for( const result of results ) {

			const button = document.createElement('button');
			button.classList.add('result');
			button.classList.add('option');

			const label = document.createElement('span');
			label.classList.add('label');
			label.textContent = result.split('Category:').join('');

			button.append( label );

			button.addEventListener('click', () => {

				console.log( result );

				selectCategory( result );

			});

			nodes.push( button );

		}

		document
			.querySelector('#search-results')
			.replaceChildren( ...nodes );

};


function loadSettings() {

	const settings = JSON.parse( localStorage.getItem('settings') );

	Object.assign( Game.settings, settings );

	initDifficulty();
	initCategory();
	initSoundSettings();

};

async function displayDocument() {

	// Clear Current snippets
	startLoadingNextDocumentButton();

	for ( const e of document.querySelectorAll('#options button') ) e.disabled = true;

	await clearSnippets();
	
	stopLoadingNextDocumentButton();

	await writeEachLetter( 
		generateFilename(), 
		document.querySelector('#feed header h3'), 
		20, 
		playTypeLetterSound, 
		playRemoveLetterSound
	);

	writeEachLetter( 
		`+${documentWorth()}`, 
		document.querySelector('#feed .reward .value'), 
		20 
	);

	await changeOptions( Game.document.options );

	const index = Game.document.nextSnippetIndex;
	Game.document.nextSnippetIndex = 0;

	for( let i = 0; i < index; i ++ ) await buySnippet( false );
	
	await delay( 100 ); 

	for ( const e of document.querySelectorAll('#options button') ) e.disabled = false;

};

//new CategorySearch();
//new Difficulty('easy');
//new FontSize('small');

async function showPressAny() {

	document.querySelector(`#initiation-text`).classList.remove(`hidden`);

	loadSettings();

};

async function whenPressAny() {

	return new Promise(( resolve ) => {

		document.body.onclick = () => {

			document.body.onclick = undefined;
			document.querySelector('#initiation-text').classList.add('init-text-fade-out');
			document.querySelector(`#initiation-text`).onanimationend = () => {

				document.querySelector(`#initiation-text`).onanimationend = undefined;
				document.querySelector(`#initiation-text`).classList.remove('init-text-fade-out');
				resolve();

			}

		}

	});

};

async function hidePressAny() {

	document.querySelector(`#initiation-text`).classList.add('hidden');

};

const introSynthGain = new Tone.Gain(1.3).connect(UIGain);
const introSynthA = new Tone.MonoSynth({

	oscillator:{
		type: 'triangle'
	}

}).connect( introSynthGain );

const introSynthB = new Tone.MonoSynth({

	oscillator:{
		type: 'square'
	},
	envelope: {
		attack: 3
	}

}).connect( introSynthGain );


async function showIntro() {

	document.querySelector(`#title-sequence`).classList.remove(`hidden`);

		let now = Tone.now();
		// trigger the attack immediately
		introSynthB.triggerAttackRelease("G1", 2.2, now, 0.15);
		introSynthA.triggerAttackRelease("F2", .2, now + 1.5, 0.3 );
		introSynthA.triggerAttackRelease("A3", .2, now + 1.7, 0.3 );
		introSynthA.triggerAttackRelease("D3", .3, now + 1.9, 0.3 );

		introSynthB.triggerAttackRelease("Bb1", 1, now + 2.1, 0.15);
		introSynthA.triggerAttackRelease("F3", 1, now + 2.1, 0.3 );


		introSynthB.triggerAttackRelease("A1", 15, now + 2.8, 0.15 );
		introSynthA.triggerAttackRelease("A3", 15, now + 2.8, 0.3 );


		introSynthGain.gain.rampTo(.3, now + 4);
		introSynthGain.gain.rampTo(0, now + 8);
		//synth.triggerAttack("E4", now + 7);
		

	return new Promise(( resolve ) => {
		
		document.querySelector('#title-sequence h2').onanimationend = () => {

			document.querySelector('#title-sequence h2').onanimationend = undefined;
			resolve();

		}

	});

};

async function hideIntro() {

	document.querySelector(`#title-sequence`).classList.add(`hidden`);
	document.querySelector(`#title-content`).classList.add(`hidden`);

};

async function displayConsole() {

	Tone.Transport.start();

	document
		.getElementById('next-document-button')
		.addEventListener('click', nextDocument );

	document
		.getElementById('buy-snippet-button')
		.addEventListener('click', buySnippet );

	document
		.querySelector('#choose-option-a')
		.addEventListener('click', chooseA );

	document
		.querySelector('#choose-option-b')
		.addEventListener('click', chooseB );

	document
		.querySelector('#choose-option-c')
		.addEventListener('click', chooseC );

	document
		.querySelector('#choose-option-d')
		.addEventListener('click', chooseD );

	masterVolumeInput.addEventListener('input', () => { 
		setMasterVolume( masterVolumeInput.value );
	} );

	UIVolumeInput.addEventListener('input', () => { 
		setUIVolume( UIVolumeInput.value ); 
	} );

	ambientInput.addEventListener('input', () => { 
		setAmbientVolume( ambientInput.value ); 
	} );

	musicInput.addEventListener('input', () => { 
		setMusicVolume( musicInput.value ); 
	} );

	const snippets = document.querySelector('#feed content');
	let isDown = false;
	let startY;
	let scrollTop;

	snippets.addEventListener('mousedown', (e) => {
	  isDown = true;
	  snippets.classList.add('active');
	  startY = e.pageY - snippets.offsetTop;
	  scrollTop = snippets.scrollTop;
	});
	snippets.addEventListener('mouseleave', () => {
	  isDown = false;
	  snippets.classList.remove('active');
	});
	snippets.addEventListener('mouseup', () => {
	  isDown = false;
	  snippets.classList.remove('active');
	});
	snippets.addEventListener('mousemove', (e) => {
	  if(!isDown) return;
	  e.preventDefault();
	  const y = e.pageY - snippets.offsetTop;
	  const walk = (y - startY); //scroll-fast
	  snippets.scrollTop = scrollTop - walk;
	});

	const sidebar = document.querySelector('#game-sidebar');
	const sidebarPages = sidebar.querySelectorAll('.page');
	const menuOptions = document.querySelectorAll('#menu .menu-option');
	
	for ( const option of menuOptions ) {

		option.addEventListener('click', e => {

			const pageId = option.getAttribute('page-id');

			for ( const page of sidebarPages ) page.classList.add('hidden');

			document.getElementById( pageId ).classList.remove('hidden');
			document.querySelector('#close-sidebar').classList.add('hidden');
			document.querySelector('#back-sidebar').classList.remove('hidden');

			const title = option.querySelector('span').textContent;

			writeEachLetter( title, sidebar.querySelector('header h2'), 20, playTypeLetterSound, playRemoveLetterSound );

		});

	};

	document.querySelector('#open-menu').addEventListener('click', () => openMenu() );
	document.querySelector('#close-sidebar').addEventListener('click', () => closeMenu() ); 

	document.body.addEventListener('keydown', ( e ) => {

		if ( e.key === 'Escape' && !e.repeat ) {

			if ( sidebar.classList.contains('hidden') ) openMenu();

			else closeMenu();

		}

	});

	document.querySelector('#back-sidebar').addEventListener( 'click', () => {

		for ( const page of sidebarPages ) page.classList.add('hidden');
		document.querySelector('#menu').classList.remove('hidden');

		writeEachLetter( '  ', sidebar.querySelector('header h2'), 20, playTypeLetterSound, playRemoveLetterSound );

		document.querySelector('#close-sidebar').classList.remove('hidden');
		document.querySelector('#back-sidebar').classList.add('hidden');

	} );


	if ( !localStorage.getItem('TAM') ) nextDocument();
	else loadGame('TAM');

	document.querySelector('#game-content').classList.remove(`hidden`);

};


async function start() {

	await showPressAny();
	await whenPressAny();
	await hidePressAny();

	await showIntro();
	await hideIntro();

	await displayConsole();


};

start();