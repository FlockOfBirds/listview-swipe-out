import * as dojoDeclare from "dojo/_base/declare";
import * as WidgetBase from "mxui/widget/_WidgetBase";

import * as dojoAspect from "dojo/aspect";
import * as domClass from "dojo/dom-class";
import * as registry from "dijit/registry";

import * as Hammer from "hammerjs";
import HammerSwipeOut from "./HammerSwipeOut";

import "./ui/ListViewSwipeOut.css";

class ListViewSwipeOut extends WidgetBase {
    // Properties from Mendix modeler
    targetName: string;

    private swipeClass: string;
    private targetWidget: mxui.widget._WidgetBase;
    private targetNode: dojo.NodeList | HTMLElement;
    // private loadMoreListItemNone: any;
    // private enableDemo = false;
    private contextObject: mendix.lib.MxObject;

    postCreate() {
        this.swipeClass = "swipe-listview-out";
        this.findTarget();
    }

    update(contextObject: mendix.lib.MxObject, callback: Function) {
        this.contextObject = contextObject;

        dojoAspect.after(this.targetWidget, "_renderData", () => {
            logger.debug(this.id + "_listview._showLoadMoreButton");
            Hammer.each(document.querySelectorAll(".mx-listview-item"), (container: HTMLElement) => {
                new HammerSwipeOut(container, Hammer.DIRECTION_HORIZONTAL);
            }, null);
        });

        callback();
    }

    private findTarget() {
        let queryNode = this.domNode.parentNode as HTMLElement;
        while (!this.targetNode) {
            this.targetNode = queryNode.querySelector(".mx-name-" + this.targetName) as HTMLElement;
            if (queryNode === queryNode.parentNode) { // TODO: should be compared to document
                break;
            }
            queryNode = queryNode.parentNode as HTMLElement;
        }
        // TODO: check if targetWidget is the right type
        if (this.targetNode) {
            this.targetWidget = registry.byNode(this.targetNode as HTMLElement);
            domClass.add(this.targetNode as HTMLElement, this.swipeClass);
        } else {
            logger.error("Error: unable to find listview with name " + this.targetName);
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
