import * as dojoDeclare from "dojo/_base/declare";
import * as WidgetBase from "mxui/widget/_WidgetBase";

import * as dojoAspect from "dojo/aspect";
import * as domClass from "dojo/dom-class";
import * as registry from "dijit/registry";

import * as Hammer from "hammerjs";
import { Direction, HammerSwipeOut } from "./HammerSwipeOut";

import "./ui/ListViewSwipeOut.css";

class ListViewSwipeOut extends WidgetBase {
    // Properties from Mendix modeler
    targetName: string;
    onLeftSwipe: string;
    onRightSwipe: string;

    private swipeClass: string;
    private targetWidget: mxui.widget._WidgetBase;
    private targetNode: HTMLElement;
    private contextObject: mendix.lib.MxObject;

    postCreate() {
        this.swipeClass = "swipe-listview-out";
        this.findTarget();
    }

    update(contextObject: mendix.lib.MxObject, callback: Function) {
        this.contextObject = contextObject;

        dojoAspect.after(this.targetWidget, "_renderData", () => {
            Hammer.each(document.querySelectorAll(".mx-listview-item"), (container: HTMLElement) => {
                new HammerSwipeOut(container, Hammer.DIRECTION_HORIZONTAL, (direction: Direction) =>
                    this.handleSwipe(direction));
            }, this);
        });

        callback();
    }

    private findTarget() {
        let queryNode = this.domNode.parentNode as Element;
        while (!this.targetNode) {
            this.targetNode = queryNode.querySelector(".mx-name-" + this.targetName) as HTMLElement;
            if (window.document.isEqualNode(queryNode)) { break; }
            queryNode = queryNode.parentNode as HTMLElement;
        }

        if (this.targetNode) {
            this.targetWidget = registry.byNode(this.targetNode);
            if (this.targetWidget.hasOwnProperty("_listNode")) {
                domClass.add(this.targetNode, this.swipeClass);
            } else {
                logger.error("Supplied target does not correspond to a listview: " + this.targetName);
            }
        } else {
            logger.error("Unable to find listview with name " + this.targetName);
        }
    }

    private handleSwipe(direction: Direction) {
        const guids = this.contextObject ? [ this.contextObject.getGuid() ] : [];
        if (direction === "left") {
            this.executeAction(this.onLeftSwipe, guids);
        } else {
            this.executeAction(this.onRightSwipe, guids);
        }
    }

    private executeAction(microflow: string, guids: string[]) {
        if (microflow) {
            window.mx.ui.action(microflow, {
                error: (error: Error) =>
                    window.mx.ui.error(`An error occurred while executing action: ${error.message}`, true),
                params: { guids }
            });
        }
    }
}

// Declare widget prototype the Dojo way
// Thanks to https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/dojo/README.md
// tslint:disable : only-arrow-functions
dojoDeclare("com.mendix.widget.ListViewSwipeOut.ListViewSwipeOut", [ WidgetBase ], function (Source: any) {
    let result: any = {};
    for (let property in Source.prototype) {
        if (property !== "constructor" && Source.prototype.hasOwnProperty(property)) {
            result[property] = Source.prototype[property];
        }
    }
    return result;
} (ListViewSwipeOut));
