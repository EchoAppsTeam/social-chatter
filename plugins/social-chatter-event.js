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

var plugin = Echo.createPlugin({
	"name": "SocialChatterEvent",
	"applications": ["Stream", "Submit"],
	"dependencies": [{
		"url": "//cdn.echoenabled.com/clientapps/v2/submit.js",
		"application": "Submit"
	}, {
		"url": "//cdn.echoenabled.com/clientapps/v2/social-chatter/datepicker/jquery-ui-1.8.18.custom.min.js",
		"loaded": function() { return !!$.datepicker; }
	}, {
		"url": "//cdn.echoenabled.com/clientapps/v2/social-chatter/datepicker/jquery-ui-timepicker-addon.js",
		"loaded": function() { return !!$.datepicker && !!$.timepicker; }
	}],
	"init": function(plugin, application) {
		if (!plugin.config.get(application, "dateFormat")) {
			plugin.config.set(application, "dateFormat", "yy-mm-dd");
		}
		if (!plugin.config.get(application, "timeFormat")) {
			plugin.config.set(application, "timeFormat", "hh:mm tt");
		}
		if (!plugin.config.get(application, "ampm")) {
			plugin.config.set(application, "ampm", true);
		}
		if (application instanceof Echo.Submit) {
			$(application.config.get("target"))
				.addClass("echo-submit-plugin-SocialChatterEvent");
			plugin.extendTemplate("Submit", plugin.template["Submit.AdminNotice"],
				"insertAfter", "echo-submit-header");
			plugin.extendTemplate("Submit", plugin.template["Submit.Metadata"],
				"insertAfter", "echo-submit-text");
			plugin.extendTemplate("Submit", plugin.template["Submit.EventIcon"],
				"insertBefore", "echo-submit-body");
			$.each(plugin.renderers.Submit, function(name, renderer) {
				plugin.extendRenderer("Submit", name, renderer);
			});
			plugin.listenSubmitEvents(application);
			plugin.postAction(application);
		}
		if (application instanceof Echo.Stream) {
			$(application.config.get("target"))
				.addClass("echo-stream-plugin-SocialChatterEvent");
			plugin.extendTemplate("Item", plugin.template.Item,
				"insertAfter", "echo-item-authorName");
			$.each(plugin.renderers.Item, function(name, renderer) {
				plugin.extendRenderer("Item", name, renderer);
			});
			plugin.addItemControl(application, plugin.assembleControl(application));
			plugin.listenStreamEvents(application);
		}
		plugin.addCss(plugin.css);
	}
});

plugin.addLabels({
	"unknown": "Unknown",
	"notProvided": "Not provided",
	"errorLoadingImageURL": "Error loading image URL",
	"eventTitle": "Event title",
	"VIPGuestName": "VIP guest name",
	"photoURL": "VIP/Event photo URL",
	"eventNameHint": "Type event name",
	"vipNameHint": "Type vip name",
	"vipPhotoHint": "Type vip photo url",
	"vipInstructionsHint": "Type instructions for your VIP guest. Instructions will be displayed as a note in the \"Green Room\" tab",
	"eventDescriptionHint": "Type event description",
	"eventStartHint": "Type event start date",
	"eventEndHint": "Type event end date",
	"changeEventIcon": "change icon",
	"onAirEventOpen": "View Current Session",
	"upcomingEventOpen": "View this Upcoming Chat",
	"passedEventOpen": "View this Chat Archive",
	"eventName": "<b>Event title</b>",
	"eventStatus": "<b>Event status</b>",
	"upcoming": "upcoming event",
	"onAir": "<span class=\"echo-event-onair-label\">on air now!</span>",
	"passed": "passed event",
	"vipName": "<b>VIP guest name</b>",
	"vipInstructions": "<b>Instructions for VIP guest <small>(for Green Room tab)</small></b>",
	"eventDescription": "<b>Event description</b>",
	"eventDuration": "<b>Event duration</b>",
	"eventStart": "<b>Start date and time</b> <small>(in your timezone)</small>",
	"eventEnd": "<b>End date and time</b> <small>(in your timezone)</small>",
	"createdBy": "<b>Created by</b>",
	"creationDate": "<b>Creation date</b>",
	"viewFullEvent": "Show event details",
	"viewDefaultEvent": "Hide event details",
	"eventSubmitNotice": "<b>Notes for administrators:</b> <div style=\"text-align: left; padding-left: 40px;\"><div style=\"margin: 10px 0 10px 0;\">1. fields marked with <span class=\"echo-submit-event-field-mandatory\">*</span> are mandatory</div><div style=\"margin-bottom: 10px;\">2. there might be multiple instances of passed and upcoming events, but only <b>one on air</b> event at a time. Please make sure that there are no time overlaps in events scheduling. Learn more about the Social Chatter application <a href='http://wiki.aboutecho.com/Echo%20Application%20-%20Echo%20Social%20Chatter' target='_blank'>here</a>.</div></ul>"
});

plugin.template = {
	"Submit.AdminNotice":
		'<div class="echo-submit-eventSubmitNotice"></div>',
	"Submit.EventIcon":
		'<div class="echo-submit-eventIconContainer">' +
			'<img class="echo-submit-eventIcon" src="//cdn.echoenabled.com/clientapps/v2/social-chatter/images/vip.jpg">' +
			'<div class="echo-submit-eventIconError">' + plugin.label("errorLoadingImageURL") + '</div>' +
			'<div class="echo-submit-changeEventIcon echo-linkColor echo-clickable"></div>' +
		'</div>',
	"Submit.Metadata":
		'<div class="echo-submit-metadata-container">' +
			'<div class="echo-submit-field-title">' + plugin.label("eventTitle") + ' <span class="echo-submit-event-field-mandatory">*</span></div>' +
			'<div class="echo-submit-event-inputContainer echo-submit-border">' +
				'<input type="text" class="echo-submit-eventName echo-submit-text-input echo-primaryFont">' +
			'</div>' +
		'</div>' +
		'<div class="echo-submit-metadata-container">' +
			'<div class="echo-submit-field-title">' + plugin.label("VIPGuestName") + ' <span class="echo-submit-event-field-mandatory">*</span></div>' +
			'<div class="echo-submit-event-inputContainer echo-submit-border">' +
				'<input type="text" class="echo-submit-vipName echo-submit-text-input echo-primaryFont">' +
			'</div>' +
		'</div>' +
		'<div class="echo-submit-metadata-container">' +
			'<div class="echo-submit-field-title">' + plugin.label("photoURL") + '</div>' +
			'<div class="echo-submit-event-inputContainer echo-submit-border">' +
				'<input type="text" class="echo-submit-vipPhoto echo-submit-text-input echo-primaryFont">' +
			'</div>' +
		'</div>' +
		'<div class="echo-submit-metadata-container">' +
			'<div class="echo-submit-field-title">' + plugin.label("eventStart") + ' <span class="echo-submit-event-field-mandatory">*</span></div>' +
			'<div class="echo-submit-event-inputContainer echo-submit-border">' +
				'<input type="text" class="echo-submit-eventStart echo-submit-text-input echo-primaryFont">' +
			'</div>' +
		'</div>' +
		'<div class="echo-submit-metadata-container">' +
			'<div class="echo-submit-field-title">' + plugin.label("eventEnd") + ' <span class="echo-submit-event-field-mandatory">*</span></div>' +
			'<div class="echo-submit-event-inputContainer echo-submit-border">' +
				'<input type="text" class="echo-submit-eventEnd echo-submit-text-input echo-primaryFont">' +
			'</div>' +
		'</div>' +
		'<div class="echo-submit-metadata-container">' +
			'<div class="echo-submit-field-title">' + plugin.label("eventDescription") + '</div>' +
			'<div class="echo-submit-event-inputContainer echo-submit-border">' +
				'<textarea class="echo-submit-eventDescription echo-submit-text-area echo-primaryFont"></textarea>' +
			'</div>' +
		'</div>' +
		'<div class="echo-submit-metadata-container">' +
			'<div class="echo-submit-field-title">' + plugin.label("vipInstructions") + '</div>' +
			'<div class="echo-submit-event-inputContainer echo-submit-border">' +
				'<textarea class="echo-submit-vipInstructions echo-submit-text-area echo-primaryFont"></textarea>' +
			'</div>' +
		'</div>',
	"Item": '<div class="echo-item-eventContainer"></div>',
	"Item.EventDefault": '<div class="echo-item-eventDefault">' +
		'<div class="echo-item-eventNameDefault"></div>' +
		'<div class="echo-item-eventDescriptionDefault"></div>' +
		'<div class="echo-item-eventStatus"></div>' +
		'<div class="echo-item-eventButtonContainer">' +
			'<button class="echo-item-eventButton"></button>' +
		'</div>' +
	'</div>',
	"Item.EventFull": '<div class="echo-item-event">' +
			'<div class="echo-item-eventInfo">' +
				'<div class="echo-item-eventItem">' +
					'<span class="echo-item-eventName"></span>' +
				'</div>' +
				'<div class="echo-item-eventItem">' +
					'<span class="echo-item-eventStatus"></span>' +
				'</div>' +
				'<div class="echo-item-eventItem">' +
					'<span class="echo-item-vipName"></span>' +
				'</div>' +
				'<div class="echo-item-eventItem">' +
					'<span class="echo-item-eventDescription"></span>' +
				'</div>' +
				'<div class="echo-item-eventItem">' +
					'<span class="echo-item-eventDuration"></span>' +
				'</div>' +
				'<div class="echo-item-eventItem">' +
					'<span class="echo-item-eventStart"></span>' +
				'</div>' +
				'<div class="echo-item-eventItem">' +
					'<span class="echo-item-eventEnd"></span>' +
				'</div>' +
				'<div class="echo-item-eventItem">' +
					'<span class="echo-item-eventCreatedBy"></span>' +
				'</div>' +
				'<div class="echo-item-eventItem">' +
					'<span class="echo-item-eventCreationDate"></span>' +
				'</div>' +
				'<div class="echo-item-eventItem">' +
					'<span class="echo-item-vipInstructions"></span>' +
				'</div>' +
			'</div>' +
			'<div class="echo-item-eventButtonContainer">' +
				'<button class="echo-item-eventButton"></button>' +
			'</div>' +
		'</div>'
};

plugin.fields = ["eventName", "vipName", "vipInstructions", "vipPhoto", "eventDescription", "eventStart", "eventEnd"];

plugin.mandatoryFields = ["eventName", "vipName", "eventStart", "eventEnd"];

plugin.renderers = {"Submit": {}, "Item": {}};

plugin.renderers.Item.eventContainer = function(element) {
	var application = this;
	if (!plugin.get(this, "eventTemplate.type")) {
		plugin.set(this, "eventTemplate.type", "default");
	}
	var type = plugin.get(this, "eventTemplate.type");
	var template = type == "default"
		? plugin.template["Item.EventDefault"]
		: plugin.template["Item.EventFull"];
	var renderers = $.foldl({}, ["eventName", "vipName", "eventStart", "eventEnd", "eventDescription"], function(info, acc, i) {
		acc[info] = function(element) {
			var event =  new Echo.SocialChatterEvent(application.data.object.content);
			if (info == "eventStart" || info == "eventEnd") {
				element.html(plugin.label(info) + ": " + plugin.getFullDate(application, event.data[info]));
			} else {
				var prefix = plugin.label(info) !== info
					? plugin.label(info) + ": "
					: "";
				element.html(prefix + (event.data[info] || plugin.label("unknown")));
			}
		};
	});
	var event = new Echo.SocialChatterEvent(application.data.object.content);
	renderers = $.extend(renderers, {
		"eventStatus": function(element) {
			var status = event.getEventStatus();
			var content = plugin.label("eventStatus") + ": " + plugin.label(status);
			var extra;
			if (status == "upcoming") {
				extra = event.calcAnotherStartEvent();
			} else if (status == "passed") {
				extra = event.calcEndEvent();
			}
			if (extra)
				content += ". " + extra + ".";
			element.html(content);
		},
		"eventDuration": function(element) {
			var duration = event.getEventDuration();
			element.html(plugin.label("eventDuration") + ": " + event.displayDateDiff(duration, function(diff, period) {
				return diff + " " + period + (diff == 1 ? "" : "s");
			}));
		},
		"eventCreatedBy": function(element) {
			element.html(plugin.label("createdBy") + ": " + application.data.actor.title);	
		},
		"eventNameDefault": function(element) {
			element.html(event.data.eventName || plugin.label("unknown"));
		},
		"eventDescriptionDefault": function(element) {
			element.html(event.data.eventDescription || plugin.label("unknown"));
		},
		"eventCreationDate": function(element) {
			application.calcAge();
			element.html(plugin.label("creationDate") + ": " + application.age);	
		},
		"vipInstructions": function(element) {
			element.html(plugin.label("vipInstructions") + ": " + (event.data.vipInstructions || plugin.label("notProvided")));
		},
		"eventButton": function(element) {
			if ($.isEmptyObject(event)) {
				element.detach();
				return;
			}
			var button = new Echo.UI.Button(element, {
				"normal": {
					"icons": false,
					"disable": false,
					"label": plugin.label(event.getEventStatus() + "EventOpen")
				}
			});
			element.click(function() {
				plugin.publish(application, "SocialChatter.onBeforeEventOpen", {
					"event": application.data
				});
			});
		}
	});
	var dom = $.toDOM(this.substitute(template), "echo-item-", renderers);
	element.empty().append(dom.content);
};

plugin.renderers.Submit.changeEventIcon = function(element) {
	var self = this;
	element.text(plugin.label("changeEventIcon"));
	element.click(function() {
		self.dom.get("vipPhoto").focus().select();
	});
};

plugin.renderers.Submit.text = function(element) {
	var event = new Echo.SocialChatterEvent(this.config.get("data.object.content"));
	if ($.isEmptyObject(event)) {
		return this.parentRenderer("text", arguments);
	}
	// we need to put some value into textarea
	// to satisfy submission code requirements,
	// this calue would be re-written by the plugin later
	element.val(".").detach();
};

plugin.renderers.Submit.eventInfo = function(element, dom, extra) {
	extra = extra || {};
	var type = extra.type;
	var event = new Echo.SocialChatterEvent(this.config.get("data.object.content"));
	var value = event.data && event.data[type] && (type == "eventStart" || type == "eventEnd")
		? plugin.getFullDate(this, event.data[type])
		: event.data[type] || "";
	if (!$.isEmptyObject(event)) {
		dom.get(type)
			.iHint({
				"text": plugin.label(type + "Hint"),
				"className": "echo-secondaryColor"
			})
			.val($.trim($.stripTags(value || "")))
			.blur();
	} else {
		dom.get(type).detach();
	}
};

plugin.renderers.Submit.eventSubmitNotice = function(element) {
	element.html('<span>' + plugin.label("eventSubmitNotice") + '</span>');
};

$.each(["eventStart", "eventEnd"], function(i, info) {
	plugin.renderers.Submit[info] = function(element, dom) {
		var self = this;
		this.render("eventInfo", element, dom, {"type": info});
		var datepicker = $("#ui-datepicker-div");
		var event = new Echo.SocialChatterEvent(this.config.get("data.object.content"));
		if (event.data[info]) {
			plugin.set(this, "eventsTimestamp." + info, event.data[info]);
		}
		var datetimepickerConfig = {
			"ampm": plugin.config.get(this, "ampm"),
			"dateFormat": plugin.config.get(this, "dateFormat"),
			"timeFormat": plugin.config.get(this, "timeFormat"),
			"onSelect": function() {
				plugin.set(self, "eventsTimestamp." + info, element.datetimepicker("getDate").getTime());
			},
			"onClose": function(date) {
				var element = info == "eventStart"
					? dom.get("eventEnd")
					: dom.get("eventStart");
				if (element.val()) {
					var startDate = plugin.get(self, "eventsTimestamp.eventStart");
					var endDate = plugin.get(self, "eventsTimestamp.eventEnd");
					if (startDate > endDate) {
						element.val(date);
					}
				} else {
					element.val(date);
				}
			}
		};
		element.datetimepicker(datetimepickerConfig)
		.keydown(function(e) {
			var code = e.keyCode || e.which;
			if (code ^ 9 && code ^ 13)
				return false;
		});
		!datepicker.parents(".datepicker-ui").length && datepicker.wrap('<div class="datepicker-ui"></div>');
	};
});

$.each(plugin.fields, function(i, info) {
	plugin.renderers.Submit[info] = plugin.renderers.Submit[info] || function(element, dom) {
		var self = this;
		this.render("eventInfo", element, dom, {"type": info});
		// exclusion for "vipPhoto" element name
		if (info == "vipPhoto") {
			var content = this.config.get("data.object.content");
			if (content) {
				var event = new Echo.SocialChatterEvent(content);
				if (event.data.vipPhoto) {
					dom.get("eventIcon").attr("src", event.data.vipPhoto);
				}
			}
			element.focus(function() {
				self.dom.get("eventIconError").hide();
				element.parent().removeClass("echo-input-error");
			}).blur(function() {
				var _element = $(this);
				if (_element.val()) {
					self.dom.get("eventIcon")
						.attr("src", _element.val())
						.one("error", function() {
							element.parent().addClass("echo-input-error");
							self.dom.get("eventIconError").show();
							self.dom.get("eventIcon")
								.attr("src", "//cdn.echoenabled.com/clientapps/v2/social-chatter/images/vip.jpg");
						});
				}
			})
		}
	};
});

plugin.assembleContent = function(application) {
	return $.foldl({}, plugin.fields, function(name, acc) {
		if (name == "eventStart" || name == "eventEnd") {
			acc[name] = plugin.get(application, "eventsTimestamp." + name);
			return;
		}
		acc[name] = application.dom.get(name).val();
	});
};

plugin.listenStreamEvents = function(application) {
	plugin.subscribe(application, "internal.Item.onDelete", function(topic, args) {
		plugin.publish(application, "SocialChatter.onEventDelete", args);
	});
};

plugin.postAction = function(application) {
	application.posting = application.posting || {};
	application.posting.action = function() {
		var highlighted;
		$.each(plugin.mandatoryFields, function(i, v) {
			var element = application.dom.get(v);
			highlighted = application.highlightMandatory(element);
			return !highlighted;
		});
		if (highlighted) return;
		application.post();
	}
};

plugin.listenSubmitEvents = function(application) {
	$.each(["Post", "Edit"], function(i, mode) {
		plugin.subscribe(application, "Submit.on" + mode + "Init", function(topic, args) {
			if ($.isArray(args.postData)) {
				$.each(args.postData, function(i, data) {
					if (data.field == "content") {
						data.value = $.object2JSON(plugin.assembleContent(application));
					}
				});
			} else {
				args.postData.content = $.object2JSON(plugin.assembleContent(application));
			}
		});
	});
	plugin.subscribe(application, "Submit.onPostComplete", function(topic, args) {
		application.rerender(plugin.fields);
	});
};

plugin.renderers.Item.footer = function(element) {
	this.parentRenderer("footer", arguments);
	if (!this.user.isAdmin() || this.user.hasAnyRole(["vip"])) {
		element.hide();
	}
};

plugin.renderers.Item.avatar = function() {
	var content =  new Echo.SocialChatterEvent(this.data.object.content);
	var initialAvatar = this.data.actor.avatar;
	var defaultAvatar = this.user.get("defaultAvatar");
	// re-define default avatar for the item
	this.user.set("defaultAvatar", "//cdn.echoenabled.com/clientapps/v2/social-chatter/images/vip.jpg");
	if (!$.isEmptyObject(content)) {
		this.data.actor.avatar = content.data.vipPhoto;
	}
	var element = this.parentRenderer("avatar", arguments);
	this.data.actor.avatar = initialAvatar;
	// reset default avatar
	this.user.set("defaultAvatar", defaultAvatar);
	return element;
}

plugin.renderers.Item.authorName = plugin.renderers.Item.body = function(element) {
	element.remove();
};

plugin.getFullDate = function(application, timestamp) {
	var d = new Date(timestamp);
	return (timestamp
		? $.datepicker.formatDate(plugin.config.get(application, "dateFormat"), d)
		+ " " + $.datepicker.formatTime(plugin.config.get(application, "timeFormat"),  {
			"hour": d.getHours(),
			"minute": d.getMinutes(),
			"second": d.getSeconds(),
			"millisec": d.getMilliseconds()
		}, {
			"ampm": plugin.config.get(application, "ampm")
		})
		: plugin.label("unknown"));
};

plugin.assembleControl = function(application) {
	return function() {
		var item = this;
		var type = plugin.get(item, "eventTemplate.type");
		return {
			"name": "ViewFullEvent",
			"label": type == "default"
				? plugin.label("viewFullEvent")
				: plugin.label("viewDefaultEvent"),
			"visible": item.user.isAdmin(),
			"callback": function() {
				plugin.set(item, "eventTemplate.type", type == "default" ? "full" : "default");
				item.rerender(["eventContainer", "controls"]);
			} 
		};
	};
};

plugin.css =
	'.ui-timepicker-div .ui-widget-header { margin-bottom: 8px; }' +
	'.ui-timepicker-div dl { text-align: left; }' +
	'.ui-timepicker-div dl dt { height: 25px; margin-bottom: -25px; }' +
	'.ui-timepicker-div dl dd { margin: 0 10px 10px 65px; }' +
	'.ui-timepicker-div td { font-size: 90%; }' +
	'.ui-tpicker-grid-label { background: none; border: none; margin: 0; padding: 0; }' +
	'.echo-item-eventItem { margin: 5px 0px; }' +
	'.echo-item-eventContainer { float: left; }' +
	'.echo-submit-plugin-SocialChatterEvent .echo-submit-content { border: 0px; }' +
	'.echo-submit-plugin-SocialChatterEvent .echo-submit-post-container { float: left; margin: 0px 15px 0px 5px; }' +
	'.echo-submit-plugin-SocialChatterEvent .echo-submit-cancelButton-container { float: left; }' +
	'.echo-stream-plugin-SocialChatterEvent .echo-item-avatar-wrapper { margin-top: 7px; }' +
	'.echo-submit-plugin-SocialChatterEvent .echo-input-error { border: 1px solid red; }' +
	'.echo-submit-plugin-SocialChatterEvent .echo-submit-eventIconError { display: none; color: red; font-size: 12px; margin: 10px 0px; text-align: center; }' +
	'.echo-submit-plugin-SocialChatterEvent .echo-submit-eventIconContainer { text-align: center; width: 175px; float: left; margin-right: 20px; }' +
	'.echo-submit-plugin-SocialChatterEvent .echo-submit-eventIconContainer img { margin: 20px 0px 10px 0px; max-width: 120px; }' +
	'.echo-submit-plugin-SocialChatterEvent .echo-submit-changeEventIcon { text-align: center; }' +
	'.echo-submit-plugin-SocialChatterEvent .echo-submit-body { float: left; }' +
	'.echo-submit-plugin-SocialChatterEvent .echo-submit-controls { clear: both; margin-left: 195px; margin-bottom: 15px; }' +
	'.echo-submit-plugin-SocialChatterEvent .echo-submit-body { margin-right: 20px; }' +
	'.echo-submit-field-title { font-size: 14px; font-weight: bold; margin-bottom: 5px; }' +
	'.echo-item-eventButtonContainer { padding: 15px 0 15px 0px; text-align: left; }' +
	'.echo-item-eventDefault { padding: 5px 0 5px 0px; }' +
	'.echo-item-eventNameDefault { font-size: 20px; font-weight: bold; }' +
	'.echo-item-eventDescriptionDefault { font-size: 14px; margin: 10px 0px; }' +
	'.echo-socialchatter-view-eventsStream .echo-item-avatar, .echo-socialchatter-view-eventsStream .echo-item-avatar img { height: auto !important; }' +
	'.echo-socialchatter-view-eventsStream .echo-item-modeSwitch, .echo-socialchatter-view-eventsStream .echo-item-status { display: none !important; }' +
	'.echo-socialchatter-view-eventsStream .echo-item-subcontainer { margin-left: 10px; }' +
	'.echo-event-onair-label { color: green; font-weight: bold; }' +
	'.echo-submit-eventSubmitNotice { background-color: #D9EDF7; border: 1px solid #BCE8F1; border-radius: 4px 4px 4px 4px; color: #3A87AD;  padding: 15px; text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5); font-size: 14px; line-height: 16px; text-align: center; }' +
	'.echo-submit-eventSubmitNotice a { color: #3A87AD; cursor: pointer; text-decoration: underline; }' +
	'.echo-submit-event-field-mandatory { color: red; font-weight: bold; }' +
	'.echo-submit-event-inputContainer { margin-bottom: 15px; width: 300px; padding: 5px; }';
})(jQuery);
