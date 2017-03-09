import * as dojoDeclare from "dojo/_base/declare";
import * as WidgetBase from "mxui/widget/_WidgetBase";

import * as registry from "dijit/registry";
import * as dojoAspect from "dojo/aspect";
import * as domClass from "dojo/dom-class";

import * as Hammer from "hammerjs";
import { AfterSwipeAction, Direction, HammerSwipeOut, SwipeOutOptions } from "./HammerSwipeOut";

import "./ui/ListViewSwipeOut.css";

class ListViewSwipeOut extends WidgetBase {
    // Properties from Mendix modeler
    targetName: string;
    itemEntity: string;
    onLeftSwipe: string;
    onRightSwipe: string;
    microflowTriggerDelay: number;
    afterSwipeAction: AfterSwipeAction;
    foreComponentName: string;
    backComponentName: string;
    postSwipeComponentName: string;
    transparentOnSwipe: boolean;

    private swipeClass: string;
    private targetWidget: any;
    private targetNode: HTMLElement;
    private contextObject: mendix.lib.MxObject;

    postCreate() {
        this.swipeClass = "swipe-listview-out";
        this.targetNode = this.findTargetNode(this.targetName);
        if (this.validateConfig()) {
            this.targetWidget = registry.byNode(this.targetNode);
            domClass.add(this.targetNode, this.swipeClass);
        }
    }

    update(contextObject: mendix.lib.MxObject, callback?: () => void) {
        if (this.targetWidget) {
            this.contextObject = contextObject;
            let direction: Direction | "horizontal";
            if (this.onLeftSwipe && this.onRightSwipe) {
                direction = "horizontal";
            } else if (!this.onLeftSwipe && this.onRightSwipe) {
                direction = "right";
            } else if (this.onLeftSwipe && !this.onRightSwipe) {
                direction = "left";
            }

            if (direction) {
                const swipeOutOptions: SwipeOutOptions = {
                    afterSwipeAction: this.afterSwipeAction,
                    backComponentName: this.backComponentName,
                    callback: (element, swipeDirection) => this.handleSwipe(element, swipeDirection),
                    callbackDelay: this.microflowTriggerDelay,
                    foreComponentName: this.foreComponentName,
                    postSwipeComponentName: this.postSwipeComponentName,
                    swipeDirection: direction,
                    transparentOnSwipe: this.transparentOnSwipe
                };

                dojoAspect.after(this.targetWidget, "_renderData", () => {
                    try {
                        Hammer.each(this.targetNode.querySelectorAll(".mx-listview-item"), (container: HTMLElement) => {
                            new HammerSwipeOut(container, swipeOutOptions);
                        }, this);
                    } catch (error) {
                        window.mx.ui.error(error.message, true);
                    }

                });
            }
        }

        if (callback) callback();
    }

    private findTargetNode(name: string): HTMLElement {
        let queryNode = this.domNode.parentNode as Element;
        let targetNode: HTMLElement;
        while (!targetNode) {
            targetNode = queryNode.querySelector(".mx-name-" + name) as HTMLElement;
            if (window.document.isEqualNode(queryNode)) { break; }
            queryNode = queryNode.parentNode as HTMLElement;
        }
        return targetNode;
    }

    private validateConfig(): boolean {
        if (!this.targetNode) {
            window.mx.ui.error(`Listview swipe out: unable to find listview with the name "${this.targetName}"`);
            return false;
        }
        this.targetWidget = registry.byNode(this.targetNode);
        if (!this.targetWidget || this.targetWidget.declaredClass !== "mxui.widget.ListView") {
            window.mx.ui.error(`Listview swipe out: configuration target name "${this.targetName}" 
            is not of the type listview`);
            return false;
        }
        if (this.targetWidget._renderData === undefined || this.targetWidget.datasource === undefined ||
            this.targetWidget.datasource.path === undefined) {

            window.mx.ui.error("Listview swipe out: this Mendix version is not compatible", true);
            window.logger.error("mxui.widget.ListView does not have a _renderData function or or .datasource.path");
            return false;
        }
        const segments = this.targetWidget.datasource.path.split("/");
        const listEntity = segments.length ? segments[segments.length - 1] : "";
        if (listEntity !== this.itemEntity) {
            window.mx.ui.error(`Listview swipe out: configuration entity ${this.itemEntity} does not 
            match the listview entity ${listEntity} of ${this.targetName}`, true);
            return false;
        }
        if (!this.onRightSwipe && !this.onLeftSwipe) {
            window.mx.ui.error("Listview swipe out: no microflow is setup, a left and/or right is required", true);
            return false;
        }
        return true;
    }

    private handleSwipe(element: HTMLElement, direction: Direction) {
        const guids = [ registry.byNode(element).getGuid() ];
        this.executeAction(direction === "left" ? this.onLeftSwipe : this.onRightSwipe, guids);
    }

    private executeAction(microflow: string, guids: string[]) {
        if (microflow) {
            window.mx.ui.action(microflow, {
                error: error =>
                    window.mx.ui.error(`An error occurred while executing action ${microflow}: ${error.message}`, true),
                params: {
                    applyto: "selection",
                    guids
                }
            });
        }
    }
}

// Declare widget prototype the Dojo way
// Thanks to https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/dojo/README.md
// tslint:disable : only-arrow-functions
dojoDeclare("com.mendix.widget.ListViewSwipeOut.ListViewSwipeOut", [ WidgetBase ], function(Source: any) {
    const result: any = {};
    for (const property in Source.prototype) {
        if (property !== "constructor" && Source.prototype.hasOwnProperty(property)) {
            result[property] = Source.prototype[property];
        }
    }
    return result;
}(ListViewSwipeOut));
