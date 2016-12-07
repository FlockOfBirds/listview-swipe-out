import * as Hammer from "hammerjs";
import * as domClass from "dojo/dom-class";
import * as domStyle from "dojo/dom-style";

interface SwipeOutOptions {
    afterSwipeAction: AfterSwipeAction;
    callback: (direction: Direction) => void;
    callbackDelay: number;
}

type Direction = "right" | "left";
type AfterSwipeAction = "remove" | "none";

class HammerSwipeOut {
    private container: HTMLElement;
    private swipePane: HTMLElement;
    private containerSize: number;
    private containerClass: string;
    private hammer: HammerManager;
    private options: SwipeOutOptions;
    private swipedOut: boolean;

    //TODO: Add test for phonegap and normal mobile browser

    constructor(container: HTMLElement, options: SwipeOutOptions) {
        this.container = container;
        this.options = options;
        this.containerClass = this.container.className;
        this.containerSize = this.container.offsetWidth;
        this.swipedOut = false;

        this.hammer = new Hammer.Manager(this.container);
        this.hammer.add(new Hammer.Pan({ direction: Hammer.DIRECTION_HORIZONTAL }));
        this.hammer.on("panstart panmove panend pancancel", (event: HammerInput) => this.onPan(event));

        this.swipePane = this.container.getElementsByClassName("swipe-foreground")[0] as HTMLElement;
        if (!this.swipePane) {
            this.swipePane = this.container;
        }

        this.registerExtraEvents();
    }

    private onPan(ev: HammerInput) {
        const maximumPercentage = 100;
        const percentageThreshold = 20;
        let currentPercentage = (maximumPercentage / this.containerSize) * ev.deltaX;
        let animate = false;
        let direction: Direction;
        if (ev.type === "panend" || ev.type === "pancancel") {
            if (Math.abs(currentPercentage) > percentageThreshold && ev.type === "panend") {
                direction = currentPercentage < 0 ? "left" : "right";
                this.out(direction);
                return;
            }
            currentPercentage = 0;
            animate = true;
        }
        this.show(currentPercentage, animate);
    }

    private show(currentPercentage: number = 0, animate?: boolean) {
        const hundredPercent = 100;
        const pos = (this.containerSize / hundredPercent) * currentPercentage;
        const translate = "translate3d(" + pos + "px, 0, 0)";

        if (animate) {
            domClass.add(this.container, "animate");
        } else {
            domClass.remove(this.container, "animate");
        }

        domStyle.set(this.swipePane, { transform: translate });
    }

    private out(direction: Direction) {
        let pos = direction === "left" ? -this.containerSize : this.containerSize;
        const translate = "translate3d(" + pos + "px, 0, 0)";
        domClass.add(this.container, "animate");
        domStyle.set(this.swipePane, { transform: translate });
        this.swipedOut = true;
        this.hide(direction);
    }

    private hide(direction: Direction) {
        const removeItemDelay = 600; // Should be done with next touch?
        if (this.options.afterSwipeAction === "remove") {

            setTimeout(() => {
                domStyle.set(this.container, { "height": 0 });
                domClass.add(this.container, "animate");

                setTimeout(() => {
                    domClass.add(this.container, "hide");
                    domClass.remove(this.container, "animate");
                    this.options.callback(direction);
                }, removeItemDelay)
            }, this.options.callbackDelay);
        } else {
            setTimeout(() => {
                domClass.remove(this.container, "animate");
                this.options.callback(direction);
            }, this.options.callbackDelay);
        }
    }

    private registerExtraEvents() {
        if (this.options.afterSwipeAction === "remove") {
            this.swipePane.addEventListener("transitionend", () => {
                const swipeBackground = this.container.getElementsByClassName("swipe-background")[0] as HTMLElement;
                if (swipeBackground && this.swipedOut) {
                    domStyle.set(this.container, {
                        "height": this.container.offsetHeight + "px"
                    });
                    domClass.add(swipeBackground, "hide");

                }
            });
        }
    }
}

export { HammerSwipeOut, Direction, AfterSwipeAction, SwipeOutOptions };
