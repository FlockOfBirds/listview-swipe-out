/*

 This is a DEMO widget and is NOT suitable for PRODUCTION.
 No warranties and no further version other than this demo will be provided.

 IDEAS
 Start index at 0 at end.
 Make a page indicator
 Auto load more
 PercentageThreshold
 Handle original sizing, and resizing.
 */

define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "ListviewSwipeOut/lib/hammer",
    "dojo/dom-class",
    "dojo/aspect",
    "dijit/registry",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/_base/lang"
], function(declare, _WidgetBase,
            Hammer, domClass, aspect,
            registry, dojoConstruct, dojoClass, dojoLang) {
    "use strict";

    return declare("ListviewSwipeOut.widget.ListviewSwipeOut", [ _WidgetBase ], {
        // Modeler variables
        targetName: "",
        swipeClass: "swipe-listview-out",
        currentIndex: 0,
        // Internal vars
        targetWidget: null,
        targetNode: null,
        loadMoreListItemNone: null,
        carousel: null,
        enableDemo: false,

        postCreate: function() {
            logger.debug(this.id + ".postCreate");
            this.findTarget();
        },

        findTarget: function() {
            logger.debug(this.id + ".postCreate");
            var queryNode = this.domNode.parentNode;
            while (!this.targetNode) {
                this.targetNode = queryNode.querySelector(".mx-name-" + this.targetName);
                if (queryNode === queryNode.parentNode) {
                    break;
                }
                queryNode = queryNode.parentNode;
            }

            if (this.targetNode) {
                this.targetWidget = registry.byNode(this.targetNode);
                domClass.add(this.targetNode, this.swipeClass);
            } else {
                this.showError("Error: unable to find listview with name " + this.targetName);
            }
        },

        showError: function(message) {
            logger.error(message);
        },

        appendLoadMore: function() {
            this.loadMoreListItemNone = dojoConstruct.create("li", {
                class: "mx-listview-item",
                innerHTML: "load more..."
            }, this.targetNode.firstChild, "last");
        },

        removeLoadMore: function() {
            dojoConstruct.destroy(this.loadMoreListItemNone);
        },

        update: function(obj, callback) {
            logger.debug(this.id + ".update");

            aspect.after(this.targetWidget, "_renderData", dojoLang.hitch(this, function() {
                logger.debug(this.id + "_listview._showLoadMoreButton");
                this.hammerTime();
            }));
            /* var self = this;
             aspect.around(this.targetWidget, "_renderData",  dojoLang.hitch(this, function(originalMethod) {
             return function(callback) {
             console.log(this.id + "_listview._renderData");
             self.removeLoadMore();
             originalMethod.apply(this, arguments);
             self.hammerTime();
             };
             }));*/
            aspect.after(this.targetWidget, "_showLoadMoreButton", dojoLang.hitch(this, function() {
                logger.debug(this.id + "_listview._showLoadMoreButton");
                // this.appendLoadMore();
            }));
            aspect.after(this.targetWidget, "_hideLoadMoreButton", dojoLang.hitch(this, function() {
                logger.debug(this.id + "_listview._hideLoadMoreButton");
                // this.removeLoadMore();
            }));
            callback();
        },

        // For each item create a background item, show en item is swiped out.
        createBackgroundItems: function() {
            /**/
        },

        uninitialize: function() {
            logger.debug(this.id + ".uninitialize");
            // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
        },

        hammerTime: function() {
            var dirProp = function(direction, hProp, vProp) {
                    //noinspection JSBitwiseOperatorUsage
                    return (direction & Hammer.DIRECTION_HORIZONTAL) ? hProp : vProp;
                },
                HammerSwipeOut = function(container, direction) {
                    /**
                     * SwipeOut
                     * @param {node} container - c
                     * @param {Hammer.Direction} direction - c
                     * @constructor
                     */
                    this.container = container;
                    this.direction = direction;
                    this.panes = [ this.container.firstChild.firstChild.firstChild ];
                    this.containerSize = this.container[dirProp(direction, "offsetWidth", "offsetHeight")];
                    this.currentIndex = 0;
                    this.hammer = new Hammer.Manager(this.container);
                    this.hammer.add(new Hammer.Pan({ direction: this.direction, threshold: 10 }));
                    this.hammer.on("panstart panmove panend pancancel", Hammer.bindFn(this.onPan, this));
                    this.show(this.currentIndex);
                };
            HammerSwipeOut.prototype = {
                /**
                 * Show a pane
                 * @param {Number} showIndexIn - index to show
                 * @param {Number} [percentIn] percentage visible - %
                 * @param {Boolean} [animate] - if animate is needed
                 */
                show: function(showIndexIn, percentIn, animate) {
                    logger.debug(".show", showIndexIn, percentIn, animate);
                    var showIndex = Math.max(0, Math.min(showIndexIn, this.panes.length - 1)),
                        percent = percentIn || 0,
                        className = this.container.className,
                        paneIndex = 0,
                        pos = null,
                        translate = null,
                        hundredPercent = 100;
                    if (animate) {
                        if (className.indexOf("animate") === -1) {
                            this.container.className += " animate";
                        }
                    } else if (className.indexOf("animate") !== -1) {
                        this.container.className = className.replace("animate", "").trim();
                    }
                    // for (paneIndex = 0; paneIndex < this.panes.length; paneIndex++) {
                    pos = (this.containerSize / hundredPercent) *
                        (((paneIndex - showIndex) * hundredPercent) + percent);
                    //noinspection JSBitwiseOperatorUsage
                    if (this.direction & Hammer.DIRECTION_HORIZONTAL) {
                        translate = "translate3d(" + pos + "px, 0, 0)";
                    } else {
                        translate = "translate3d(0, " + pos + "px, 0)";
                    }
                    this.panes[paneIndex].style.transform = translate;
                    this.panes[paneIndex].style.mozTransform = translate;
                    this.panes[paneIndex].style.webkitTransform = translate;
                    // }
                    this.currentIndex = showIndex;
                },
                out: function(direction, animate) {
                    // showIndex = Math.max(0, Math.min(showIndex, this.panes.length - 1));
                    // percent = percent || 0;
                    var className = this.container.className,
                        paneIndex = 0,
                        pos = null,
                        translate = null;
                    if (animate) {
                        if (className.indexOf("animate") === -1) {
                            this.container.className += " animate";
                        }
                    } else if (className.indexOf("animate") !== -1) {
                        this.container.className = className.replace("animate", "").trim();
                    }
                    // pos = (this.containerSize / hundredPercent) *
                    //        (((paneIndex - showIndex) * hundredPercent) + percent);
                    pos = direction === "left" ? -this.containerSize : this.containerSize;
                    translate = "translate3d(" + pos + "px, 0, 0)";
                    this.panes[paneIndex].style.transform = translate;
                    this.panes[paneIndex].style.mozTransform = translate;
                    this.panes[paneIndex].style.webkitTransform = translate;
                    this.hide();
                },
                hide: function() {
                    var backgroundNodeNode = this.container.firstChild.firstChild.children[1], // Ugly
                        container = this.container,
                        timeoutAnimation = 600,
                        timeoutRemove = 2000; // Should be done with next touch?
                    setTimeout(function() {
                        backgroundNodeNode.style.display = "none";
                        setTimeout(function() {
                            dojoClass.add(container, "removed-from-list");
                        }, timeoutRemove);
                    }, timeoutAnimation);
                },
                /**
                 * Handle pan
                 * @param {Object} ev - event object
                 */
                onPan: function(ev) {
                    // console.log(".onPan", ev);
                    var numberInPercent = 100,
                        percentageThreshold = 20,
                        delta = dirProp(this.direction, ev.deltaX, ev.deltaY),
                        percent = (numberInPercent / this.containerSize) * delta,
                        animate = false,
                        direction = "none";
                    if (ev.type === "panend" || ev.type === "pancancel") {
                        if (Math.abs(percent) > percentageThreshold && ev.type === "panend") {
                            if (percent < 0) {
                                logger.debug("left out");
                                direction = "left";
                            } else {
                                logger.debug("right out");
                                direction = "right";
                            }
                            this.out(direction, true);
                            return;
                        }
                        percent = 0;
                        animate = true;
                    }
                    this.show(this.currentIndex, percent, animate);
                }
            };
            Hammer.each(document.querySelectorAll(".mx-listview-item"), function(container) {
                new HammerSwipeOut(container, Hammer.DIRECTION_HORIZONTAL);
            });
        }
    });
});
