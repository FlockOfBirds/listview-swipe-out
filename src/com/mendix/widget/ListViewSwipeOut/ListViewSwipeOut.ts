import * as dojoDeclare from "dojo/_base/declare";
import * as WidgetBase from "mxui/widget/_WidgetBase";

import * as dojoAspect from "dojo/aspect";
import * as domClass from "dojo/dom-class";
import * as registry from "dijit/registry";

import * as Hammer from "hammerjs";
import { AfterSwipeAction, Direction, HammerSwipeOut, SwipeOutOptions } from "./HammerSwipeOut";

import "./ui/ListViewSwipeOut.css";

class ListViewSwipeOut extends WidgetBase {
    // Properties from Mendix modeler
    targetName: string;
    onLeftSwipe: string;
    onRightSwipe: string;
    microflowTriggerDelay: number;
    afterSwipeAction: AfterSwipeAction;
    foreComponentName: string;
    backComponentName: string;
    postSwipeComponentName: string;
    transparentOnSwipe: boolean;

    private swipeClass: string;
    private targetWidget: mxui.widget._WidgetBase;
    private targetNode: HTMLElement;
    private contextObject: mendix.lib.MxObject;

    postCreate() {
        this.swipeClass = "swipe-listview-out";
        this.findTargets();
        this.checkConfig();
    }

    update(contextObject: mendix.lib.MxObject, callback: Function) {
        if (this.targetWidget) {
            this.contextObject = contextObject;
            const swipeOutOptions: SwipeOutOptions = {
                afterSwipeAction: this.afterSwipeAction,
                backComponentName: this.backComponentName,
                callback: (direction: Direction) => this.handleSwipe(direction),
                callbackDelay: this.microflowTriggerDelay,
                foreComponentName: this.foreComponentName,
                postSwipeComponentName: this.postSwipeComponentName,
                transparentOnSwipe: this.transparentOnSwipe
            };

            dojoAspect.after(this.targetWidget, "_renderData", () =>
                Hammer.each(this.targetNode.querySelectorAll(".mx-listview-item"), (container: HTMLElement) => {
                    new HammerSwipeOut(container, swipeOutOptions);
                }, this)
            );
        }
        callback();
    }

    private findTargets() {
        let queryNode = this.domNode.parentNode as Element;
        while (!this.targetNode) {
            this.targetNode = queryNode.querySelector(".mx-name-" + this.targetName) as HTMLElement;
            if (window.document.isEqualNode(queryNode)) { break; }
            queryNode = queryNode.parentNode as HTMLElement;
        }

        if (this.targetNode) {
            this.targetWidget = registry.byNode(this.targetNode);
            if (this.targetWidget.declaredClass === "mxui.widget.ListView") {
                // if (typeof this.targetWidget._renderData !== "undefined") {
                domClass.add(this.targetNode, this.swipeClass);
                // } else {
                //     this.targetWidget = null;
                //     logger.error("This Mendix version is not compatible with the Listview swipe out widget");
                //     logger.error("mxui.widget.ListView does not have _renderData function");
                // }
            } else {
                this.targetWidget = null;
                window.mx.ui.error(`Supplied target name "${this.targetName}" is not of the type listview`);
            }
        } else {
            window.mx.ui.error(`Unable to find listview with the name "${this.targetName}"`);
        }
    }

    private checkConfig() {
        if (!this.onRightSwipe && !this.onLeftSwipe) {
            window.mx.ui.error(this.id + " No microflow is setup, should setup a left or right", true);
        }
    }

    private handleSwipe(direction: Direction) {
        const guids = this.contextObject ? [ this.contextObject.getGuid() ] : [];
        this.executeAction(direction === "left" ? this.onLeftSwipe : this.onRightSwipe, guids);
    }

    private executeAction(microflow: string, guids: string[]) {
        if (microflow) {
            window.mx.ui.action(microflow, {
                error: error =>
                    window.mx.ui.error(`An error occurred while executing action ${microflow}: ${error.message}`, true),
                params: { guids }
            });
        }
    }
}

// Declare widget prototype the Dojo way
// Thanks to https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/dojo/README.md
// tslint:disable : only-arrow-functions
dojoDeclare("com.mendix.widget.ListViewSwipeOut.ListViewSwipeOut", [ WidgetBase ], function(Source: any) {
    let result: any = {};
    for (let property in Source.prototype) {
        if (property !== "constructor" && Source.prototype.hasOwnProperty(property)) {
            result[property] = Source.prototype[property];
        }
    }
    return result;
}(ListViewSwipeOut));
