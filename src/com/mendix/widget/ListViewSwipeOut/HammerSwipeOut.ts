import * as Hammer from "hammerjs";
import * as domClass from "dojo/dom-class";

interface Container extends HTMLElement {
    [key: string]: any;
}

interface Panes extends HTMLElement {
    [key: string]: any;
}

type Direction = "right" | "left" | "none";

export default class HammerSwipeOut {
    private container: Container;
    private direction: number;
    private panes: Panes[];
    private containerSize: number;
    private currentIndex: number;
    private hammer: HammerManager;

    //TODO: Add test for phonegap and normal mobile browser

    constructor(container: HTMLElement, direction: number) {
        this.container = container;
        this.direction = direction;
        this.panes = [ this.container.firstChild.firstChild.firstChild as HTMLElement ];
        this.containerSize = this.container.offsetWidth;
        this.currentIndex = 0;
        this.hammer = new Hammer.Manager(this.container);
        this.hammer.add(new Hammer.Pan({ direction: Hammer.DIRECTION_HORIZONTAL }));
        this.hammer.on("panstart panmove panend pancancel", (event: HammerInput) => this.onPan(event));
    }

    private show(showIndexIn: number, percentIn?: number, animate?: boolean) {
        let showIndex = Math.max(0, Math.min(showIndexIn, this.panes.length - 1));
        let percent = percentIn || 0;
        let className = this.container.className;
        let paneIndex = 0;
        let pos: number;
        let translate: string;
        let hundredPercent = 100;

        // TODO: Add classes for when swiping left or right begins. Remove classes after swiping is done or cancelled
        if (animate) {
            if (className.indexOf("animate") === -1) {
                this.container.className += " animate";
            }
        } else if (className.indexOf("animate") !== -1) {
            this.container.className = className.replace("animate", "").trim();
        }
        pos = (this.containerSize / hundredPercent) *
            (((paneIndex - showIndex) * hundredPercent) + percent);

        // TODO: Check on the moztransform
        translate = "translate3d(" + pos + "px, 0, 0)";
        this.panes[paneIndex].style.transform = translate;
        // this.panes[paneIndex].style.mozTransform = translate;
        this.panes[paneIndex].style.webkitTransform = translate;
        this.currentIndex = showIndex;
    }

    private out(direction: Direction, animate?: boolean) {
        let className = this.container.className;
        let paneIndex = 0;
        let pos: number;
        let translate: string;

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
        // this.panes[paneIndex].style.mozTransform = translate;
        this.panes[paneIndex].style.webkitTransform = translate;
        this.hide();
    }

    private hide() {
        let backgroundNodeNode = (this.container.firstChild.firstChild as HTMLElement).children[1] as HTMLElement; // Ugly
        let container = this.container;
        let timeoutAnimation = 600;
        let timeoutRemove = 2000; // Should be done with next touch?

        setTimeout(function() {
            backgroundNodeNode.style.display = "none";
            setTimeout(function() {
                domClass.add(container, "removed-from-list");
                // TODO: Add setting to control whether removal should occur or not
                // TODO: Add microflow here. Add user setting to decide when actual microflow execution occurs
            }, timeoutRemove);
        }, timeoutAnimation);
    }

    private onPan(ev: HammerInput) {
        let numberInPercent = 100;
        let percentageThreshold = 20;
        let percent = (numberInPercent / this.containerSize) * ev.deltaX;
        let animate = false;
        let direction: Direction = "none";
        if (ev.type === "panend" || ev.type === "pancancel") {
            if (Math.abs(percent) > percentageThreshold && ev.type === "panend") {
                if (percent < 0) {
                    // window.logger.debug("left out");
                    direction = "left";
                } else {
                    // window.logger.debug("right out");
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
}
