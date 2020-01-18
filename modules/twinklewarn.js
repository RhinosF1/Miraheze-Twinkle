//<nowiki>


(function($){


/*
 ****************************************
 *** twinklewarn.js: Warn module
 ****************************************
 * Mode of invocation:     Tab ("Warn")
 * Active on:              User talk pages
 * Config directives in:   TwinkleConfig
 */

Twinkle.warn = function twinklewarn() {
	if( mw.config.get('wgNamespaceNumber') === 3 ) {
			Twinkle.addPortletLink( Twinkle.warn.callback, "Warn", "tw-warn", "Warn/notify user" );
	}

	// modify URL of talk page on rollback success pages
	if( mw.config.get('wgAction') === 'rollback' ) {
		var $vandalTalkLink = $("#mw-rollback-success").find(".mw-usertoollinks a").first();
		$vandalTalkLink.css("font-weight", "bold");
		$vandalTalkLink.wrapInner($("<span/>").attr("title", "If appropriate, you can use Twinkle to warn the user about their edits to this page."));

		var extraParam = "vanarticle=" + mw.util.rawurlencode(Morebits.pageNameNorm);
		var href = $vandalTalkLink.attr("href");
		if (href.indexOf("?") === -1) {
			$vandalTalkLink.attr("href", href + "?" + extraParam);
		} else {
			$vandalTalkLink.attr("href", href + "&" + extraParam);
		}
	}
};

Twinkle.warn.callback = function twinklewarnCallback() {
	if( mw.config.get('wgTitle').split( '/' )[0] === mw.config.get('wgUserName') &&
			!confirm( 'You are about to warn yourself! Are you sure you want to proceed?' ) ) {
		return;
	}

	var Window = new Morebits.simpleWindow( 600, 440 );
	Window.setTitle( "Warn/notify user" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Choosing a warning level", "WP:UWUL#Levels" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#warn" );

	var form = new Morebits.quickForm( Twinkle.warn.callback.evaluate );
	var main_select = form.append( {
			type: 'field',
			label: 'Choose type of warning/notice to issue',
			tooltip: 'First choose a main warning group, then the specific warning to issue.'
		} );

	var main_group = main_select.append( {
			type: 'select',
			name: 'main_group',
			event:Twinkle.warn.callback.change_category
		} );

	var defaultGroup = parseInt(Twinkle.getPref('defaultWarningGroup'), 10);
	main_group.append( { type: 'option', label: 'General note (1)', value: 'level1', selected: ( defaultGroup === 1 || defaultGroup < 1 || ( Morebits.userIsInGroup( 'sysop' ) ? defaultGroup > 8 : defaultGroup > 7 ) ) } );
	main_group.append( { type: 'option', label: 'Caution (2)', value: 'level2', selected: ( defaultGroup === 2 ) } );
	main_group.append( { type: 'option', label: 'Warning (3)', value: 'level3', selected: ( defaultGroup === 3 ) } );
	main_group.append( { type: 'option', label: 'Final warning (4)', value: 'level4', selected: ( defaultGroup === 4 ) } );
	main_group.append( { type: 'option', label: 'Only warning (4im)', value: 'level4im', selected: ( defaultGroup === 5 ) } );
	main_group.append( { type: 'option', label: 'Single issue notices', value: 'singlenotice', selected: ( defaultGroup === 6 ) } );
	main_group.append( { type: 'option', label: 'Single issue warnings', value: 'singlewarn', selected: ( defaultGroup === 7 ) } );
	if( Twinkle.getPref( 'customWarningList' ).length ) {
		main_group.append( { type: 'option', label: 'Custom warnings', value: 'custom', selected: ( defaultGroup === 9 ) } );
	}
	if( Morebits.userIsInGroup( 'sysop' ) ) {
		main_group.append( { type: 'option', label: 'Blocking', value: 'block', selected: ( defaultGroup === 8 ) } );
	}

	main_select.append( { type: 'select', name: 'sub_group', event:Twinkle.warn.callback.change_subcategory } ); //Will be empty to begin with.

	form.append( {
			type: 'input',
			name: 'article',
			label: 'Linked article',
			value:( Morebits.queryString.exists( 'vanarticle' ) ? Morebits.queryString.get( 'vanarticle' ) : '' ),
			tooltip: 'An article can be linked within the notice, perhaps because it was a revert to said article that dispatched this notice. Leave empty for no article to be linked.'
		} );

	var more = form.append( { type: 'field', name: 'reasonGroup', label: 'Warning information' } );
	more.append( { type: 'textarea', label: 'Optional message:', name: 'reason', tooltip: 'Perhaps a reason, or that a more detailed notice must be appended' } );

	var previewlink = document.createElement( 'a' );
	$(previewlink).click(function(){
		Twinkle.warn.callbacks.preview(result);  // |result| is defined below
	});
	previewlink.style.cursor = "pointer";
	previewlink.textContent = 'Preview';
	more.append( { type: 'div', id: 'warningpreview', label: [ previewlink ] } );
	more.append( { type: 'div', id: 'twinklewarn-previewbox', style: 'display: none' } );

	more.append( { type: 'submit', label: 'Submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();
	result.main_group.root = result;
	result.previewer = new Morebits.wiki.preview($(result).find('div#twinklewarn-previewbox').last()[0]);

	// We must init the first choice (General Note);
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.main_group.dispatchEvent( evt );
};

// This is all the messages that might be dispatched by the code
// Each of the individual templates require the following information:
//   label (required): A short description displayed in the dialog
//   summary (required): The edit summary used. If an article name is entered, the summary is postfixed with "on [[article]]", and it is always postfixed with ". $summaryAd"
//   suppressArticleInSummary (optional): Set to true to suppress showing the article name in the edit summary. Useful if the warning relates to attack pages, or some such.
Twinkle.warn.messages = {
	level1: {
		"Common warnings": {
			"uw-vandalism1": {
				label: "Vandalism",
				summary: "General note: Unconstructive editing"
			},
			"uw-test1": {
				label: "Editing tests",
				summary: "General note: Editing tests"
			},
		},
		"Promotions and spam": {
			"uw-advert1": {
				label: "Using Meta for advertising or promotion",
				summary: "General note: Using Meta for advertising or promotion"
			},
			"uw-spam1": {
				label: "Adding spam links",
				summary: "General note: Adding spam links"
			}
		},
		"Behavior towards other editors": {
			"uw-agf1": {
				label: "Not assuming good faith",
				summary: "General note: Not assuming good faith"
			},
			"uw-harass1": {
				label: "Harassment of other users",
				summary: "General note: Harassment of other users"
			},
			"uw-pa1": {
				label: "Personal attack directed at a specific editor",
				summary: "General note: Personal attack directed at a specific editor"
			},
			"uw-tempabuse1": {
				label: "Improper use of warning or blocking template",
				summary: "General note: Improper use of warning or blocking template"
			}
		},
	},

	level2: {
		"Common warnings": {
			"uw-vandalism2": {
				label: "Vandalism",
				summary: "Caution: Unconstructive editing"
			},
			"uw-test2": {
				label: "Editing tests",
				summary: "Caution: Editing tests"
			},
		},
		"Promotions and spam": {
			"uw-advert2": {
				label: "Using Meta for advertising or promotion",
				summary: "Caution: Using Meta for advertising or promotion"
			},
			"uw-spam2": {
				label: "Adding spam links",
				summary: "Caution: Adding spam links"
			}
		},
		"Behavior towards other editors": {
			"uw-agf2": {
				label: "Not assuming good faith",
				summary: "Caution: Not assuming good faith"
			},
			"uw-harass2": {
				label: "Harassment of other users",
				summary: "Caution: Harassment of other users"
			},
			"uw-pa2": {
				label: "Personal attack directed at a specific editor",
				summary: "Caution: Personal attack directed at a specific editor"
			},
			"uw-tempabuse2": {
				label: "Improper use of warning or blocking template",
				summary: "Caution: Improper use of warning or blocking template"
			}
		},
	},


	level3: {
		"Common warnings": {
			"uw-vandalism3": {
				label: "Vandalism",
				summary: "Warning: Vandalism"
			},
			"uw-disruptive3": {
				label: "Disruptive editing",
				summary: "Warning: Disruptive editing"
			},
			"uw-test3": {
				label: "Editing tests",
				summary: "Warning: Editing tests"
			},
		},

		"Promotions and spam": {
			"uw-advert3": {
				label: "Using Meta for advertising or promotion",
				summary: "Warning: Using Meta for advertising or promotion"
			},
			"uw-spam3": {
				label: "Adding spam links",
				summary: "Warning: Adding spam links"
			}
		},
		"Behavior towards other users": {
			"uw-agf3": {
				label: "Not assuming good faith",
				summary: "Warning: Not assuming good faith"
			},
			"uw-harass3": {
				label: "Harassment of other users",
				summary: "Warning: Harassment of other users"
			},
			"uw-pa3": {
				label: "Personal attack directed at a specific editor",
				summary: "Warning: Personal attack directed at a specific editor"
			}
		},
	},


	level4: {
		"Common warnings": {
			"uw-generic4": {
				label: "Generic warning (for template series missing level 4)",
				summary: "Final warning notice"
			},
			"uw-vandalism4": {
				label: "Vandalism",
				summary: "Final warning: Vandalism"
			},
			"uw-delete4": {
				label: "Removal of content, blanking",
				summary: "Final warning: Removal of content, blanking"
			}
		},
		"Promotions and spam": {
			"uw-advert4": {
				label: "Using Meta for advertising or promotion",
				summary: "Final warning: Using Meta for advertising or promotion"
			},
			"uw-spam4": {
				label: "Adding spam links",
				summary: "Final warning: Adding spam links"
			}
		},
		"Behavior towards other editors": {
			"uw-harass4": {
				label: "Harassment of other users",
				summary: "Final warning: Harassment of other users"
			},
			"uw-pa4": {
				label: "Personal attack directed at a specific editor",
				summary: "Final warning: Personal attack directed at a specific editor"
			}
		},
	},

	level4im: {
		"Common warnings": {
			"uw-vandalism4im": {
				label: "Vandalism",
				summary: "Only warning: Vandalism"
			},
			"uw-delete4im": {
				label: "Removal of content, blanking",
				summary: "Only warning: Removal of content, blanking"
			},
			"uw-upvio-wikiname": {
			label: "Username policy violation (Wikiname)",
			summary: "Only warning: Violation of the username policy (wikiname)"
			}
		},
		"Promotions and spam": {
			"uw-advert4im": {
				label: "Using Meta for advertising or promotion",
				summary: "Only warning: Using Meta for advertising or promotion"
			},
			"uw-spam4im": {
				label: "Adding spam links",
				summary: "Only warning: Adding spam links"
			}
		},
		"Behavior towards other editors": {
			"uw-harass4im": {
				label: "Harassment of other users",
				summary: "Only warning: Harassment of other users"
			},
			"uw-npa4im": {
				label: "Personal attack directed at a specific editor",
				summary: "Only warning: Personal attack directed at a specific editor"
			}
		},
		"Other": {
			"uw-create4im": {
				label: "Creating inappropriate pages",
				summary: "Only warning: Creating inappropriate pages"
			},
			"uw-move4im": {
				label: "Page moves against naming conventions or consensus",
				summary: "Only warning: Page moves against naming conventions or consensus"
			},
			"uw-upload4im": {
				label: "Uploading unencyclopedic images",
				summary: "Only warning: Uploading unencyclopedic images"
			}
		}/*,
		"To be removed from Twinkle": {
			"uw-af4im": {
				label: "Inappropriate feedback through the Article Feedback Tool",
				summary: "Only warning: Inappropriate feedback through the Article Feedback Tool"
			},
			"uw-redirect4im": {
				label: "Creating malicious redirects",
				summary: "Only warning: Creating malicious redirects"
			}
		}*/
	},


	singlenotice: {
		"uw-2redirect": {
			label: "Creating double redirects through bad page moves",
			summary: "Notice: Creating double redirects through bad page moves"
		},
		"uw-warn": {
			label: "Place user warning templates when reverting vandalism",
			summary: "Notice: You can use user warning templates when reverting vandalism"
		}
	},

	singlewarn: {
		"uw-3rr": {
			label: "Violating the three-revert rule; see also uw-ew",
			summary: "Warning: Violating the three-revert rule"
		},
		"uw-affiliate": {
			label: "Affiliate marketing",
			summary: "Warning: Affiliate marketing"
		},
		"uw-agf-sock": {
			label: "Use of multiple accounts (assuming good faith)",
			summary: "Warning: Using multiple accounts"
		},
		"uw-attack": {
			label: "Creating attack pages",
			summary: "Warning: Creating attack pages",
			suppressArticleInSummary: true
		},
		"uw-attempt": {
			label: "Triggering the edit filter",
			summary: "Warning: Triggering the edit filter"
		},
		"uw-bizlist": {
			label: "Business promotion",
			summary: "Warning: Promoting a business"
		},
		"uw-botun": {
			label: "Bot username",
			summary: "Warning: Bot username"
		},
		"uw-canvass": {
			label: "Canvassing",
			summary: "Warning: Canvassing"
		},
		"uw-copyright": {
			label: "Copyright violation",
			summary: "Warning: Copyright violation"
		},
		"uw-copyright-link": {
			label: "Linking to copyrighted works violation",
			summary: "Warning: Linking to copyrighted works violation"
		},
		"uw-copyright-new": {
			label: "Copyright violation (with explanation for new users)",
			summary: "Notice: Avoiding copyright problems",
			heading: "Meta and copyright"
		},
		"uw-copyright-remove": {
			label: "Removing {{copyvio}} template from articles",
			summary: "Warning: Removing {{copyvio}} templates"
		},
		"uw-efsummary": {
			label: "Edit summary triggering the edit filter",
			summary: "Warning: Edit summary triggering the edit filter"
		},
		"uw-ew": {
			label: "Edit warring (stronger wording)",
			summary: "Warning: Edit warring"
		},
		"uw-ewsoft": {
			label: "Edit warring (softer wording for newcomers)",
			summary: "Warning: Edit warring"
		},
		"uw-hoax": {
			label: "Creating hoaxes",
			summary: "Warning: Creating hoaxes"
		},
		"uw-legal": {
			label: "Making legal threats",
			summary: "Warning: Making legal threats"
		},
		"uw-login": {
			label: "Editing while logged out",
			summary: "Warning: Editing while logged out"
		},
		"uw-longterm": {
			label: "Long term pattern of vandalism",
			summary: "Warning: Long term pattern of vandalism"
		},
		"uw-multipleIPs": {
			label: "Usage of multiple IPs",
			summary: "Warning: Usage of multiple IPs"
		},
		"uw-pinfo": {
			label: "Personal info",
			summary: "Warning: Personal info"
		},
		"uw-socksuspect": {
			label: "Sockpuppetry",
			summary: "Warning: You are a suspected [[WP:SOCK|sockpuppet]]"  // of User:...
		},
		"uw-upv": {
			label: "Userpage vandalism",
			summary: "Warning: Userpage vandalism"
		},
		"uw-username": {
			label: "Username is against policy",
			summary: "Warning: Your username might be against policy",
			suppressArticleInSummary: true  // not relevant for this template
		},
		"uw-coi-username": {
			label: "Username is against policy, and conflict of interest",
			summary: "Warning: Username and conflict of interest policy",
			heading: "Your username"
		},
		"uw-userpage": {
			label: "Userpage or subpage is against policy",
			summary: "Warning: Userpage or subpage is against policy"
		},
		"uw-wrongsummary": {
			label: "Using inaccurate or inappropriate edit summaries",
			summary: "Warning: Using inaccurate or inappropriate edit summaries"
		}
	},


	block: {
		"uw-block": {
			label: "Block",
			summary: "You have been blocked from editing",
			pageParam: true,
			reasonParam: true,  // allows editing of reason for generic templates
			suppressArticleInSummary: true
		},
		"uw-blocknotalk": {
			label: "Block - talk page disabled",
			summary: "You have been blocked from editing and your user talk page has been disabled",
			pageParam: true,
			reasonParam: true,
			suppressArticleInSummary: true
		},
		"uw-blockindef": {
			label: "Block - indefinite",
			summary: "You have been indefinitely blocked from editing",
			indefinite: true,
			pageParam: true,
			reasonParam: true,
			suppressArticleInSummary: true
		},
		"uw-ablock": {
			label: "Block - IP address",
			summary: "Your IP address has been blocked from editing",
			pageParam: true,
			suppressArticleInSummary: true
		},
		"uw-vblock": {
			label: "Vandalism block",
			summary: "You have been blocked from editing for persistent [[WP:VAND|vandalism]]",
			pageParam: true
		},
		"uw-voablock": {
			label: "Vandalism-only account block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your account is being [[WP:VOA|used only for vandalism]]",
			indefinite: true,
			pageParam: true
		},
		"uw-sblock": {
			label: "Spam block",
			summary: "You have been blocked from editing for using Meta for spam purposes"
		},
		"uw-adblock": {
			label: "Advertising block",
			summary: "You have been blocked from editing for [[WP:SOAP|advertising or self-promotion]]",
			pageParam: true
		},
		"uw-soablock": {
			label: "Spam/advertising-only account block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your account is being used only for [[WP:SPAM|spam, advertising, or promotion]]",
			indefinite: true,
			pageParam: true
		},
		"uw-npblock": {
			label: "Creating nonsense pages block",
			summary: "You have been blocked from editing for creating [[WP:PN|nonsense pages]]",
			pageParam: true
		},
		"uw-copyrightblock": {
			label: "Copyright violation block",
			summary: "You have been blocked from editing for continued [[WP:COPYVIO|copyright infringement]]",
			pageParam: true
		},
		"uw-spoablock": {
			label: "Sockpuppet account block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your account is being used only for [[WP:SOCK|sock puppetry]]",
			indefinite: true
		},
		"uw-ipevadeblock": {
			label: "Block-evasion block - IP address",
			summary: "Your IP address has been blocked from editing because it has been used to [[WP:EVADE|evade a previous block]]"
		},
		"uw-hblock": {
			label: "Harassment block",
			summary: "You have been blocked from editing for attempting to [[WP:HARASS|harass]] other users",
			pageParam: true
		},
		"uw-disruptblock": {
			label: "Disruptive editing block",
			summary: "You have been blocked from editing for [[WP:DE|disruptive editing]]",
			pageParam: true
		},
		"uw-deoablock": {
			label: "Disruption/trolling-only account block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your account is being used only for [[WP:DE|trolling, disruption or harassment]]",
			indefinite: true,
			pageParam: true
		},
		"uw-lblock": {
			label: "Legal threat block (indefinite)",
			summary: "You have been indefinitely blocked from editing for making [[WP:NLT|legal threats or taking legal action]]",
			indefinite: true
		},
		"uw-aeblock": {
			label: "Arbitration enforcement block",
			summary: "You have been blocked from editing for violating an [[WP:Arbitration|arbitration decision]] with your edits",
			pageParam: true,
			reasonParam: true
		},
		"uw-efblock": {
			label: "Edit filter-related block",
			summary: "You have been blocked from editing for making disruptive edits that repeatedly triggered the [[WP:EF|edit filter]]"
		},
		"uw-myblock": {
			label: "Social networking block",
			summary: "You have been blocked from editing for using user and/or article pages as a [[WP:NOTMYSPACE|blog, web host, social networking site or forum]]",
			pageParam: true
		},
		"uw-dblock": {
			label: "Deletion/removal of content block",
			summary: "You have been blocked from editing for continued [[WP:VAND|removal of material]]",
			pageParam: true
		},
		"uw-compblock": {
			label: "Possible compromised account block (indefinite)",
			summary: "You have been indefinitely blocked from editing because it is believed that your [[WP:SECURE|account has been compromised]]",
			indefinite: true
		},
		"uw-botblock": {
			label: "Unapproved bot block",
			summary: "You have been blocked from editing because it appears you are running a [[WP:BOT|bot script]] without [[WP:BRFA|approval]]",
			pageParam: true
		},
		"uw-ublock": {
			label: "Username soft block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your username is a violation of the [[WP:U|username policy]]",
			indefinite: true,
			reasonParam: true
		},
		"uw-uhblock": {
			label: "Username hard block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your username is a blatant violation of the [[WP:U|username policy]]",
			indefinite: true,
			reasonParam: true
		},
		"uw-softerblock": {
			label: "Promotional username soft block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] gives the impression that the account represents a group, organization or website",
			indefinite: true
		},
		"uw-causeblock": {
			label: "Promotional username soft block, for charitable causes (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] gives the impression that the account represents a group, organization or website",
			indefinite: true
		},
		"uw-botublock": {
			label: "Bot username soft block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] indicates this is a [[WP:BOT|bot]] account, which is currently not approved",
			indefinite: true
		},
		"uw-memorialblock": {
			label: "Memorial username soft block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] indicates this account may be used as a memorial or tribute to someone",
			indefinite: true
		},
		"uw-ublock-famous": {
			label: "Famous username soft block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] matches the name of a well-known living individual",
			indefinite: true
		},
		"uw-ublock-double": {
			label: "Similar username soft block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] is too similar to the username of another Meta user",
			indefinite: true
		},
		"uw-uhblock-double": {
			label: "Username impersonation hard block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] appears to impersonate another established Meta user",
			indefinite: true
		},
		"uw-vaublock": {
			label: "Vandalism-only account and username hard block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your account is being [[WP:VOA|used only for vandalism]] and your username is a blatant violation of the [[WP:U|username policy]]",
			indefinite: true,
			pageParam: true
		},
		"uw-spamublock": {
			label: "Spam-only account and promotional username hard block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your account is being used only for [[WP:SPAM|spam or advertising]] and your username is a violation of the [[WP:U|username policy]]",
			indefinite: true
		}
	}
};

Twinkle.warn.prev_block_timer = null;
Twinkle.warn.prev_block_reason = null;
Twinkle.warn.prev_article = null;
Twinkle.warn.prev_reason = null;

Twinkle.warn.callback.change_category = function twinklewarnCallbackChangeCategory(e) {
	var value = e.target.value;
	var sub_group = e.target.root.sub_group;
	sub_group.main_group = value;
	var old_subvalue = sub_group.value;
	var old_subvalue_re;
	if( old_subvalue ) {
		old_subvalue = old_subvalue.replace(/\d*(im)?$/, '' );
		old_subvalue_re = new RegExp( $.escapeRE( old_subvalue ) + "(\\d*(?:im)?)$" );
	}

	while( sub_group.hasChildNodes() ){
		sub_group.removeChild( sub_group.firstChild );
	}

	// worker function to create the combo box entries
	var createEntries = function( contents, container, wrapInOptgroup ) {
		// due to an apparent iOS bug, we have to add an option-group to prevent truncation of text
		// (search WT:TW archives for "Problem selecting warnings on an iPhone")
		if ( wrapInOptgroup && $.client.profile().platform === "iphone" ) {
			var wrapperOptgroup = new Morebits.quickForm.element( {
				type: 'optgroup',
				label: 'Available templates'
			} );
			wrapperOptgroup = wrapperOptgroup.render();
			container.appendChild( wrapperOptgroup );
			container = wrapperOptgroup;
		}

		$.each( contents, function( itemKey, itemProperties ) {
			var key = (typeof itemKey === "string") ? itemKey : itemProperties.value;

			var selected = false;
			if( old_subvalue && old_subvalue_re.test( key ) ) {
				selected = true;
			}

			var elem = new Morebits.quickForm.element( {
				type: 'option',
				label: "{{" + key + "}}: " + itemProperties.label,
				value: key,
				selected: selected
			} );
			var elemRendered = container.appendChild( elem.render() );
			$(elemRendered).data("messageData", itemProperties);
		} );
	};

	if( value === "singlenotice" || value === "singlewarn" || value === "block" ) {
		// no categories, just create the options right away
		createEntries( Twinkle.warn.messages[ value ], sub_group, true );
	} else if( value === "custom" ) {
		createEntries( Twinkle.getPref("customWarningList"), sub_group, true );
	} else {
		// create the option-groups
		$.each( Twinkle.warn.messages[ value ], function( groupLabel, groupContents ) {
			var optgroup = new Morebits.quickForm.element( {
				type: 'optgroup',
				label: groupLabel
			} );
			optgroup = optgroup.render();
			sub_group.appendChild( optgroup );
			// create the options
			createEntries( groupContents, optgroup, false );
		} );
	}

	if( value === 'block' ) {
		// create the block-related fields
		var more = new Morebits.quickForm.element( { type: 'div', id: 'block_fields' } );
		more.append( {
			type: 'input',
			name: 'block_timer',
			label: 'Period of blocking: ',
			tooltip: 'The period the blocking is due for, for example 24 hours, 2 weeks, indefinite etc...'
		} );
		more.append( {
			type: 'input',
			name: 'block_reason',
			label: '"You have been blocked for ..." ',
			tooltip: 'An optional reason, to replace the default generic reason. Only available for the generic block templates.'
		} );
		e.target.root.insertBefore( more.render(), e.target.root.lastChild );

		// restore saved values of fields
		if(Twinkle.warn.prev_block_timer !== null) {
			e.target.root.block_timer.value = Twinkle.warn.prev_block_timer;
			Twinkle.warn.prev_block_timer = null;
		}
		if(Twinkle.warn.prev_block_reason !== null) {
			e.target.root.block_reason.value = Twinkle.warn.prev_block_reason;
			Twinkle.warn.prev_block_reason = null;
		}
		if(Twinkle.warn.prev_article === null) {
			Twinkle.warn.prev_article = e.target.root.article.value;
		}
		e.target.root.article.disabled = false;

		$(e.target.root.reason).parent().hide();
		e.target.root.previewer.closePreview();
	} else if( e.target.root.block_timer ) {
		// hide the block-related fields
		if(!e.target.root.block_timer.disabled && Twinkle.warn.prev_block_timer === null) {
			Twinkle.warn.prev_block_timer = e.target.root.block_timer.value;
		}
		if(!e.target.root.block_reason.disabled && Twinkle.warn.prev_block_reason === null) {
			Twinkle.warn.prev_block_reason = e.target.root.block_reason.value;
		}

		// hack to fix something really weird - removed elements seem to somehow keep an association with the form
		e.target.root.block_reason = null;

		$(e.target.root).find("#block_fields").remove();

		if(e.target.root.article.disabled && Twinkle.warn.prev_article !== null) {
			e.target.root.article.value = Twinkle.warn.prev_article;
			Twinkle.warn.prev_article = null;
		}
		e.target.root.article.disabled = false;

		$(e.target.root.reason).parent().show();
		e.target.root.previewer.closePreview();
	}

	// clear overridden label on article textbox
	Morebits.quickForm.setElementTooltipVisibility(e.target.root.article, true);
	Morebits.quickForm.resetElementLabel(e.target.root.article);

	// hide the big red notice
	$("#tw-warn-red-notice").remove();
};

Twinkle.warn.callback.change_subcategory = function twinklewarnCallbackChangeSubcategory(e) {
	var main_group = e.target.form.main_group.value;
	var value = e.target.form.sub_group.value;

	if( main_group === 'singlenotice' || main_group === 'singlewarn' ) {
		if( value === 'uw-bite' || value === 'uw-username' || value === 'uw-socksuspect' ) {
			if(Twinkle.warn.prev_article === null) {
				Twinkle.warn.prev_article = e.target.form.article.value;
			}
			e.target.form.article.notArticle = true;
			e.target.form.article.value = '';
		} else if( e.target.form.article.notArticle ) {
			if(Twinkle.warn.prev_article !== null) {
				e.target.form.article.value = Twinkle.warn.prev_article;
				Twinkle.warn.prev_article = null;
			}
			e.target.form.article.notArticle = false;
		}
	} else if( main_group === 'block' ) {
		if( Twinkle.warn.messages.block[value].indefinite ) {
			if(Twinkle.warn.prev_block_timer === null) {
				Twinkle.warn.prev_block_timer = e.target.form.block_timer.value;
			}
			e.target.form.block_timer.disabled = true;
			e.target.form.block_timer.value = 'indefinite';
		} else if( e.target.form.block_timer.disabled ) {
			if(Twinkle.warn.prev_block_timer !== null) {
				e.target.form.block_timer.value = Twinkle.warn.prev_block_timer;
				Twinkle.warn.prev_block_timer = null;
			}
			e.target.form.block_timer.disabled = false;
		}

		if( Twinkle.warn.messages.block[value].pageParam ) {
			if(Twinkle.warn.prev_article !== null) {
				e.target.form.article.value = Twinkle.warn.prev_article;
				Twinkle.warn.prev_article = null;
			}
			e.target.form.article.disabled = false;
		} else if( !e.target.form.article.disabled ) {
			if(Twinkle.warn.prev_article === null) {
				Twinkle.warn.prev_article = e.target.form.article.value;
			}
			e.target.form.article.disabled = true;
			e.target.form.article.value = '';
		}

		if( Twinkle.warn.messages.block[value].reasonParam ) {
			if(Twinkle.warn.prev_block_reason !== null) {
				e.target.form.block_reason.value = Twinkle.warn.prev_block_reason;
				Twinkle.warn.prev_block_reason = null;
			}
			e.target.form.block_reason.disabled = false;
		} else if( !e.target.form.block_reason.disabled ) {
			if(Twinkle.warn.prev_block_reason === null) {
				Twinkle.warn.prev_block_reason = e.target.form.block_reason.value;
			}
			e.target.form.block_reason.disabled = true;
			e.target.form.block_reason.value = '';
		}
	}

	// change form labels according to the warning selected
	if (value === "uw-socksuspect") {
		Morebits.quickForm.setElementTooltipVisibility(e.target.form.article, false);
		Morebits.quickForm.overrideElementLabel(e.target.form.article, "Username of sock master, if known (without User:) ");
	} else if (value === "uw-username") {
		Morebits.quickForm.setElementTooltipVisibility(e.target.form.article, false);
		Morebits.quickForm.overrideElementLabel(e.target.form.article, "Username violates policy because... ");
	} else if (value === "uw-bite") {
		Morebits.quickForm.setElementTooltipVisibility(e.target.form.article, false);
		Morebits.quickForm.overrideElementLabel(e.target.form.article, "Username of 'bitten' user (without User:) ");
	} else {
		Morebits.quickForm.setElementTooltipVisibility(e.target.form.article, true);
		Morebits.quickForm.resetElementLabel(e.target.form.article);
	}

	// add big red notice, warning users about how to use {{uw-[coi-]username}} appropriately
	$("#tw-warn-red-notice").remove();

	var $redWarning;
	if (value === "uw-username") {
		$redWarning = $("<div style='color: red;' id='tw-warn-red-notice'>{{uw-username}} should <b>not</b> be used for <b>blatant</b> username policy violations. " +
			"Blatant violations should be reported directly to UAA (via Twinkle's ARV tab). " +
			"{{uw-username}} should only be used in edge cases in order to engage in discussion with the user.</div>");
		$redWarning.insertAfter(Morebits.quickForm.getElementLabelObject(e.target.form.reasonGroup));
	} else if (value === "uw-coi-username") {
		$redWarning = $("<div style='color: red;' id='tw-warn-red-notice'>{{uw-coi-username}} should <b>not</b> be used for <b>blatant</b> username policy violations. " +
			"Blatant violations should be reported directly to UAA (via Twinkle's ARV tab). " +
			"{{uw-coi-username}} should only be used in edge cases in order to engage in discussion with the user.</div>");
		$redWarning.insertAfter(Morebits.quickForm.getElementLabelObject(e.target.form.reasonGroup));
	}
};

Twinkle.warn.callbacks = {
	getWarningWikitext: function(templateName, article, reason, isCustom) {
		var text = "{{subst:" + templateName;

		if (article) {
			// add linked article for user warnings (non-block templates)
			text += '|1=' + article;
		}
		if (reason && !isCustom) {
			// add extra message for non-block templates
			if (templateName === 'uw-csd' || templateName === 'uw-probation' ||
				templateName === 'uw-userspacenoindex' || templateName === 'uw-userpage') {
				text += "|3=''" + reason + "''";
			} else {
				text += "|2=''" + reason + "''";
			}
		}
		text += '}}';

		if (reason && isCustom) {
			// we assume that custom warnings lack a {{{2}}} parameter
			text += " ''" + reason + "''";
		}

		return text;
	},
	getBlockNoticeWikitext: function(templateName, article, blockTime, blockReason, isIndefTemplate) {
		var text = "{{subst:" + templateName;

		if (article && Twinkle.warn.messages.block[templateName].pageParam) {
			text += '|page=' + article;
		}

		if (!/te?mp|^\s*$|min/.exec(blockTime) && !isIndefTemplate) {
			if (/indef|\*|max/.exec(blockTime)) {
				text += '|indef=yes';
			} else {
				text += '|time=' + blockTime;
			}
		}

		if (blockReason) {
			text += '|reason=' + blockReason;
		}

		text += "|sig=true}}";
		return text;
	},
	preview: function(form) {
		var templatename = form.sub_group.value;
		var linkedarticle = form.article.value;
		var templatetext;

		if (templatename in Twinkle.warn.messages.block) {
			templatetext = Twinkle.warn.callbacks.getBlockNoticeWikitext(templatename, linkedarticle, form.block_timer.value,
				form.block_reason.value, Twinkle.warn.messages.block[templatename].indefinite);
		} else {
			templatetext = Twinkle.warn.callbacks.getWarningWikitext(templatename, linkedarticle, 
				form.reason.value, form.main_group.value === 'custom');
		}

		form.previewer.beginRender(templatetext);
	},
	main: function( pageobj ) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var messageData = params.messageData;

		var history_re = /<!-- Template:(uw-.*?) -->.*?(\d{1,2}:\d{1,2}, \d{1,2} \w+ \d{4}) \(UTC\)/g;
		var history = {};
		var latest = { date: new Date( 0 ), type: '' };
		var current;

		while( ( current = history_re.exec( text ) ) ) {
			var current_date = new Date( current[2] + ' UTC' );
			if( !( current[1] in history ) ||  history[ current[1] ] < current_date ) {
				history[ current[1] ] = current_date;
			}
			if( current_date > latest.date ) {
				latest.date = current_date;
				latest.type = current[1];
			}
		}

		var date = new Date();

		if( params.sub_group in history ) {
			var temp_time = new Date( history[ params.sub_group ] );
			temp_time.setUTCHours( temp_time.getUTCHours() + 24 );

			if( temp_time > date ) {
				if( !confirm( "An identical " + params.sub_group + " has been issued in the last 24 hours.  \nWould you still like to add this warning/notice?" ) ) {
					pageobj.statelem.info( 'aborted per user request' );
					return;
				}
			}
		}

		latest.date.setUTCMinutes( latest.date.getUTCMinutes() + 1 ); // after long debate, one minute is max

		if( latest.date > date ) {
			if( !confirm( "A " + latest.type + " has been issued in the last minute.  \nWould you still like to add this warning/notice?" ) ) {
				pageobj.statelem.info( 'aborted per user request' );
				return;
			}
		}

		var dateHeaderRegex = new RegExp( "^==+\\s*(?:" + date.getUTCMonthName() + '|' + date.getUTCMonthNameAbbrev() +
			")\\s+" + date.getUTCFullYear() + "\\s*==+", 'mg' );
		var dateHeaderRegexLast, dateHeaderRegexResult;
		while ((dateHeaderRegexLast = dateHeaderRegex.exec( text )) !== null) {
			dateHeaderRegexResult = dateHeaderRegexLast;
		}
		// If dateHeaderRegexResult is null then lastHeaderIndex is never checked. If it is not null but
		// \n== is not found, then the date header must be at the very start of the page. lastIndexOf
		// returns -1 in this case, so lastHeaderIndex gets set to 0 as desired.
		var lastHeaderIndex = text.lastIndexOf( "\n==" ) + 1;   

		if( text.length > 0 ) {
			text += "\n\n";
		}

		if( params.main_group === 'block' ) {
			if( Twinkle.getPref('blankTalkpageOnIndefBlock') && params.sub_group !== 'uw-lblock' && ( messageData.indefinite || (/indef|\*|max/).exec( params.block_timer ) ) ) {
				Morebits.status.info( 'Info', 'Blanking talk page per preferences and creating a new level 2 heading for the date' );
				text = "== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ==\n";
			} else if( !dateHeaderRegexResult || dateHeaderRegexResult.index !== lastHeaderIndex ) {
				Morebits.status.info( 'Info', 'Will create a new level 2 heading for the date, as none was found for this month' );
				text += "== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ==\n";
			}

			text += Twinkle.warn.callbacks.getBlockNoticeWikitext(params.sub_group, params.article, params.block_timer, params.reason, messageData.indefinite);
		} else {
			if( messageData.heading ) {
				text += "== " + messageData.heading + " ==\n";
			} else if( !dateHeaderRegexResult || dateHeaderRegexResult.index !== lastHeaderIndex ) {
				Morebits.status.info( 'Info', 'Will create a new level 2 heading for the date, as none was found for this month' );
				text += "== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ==\n";
			}
			text += Twinkle.warn.callbacks.getWarningWikitext(params.sub_group, params.article, 
				params.reason, params.main_group === 'custom') + " ~~~~";
		}

		if ( Twinkle.getPref('showSharedIPNotice') && Morebits.isIPAddress( mw.config.get('wgTitle') ) ) {
			Morebits.status.info( 'Info', 'Adding a shared IP notice' );
			text +=  "\n{{subst:SharedIPAdvice}}";
		}

		// build the edit summary
		var summary;
		if( params.main_group === 'custom' ) {
			switch( params.sub_group.substr( -1 ) ) {
				case "1":
					summary = "General note";
					break;
				case "2":
					summary = "Caution";
					break;
				case "3":
					summary = "Warning";
					break;
				case "4":
					summary = "Final warning";
					break;
				case "m":
					if( params.sub_group.substr( -3 ) === "4im" ) {
						summary = "Only warning";
						break;
					}
					summary = "Notice";
					break;
				default:
					summary = "Notice";
					break;
			}
			summary += ": " + Morebits.string.toUpperCaseFirstChar(messageData.label);
		} else {
			summary = messageData.summary;
			if ( messageData.suppressArticleInSummary !== true && params.article ) {
				if ( params.sub_group === "uw-socksuspect" ) {  // this template requires a username
					summary += " of [[User:" + params.article + "]]";
				} else {
					summary += " on [[" + params.article + "]]";
				}
			}
		}
		summary += "." + Twinkle.getPref("summaryAd");

		pageobj.setPageText( text );
		pageobj.setEditSummary( summary );
		pageobj.setWatchlist( Twinkle.getPref('watchWarnings') );
		pageobj.save();
	}
};

Twinkle.warn.callback.evaluate = function twinklewarnCallbackEvaluate(e) {

	// First, check to make sure a reason was filled in if uw-username was selected

	if(e.target.sub_group.value === 'uw-username' && e.target.article.value.trim() === '') {
		alert("You must supply a reason for the {{uw-username}} template.");
		return;
	}

	// Find the selected <option> element so we can fetch the data structure
	var selectedEl = $(e.target.sub_group).find('option[value="' + $(e.target.sub_group).val() + '"]');

	// Then, grab all the values provided by the form
	var params = {
		reason: e.target.block_reason ? e.target.block_reason.value : e.target.reason.value,
		main_group: e.target.main_group.value,
		sub_group: e.target.sub_group.value,
		article: e.target.article.value,  // .replace( /^(Image|Category):/i, ':$1:' ),  -- apparently no longer needed...
		block_timer: e.target.block_timer ? e.target.block_timer.value : null,
		messageData: selectedEl.data("messageData")
	};

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( e.target );

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = "Warning complete, reloading talk page in a few seconds";

	var Meta_page = new Morebits.wiki.page( mw.config.get('wgPageName'), 'User talk page modification' );
	Meta_page.setCallbackParameters( params );
	Meta_page.setFollowRedirect( true );
	Meta_page.load( Twinkle.warn.callbacks.main );
};
})(jQuery);


//</nowiki>
