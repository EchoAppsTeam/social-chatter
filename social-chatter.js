// vim: set ts=8 sts=8 sw=8 noet:
/*
 * Copyright (c) 2006-2011 Echo <solutions@aboutecho.com>. All rights reserved.
 * You may copy and modify this script as long as the above copyright notice,
 * this condition and the following disclaimer is left intact.
 * This software is provided by the author "AS IS" and no warranties are
 * implied, including fitness for a particular purpose. In no event shall
 * the author be liable for any damages arising in any way out of the use
 * of this software, even if advised of the possibility of such damage.
 */

(function($) {

Echo.Localization.extend({
	"fewMoments": "in a few moments",
	"moreYear": "more than a year",
	"defaultDateDiffDisplay": "in {diff} {period}{suffix}",
	"startDateDiffDisplay": "Will be started in {diff} {period}{suffix}",
	"endDateDiffDisplay": "Ended {diff} {period}{suffix} ago"
}, "Echo.SocialChatterEvent");

// TODO: pass entire entry to this constructor, not only "content" field
Echo.SocialChatterEvent = function(data, id) {
	this.id = id;
	this.data = this.getData(data);
};

Echo.SocialChatterEvent.prototype = new Echo.Object();

Echo.SocialChatterEvent.prototype.namespace = "Echo.SocialChatterEvent";

Echo.SocialChatterEvent.prototype.getData = function(dataString) {
	var data = {};
	try {
		data = $.parseJSON(dataString);
	} catch (e) {}
	return data || {};
};

Echo.SocialChatterEvent.prototype.calcEventDates = function(type, display) {
	type = type.charAt(0).toUpperCase() + type.substr(1);
	var content = this.data;
	if (!content["event" + type]) return;
	var timestamp = content["event" + type];
	var d = new Date(timestamp);
	var now = (new Date()).getTime();
	var diff = Math.abs(Math.floor((d.getTime() - now) / 1000));
	var dayDiff = Math.floor(diff / 86400);
	if (isNaN(dayDiff) || dayDiff < 0 || dayDiff >= 365)
		return (d.toLocaleDateString() + ', ' + d.toLocaleTimeString());
	return this.displayDateDiff(diff, display);
};

Echo.SocialChatterEvent.prototype.displayDateDiff = function(diff, display) {
	var self = this;
	var when;
	var dayDiff = Math.floor(diff / 86400);
	var display = display || function(diff, period) {
		return self.label("defaultDateDiffDisplay", {
			"diff": diff,
			"period": period,
			"suffix": diff == 1 ? "" : "s"
		});
	};
	if (diff < 60) {
		when = this.label("fewMoments");
	} else if (diff < 60 * 60) {
		diff = Math.floor(diff / 60);
		when = display(diff, "minute");
	} else if (diff < 60 * 60 * 24) {
		diff = Math.floor(diff / (60 * 60));
		when = display(diff, "hour");
	} else if (dayDiff < 30) {
		when = display(dayDiff, "day");
	} else if (dayDiff < 365) {
		diff =  Math.floor(dayDiff / 31);
		when = display(diff, "month");
	} else {
		when = this.label("moreYear");
	}
	return when;
};

Echo.SocialChatterEvent.prototype.calcStartEvent = function() {
	return this.calcEventDates("start");
};

Echo.SocialChatterEvent.prototype.calcEndEvent = function() {
	var self = this;
	return this.calcEventDates("end", function(diff, period) {
		return self.label("endDateDiffDisplay", {
			"diff": diff,
			"period": period,
			"suffix": diff == 1 ? "" : "s"
		});
	});
};

// FIXME: need rename function
Echo.SocialChatterEvent.prototype.calcAnotherStartEvent = function() {
	var self = this;
	return this.calcEventDates("start", function(diff, period) {
		return self.label("startDateDiffDisplay", {
			"diff": diff,
			"period": period,
			"suffix": diff == 1 ? "" : "s"
		});
	});
};

Echo.SocialChatterEvent.prototype.getTimestamp = function() {
	return {
		"start": this.data.eventStart ? this.data.eventStart : 0,
		"end": this.data.eventEnd ? this.data.eventEnd : 0
	};
};

Echo.SocialChatterEvent.prototype.onAir = function() {
	var timestamp = this.getTimestamp();
	var now = (new Date()).getTime();
	return (timestamp.start <= now && timestamp.end >= now);
};

Echo.SocialChatterEvent.prototype.getEventDuration = function() {
	var timestamp = this.getTimestamp();
	return Math.floor((timestamp.end - timestamp.start) / 1000);
};

Echo.SocialChatterEvent.prototype.getEventStatus = function() {
	if (this.onAir()) return "onAir";
	var timestamp = this.getTimestamp();
	var now = (new Date()).getTime();
	if (timestamp.start > now) return "upcoming";
	else if (timestamp.end < now) return "passed";
};

})(jQuery);

(function($) {

Echo.Localization.extend({
	"newEvent": "Schedule new event",
	"askQuestion": "Ask your question to",
	"answersFrom": "Answers from",
	"scheduleEvent": "Schedule new event",
	"chatClosesIn": "VIP Chat closes in: ",
	"chatOpensIn": "<b>Live chat starts in:</b> <br><br>",
	"passedEventViewNotice": "<b>Note:</b> this event is over. You are viewing chat archive.",
	"askQuestionViewNotice": "<b>Note:</b> You must be logged in to ask question",
	"upcomingEventWarning": "Please login to join this event.",
	"passedEventWarning": "Please login to view this chat archive.",
	"onAirEventWarning": "<b>Chat is on air now!</b> <br><br> Please login to join the conversation!"
}, "Echo.SocialChatterView");

Echo.SocialChatterView = function(data) {
	if (!data || !data.target) return;
	this.init(data);
	this.config = new Echo.Config(data.config || {}, {
		"defaultEventIcon": "//cdn.echoenabled.com/clientapps/v2/social-chatter/images/vip.jpg"
	});
	this.event = new Echo.SocialChatterEvent($.object2JSON(this.data));
};

Echo.SocialChatterView.prototype = new Echo.Object();

Echo.SocialChatterView.prototype.cssPrefix = "echo-socialchatter-view-";

Echo.SocialChatterView.prototype.namespace = "Echo.SocialChatterView";

Echo.SocialChatterView.prototype.templateChunk =
	'<div class="echo-socialchatter-view-eventDescription">' +
		'<div class="echo-socialchatter-view-avatar"></div>' +
		'<div class="echo-socialchatter-view-eventDataWrapper">' +
			'<div class="echo-socialchatter-view-title">{Data:eventName}</div>' +
			'<div class="echo-socialchatter-view-description">{Data:eventDescription}</div>' +
			'<div class="echo-socialchatter-view-countdown"></div>' +
		'</div>' +
		'<div class="echo-clear"></div>' +
	'</div>';

Echo.SocialChatterView.prototype.templates = {};

Echo.SocialChatterView.prototype.templates.eventsList =
	'<div class="echo-socialchatter-view-eventListContainer">' +
		'<div class="echo-socialchatter-view-newEventButton">' +
			'<div class="echo-socialchatter-view-eventSubmitLabel echo-linkColor">{Label:newEvent}</div>' +
		'</div>' +
		'<div class="echo-socialchatter-view-eventSubmitContainer">' +
			'<div class="echo-socialchatter-view-eventSubmit"></div>' +
		'</div>' +
		'<div class="echo-socialchatter-view-eventsStream"></div>' +
	'</div>';

Echo.SocialChatterView.prototype.templates.event = {
	"full": '<div class="echo-socialchatter-view-publicView">' +
			'<div class="echo-socialchatter-view-publicViewNotice"></div>' +
			'<table><tr>' +
				'<td class="echo-socialchatter-view-leftColumnTD"><div class="echo-socialchatter-view-leftColumn">' +
					'<div class="echo-socialchatter-view-publicSubmitLabel">{Label:askQuestion} {Data:vipName}</div>' +
					'<div class="echo-socialchatter-view-publicSubmit"></div>' +
					'<div class="echo-socialchatter-view-publicStream"></div>' +
				'</div></td>' +
				'<td class="echo-socialchatter-view-rightColumnTD"><div class="echo-socialchatter-view-rightColumn">' +
					'<div class="echo-socialchatter-view-publicSubmitVIPLabel">{Label:answersFrom} {Data:vipName}</div>' +
					'{Self:templateChunk}' +
					'<div class="echo-socialchatter-view-vipStream"></div>' +
				'</div></td>' +
			'</tr></table>' +
		'</div>',
	"upcoming": '<div class="echo-socialchatter-view-publicView echo-socialchatter-view-publicViewUpcoming">' +
			'{Self:templateChunk}' +
		'</div>',
	"anonymous": '<div class="echo-socialchatter-view-publicView echo-socialchatter-view-publicViewAnonymous">' +
			'<div class="echo-socialchatter-view-loginWarning"></div>' +
			'{Self:templateChunk}' +
		'</div>'
	};

Echo.SocialChatterView.prototype.templates.greenRoom =
	'<div>' +
		'<div class="echo-socialchatter-view-vipInstructions"></div>' +
		'<div class="echo-socialchatter-view-vipStream"></div>' +
	'</div>';

Echo.SocialChatterView.prototype.template = function() {
	var status = this.event.getEventStatus && this.event.getEventStatus();
	if (this.type == "event") {
		return this.templates[this.type][this.hasPublicEventAccess()
			? (status && status != "upcoming" ? "full" :"upcoming")
			: "anonymous"];
	}
	return this.templates[this.type];
};

Echo.SocialChatterView.prototype.renderers = {};

Echo.SocialChatterView.prototype.renderers.loginWarning = function(element) {
	element.html('<span>' + this.label(this.event.getEventStatus() + "EventWarning") + '</span>');
};

Echo.SocialChatterView.prototype.renderers.publicViewNotice = function(element) {
	var status = this.event.getEventStatus();
	if (status == "passed") {
		return '<span>' + this.label("passedEventViewNotice") + '</span>';
	} else if (!this.userIsLogged()) {
		return '<span>' + this.label("askQuestionViewNotice") + '</span>';
	}
	element.hide();
};

Echo.SocialChatterView.prototype.renderers.avatar = function(element) {
	var self = this;
	var url = this.data.vipPhoto || this.config.get("defaultEventIcon");
	var img = $("<img>", {"src": url});
	if (url != this.config.get("defaultEventIcon")) {
		img.one({
			"error" : function(){
				$(this).attr("src", self.config.get("defaultEventIcon"));
			}
		});
	}
	element.append(img);
};

Echo.SocialChatterView.prototype.renderers.countdown = function(element) {
	var self = this;
	element.hide();
	var status = this.event.getEventStatus();
	var isUpcomingEvent = status == "upcoming";
	var finishHandler = status == "upcoming" || status == "onAir"
		? function() {
			var topic = isUpcomingEvent
				? "SocialChatter.onEventStart"
				: "SocialChatter.onEventEnd";
			Echo.Broadcast.publish(topic, self.data);
		}
		: function() {};
	if (status != "upcoming") return;
	element.css("display", "block")
		.countdown(new Date(this.data[isUpcomingEvent ? "eventStart" : "eventEnd"]), {
			"prefix": this.label(isUpcomingEvent ? "chatOpensIn" : "chatClosesIn"),
			"finish": finishHandler
		});
};

Echo.SocialChatterView.prototype.renderers.eventSubmitLabel = function(element, dom) {
	if (this.user.isAdmin() && !this.user.hasAnyRole(["vip"])) {
		new Echo.UI.Button(element, {
			"normal": {
				"icons": false,
				"disable": false,
				"label": this.label("scheduleEvent")
			}
		});
		element.click(function() {
			dom.get("eventSubmitContainer").slideToggle();
		});
	} else {
		element.detach();
	}
};

Echo.SocialChatterView.prototype.userIsLogged = function() {
	return this.user && this.user.logged();
};

Echo.SocialChatterView.prototype.hasPublicEventAccess = function() {
	return this.config.get("permissions.access") === "allowGuest" || this.userIsLogged();
};

})(jQuery);

(function($) {

Echo.Localization.extend({
	"guest": "Guest",
	"live": "Live",
	"paused": "Paused",
	"more": "More",
	"emptyGreenRoom": "No items at this time...",
	"new": "new",
	"loading": "Loading...",
	"tabGreenRoomLabel": "Green room",
	"tabPublicEventLabel": "Public event",
	"tabAllEventsLabel": "All Events", 
	"assignVIPRoleControl": "Assign VIP role",
	"revokeVIPRoleControl": "Revoke VIP role",
	"sendToGreenRoomControl": "Send to Green Room",
	"removeFromGreenRoomControl": "Remove from Green Room"
}, "SocialChatter");

Echo.SocialChatter = function(config) {
	if (!config || !config.target || !config.eventsTargetURL) return;
	var self = this;
	this.vars = {"cache": {}};
	this.apps = {};
	this.initConfig(config, {
		"backplane": {
			"serverBaseURL": "http://api.echoenabled.com/v1"
		},
		"eventsTargetURL": undefined,
		"eventListQuery": "childrenof:" + config.eventsTargetURL + " itemsPerPage:100 state:Untouched,ModeratorApproved children:0",
		"liveUpdates": true,
		"liveUpdatesTimeout": 60, // request Events updates once per minute
		"identityManager": undefined,
		"permissions": {
			"access": "allowGuest"
		},
		"views": {}
	}, {
		"views": function(viewsConfig) {
			var views = self.getDefaultAppsConfig(config);
			$.each(views, function(view, appConfigs) {
				$.each(appConfigs, function(appName, appConfig) {
					if (viewsConfig[view] && viewsConfig[view][appName] && viewsConfig[view][appName].plugins) {
						views[view][appName].plugins = self.updateAppPlugins(
							views[view][appName].plugins,
							viewsConfig[view][appName].plugins
						);
					}
				});
			});
			return views;
		}
	});
	$.foldl(this.apps, this.config.get("views"), function(config, acc, name) {
		acc[name] = {};
	});
	this.addCss();
	this.showMessage({"type": "loading", "message": this.label("loading")});
	Echo.include(this.dependencies, function() {
		self.initVars();
		self.initBackplane();
		self.initApplication(function() {
			self.initLiveUpdates(function() {
				return {
					"endpoint": "search",
					"query": {
						"q": self.config.get("eventListQuery"),
						"since": self.nextSince || 0
					}
				};
			}, function(data) { self.handleLiveUpdatesResponse(data); });
			self.requestEventList(function(data) {
				data.entries = data.entries || [];
				self.initSocialChatterEvents(data.entries);
				self.setPublicEvent(self.pickRelevantEvent());
				self.config.get("target").empty().append(self.render());
				self.initTabs();
				self.config.set("apps.Stream.EventList.data", data);
			});
			self.listenEvents();
		});
	});
};

Echo.SocialChatter.prototype = new Echo.Application();

Echo.SocialChatter.prototype.namespace = "SocialChatter";

Echo.SocialChatter.prototype.cssPrefix = "echo-socialchatter-";

Echo.SocialChatter.prototype.dependencies = [{
	"url": "//cdn.echoenabled.com/clientapps/v2/social-chatter/plugins/vip-replies.js",
	"loaded": function() { return !!Echo.Plugins.VipReplies; }
}, {
	"url": "//cdn.echoenabled.com/clientapps/v2/social-chatter/plugins/user-metadata-manager.js",
	"loaded": function() { return !!Echo.Plugins.UserMetadataManager; }
}, {
	"url": "//cdn.echoenabled.com/clientapps/v2/social-chatter/plugins/item-conditional-css-classes.js",
	"loaded": function() { return !!Echo.Plugins.ItemConditionalCSSClasses; }
}, {
	"url": "//cdn.echoenabled.com/clientapps/v2/social-chatter/plugins/social-chatter-event.js",
	"loaded": function() { return !!Echo.Plugins.SocialChatterEvent; }
}, {
	"url": "//cdn.echoenabled.com/clientapps/v2/social-chatter/plugins/submit-textarea-auto-resize.js",
	"loaded": function() { return !!Echo.Plugins.SubmitTextareaAutoResize; }
}, {
	"url": "//cdn.echoenabled.com/clientapps/v2/social-chatter/plugins/submit-countdown-event.js",
	"loaded": function() { return !!Echo.Plugins.SubmitCountdownEvent; }
}, {
	"url": "//cdn.echoenabled.com/clientapps/v2/social-chatter/countdown/jquery.countdown.js",
	"loaded": function() { return !!($.fn && $.fn.countdown); }
}];

Echo.SocialChatter.prototype.template = 
	'<div class="echo-socialchatter-container echo-primaryFont echo-primaryBackgroundColor">' +
		'<div class="echo-socialchatter-authContainer">' +
			'<div class="echo-socialchatter-auth"></div>' +
			'<div class="echo-clear"></div>' +
		'</div>' +
		'<div class="echo-socialchatter-tabs"></div>' +
	'</div>';

Echo.SocialChatter.prototype.getDefaultAppsConfig = function(config) {
	var plugins = {
		"MetadataManager": {
			"name": "MetadataManager",
			"controls": [{
				"marker": "greenroom",
				"labelMark": "{Label:sendToGreenRoomControl}",
				"labelUnmark": "{Label:removeFromGreenRoomControl}"
			}],
			"enabled": "{Self:isNonVIPUser}"
		},
		"ItemConditionalCSSClasses": {
			"name": "ItemConditionalCSSClasses",
			"conditions": [{
				"field": "actor.roles",
				"value": ["vip"],
				"className": "echo-item-vip-guest"
			}]
		},
		"UserMetadataManager": {
			"name": "UserMetadataManager",
			"controls": [{
				// we need "moderator" role for VIP as well
				// since we need to apply markers to some items
				"roles": "vip,moderator",
				"labelSet": "{Label:assignVIPRoleControl}",
				"labelUnset": "{Label:revokeVIPRoleControl}"
			}],
			"enabled": "{Self:isNonVIPUser}"
		}
	};
	return {
		// Green Room tab applications
		"GreenRoom": {
			"Stream": {
				"appkey": null,
				"query": "childrenof:{Self:event.id}/* state:Untouched,ModeratorApproved markers:greenroom -markers:answered children:1 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved",
				"reTag": false,
				"plugins": [{
					"name": "Reply",
					"itemURIPattern": "{Self:event.id}/{id}",
					"nestedPlugins": [{
						"name": "SubmitTextareaAutoResize"
					}]
				}, {
					"name": "VipReplies",
					"copyTo": {
						"target": "{Self:event.id}"
					},
					"view": "private"
				}, plugins.MetadataManager]
			}
		},
		// All Events tab applications
		"EventList": {
			"Stream": {
				"appkey": null,
				"query": "childrenof:{Self:eventsTargetURL} state:Untouched,ModeratorApproved children:0",
				"reTag": false,
				"itemControlsOrder": ["SocialChatterEvent", "Edit", "Curation.Delete"],
				"plugins": [{
					"name": "SocialChatterEvent"
				}, {
					"name": "Edit",
					"layout": "inline",
					"nestedPlugins": [{"name": "SocialChatterEvent"}]
				}, {
					"name": "Curation"
				}]
			},
			"Submit": {
				"appkey": null,
				"targetURL": "{Self:eventsTargetURL}",
				"itemURIPattern": "{Self:eventsTargetURL}/{id}",
				"plugins": [{
					"name": "SocialChatterEvent"
				}]
			}
		},
		// all applications from the public event tab
		"PublicEvent": {
			"Stream": {
				"appkey": null,
				"query": "childrenof:{Self:event.id} state:Untouched,ModeratorApproved safeHTML:off user.state:Untouched,ModeratorApproved children:1 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved",
				"reTag": false,
				"liveUpdatesTimeout": 60,
				"plugins": [{
					"name": "Reply",
					"itemURIPattern": "{Self:event.id}/{id}",
					"nestedPlugins": [{
						"name": "SubmitTextareaAutoResize"
					}]
				}, {
					"name": "Like"
				}, {
					"name": "Curation",
					"enabled": "{Self:isNonVIPUser}"
				}, {
					"name": "VipReplies",
					"copyTo": {
						"target": "{Self:event.id}"
					},
					"view": "private"
				},
				plugins.ItemConditionalCSSClasses,
				plugins.MetadataManager,
				plugins.UserMetadataManager]
			},
			"Submit": {
				"appkey": null,
				"targetURL": "{Self:event.id}",
				"itemURIPattern": "{Self:event.id}/{id}",
				"actionString": "Type your question here...",
				"plugins": [{
					"name": "SubmitTextareaAutoResize"
				}, {
					"name": "SubmitCountdownEvent",
					"eventEnd": "{Self:event.data.eventEnd}",
					"enabled": "{Self:event.isOnAir}"
				}]
			},
			"VIPStream": {
				"appkey": null,
				"query": "childrenof:{Self:event.id} state:Untouched,ModeratorApproved safeHTML:off user.roles:vip user.state:Untouched,ModeratorApproved children:1 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved",
				"reTag": false,
				"plugins": [{
					"name": "Reply",
					"itemURIPattern": "{Self:event.id}/{id}",
					"nestedPlugins": [{
						"name": "SubmitTextareaAutoResize"
					}]
				}, {
					"name": "Like"
				}, {
					"name": "Curation",
					"enabled": "{Self:isNonVIPUser}"
				}, {
					"name": "VipReplies"
				},
				plugins.ItemConditionalCSSClasses]
			}
		},
		// views-independent applications
		"Main": {
			"Auth": {
				"appkey": null,
				"identityManager": config.identityManager
			}
		}
	};
};

Echo.SocialChatter.prototype.renderers = {};

Echo.SocialChatter.prototype.assemblers = {};

Echo.SocialChatter.prototype.renderers.auth = function(element, dom) {
	if (!this.config.get("identityManager")) {
		element.hide();
		return;
	}
	this.initInternalApplication({
		"view": "Main",
		"name": "Auth",
		"application": "Auth"
	}, {
		"target": element
	});
};

Echo.SocialChatter.prototype.initVars = function() {
	this.event = undefined;
	this.eventById = {};
};

Echo.SocialChatter.prototype.initSocialChatterEvents = function(entries) {
	var self = this;
	$.each(entries, function(id, entry) {
		self.eventById[entry.object.id] =
			new Echo.SocialChatterEvent(entry.object.content, entry.object.id);
	});
};

Echo.SocialChatter.prototype.setPublicEvent = function(event) {
	this.data = this.data || {};
	this.event = this.data.event = event;

	// prepare variables for appending into config via templating engine
	this.isNonVIPUser = this.user.hasAnyRole(["vip"]) ? "" : "true";
	if (this.event) {
		this.event.isOnAir = this.event.onAir() ? "true" : "";
	}
};

Echo.SocialChatter.prototype.hasGreenRoomAccess = function() {
	// Green Room is available for VIP guests and admins,
	// VIP guests should have admin rights as well to mark items as "answered"
	return this.user.isAdmin();
};

Echo.SocialChatter.prototype.updateTab = function(config) {
	if (this.tabs && !this.event && config.name != "EventList"
		|| (this.event && this.event.getEventStatus() == "passed" && config.name == "GreenRoom")) {
		this.tabs.remove(config.name);
		return;
	}
	// exit if we don't have access to Green Room tab
	if (config.name == "GreenRoom" && !this.hasGreenRoomAccess()) return;
	if (this.tabs && typeof this.tabs.tabIndexById[config.name] == "undefined") {
		this.tabs.add({
			"id": config.name,
			"label": config.name == "PublicEvent"
				? this.event.data.eventName || this.label("tabPublicEventLabel")
				: this.label("tabGreenRoomLabel"),
			"icon": false
		});
	}
	var tabsDomContainer = this.dom.get("tabs");
	config.target = config.target || $("#" + this.tabs.idPrefix + config.name, tabsDomContainer);
	config.ui = config.ui || {"tab": $(".echo-" + this.tabs.classPrefix + config.name, tabsDomContainer)};
	if (this.assemblers[config.name]) {
		$(config.target).empty();
		this.assembler(config.name, config.target, config.ui);
	}
};

Echo.SocialChatter.prototype.updateTabs = function() {
	var self = this;
	$.each(["PublicEvent", "GreenRoom"], function(i, tabId) {
		self.updateTab({
			"name": tabId
		});
	});
};

Echo.SocialChatter.prototype.pickRelevantEvent = function() {
	// we need to pick one most relevant event:
	//  - look for event which is on air right now
	//  - otherwise grab first upcoming event
	//  - if there are no upcoming or on air events - return undefined
	var relevantEvent;
	$.each(this.eventById, function(id, event) {
		var status = event.getEventStatus();
		if (status == "onAir") {
			relevantEvent = event;
			return false; // break
		}
		if (status == "upcoming" && event.data.eventStart &&
			(!relevantEvent || relevantEvent.data.eventStart > event.data.eventStart)) {
				relevantEvent = event;
		}
	});
	return relevantEvent;
};

Echo.SocialChatter.prototype.classifyAction = function(entry) {
	return (entry.verbs[0] == "http://activitystrea.ms/schema/1.0/delete") ? "delete" : "post";
};

Echo.SocialChatter.prototype.hasPublicEventAccess = function() {
	return this.config.get("permissions.access") === "allowGuest" || this.user.logged();
};

Echo.SocialChatter.prototype.handleLiveUpdatesResponse = function(data) {
	var self = this;
	this.nextSince = data.nextSince || 0;
	// we need to do the following:
	//   - if the current public event is updated: update data and UI
	//   - if the current public event was deleted: delete from data and refresh the UI
	//   - if any other event was deleted: delete from data
	//   - if new event is added AND public event (on air or upcoming) is displayed:
	//		add to the data, do NOT update/switch public event view
	//   - if new event is added AND NO public event (on air or upcoming) is displayed:
	//		add to the data AND add public event tab!
	if (!data.entries || !data.entries.length) return;
	$.each(data.entries, function(id, entry) {
		var event = self.eventById[entry.object.id];
		var action = self.classifyAction(entry);
		if (!event && action != "post") return;
		switch (action) {
			case "post":
				var event = new Echo.SocialChatterEvent(
					entry.object.content,
					entry.object.id
				);
				var status = event.getEventStatus();
				self.eventById[entry.object.id] = event;
				// if current event is updated
				// OR if NO public event - add new tab & green room tab
				if ((self.event && self.event.id == event.id) ||
					(!self.event && (status == "onAir" || status == "upcoming"
))) {
					self.setPublicEvent(self.pickRelevantEvent());
					self.updateTabs();
				}
				break;
			case "delete":
				delete self.eventById[entry.object.id];
				// refresh if current event was removed
				if (self.event && self.event.id == entry.object.id) {
					delete self.event;
					self.setPublicEvent(self.pickRelevantEvent());
					self.updateTabs();
				}
				break;
		};
	});
	this.startLiveUpdates();
};

Echo.SocialChatter.prototype.initBackplane = function() {
	if (!this.config.get("backplane.busName")) return;
	Backplane.init(this.config.get("backplane"));
};

Echo.SocialChatter.prototype.initTabs = function() {
	var self = this;
	var tabs = [{
		"id": "EventList",
		"label": this.label("tabAllEventsLabel"),
		"icon": false
	}];
	if (this.event) {
		var data = this.event.data;
		tabs.push({
			"id": "PublicEvent",
			"label": data.eventName || this.label("tabPublicEventLabel"),
			"icon": false,
			"selected": true
		});
	}
	if (this.event && this.hasGreenRoomAccess()) {
		tabs.push({
			"id": "GreenRoom",
			"label": this.label("tabGreenRoomLabel"),
			"icon": false
		});
	}
	this.tabs = new Echo.UI.Tabs({
		"target": this.dom.get("tabs"),
		"addUIClass": false,
		"idPrefix": "socialchatter-tabs-",
		"classPrefix": "socialchatter-tabs-",
		"config": {
			"show": function(event, ui) {
				self.updateTab({
					"name": tabs[ui.index].id,
					"target": ui.panel,
					"ui": ui
				});
			}
		},	
		"tabs": tabs 
	});
	if (this.event) {
		this.tabs.select("PublicEvent");
	}
};

Echo.SocialChatter.prototype.requestEventList = function(callback) {
	var self = this;
	this.sendAPIRequest({
		"endpoint": "search",
		"query": {"q": this.config.get("eventListQuery")}
	}, function(data) {
		self.nextSince = data.nextSince || 0;
		callback(data);
		self.startLiveUpdates();
	});
};

Echo.SocialChatter.prototype.assembler = function(name) {
	var args = Array.prototype.slice.call(arguments, 1);
	return this.assemblers[name].apply(this, args);
};

Echo.SocialChatter.prototype.updateAppPlugins = function(plugins, updatePlugins) {
	var self = this;
	var getPluginIndex = function(plugin, plugins) {
		var idx = -1;
		$.each(plugins, function(i, _plugin) {
			if (plugin.name === _plugin.name) {
				idx = i;
				return false;
			}
		});
		return idx;
	};
	return $.foldl(plugins, updatePlugins, function(extender) {
		var id = getPluginIndex(extender, plugins);
		if (!~id) {
			plugins.push(extender);
			return;
		}
		if (extender.name === plugins[id].name) {
			if (extender.nestedPlugins && plugins[id].nestedPlugins) {
				self.updateAppPlugins(plugins[id].nestedPlugins, extender.nestedPlugins);
				// delete nested plugins in the extender to avoid override effect after extend below
				delete extender.nestedPlugins;
			}
			plugins[id] = $.extend(true, plugins[id], extender);
		}
	});
};

Echo.SocialChatter.prototype.assemblers.EventList = function(target) {
	var view = new Echo.SocialChatterView({
		"user": this.user,
		"target": target,
		"type": "eventsList"
	});
	var content = view.render();
	if (this.user.isAdmin()) {
		var submit = this.initInternalApplication({
			"view": "EventList",
			"name": "Submit",
			"application": "Submit"
		}, {
			"target": view.dom.get("eventSubmit")
		});
		submit.subscribe("Submit.onPostComplete", function(topic, args) {
			view.dom.get("eventSubmitContainer").slideUp();
		});
	}
	this.initInternalApplication({
		"view": "EventList",
		"name": "Stream",
		"application": "Stream"
	}, {
		"target": view.dom.get("eventsStream")
	});
	$(target).append(content);
};


Echo.SocialChatter.prototype.assemblers.PublicEvent = function(target, ui) {
	var self = this;
	var data = this.event.data;
	var pluginEnabled = !(this.event && this.event.getEventStatus() == "passed") && this.user.logged();
	var view = new Echo.SocialChatterView({
		"user": this.user,
		"data": data,
		"target": target,
		"type": "event",
		"config": {
			"permissions": this.config.get("permissions")
		}
	});
	var content = view.render();
	// setting tab title
	$(ui.tab).html(data.eventName || "Unknown Event");
	if (!this.hasPublicEventAccess() || this.event.getEventStatus() == "upcoming") {
		$(target).append(content);
		return;
	}
	if (this.event.onAir() && this.user.logged()) {
		this.initInternalApplication({
			"view": "PublicEvent",
			"name": "Submit",
			"application": "Submit"
		}, {
			"target": view.dom.get("publicSubmit")
		});
        view.dom.get("publicSubmitLabel").show();
	} else if( !this.user.logged() ) {
		view.dom.get("publicSubmitLabel").hide();
	}
	this.initInternalApplication({
		"view": "PublicEvent",
		"name": "Stream",
		"application": "Stream"
	}, {
		"target": view.dom.get("publicStream"),
		"plugins": this.updateAppPlugins(
			this.config.get("views")["PublicEvent"]["Stream"].plugins,
			[{
				"name": "Reply",
				"enabled": pluginEnabled
			}, {
				"name": "Like",
				"enabled": pluginEnabled
			}]
		)
	});
	this.initInternalApplication({
		"view": "PublicEvent",
		"name": "VIPStream",
		"application": "Stream"
	}, {
		"target": view.dom.get("vipStream"),
		"plugins": this.updateAppPlugins(
			this.config.get("views")["PublicEvent"]["VIPStream"].plugins,
			[{
				"name": "Reply",
				"enabled": pluginEnabled
			}, {
				"name": "Like",
				"enabled": pluginEnabled
			}]
		)
	});
	$(target).append(content);
};

Echo.SocialChatter.prototype.assemblers.GreenRoom = function(target, ui) {
	var view = new Echo.SocialChatterView({
		"user": this.user,
		"target": target,
		"type": "greenRoom"
	});
	var content = view.render();
	this.initInternalApplication({
		"view": "GreenRoom",
		"name": "Stream",
		"application": "Stream"
	}, {
		"target": view.dom.get("vipStream")
	});
	var instrustionsContainer = view.dom.get("vipInstructions");
	if (!this.event || !this.event.data || !this.event.data.vipInstructions) {
		instrustionsContainer.hide();
	} else {
		instrustionsContainer.html(this.event.data.vipInstructions).show();
	}
	$(target).append(content);
};

Echo.SocialChatter.prototype.initInternalApplication = function(appSpec, appConfig) {
	// "specification" argument defines app location in the structure and the type of app
	this.destroyInternalApplication(appSpec);

	// we need to copy apps config to avoid changes in the common config
	appConfig = this.normalizeAppConfig(
		$.extend(true, 
			{},
			this.config.get("views")[appSpec.view][appSpec.name],
			appConfig
		)
	);
	this.apps[appSpec.view][appSpec.name] = new Echo[appSpec.application](appConfig);
	return this.apps[appSpec.view][appSpec.name];
};

Echo.SocialChatter.prototype.normalizeAppConfig = function(config) {
	var self = this;
	$.foldl(config, ["appkey", "apiBaseURL", "submissionProxyURL"], function(key, acc) {
		config[key] = config[key] || self.config.get(key);
	});
	var normalize = function(value) {
		if (typeof value == "string") {
			return self.substitute(value);
		// isPlainObject doesn't work correctly in IE <= 8 within jquery 1.4.2
		// this is the reason why we check whether jquery object
		} else if ($.isPlainObject(value) && !value.jquery) {
			return $.foldl({}, value, function(value, acc, key) {
				acc[key] = normalize(value);
			});
		} else if ($.isArray(value)) {
			return $.map(value, function(element) {
				return normalize(element);
			});
		} else {
			return value;
		}
	};
	return normalize(config);
};

Echo.SocialChatter.prototype.destroyInternalApplication = function(appSpec) {
	var app = this.apps[appSpec.view][appSpec.name];
	if (!app) return;
	if (app.liveUpdates) app.stopLiveUpdates();
	app.config.set("liveUpdates", false);
	app.startLiveUpdates = app.stopLiveUpdates = function() {};
	delete Echo.Vars.subscriptions[app.config.get("contextId")];
	delete this.apps[appSpec.view][appSpec.name];
};

Echo.SocialChatter.prototype.destroyInternalApplications = function(exceptions) {
	var self = this;
	exceptions = exceptions || [];
	var inExceptionList = function(view, name) {
		var inList = false;
		$.each(exceptions, function(id, exception) {
			if (exception.view == view && exception.name == name) {
				inList = true;
				return false; // break
			}
		});
		return inList;
	};
	$.each(this.apps, function(view, viewConfig) {
		$.each(viewConfig, function(appName, appConfig) {
			if (!inExceptionList(view, appName)) {
				self.destroyInternalApplication({"view": view, "name": appName});
			}
		});
	});
};

Echo.SocialChatter.prototype.refresh = function() {
	var self = this;
	this.stopLiveUpdates();
	this.initVars();
	this.showMessage({"type": "loading", "message": "Loading..."});
	this.destroyInternalApplications([{"view": "Main", "name": "Auth"}]);
	this.requestEventList(function(data) {
		self.initSocialChatterEvents(data.entries);
		self.setPublicEvent(self.pickRelevantEvent());
		self.config.get("target").empty().append(self.render());
		self.initTabs();
	});
};

Echo.SocialChatter.prototype.listenEvents = function() {
	var self = this;
	this.subscribe("internal.User.onInvalidate", function() {
		self.refresh();
	});	
	Echo.Broadcast.subscribe("SocialChatter.onBeforeEventOpen", function(topic, args) {
		var obj = args.event.object;
		self.setPublicEvent(new Echo.SocialChatterEvent(obj.content, obj.id));
		self.updateTabs();
		self.tabs.select("PublicEvent");
	});
	$.map(["Submit.onPostComplete", "Submit.onEditComplete", "SocialChatter.onEventDelete"], function(topic) {
		Echo.Broadcast.subscribe(topic, function() {
			self.startLiveUpdates(true);
		});
	});
	$.map(["SocialChatter.onEventStart", "SocialChatter.onEventEnd"], function(topic) {
		Echo.Broadcast.unsubscribe(topic);
		Echo.Broadcast.subscribe(topic, function(event) {
			self.updateTabs();
		});
	});
};

Echo.SocialChatter.prototype.addCss = function() {
	var id = 'echo-css-jquery-ui';
	if ($('#' + id).length) return;
	var container = document.getElementsByTagName("head")[0] || document.documentElement;
	var link = $("<link>", {
		"rel": "stylesheet",
		"id": id,
		"type": "text/css",
		"href": "//cdn.echoenabled.com/clientapps/v2/social-chatter/datepicker/datepicker-ui/jquery-ui-1.8.18.custom.css"
	}).get(0);
	container.insertBefore(link, $(container).children().get(0));
	$.addCss(
		'.echo-ui .echo-tabs-header li.ui-state-default { background-color: #E6E6E6; }' +
		'.echo-ui .echo-tabs-header li.ui-state-active { background-color: #FFFFFF; }' +
		// fancy buttons
		'.echo-item-eventButtonContainer .echo-button .ui-state-default, .echo-socialchatter-view-newEventButton .echo-button .ui-state-default, .echo-submit-controls .echo-button .ui-state-default {background: -webkit-gradient(linear, left top, left bottom, from(white), to(#EDEDED)); background: -moz-linear-gradient(top, white, #EDEDED); text-shadow: 0 1px 1px rgba(0, 0, 0, .3); -webkit-box-shadow: 0 1px 2px rgba(0,0,0,.2); -moz-box-shadow: 0 1px 2px rgba(0,0,0,.2); box-shadow: 0 1px 2px rgba(0,0,0,.2); width: 100px;}' +
		'.echo-socialchatter-view-newEventButton .echo-button .ui-state-default, .echo-item-eventButtonContainer .echo-button .ui-state-default { width: auto; padding: 3px 15px; }' +
		'.echo-socialchatter-view-eventListContainer { margin-left: 15px; margin-right: 15px; }' +
		'.echo-socialchatter-view-eventListContainer .echo-submit-userInfoWrapper { display: none; }' +
		'.echo-socialchatter-view-publicStream, .echo-socialchatter-view-vipStream { margin-top: 15px; }' +
		'.echo-socialchatter-view-vipStream { margin-bottom: 20px; }' +
		'.echo-ui .echo-socialchatter-tabs .ui-tabs .ui-tabs-nav li { border: 1px solid #DDDDDD; border-bottom: none; }' +
		'.echo-ui .echo-socialchatter-tabs .ui-tabs .ui-tabs-nav li a { padding: 7px 15px 5px 15px; font-size: 16px; }' +
		'.echo-ui .echo-socialchatter-tabs .ui-tabs .ui-tabs-panel { border-radius: 0px; border-left: 1px solid #DDDDDD; border-bottom: 1px solid #DDDDDD; border-right: 1px solid #DDDDDD; }' +
		'.echo-ui .echo-socialchatter-tabs .echo-tabs-header { border-bottom: 1px solid #DDDDDD; }' +
		'.echo-socialchatter-view-eventSubmitContainer { display: none; }' +
		'.echo-socialchatter-view-eventsStream { margin-top: 15px; }' +
		'.echo-socialchatter-view-eventsStream .echo-stream-header { display: none; }' +
		'.echo-socialchatter-view-leftColumn { margin: 5px 25px 0px 10px; }' +
		'.echo-socialchatter-view-leftColumnTD { width: 40%; vertical-align: top; }' +
		'.echo-socialchatter-view-rightColumnTD { width: 60%; vertical-align: top; }' +
		'.echo-socialchatter-view-rightColumn { margin: 0 10px; border: 1px solid #D3D3D3; padding: 15px 10px 15px 20px; border-radius: 4px; -webkit-box-shadow: 0 1px 2px rgba(0,0,0,.2); -moz-box-shadow: 0 1px 2px rgba(0,0,0,.2); box-shadow: 0 1px 2px rgba(0,0,0,.2); }' +
		'.echo-socialchatter-view-publicSubmitLabel, .echo-socialchatter-view-publicSubmitVIPLabel { font-weight: bold; font-size: 16px; margin-bottom: 10px; }' +
		'.echo-socialchatter-view-eventSubmitLabel { margin-top: 10px; cursor: pointer; font-weight: bold; font-size: 16px; }' +
		'.echo-socialchatter-view-eventSubmit .echo-submit-post-container { float: left; margin-left: 7px; }' +
		'.echo-socialchatter-view-eventSubmit .echo-submit-content { border: none; }' +
		'.echo-socialchatter-view-publicSubmit .echo-submit-userInfoWrapper { display: none; }' +
		'.echo-socialchatter-view-eventSubmit .echo-submit-userInfoWrapper { display: none; }' +
		'.echo-socialchatter-view-publicStream .echo-submit-userInfoWrapper { display: none; }' +
		'.echo-socialchatter-view-vipStream .echo-submit-userInfoWrapper { display: none; }' +
		'.echo-socialchatter-view-vipStream textarea.echo-submit-text { height: 36px; }' +
		'.echo-socialchatter-view-publicStream textarea.echo-submit-text { height: 36px; }' +
		'.echo-socialchatter-view-publicSubmit textarea.echo-submit-text { height: 36px; }' +
		'.echo-socialchatter-view-vipStream .echo-stream-header { display: none; }' +
		'.echo-socialchatter-view-publicStream .echo-stream-header { display: none; }' +
		'.echo-application-message { border: none; }' +
		'.echo-socialchatter-container .echo-submit-markersContainer, .echo-socialchatter-container .echo-submit-tagsContainer, .echo-socialchatter-container .echo-item-modeSwitch { display: none !important; }' +
		'.echo-socialchatter-view-publicSubmit .echo-submit-text { height: 55px; }' +
		'.echo-socialchatter-auth { float: right; }' +
		'.echo-socialchatter-auth .echo-auth-avatar, .echo-auth-logout { height: 24px; line-height: 24px; margin: 0px;}' +
		'.echo-socialchatter-auth .echo-auth-name { line-height: 23px; font-size: 14px; margin: 0px 20px 0px 0px; }' +
		'.echo-socialchatter-auth .echo-auth-edit { height: 24px; line-height: 24px; margin: 0px 5px 0px 0px; }' +
		'.echo-socialchatter-view-publicView { margin-top: 5px; }' +
		'.echo-socialchatter-view-publicView table { width: 100%; }' +
		'.echo-socialchatter-view-eventSubmit { margin: 10px auto; padding: 10px; width: 550px; }' +
		'.echo-socialchatter-view-eventSubmitContainer { border-radius: 7px; border: 1px solid #D3D3D3; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); margin: 10px 0px; }' +
		'.echo-socialchatter-view-eventDescription .echo-socialchatter-view-avatar { float: left; width: 100px; margin-right:-110px; margin-top: 2px; }' +
		'.echo-socialchatter-view-eventDescription .echo-socialchatter-view-avatar img { width: 100px; }' +
		'.echo-socialchatter-view-eventDescription .echo-socialchatter-view-title { margin-left: 115px; font-size: 20px; line-height: 20px; font-weight: bold; }' +
		'.echo-socialchatter-view-eventDescription .echo-socialchatter-view-description, .echo-socialchatter-view-eventDescription .startEvent, .echo-socialchatter-view-eventDescription .echo-socialchatter-view-countdown { margin-left: 115px; font-size: 14px; margin-top: 10px; }' +
		'.echo-socialchatter-view-publicViewUpcoming .echo-socialchatter-view-eventDescription, .echo-socialchatter-view-publicViewAnonymous .echo-socialchatter-view-eventDescription { max-width: 400px; margin: 20px auto; }' +
		'.echo-socialchatter-view-publicViewUpcoming { margin-top: 35px; }' +
		'.echo-socialchatter-view-countdown, .echo-socialchatter-view-publicViewNotice, .echo-socialchatter-view-vipInstructions { background-color: #D9EDF7; border: 1px solid #BCE8F1; border-radius: 4px 4px 4px 4px; color: #3A87AD;  margin: 20px auto 30px; padding: 15px; text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5); font-size: 16px; text-align: center; }' +
		'.echo-socialchatter-view-countdown { display: none; }' +
		'.echo-socialchatter-view-vipInstructions { line-height: 20px; margin-top: 10px; }' +
		'.echo-socialchatter-view-publicViewNotice { width: 450px; }' +
		'.echo-socialchatter-view-publicViewNotice { margin-top: 0px; margin-bottom: 10px; }' +
		'.echo-socialchatter-view-publicViewAnonymous .echo-socialchatter-view-loginWarning { background-color: #F2DEDE; border: 1px solid #EED3D7; border-radius: 4px 4px 4px 4px; color: #B94A48;  margin: 20px auto 30px; padding: 15px; text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5); font-size: 16px; text-align: center; width: 300px; }'
	, 'SocialChatter');
};

})(jQuery);
